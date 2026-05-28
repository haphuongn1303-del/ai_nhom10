/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CreditCard, Calendar, User, Phone, CheckCircle, FileText, AlertCircle } from 'lucide-react';

interface BookingCardProps {
  booking: {
    customerName: string;
    cccd: string;
    phone: string;
    checkin: string;
    checkout: string;
    roomType: string;
    pricePerNight: number;
  };
  onPaymentConfirmed: (bookingId: string, status: 'Chờ thanh toán' | 'Đã thanh toán') => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPaymentConfirmed,
  onCancel,
  isSubmitting,
}) => {
  const [copied, setCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [payMethod, setPayMethod] = useState<'pay_later' | 'pay_now'>('pay_now');
  const [confirmedMethod, setConfirmedMethod] = useState<'pay_later' | 'pay_now' | null>(null);

  // Calculate nights
  const checkinDate = new Date(booking.checkin);
  const checkoutDate = new Date(booking.checkout);
  const diffTime = Math.abs(checkoutDate.getTime() - checkinDate.getTime());
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  const totalPrice = booking.pricePerNight * nights;

  // Generate a mock unique booking code
  const bookingId = `PLM-${Math.floor(100000 + Math.random() * 900000)}`;

  // Bank transfer info
  const bankName = 'VietinBank';
  const accountNumber = '1122334455';
  const accountName = 'PULLMAN HANOI HOTEL';
  const description = `THANH TOAN PHONG ${bookingId}`;

  // VietQR URL API (Official standardized bank QR generation format in Vietnam)
  const qrCodeUrl = `https://img.vietqr.io/image/vietinbank-1122334455-compact2.png?amount=${totalPrice}&addInfo=${encodeURIComponent(
    description
  )}&accountName=${encodeURIComponent(accountName)}`;

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(`${accountNumber}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPay = () => {
    setConfirmedMethod(payMethod);
    setPaymentSuccess(true);
    onPaymentConfirmed(bookingId, payMethod === 'pay_later' ? 'Chờ thanh toán' : 'Đã thanh toán');
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  if (paymentSuccess) {
    return (
      <div className="bg-[#141414] text-center border border-[#2A2A2A] rounded-none p-6 shadow-2xl animate-fade-in space-y-6 flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 bg-[#1A1A1A] border border-[#C5A059] rounded-full flex items-center justify-center mx-auto shadow-inner text-[#C5A059]">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2 justify-center items-center flex flex-col">
          <h4 className="font-serif text-[#C5A059] font-bold tracking-widest text-sm uppercase">
            {confirmedMethod === 'pay_later' ? 'ĐẶT PHÒNG THÀNH CÔNG!' : 'CẢM ƠN QUÝ KHÁCH!'}
          </h4>
          <p className="text-xs text-slate-300">
            {confirmedMethod === 'pay_later' ? 'Yêu cầu đặt phòng trả sau đã ghi nhận:' : 'Đơn đặt phòng đã được xác nhận:'}
          </p>
          <div className="font-mono bg-[#1E1E1E] text-[#C5A059] px-6 py-2 border border-[#2A2A2A] text-sm font-bold tracking-widest inline-block">
            {bookingId}
          </div>
        </div>

        {confirmedMethod === 'pay_later' ? (
          <div className="text-left bg-amber-950/20 border border-amber-900/40 p-4 space-y-2.5 rounded-none text-xs text-[#E8E2D9] max-w-sm">
            <div className="flex items-center gap-1.5 text-[#C5A059] font-semibold uppercase tracking-wider text-[10px]">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Lưu ý quan trọng về Check-in</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Thông tin đặt phòng của quý khách đã được tự động cập nhật và đồng bộ trực tiếp lên Google Sheets quản trị của khách sạn Pullman Hanoi.
            </p>
            <p className="text-[11px] text-[#C5A059] leading-relaxed font-semibold bg-black/30 p-2 border-l border-[#C5A059]">
              ⚠️ Đối với trường hợp checkin chậm 3 tiếng so với giờ đăng ký, khách sạn sẽ tự động hủy phòng nên quý khách vui lòng đến đúng giờ hoặc có thay đổi về thời gian checkin hay checkout hãy gọi trực tiếp đến hotline của khách sạn để cập nhật thông tin nhanh nhất.
            </p>
          </div>
        ) : (
          <div className="text-left bg-amber-950/20 border border-amber-900/40 p-4 space-y-2 rounded-none text-xs text-[#E8E2D9] max-w-sm">
            <p className="text-[11px] text-slate-300 leading-relaxed font-serif">
               🌸 <strong>Cảm ơn Quý khách đã hoàn tất chuyển khoản thanh toán toàn bộ tiền phòng!</strong>
            </p>
            <p className="text-[11px] text-slate-400 leading-normal">
              Thông tin đặt phòng và trạng thái thanh toán đã được ghi nhận trực tiếp trên hệ thống Google Sheets quản trị của Khách sạn Pullman Hanoi. Nhân viên lễ tân sẽ liên hệ xác minh sớm nhất.
            </p>
          </div>
        )}

        <div className="w-full">
          <button
            onClick={onCancel}
            className="w-full py-3 px-6 bg-[#C5A059] hover:bg-[#C5A059]/80 text-black font-bold text-xs uppercase tracking-widest transition-all rounded-none cursor-pointer"
          >
            Quay lại Trò chuyện
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0F0F0F] text-[#E8E2D9] rounded-none border border-[#2A2A2A] shadow-2xl overflow-hidden animate-fade-in flex flex-col h-full">
      {/* Title */}
      <div className="px-5 py-5 bg-[#0F0F0F] border-b border-[#2A2A2A] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <CreditCard className="w-4 h-4 text-[#C5A059]" />
          <h4 className="font-serif font-semibold text-xs uppercase tracking-widest text-[#E8E2D9]">
            Hóa Đơn & Thanh Toán
          </h4>
        </div>
        <span className="text-[9px] font-mono text-[#C5A059] px-2 py-0.5 border border-[#C5A059]/40 bg-[#141414] tracking-wider font-semibold">
          REALTIME
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Reservation Breakdown */}
        <div className="bg-[#141414] p-4 rounded-none border border-[#2A2A2A] space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Hạng phòng:</span>
            <span className="font-serif text-[#E8E2D9] font-semibold">{booking.roomType}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium font-serif">Số lượng đêm:</span>
            <span className="text-[#E8E2D9] font-semibold">{nights} đêm</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium font-serif">Đơn giá:</span>
            <span className="text-slate-200 font-semibold">{formatVND(booking.pricePerNight)}/đêm</span>
          </div>
          <div className="h-[1px] bg-[#2A2A2A]" />
          <div className="flex justify-between items-center pt-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">TỔNG THANH TOÁN:</span>
            <span className="text-[#C5A059] font-bold text-lg tracking-tight">{formatVND(totalPrice)}</span>
          </div>
        </div>

        {/* Guest info card */}
        <div className="bg-[#141414] p-4 rounded-none border border-[#2A2A2A] space-y-3">
          <p className="text-[9px] font-bold text-[#C5A059] uppercase tracking-widest">Hồ sơ khách nghỉ</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <User className="w-3.5 h-3.5 text-[#C5A059]/70 shrink-0" />
              <span className="font-semibold text-slate-200">{booking.customerName}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 text-[11px]">
              <FileText className="w-3.5 h-3.5 text-[#C5A059]/70 shrink-0" />
              <span>CCCD: {booking.cccd}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 text-[11px]">
              <Phone className="w-3.5 h-3.5 text-[#C5A059]/70 shrink-0" />
              <span>SĐT: {booking.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-[#C5A059]/70 shrink-0" />
              <span className="truncate">
                {booking.checkin} ➔ {booking.checkout}
              </span>
            </div>
          </div>
        </div>

        {/* Brand Option Selection Buttons */}
        <div className="space-y-2">
          <p className="text-[9px] font-bold text-[#C5A059] uppercase tracking-widest">Phương thức thanh toán</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPayMethod('pay_later')}
              className={`p-3 border text-left transition-all duration-200 cursor-pointer rounded-none flex flex-col justify-between h-[80px] ${
                payMethod === 'pay_later'
                  ? 'border-[#C5A059] bg-amber-950/20 text-white'
                  : 'border-[#2A2A2A] bg-[#141414] text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-serif font-bold text-[9px] uppercase tracking-wider block">LỰA CHỌN 1</span>
              <span className="text-[10px] leading-snug font-medium block mt-1">Trả tiền sau khi sử dụng dịch vụ</span>
            </button>
            <button
              onClick={() => setPayMethod('pay_now')}
              className={`p-3 border text-left transition-all duration-200 cursor-pointer rounded-none flex flex-col justify-between h-[80px] ${
                payMethod === 'pay_now'
                  ? 'border-[#C5A059] bg-amber-950/20 text-white'
                  : 'border-[#2A2A2A] bg-[#141414] text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-serif font-bold text-[9px] uppercase tracking-wider block">LỰA CHỌN 2</span>
              <span className="text-[10px] leading-snug font-medium block mt-1">Thanh toán chuyển khoản luôn</span>
            </button>
          </div>
        </div>

        {/* Selective Display content */}
        {payMethod === 'pay_later' ? (
          <div className="bg-amber-950/15 border border-amber-900/30 p-4 space-y-3 rounded-none animate-fade-in text-xs max-w-sm">
            <div className="flex items-center gap-1.5 text-[#C5A059] font-bold uppercase tracking-wider text-[10px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span>Chính Sách Hủy Phòng Tự Động</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-serif">
              Đối với trường hợp checkin chậm 3 tiếng khách sạn sẽ tự động hủy phòng nên khách vui lòng đến đúng giờ.
            </p>
            <p className="text-[11px] text-slate-400 leading-normal">
              Hoặc nếu có thay đổi về thời gian checkin hay checkout, xin quý khách vui lòng <strong>gọi trực tiếp đến hotline</strong> của khách sạn để cập nhật thông tin nhanh nhất.
            </p>
          </div>
        ) : (
          <div className="bg-[#1C1C1C] text-[#E8E2D9] p-4 rounded-none border border-[#2A2A2A] flex flex-col items-center space-y-3.5 animate-fade-in">
            <div className="text-center space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#C5A059]">Quét QR Chuyển Khoản Tiền Phòng</p>
              <p className="text-[10px] font-semibold text-slate-300 flex items-center justify-center gap-1 font-serif">
                Thụ hưởng: {accountName}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-none border border-[#C5A059] flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="VietQR Payment Code"
                className="w-36 h-36 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="w-full text-[10px] text-slate-400 space-y-1.5 leading-relaxed font-mono">
              <div className="flex justify-between py-0.5 items-center">
                <span>Số tài khoản:</span>
                <button
                  onClick={handleCopyClipboard}
                  className="font-bold text-[#E8E2D9] bg-[#2A2A2A] hover:bg-[#C5A059] hover:text-black border border-[#2A2A2A] px-2.5 py-1 rounded-none transition-colors duration-200 cursor-pointer text-xxs font-mono"
                >
                  {accountNumber} {copied ? '• COPIED!' : '• COPY'}
                </button>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Ngân hàng:</span>
                <span className="font-semibold text-slate-200">{bankName}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Số tiền:</span>
                <span className="font-bold text-[#C5A059]">{formatVND(totalPrice)}</span>
              </div>
              <div className="flex flex-col pt-1.5 border-t border-[#2A2A2A]">
                <span>Nội dung chuyển khoản:</span>
                <span className="font-mono font-bold text-[#C5A059] bg-[#0F0F0F] border border-[#2A2A2A] px-2 py-1.5 text-center mt-1 select-all select-text text-xxs">
                  {description}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="p-4 bg-[#0F0F0F] border-t border-[#2A2A2A] flex gap-3 sm:gap-3.5 shrink-0">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-3 bg-transparent hover:bg-[#1E1E1E]/55 text-slate-400 hover:text-white rounded-none font-medium text-xs border border-[#2A2A2A] uppercase tracking-widest transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          onClick={handleConfirmPay}
          disabled={isSubmitting}
          className="flex-1 py-3 bg-[#C5A059] hover:bg-[#C5A059]/80 disabled:bg-slate-700 text-black rounded-none font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          {isSubmitting ? (
            'Processing...'
          ) : payMethod === 'pay_later' ? (
            'Xác nhận đặt phòng'
          ) : (
            'Đã chuyển khoản'
          )}
        </button>
      </div>
    </div>
  );
};
