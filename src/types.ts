/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Room {
  roomType: string;
  totalRooms: number;
  availableRooms: number;
  pricePerNight: number;
  imageUrl: string;
  description: string;
}

export interface Booking {
  bookingId: string;
  customerName: string;
  cccd: string;
  phone: string;
  checkin: string; // YYYY-MM-DD
  checkout: string; // YYYY-MM-DD
  roomType: string;
  nights: number;
  totalPrice: number;
  status: 'Chờ thanh toán' | 'Đã thanh toán' | 'Đã xác nhận';
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface AuthState {
  user: any | null;
  accessToken: string | null;
  isLoading: boolean;
  spreadsheetId: string | null;
  isSynced: boolean;
  sheetsError: string | null;
}
