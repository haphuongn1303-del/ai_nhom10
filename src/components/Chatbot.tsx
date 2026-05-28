/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Sparkles, Building2, Phone, Mail, HelpCircle, Loader2, ArrowRight } from 'lucide-react';
import { Message, Room } from '../types';
import { simulateChatBotOffline } from '../utils/chatbotFallback';

interface ChatbotProps {
  rooms: Room[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onBookingDetected: (booking: {
    customerName: string;
    cccd: string;
    phone: string;
    checkin: string;
    checkout: string;
    roomType: string;
    pricePerNight: number;
  }) => void;
  bookingInProgress: any | null;
}

const ALL_SUGGESTIONS = [
  { label: '💰 Giá Phòng', query: 'Xem danh sách các loại phòng và giá' },
  { label: '🏨 Đặt Superior', query: 'Tôi muốn đặt phòng Superior 2 đêm' },
  { label: '📍 Vị Trí', query: 'Địa chỉ khách sạn Pullman Hanoi ở đâu?' },
  { label: '🍽️ Nhà Hàng & Bar', query: 'Nhà hàng La Cheminée và Mint Bar tại khách sạn Pullman Hanoi dịch vụ thế nào?' },
  { label: '🏊 Tiện ích 5★', query: 'Pullman Hanoi có các tiện ích dịch vụ spa, gym, bể bơi ngoài trời gì?' },
  { label: '📶 Mạng Wifi', query: 'Tên wifi và mật khẩu truy cập internet tại Pullman Hanoi là gì?' },
  { label: '👑 Đặc Quyền VIP', query: 'Đặc quyền phòng Executive Lounge tầng 14?' },
  { label: '⏱️ Giờ Check-in/out', query: 'Thời gian Check-in và Check-out tại Pullman Hanoi?' }
];

export const Chatbot: React.FC<ChatbotProps> = ({ rooms, messages, setMessages, onBookingDetected, bookingInProgress }) => {
  const [inputValue, setInputValue] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clear or reset conversation thread
  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: 'Xin kính chào Quý khách! 🌸 Tôi là Trợ lý Ảo đặt phòng thông minh của   Pullman Hanoi Hotel  .\n\nHôm nay, tôi có thể hỗ trợ Quý khách giải đáp thông tin khách sạn, tư vấn dịch vụ tiện ích, kiểm tra phòng trống hoặc tiến hành đặt phòng trực tuyến một cách dễ dàng và nhanh chóng.\n\nQuý khách muốn tìm hiểu về dịch vụ gì hoặc muốn đặt phòng nào hôm nay ạ?',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Auto-scroll chat to bottom with robust delayed timers to capture dynamic layouts & loaded image heights
  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  useEffect(() => {
    scrollToBottom('smooth');
    const t1 = setTimeout(() => scrollToBottom('smooth'), 120);
    const t2 = setTimeout(() => scrollToBottom('smooth'), 450);
    const t3 = setTimeout(() => scrollToBottom('smooth'), 900);
    const t4 = setTimeout(() => scrollToBottom('smooth'), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [messages, isBotTyping]);

  // Client-side parser to intercept structured JSON commands from Gemini
  const checkAndParseBookingDetails = (text: string) => {
    try {
      // Find JSON block in string if any
      const jsonRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
      let match;
      while ((match = jsonRegex.exec(text)) !== null) {
        const jsonStr = match[1];
        const parsed = JSON.parse(jsonStr);
        if (parsed.action === 'CREATE_BOOKING' || (parsed.customerName && parsed.cccd && parsed.phone)) {
          // Find corresponding room price
          const matchedRoom = rooms.find(
            (r) => r.roomType.toLowerCase().trim() === parsed.roomType?.toLowerCase().trim()
          );
          const pricePerNight = matchedRoom ? matchedRoom.pricePerNight : 2200000;

          onBookingDetected({
            customerName: parsed.customerName,
            cccd: parsed.cccd,
            phone: parsed.phone,
            checkin: parsed.checkin,
            checkout: parsed.checkout,
            roomType: parsed.roomType,
            pricePerNight,
          });
        }
      }
    } catch (e) {
      console.warn('Could not parse potential booking json command:', e);
    }
  };

  const getMatchingRooms = (text: string): Room[] => {
    const textLower = text.toLowerCase();
    // Check if the message is explicitly listing or suggesting rooms
    const isRoomRelated = textLower.includes('phòng') || textLower.includes('loại phòng') || textLower.includes('giá') || textLower.includes('đặt phòng') || textLower.includes('superior') || textLower.includes('deluxe') || textLower.includes('executive') || textLower.includes('suite');
    if (!isRoomRelated) return [];

    // Filter which rooms are mentioned in the text
    return rooms.filter((r) => {
      const roomLower = r.roomType.toLowerCase();
      // Either the text explicitly contains the room type name
      if (textLower.includes(roomLower) || (roomLower.includes('superior') && textLower.includes('superior')) || (roomLower.includes('deluxe') && textLower.includes('deluxe')) || (roomLower.includes('executive suite') && textLower.includes('suite')) || (roomLower.includes('executive room') && textLower.includes('executive'))) return true;
      // Or if it's a general inquire about "các loại phòng" / "phòng trống" or contains lists
      if (textLower.includes('danh sách phòng') || textLower.includes('các loại phòng') || textLower.includes('giá phòng') || textLower.includes('phòng nghỉ dưỡng')) return true;
      return false;
    });
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isBotTyping) return;

    const userMessage: Message = {
      id: `m-${Date.now()}-user`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsBotTyping(true);

    try {
      // Prepare chat history for server call
      const formattedHistory = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));
      // Append current user message
      formattedHistory.push({ role: 'user', text: textToSend });

      let botReply = '';

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: formattedHistory,
            roomsData: rooms,
          }),
        });

        if (!res.ok) {
          throw new Error('API server returned error status');
        }

        const data = await res.json();
        botReply = data.text || 'Tôi chưa hiểu yêu cầu của quý khách. Bạn có thể nói rõ hơn không?';
      } catch (apiErr) {
        console.warn('API Endpoint not running or failed. Falling back to local smart Concierge logic on Vercel:', apiErr);
        botReply = simulateChatBotOffline(formattedHistory, rooms);
      }

      const botMessage: Message = {
        id: `m-${Date.now()}-bot`,
        role: 'model',
        text: botReply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Check if this answer finalized a booking
      checkAndParseBookingDetails(botReply);

    } catch (err: any) {
      console.error('Core chatbot sequence failure:', err);
      const errorMessage: Message = {
        id: `m-${Date.now()}-err`,
        role: 'model',
        text: `⚠️   Lỗi kết nối:   Không thể liên lạc với máy chủ Concierge. Vui lòng thử lại.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const cleanTextOfJson = (text: string) => {
    // Hide the ```json ... ``` block from rendering on UI to keep chat beautiful
    return text.replace(/```json\s*\{[\s\S]*?\}\s*```/g, '').trim();
  };

  return (
    <div id="chatbot-frame" className="flex flex-col h-full bg-[#141414] border border-[#2A2A2A] shadow-2xl rounded-none overflow-hidden">
      {/* Header */}
      <div id="chatbot-header" className="h-20 border-b border-[#2A2A2A] bg-[#0F0F0F] text-[#E8E2D9] flex items-center justify-between px-6 sm:px-8 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0F0F0F]"></span>
            <div className="w-11 h-11 rounded-full border border-[#C5A059] flex items-center justify-center bg-[#1E1E1E] overflow-hidden">
              <span className="font-serif font-bold italic text-[#C5A059] text-lg">P</span>
            </div>
          </div>
          <div>
            <h3 className="font-serif text-sm font-semibold tracking-wider text-[#E8E2D9] flex items-center gap-2">
              Pullman Hanoi Digital Concierge <Sparkles className="w-3.5 h-3.5 text-[#C5A059] fill-[#C5A059]/40" />
            </h3>
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Connected to live sheet availability</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetChat}
            className="px-2.5 py-1 rounded-none text-[9px] font-mono bg-transparent hover:bg-red-950/40 text-red-500 hover:text-red-400 border border-red-900/40 hover:border-red-750/60 transition-colors uppercase tracking-widest cursor-pointer font-bold"
            title="Làm mới lịch sử chat"
          >
            LÀM MỚI CHAT
          </button>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-none text-[9px] font-mono bg-[#1E1E1E] text-[#C5A059] border border-[#2A2A2A] tracking-wider uppercase">
            Model: 3.5-Flash
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        id="chatbot-messages-container"
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-[#141414]"
      >
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const displayedText = cleanTextOfJson(message.text).replaceAll('*', ' ');

          if (!displayedText && !isUser) return null; // Safe guard for pure JSON messages

          return (
            <div
              key={message.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Meta details */}
                <p className="text-[9px] uppercase tracking-widest text-[#C5A059]/60 mb-2 font-mono">
                  {isUser ? 'Guest' : 'Concierge'} • {message.timestamp}
                </p>

                {/* Bubble Container */}
                <div
                  className={`text-sm leading-relaxed whitespace-pre-line p-5 shadow-none transition-all ${
                    isUser
                      ? 'bg-[#C5A059] text-black font-medium rounded-none'
                      : 'bg-[#1E1E1E] text-[#E8E2D9] border-l-2 border-[#C5A059] rounded-none'
                  }`}
                >
                  {displayedText}
                </div>

                {/* If this is a model reply and mentions room types, render card grid for matching rooms */}
                {!isUser && getMatchingRooms(message.text).length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {getMatchingRooms(message.text).map((room) => (
                      <div key={room.roomType} className="bg-[#1E1E1E] border border-[#2A2A2A] hover:border-[#C5A059] transition-all flex flex-col overflow-hidden group">
                        <div className="relative h-40 overflow-hidden shrink-0 bg-neutral-900">
                          <img
                            src={room.imageUrl}
                            alt={room.roomType}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                            onLoad={() => {
                              scrollToBottom('smooth');
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 text-[9px] font-mono border border-[#C5A059]/40 text-[#C5A059] tracking-wider font-semibold">
                            {room.availableRooms > 0 ? `Còn ${room.availableRooms} phòng` : 'Hết phòng'}
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#E8E2D9] group-hover:text-[#C5A059] transition-colors">
                              {room.roomType}
                            </h4>
                            <p className="text-[11px] text-[#C5A059] font-mono font-bold">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.pricePerNight)} / đêm
                            </p>
                            <p className="text-[10px] text-slate-400 leading-normal font-sans line-clamp-3">
                              {room.description}
                            </p>
                          </div>
                          <button
                            onClick={() => handleSendMessage(`Tôi muốn đặt phòng ${room.roomType}`)}
                            disabled={room.availableRooms <= 0}
                            className="w-full py-2 px-3 text-[10px] uppercase tracking-wider font-mono font-bold border border-[#2A2A2A] hover:border-[#C5A059] bg-[#141414] hover:bg-[#C5A059] text-[#C5A059] hover:text-black transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {room.availableRooms > 0 ? 'Đặt Phòng Này' : 'Đã Hết Phòng'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isBotTyping && (
          <div className="flex justify-start">
            <div className="flex flex-col items-start">
              <p className="text-[9px] uppercase tracking-widest text-[#C5A059]/60 mb-2 font-mono">
                Concierge • Đang phản hồi
              </p>
              <div className="bg-[#1E1E1E] border-l-2 border-[#C5A059] rounded-none p-5 shadow-none flex items-center space-x-3 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 text-[#C5A059] animate-spin" />
                <span className="italic font-light">Concierge đang kiểm tra hệ thống...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking banner notification in-chat */}
      {bookingInProgress && (
        <div className="mx-6 mb-3 p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-none flex items-center justify-between text-xs animate-fade-in shrink-0">
          <span className="text-[#E8E2D9] font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Đơn nháp: <strong className="text-[#C5A059]">{bookingInProgress.roomType}</strong> ({bookingInProgress.customerName})
          </span>
          <span className="text-[#C5A059] font-mono text-[9px] uppercase tracking-widest bg-amber-950/40 px-2 py-0.5 border border-[#C5A059]/40">
            HÓA ĐƠN QR SẴN ĐỒNG BỘ
          </span>
        </div>
      )}

      {/* Suggested Questions Section & Input Pane Combined */}
      <div id="chatbot-input-pane" className="p-5 bg-[#0F0F0F] border-t border-[#2A2A2A] flex flex-col gap-3.5 shrink-0">
        {/* Horizontal scrollable quick assistant shortcuts */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-[#C5A059] font-serif uppercase tracking-widest font-semibold flex items-center gap-1.5 leading-none">
              <HelpCircle className="w-3.5 h-3.5" /> Gợi ý yêu cầu tư vấn nhanh:
            </span>
            <span className="text-[9px] text-slate-500 font-mono tracking-widest leading-none hidden sm:inline uppercase">
              Click để hỏi trực tiếp
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 px-0.5 scrollbar-thin scrollbar-thumb-[#2A2A2A] scrollbar-track-transparent">
            {ALL_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(s.query)}
                className="shrink-0 text-[9px] font-mono font-medium uppercase tracking-wider bg-[#141414] hover:bg-[#C5A059] text-[#C5A059] hover:text-black border border-[#2A2A2A] hover:border-[#C5A059] py-1.5 px-3.5 rounded-none transition-all duration-150 cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Box Structure */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(inputValue);
            }}
            disabled={isBotTyping}
            placeholder="Gõ tin nhắn hoặc câu hỏi dịch vụ tại đây..."
            className="flex-1 text-xs bg-[#141414] border border-[#2A2A2A] focus:border-[#C5A059] py-3.5 px-4 text-[#E8E2D9] focus:outline-none transition-colors placeholder:text-slate-500 font-sans rounded-none"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isBotTyping}
            className="w-12 h-12 bg-transparent hover:bg-[#C5A059] border border-[#2A2A2A] hover:border-[#C5A059] text-[#C5A059] hover:text-black disabled:bg-transparent disabled:text-slate-800 disabled:border-slate-800 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
