/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BedDouble, MessageSquareText, Settings, Sparkles, Building2, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { Chatbot } from './components/Chatbot';
import { BookingCard } from './components/BookingCard';
import { AdminPanel } from './components/AdminPanel';
import { DEFAULT_ROOMS, PULLMAN_INFO } from './hotelData';
import { Room, Booking, Message } from './types';
import {
  initAuth,
  googleLogout,
  fetchRoomsFromSheet,
  fetchBookingsFromSheet,
  appendBookingToSheet,
  updateRoomAvailabilityInSheet
} from './firebase';

export default function App() {
  // Application Data States
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Xin kính chào Quý khách! 🌸 Tôi là Trợ lý Ảo đặt phòng thông minh của   Pullman Hanoi Hotel  .\n\nHôm nay, tôi có thể hỗ trợ Quý khách giải đáp thông tin khách sạn, tư vấn dịch vụ tiện ích, kiểm tra phòng trống hoặc tiến hành đặt phòng trực tuyến một cách dễ dàng và nhanh chóng.\n\nQuý khách muốn tìm hiểu về dịch vụ gì hoặc muốn đặt phòng nào hôm nay ạ?',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  // Authentication & Sync States
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  // Active User Flow States
  const [bookingInProgress, setBookingInProgress] = useState<any | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(true); // Collapsible admin control panel

  // Load spreadsheetId and Auth on mount
  useEffect(() => {
    let savedSheetId = localStorage.getItem('pullman_sync_sheet_id');
    if (!savedSheetId) {
      savedSheetId = '1UR_Ri4fqR2-_oKlz9YE89WqYGg4bQWcbmk5cvtOW3aQ';
      localStorage.setItem('pullman_sync_sheet_id', savedSheetId);
    }
    setSpreadsheetId(savedSheetId);

    // Initialize Firebase Auth listener
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        // If we also had a saved/default sheet, immediately sync
        if (savedSheetId) {
          syncWithSheets(savedSheetId, token);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsSynced(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync Google Sheet Rooms & Bookings values
  const syncWithSheets = async (sheetId: string, token: string) => {
    setIsLoading(true);
    setSheetsError(null);
    try {
      const liveRooms = await fetchRoomsFromSheet(sheetId, token);
      setRooms(liveRooms);

      const liveBookings = await fetchBookingsFromSheet(sheetId, token);
      setBookings(liveBookings);

      setIsSynced(true);
      setSpreadsheetId(sheetId);
      localStorage.setItem('pullman_sync_sheet_id', sheetId);
    } catch (err: any) {
      console.error('Sheets Sync Error:', err);
      setSheetsError(`Lỗi đồng bộ: ${err.message || 'Kiểm tra quyền truy cập Sheet'}`);
      setIsSynced(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Silent sync helper to update sheet changes in the background without causing flashing loader spinners
  const syncWithSheetsInSilence = async (sheetId: string, token: string) => {
    try {
      const liveRooms = await fetchRoomsFromSheet(sheetId, token);
      setRooms(liveRooms);

      const liveBookings = await fetchBookingsFromSheet(sheetId, token);
      setBookings(liveBookings);

      setIsSynced(true);
      setSheetsError(null);
    } catch (err: any) {
      console.warn('Silent auto-sync failed (it will re-attempt automatically):', err);
    }
  };

  // Set up periodic automatic background polling to fetch any manual edits on the spreadsheet instantly
  useEffect(() => {
    if (!spreadsheetId || !accessToken || !isSynced) return;

    const intervalId = setInterval(() => {
      syncWithSheetsInSilence(spreadsheetId, accessToken);
    }, 5000); // Check for manual spreadsheet updates every 5 seconds

    return () => clearInterval(intervalId);
  }, [spreadsheetId, accessToken, isSynced]);

  const handleAuthSuccess = (authUser: any, token: string) => {
    setUser(authUser);
    setAccessToken(token);
    if (spreadsheetId) {
      syncWithSheets(spreadsheetId, token);
    }
  };

  const handleLogout = async () => {
    try {
      await googleLogout();
      setUser(null);
      setAccessToken(null);
      setIsSynced(false);
      // Keep spreadsheet ID in state, but mark as unsynced
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const handleLinkSpreadsheet = (sheetId: string) => {
    setSpreadsheetId(sheetId);
    localStorage.setItem('pullman_sync_sheet_id', sheetId);
    if (accessToken) {
      syncWithSheets(sheetId, accessToken);
    } else {
      setSheetsError('Vui lòng Đăng nhập để kích hoạt đồng bộ hóa trên Google Sheet này.');
    }
  };

  const handleRefresh = () => {
    if (spreadsheetId && accessToken) {
      syncWithSheets(spreadsheetId, accessToken);
    }
  };

  // Bot detected guest provided info and wants checkout QR Code
  const handleBookingDetected = (booking: any) => {
    setBookingInProgress(booking);
  };

  // User submits payment checkout confirmation in BookingCard
  const handlePaymentConfirmed = async (bookingId: string, status: 'Chờ thanh toán' | 'Đã thanh toán' | 'Đã xác nhận' = 'Đã thanh toán') => {
    if (!bookingInProgress) return;

    const checkinDate = new Date(bookingInProgress.checkin);
    const checkoutDate = new Date(bookingInProgress.checkout);
    const diffTime = Math.abs(checkoutDate.getTime() - checkinDate.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const totalPrice = bookingInProgress.pricePerNight * nights;

    const newBooking: Booking = {
      bookingId,
      customerName: bookingInProgress.customerName,
      cccd: bookingInProgress.cccd,
      phone: bookingInProgress.phone,
      checkin: bookingInProgress.checkin,
      checkout: bookingInProgress.checkout,
      roomType: bookingInProgress.roomType,
      nights,
      totalPrice,
      status,
      createdAt: new Date().toLocaleString('vi-VN'),
    };

    setIsLoading(true);

    try {
      if (isSynced && spreadsheetId && accessToken) {
        // 1. Write booking row to sheet
        await appendBookingToSheet(spreadsheetId, accessToken, newBooking);

        // 2. Decrement room count in sheet
        await updateRoomAvailabilityInSheet(spreadsheetId, accessToken, rooms, bookingInProgress.roomType, true);

        // 3. Re-fetch fresh sheet values to synchronize
        await syncWithSheets(spreadsheetId, accessToken);
      } else {
        // Offline Fallback State Management
        setBookings((prev) => [newBooking, ...prev]);

        // Decrement room count locally
        setRooms((prev) =>
          prev.map((r) =>
            r.roomType.toLowerCase().trim() === bookingInProgress.roomType.toLowerCase().trim()
              ? { ...r, availableRooms: Math.max(0, r.availableRooms - 1) }
              : r
          )
        );
      }

      // Dynamic confirmation text sent to the Chatbot as a model message
      let confirmationText = '';
      if (status === 'Chờ thanh toán') {
        confirmationText = `🌸   XÁC NHẬN ĐẶT PHÒNG THÀNH CÔNG!   🏨\n\n` +
          `Kính chào Quý khách   ${bookingInProgress.customerName}  , Pullman Hanoi xin xác nhận đặt giữ phòng nghỉ của Quý khách:\n\n` +
          `•   Mã đặt phòng  : \`${bookingId}\`\n` +
          `•   Hạng phòng  : ${bookingInProgress.roomType}\n` +
          `•   Số lượng đêm  : ${nights} đêm (${bookingInProgress.checkin} ➔ ${bookingInProgress.checkout})\n` +
          `•   Tổng giá tiền  : ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}\n` +
          `•   Hình thức thanh toán  : Trả sau khi sử dụng xong dịch vụ (Hành lý ký gửi sau check-out)\n` +
          `•   Trạng thái  : Chờ thanh toán\n\n` +
          `⚠️   LƯU Ý QUAN TRỌNG:  \n` +
          `Đối với trường hợp check-in chậm 3 tiếng so với thời gian đã đăng ký, khách sạn sẽ tự động hủy phòng nên Quý khách vui lòng đến đúng giờ. Nếu có thay đổi về thời gian check-in hay check-out, Quý khách vui lòng gọi điện thoại trực tiếp đến đường dây nóng (Hotline) của khách sạn để được cập nhật thông tin nhanh nhất.\n\n` +
          `Thông tin đặt phòng của Quý khách đã được cập nhật trực tiếp và đồng bộ thành công lên Google Sheets quản trị.\n\n` +
          `Pullman Hanoi rất hân hạnh được phục vụ Quý khách cho kỳ nghỉ sắp tới!`;
      } else {
        confirmationText = `🌸   CẢM ƠN QUÝ KHÁCH & XÁC NHẬN ĐẶT PHÒNG THÀNH CÔNG!   🎉\n\n` +
          `Kính chào Quý khách   ${bookingInProgress.customerName}  , Pullman Hanoi chân thành cảm ơn Quý khách đã hoàn tất chuyển khoản thanh toán toàn bộ tiền phòng:\n\n` +
          `•   Mã đặt phòng  : \`${bookingId}\`\n` +
          `•   Hạng phòng  : ${bookingInProgress.roomType}\n` +
          `•   Số lượng đêm  : ${nights} đêm (${bookingInProgress.checkin} ➔ ${bookingInProgress.checkout})\n` +
          `•   Tổng giá tiền  : ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}\n` +
          `•   Hình thức thanh toán  : Chuyển khoản VietQR thành công\n` +
          `•   Trạng thái  : Đã thanh toán\n\n` +
          `Hệ thống Google Sheets quản trị đã tự động trực tiếp ghi nhận thông tin và trạng thái thanh toán phòng nghỉ của Quý khách. Lễ tân sẽ sớm liên hệ xác minh cho Quý khách trước giờ nhận phòng.\n\n` +
          `Kính chúc Quý khách có một chuyến đi vui vẻ & tràn trọn niềm vui tại Pullman Hanoi!`;
      }

      const confirmMessage: Message = {
        id: `confirm-msg-${Date.now()}-${bookingId}`,
        role: 'model',
        text: confirmationText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, confirmMessage]);

    } catch (e: any) {
      console.error('Error recording booking:', e);
      setSheetsError(`Lỗi ghi nhận đặt phòng: ${e.message}`);
    } finally {
      setIsLoading(false);
      setBookingInProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#E8E2D9] flex flex-col font-sans transition-all">
      {/* Navbar navigation header */}
      <header id="app-nav" className="w-full bg-[#141414] border-b border-[#2A2A2A] py-5 px-6 sm:px-8 shrink-0 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-[#1E1E1E] border border-[#C5A059] rounded-none flex items-center justify-center text-[#C5A059] shadow-inner">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 leading-none">
              <span className="font-serif font-bold text-[#E8E2D9] text-base sm:text-lg tracking-wider uppercase">
                PULLMAN HANOI
              </span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-amber-950/40 text-[#C5A059] border border-[#C5A059]/40 px-2 py-0.5 rounded-none">
                AI Agent
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">Trợ lý Đặt phòng & Đồng bộ Google Sheets</p>
          </div>
        </div>

        {/* Dashboard quick stats & panel view toggler */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="flex items-center space-x-2 px-4 py-2.5 border border-[#2A2A2A] bg-transparent hover:bg-[#1E1E1E] text-[#E8E2D9] rounded-none text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer shadow-sm"
          >
            {isAdminOpen ? (
              <>
                <EyeOff className="w-4 h-4 text-[#C5A059]" />
                <span className="hidden sm:inline">Ẩn quản trị</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-[#C5A059]" />
                <span className="hidden sm:inline">Hiện quản trị</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Grid Content Area */}
      <main id="main-grid" className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Chatbot & Active Reservation Column */}
        <div id="chatbot-container-col" className={`transition-all duration-300 flex flex-col h-[650px] min-h-[500px] w-full ${isAdminOpen ? 'lg:w-[70%]' : 'w-full'}`}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
            {/* Real chatbot column */}
            <div className={`h-full flex flex-col ${bookingInProgress ? 'md:col-span-7' : 'md:col-span-12'} animate-fade-in`}>
              <Chatbot
                rooms={rooms}
                messages={messages}
                setMessages={setMessages}
                onBookingDetected={handleBookingDetected}
                bookingInProgress={bookingInProgress}
              />
            </div>

            {/* Float Checkout payment column */}
            {bookingInProgress && (
              <div id="payment-panel-side" className="md:col-span-5 h-full flex flex-col shrink-0 animate-fade-in">
                <BookingCard
                  booking={bookingInProgress}
                  onPaymentConfirmed={handlePaymentConfirmed}
                  onCancel={() => setBookingInProgress(null)}
                  isSubmitting={isLoading}
                />
              </div>
            )}
          </div>
        </div>

        {/* Administration Panel Column */}
        {isAdminOpen && (
          <div id="admin-panel-column" className="w-full lg:w-[30%] h-[650px] min-h-[500px] flex flex-col animate-fade-in shrink-0">
            <AdminPanel
              user={user}
              accessToken={accessToken}
              spreadsheetId={spreadsheetId}
              onAuthSuccess={handleAuthSuccess}
              onLogout={handleLogout}
              onLinkSpreadsheet={handleLinkSpreadsheet}
              rooms={rooms}
              bookings={bookings}
              isSynced={isSynced}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              sheetsError={sheetsError}
            />
          </div>
        )}
      </main>


    </div>
  );
}
