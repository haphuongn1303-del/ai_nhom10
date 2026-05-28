/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings, Key, Link2, RefreshCw, Layers, Clipboard, AlertCircle, CheckCircle2, Database, PlusCircle, ExternalLink
} from 'lucide-react';
import { googleSignIn, googleLogout, createSyncedSpreadsheet } from '../firebase';
import { Room, Booking } from '../types';

interface AdminPanelProps {
  user: any;
  accessToken: string | null;
  spreadsheetId: string | null;
  onAuthSuccess: (user: any, token: string) => void;
  onLogout: () => void;
  onLinkSpreadsheet: (sheetId: string) => void;
  rooms: Room[];
  bookings: Booking[];
  isSynced: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  sheetsError: string | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  accessToken,
  spreadsheetId,
  onAuthSuccess,
  onLogout,
  onLinkSpreadsheet,
  rooms,
  bookings,
  isSynced,
  isLoading,
  onRefresh,
  sheetsError,
}) => {
  const [isLinking, setIsLinking] = useState(false);
  const [manualSheetId, setManualSheetId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showIframeGuide, setShowIframeGuide] = useState(false);
  const [showVercelGuide, setShowVercelGuide] = useState(false);

  const handleLogin = async () => {
    try {
      setLocalError(null);
      setShowIframeGuide(false);
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
      }
    } catch (e: any) {
      console.error('Sign in error detailed:', e);
      const isPopupBlocked = e.code === 'auth/popup-blocked' || e.message?.includes('popup-blocked');
      const isCancelled = e.code === 'auth/cancelled-popup-request' || e.message?.includes('cancelled-popup-request');
      const isUnauthorizedDomain = e.code === 'auth/unauthorized-domain' || e.message?.includes('unauthorized-domain');

      if (isUnauthorizedDomain) {
        setShowVercelGuide(true);
        setLocalError('Lỗi miền chưa được ủy quyền (auth/unauthorized-domain). Bạn cần khai báo tên miền của web lên trang quản lý Firebase Console theo hướng dẫn cài đặt ở dưới.');
      } else if (isPopupBlocked || isCancelled) {
        setShowIframeGuide(true);
        setLocalError(
          isPopupBlocked
            ? 'Cửa sổ đăng ký/đăng nhập (Popup) đã bị trình duyệt chặn.'
            : 'Yêu cầu đăng nhập trước đó đã bị hủy hoặc cửa sổ popup bị tắt sớm.'
        );
      } else {
        setLocalError(`Đăng nhập thất bại: ${e.message || e}`);
      }
    }
  };

  const handleCreateAutoSheet = async () => {
    if (!accessToken) {
      setLocalError('Vui lòng đăng nhập Google trước khi tạo Sheet.');
      return;
    }
    try {
      setIsLinking(true);
      setLocalError(null);
      const newSheetId = await createSyncedSpreadsheet(accessToken);
      onLinkSpreadsheet(newSheetId);
    } catch (e: any) {
      setLocalError(`Lỗi khởi tạo Sheet: ${e.message}`);
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkManual = () => {
    if (!manualSheetId.trim()) return;
    onLinkSpreadsheet(manualSheetId.trim());
    setManualSheetId('');
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div id="admin-panel" className="bg-[#0F0F0F] text-[#E8E2D9] border border-[#2A2A2A] rounded-none shadow-2xl flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 bg-[#0F0F0F] border-b border-[#2A2A2A] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Settings className="w-4 h-4 text-[#C5A059]" />
          <h3 className="font-serif font-semibold text-[#E8E2D9] text-xs uppercase tracking-widest">
            Hệ Thống Đồng Bộ Pullman Hanoi
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          {isSynced ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-none text-[9px] uppercase tracking-widest font-mono border border-emerald-900/40">
              <Database className="w-3 h-3" /> Sheets Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-400 bg-[#1E1E1E] px-2.5 py-1 rounded-none text-[9px] uppercase tracking-widest font-mono border border-[#2A2A2A]">
              Chế Độ Offline
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Auth Section */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-none p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[10px] text-[#C5A059] uppercase tracking-widest block">
              1. Kết nối Tài khoản quản lý
            </h4>
            {user && (
              <span className="text-[10px] text-slate-400 font-mono">
                {user.email}
              </span>
            )}
          </div>

          {!user ? (
            <div className="flex flex-col items-center py-2 text-center space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                Để kích hoạt tính năng đồng bộ tự động với Google Sheets và cập nhật thông tin phòng thực tế, vui lòng đăng nhập bằng tài khoản Google.
              </p>
              {/* Styled Google Sign-In Button from Guidelines */}
              <button
                id="google-signin-action-btn"
                onClick={handleLogin}
                className="hover:bg-amber-950/20 bg-transparent text-[#C5A059] hover:text-white border border-[#C5A059] px-5 py-3 transition-colors text-xs font-semibold tracking-widest uppercase rounded-none flex items-center justify-center space-x-3 cursor-pointer w-full max-w-xs"
              >
                <div className="gsi-material-button-icon bg-white p-1 rounded-sm shrink-0">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-semibold">Đăng nhập Google Account</span>
              </button>

              {/* Iframe Popup Block Guide */}
              {showIframeGuide && (
                <div id="iframe-auth-guide-box" className="w-full text-left bg-amber-950/20 border border-amber-900/40 p-4 space-y-3 rounded-none text-xs text-[#E8E2D9]">
                  <div className="flex items-center gap-2 text-[#C5A059] font-semibold uppercase tracking-wider text-[10px]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Hướng dẫn khắc phục sự cố / Quick Fix</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Môi trường xem trước của AI Studio chạy dưới dạng <strong>Iframe</strong> bảo mật, khiến các trình duyệt tự động chặn cửa sổ bật lên (Popup) và Cookie bên thứ ba.
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-300">
                    <li>
                      <strong className="text-[#C5A059]">Giải pháp tốt nhất:</strong> Nhấp vào nút <strong>"Mở trong Tab mới"</strong> bên dưới để chạy ứng dụng độc lập, giải quyết triệt để lỗi chặn cửa sổ.
                    </li>
                    <li>
                      <strong>Cấp quyền Popup:</strong> Nhấp vào biểu tượng chặn popup trên địa chỉ trình duyệt của bạn (góc phải thanh nhập URL) và chọn <strong>"Luôn cho phép cửa sổ bật lên"</strong>.
                    </li>
                    <li>
                      <strong>Tránh click dồn dập:</strong> Vui lòng chờ vài giây giữa các lần nhấn đăng nhập để tránh lỗi hủy yêu cầu (`cancelled-popup-request`).
                    </li>
                  </ul>
                  <button
                    id="new-tab-login-btn"
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="w-full mt-2 py-2 px-3 border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-black font-semibold uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-transparent"
                  >
                    Mở ứng dụng ở Tab mới <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Vercel Authorized Domains Config Guide */}
              {showVercelGuide && (
                <div id="vercel-auth-guide-box" className="w-full text-left bg-stone-900 border border-[#C5A059]/40 p-5 space-y-3 rounded-none text-xs text-[#E8E2D9] animate-fade-in">
                  <div className="flex items-center gap-2 text-[#C5A059] font-bold uppercase tracking-wider text-[10px]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Ủy quyền miền Vercel trên Firebase</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Khi triển khai ứng dụng lên Vercel, Firebase Auth sẽ từ chối đăng nhập nếu chưa gán tên miền Vercel vào danh sách tin cậy. Cách khắc phục:
                  </p>
                  <ol className="list-decimal pl-4.5 space-y-2 text-[11px] text-slate-300 font-sans">
                    <li>Truy cập <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#C5A059] underline hover:text-white font-semibold">Firebase Console</a>.</li>
                    <li>Chọn dự án Firestore của bạn (<span className="font-mono text-[10px] text-amber-500 font-semibold">lunar-slice-mpp0d</span>).</li>
                    <li>Vào mục <strong className="text-white">Authentication</strong> &gt; <strong className="text-white">Settings</strong> &gt; <strong className="text-white">Authorized domains</strong>.</li>
                    <li>Bấm <strong className="text-emerald-400">Add domain</strong> rồi nhập tên miền trang web Vercel của bạn vào (Ví dụ: <span className="font-mono text-xs bg-[#1E1E1E] px-1.5 py-0.5 text-slate-400">c67eb491-0da4-41b6-ba7c-6f6f91430831.vercel.app</span>).</li>
                  </ol>
                  <p className="text-[10px] text-slate-400 italic">
                    💡 Đăng nhập của bạn sẽ hoạt động trơn tru ngay lập tức sau khi thêm miền mà không cần viết lại bất kỳ dòng code nào!
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 w-full mt-1.5 items-center">
                <button
                  type="button"
                  onClick={() => setShowVercelGuide(!showVercelGuide)}
                  className="text-[10px] text-[#C5A059]/80 hover:text-[#C5A059] hover:underline uppercase tracking-wider font-mono text-center cursor-pointer bg-transparent border-0"
                >
                  {showVercelGuide ? '▲ Đóng hướng dẫn Vercel' : '❓ Lỗi Đăng Nhập Mail TRÊN VERCEL / Khắc Phục'}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 italic leading-normal max-w-xs">
                💡 Mẹo: Nhấp chọn biểu tượng "Mở trong tab mới" ở góc trên bên phải thanh công cụ hoặc nút phía trên để đăng nhập nhanh chóng, bỏ qua rào cản bảo mật Iframe.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-none">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-full border border-[#2A2A2A]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-9 h-9 bg-[#C5A059] text-black rounded-full flex items-center justify-center font-bold text-sm">
                    {user.displayName?.charAt(0) || 'G'}
                  </div>
                )}
                <div>
                  <h5 className="font-serif font-semibold text-xs text-[#E8E2D9] leading-tight">
                    {user.displayName || 'Quản lý Pullman'}
                  </h5>
                  <p className="text-[10px] text-[#C5A059] uppercase tracking-wider mt-0.5">Administrator Verified</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-950/25 hover:bg-rose-900/35 px-3 py-1.5 border border-rose-900/40 rounded-none transition-all cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>

        {/* Spreadsheet Link Section */}
        {user && (
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-none p-5 space-y-4">
            <h4 className="font-semibold text-[10px] text-[#C5A059] uppercase tracking-widest block">
              2. Kết nối Google Sheet Đồng Bộ
            </h4>

            {!spreadsheetId ? (
              <div className="space-y-4">
                <div className="bg-blue-950/30 border border-blue-900/40 text-blue-300 p-4 rounded-none text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Khách sạn chưa gán trang tính đồng bộ. Vui lòng chọn khởi tạo tự động hoặc gò nhập mã định danh trang tính của bạn.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  <button
                    onClick={handleCreateAutoSheet}
                    disabled={isLinking}
                    className="w-full py-3 px-4 bg-[#C5A059] hover:bg-[#C5A059]/80 text-black rounded-none text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isLinking ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )}
                    Tạo mới Pullman Sheet tự động
                  </button>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập thủ công Spreadsheet ID..."
                      value={manualSheetId}
                      onChange={(e) => setManualSheetId(e.target.value)}
                      className="flex-1 text-xs bg-[#1E1E1E] text-[#E8E2D9] border border-[#2A2A2A] focus:border-[#C5A059] rounded-none px-3.5 py-2.5 outline-none"
                    />
                    <button
                      onClick={handleLinkManual}
                      className="px-4 bg-transparent hover:bg-[#1E1E1E] border border-[#2A2A2A] text-[#C5A059] hover:text-white rounded-none text-xs font-semibold uppercase tracking-widest transition-all"
                    >
                      Kết nối
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 rounded-none text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold leading-none text-emerald-400">Google Sheet Connected!</p>
                      <p className="text-[9px] text-[#C5A059] mt-1 truncate font-mono max-w-[200px] sm:max-w-xs">{spreadsheetId}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={onRefresh}
                      disabled={isLoading}
                      className="p-2.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-[#C5A059] rounded-none flex items-center justify-center transition-all cursor-pointer"
                      title="Nạp lại dữ liệu Sheets"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-[#1E1E1E] hover:bg-[#C5A059] border border-[#C5A059] hover:text-black text-[#C5A059] rounded-none flex items-center justify-center transition-colors font-semibold text-[10px] tracking-widest uppercase gap-1"
                    >
                      Mở Sheet <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Errors Panel */}
        {(localError || sheetsError) && (
          <div className="bg-rose-950/30 border border-rose-900/40 text-rose-300 p-4 rounded-none text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{localError || sheetsError}</p>
          </div>
        )}

        {/* Live Rooms Inventory */}
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-1">
            <h4 className="font-semibold text-[10px] text-[#C5A059] uppercase tracking-widest block">
              3. Tình trạng phòng trống thực tế
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Live Sync</span>
          </div>

          <div className="overflow-x-auto rounded-none border border-[#2A2A2A]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141414] border-b border-[#2A2A2A] text-[#C5A059] font-medium tracking-wider uppercase text-[9px]">
                  <th className="py-3.5 px-4 font-normal">Loại phòng (Class)</th>
                  <th className="py-3.5 px-4 text-center font-normal">Tổng</th>
                  <th className="py-3.5 px-4 text-center font-normal">Còn trống</th>
                  <th className="py-3.5 px-4 text-right font-normal">Đơn giá / Đêm</th>
                  <th className="py-3.5 px-4 text-center font-normal">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A] text-slate-300">
                {rooms.map((room, idx) => (
                  <tr key={idx} className="hover:bg-[#1E1E1E]/40 transition-colors bg-[#0F0F0F]">
                    <td className="py-3.5 px-4 font-serif text-[#E8E2D9] font-medium">{room.roomType}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{room.totalRooms}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      <span className={`${room.availableRooms > 0 ? 'text-[#E8E2D9]' : 'text-rose-400 bg-rose-950/20 px-2 py-0.5 border border-rose-900/30'}`}>
                        {room.availableRooms}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#C5A059]">
                      {formatVND(room.pricePerNight)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {room.availableRooms > 0 ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Còn phòng" />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Hết phòng" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Bookings Logs */}
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-1">
            <h4 className="font-semibold text-[10px] text-[#C5A059] uppercase tracking-widest block">
              4. Nhật ký Đơn Đặt Phòng
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Đơn: {bookings.length}</span>
          </div>

          <div className="overflow-x-auto rounded-none border border-[#2A2A2A] max-h-60 overflow-y-auto">
            {bookings.length === 0 ? (
              <div className="py-8 text-center text-slate-500 border border-dashed border-[#2A2A2A] rounded-none bg-[#141414] text-xs font-light">
                Chưa có đơn đặt phòng nào được ghi nhận.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#141414] border-b border-[#2A2A2A] text-[#C5A059] font-medium tracking-wider uppercase text-[9px] sticky top-0">
                    <th className="py-3.5 px-4 font-normal">Khách hàng</th>
                    <th className="py-3.5 px-4 text-center font-normal">Liên hệ</th>
                    <th className="py-3.5 px-4 text-center font-normal">Trú ngụ</th>
                    <th className="py-3.5 px-4 font-normal">Hạng phòng</th>
                    <th className="py-3.5 px-4 text-right font-normal">Tổng thanh toán</th>
                    <th className="py-3.5 px-4 text-center font-normal">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A] text-slate-300">
                  {bookings.map((booking, idx) => (
                    <tr key={idx} className="hover:bg-[#1E1E1E]/40 transition-colors bg-[#0F0F0F]">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#E8E2D9] leading-tight">{booking.customerName}</p>
                        <p className="text-[9px] text-[#C5A059] font-mono mt-0.5">CCCD: {booking.cccd}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[11px]">{booking.phone}</td>
                      <td className="py-3.5 px-4 text-center leading-normal text-slate-400">
                        <p className="font-medium text-slate-200">{booking.checkin}</p>
                        <p className="text-[9px] text-slate-500">➔ {booking.checkout} ({booking.nights}đ)</p>
                      </td>
                      <td className="py-3.5 px-4 font-serif text-[#E8E2D9]">{booking.roomType}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#C5A059]">
                        {formatVND(booking.totalPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest border ${
                          booking.status === 'Đã thanh toán' || booking.status === 'Đã xác nhận'
                            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40'
                            : 'bg-amber-950/25 text-amber-400 border-amber-900/40'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
