/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { Room, Booking } from './types';
import { DEFAULT_ROOMS } from './hotelData';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request necessary Google Workspace scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize on App Load
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Try to get token if user is signed in but page refreshed
        // Firebase allows retrieving the provider token inside current session, or we force login.
        // We'll let the user initiate a click if token needs refresh.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ==========================================
// GOOGLE SHEETS API HELPER METHODS
// ==========================================

// Create a new Spreadsheet in Drive and populate with Default Pullman Data
export const createSyncedSpreadsheet = async (token: string): Promise<string> => {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Pullman Hanoi Hotel - Chatbot Sync Management',
      },
      sheets: [
        {
          properties: {
            title: 'Rooms & Availability',
          },
        },
        {
          properties: {
            title: 'Bookings Log',
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    throw new Error(`Failed to create spreadsheet: ${errorData?.error?.message || createRes.statusText}`);
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // 1. Populate Rooms Sheet
  const roomsData = [
    ['Room Type', 'Total Rooms', 'Available Rooms', 'Price Per Night (VND)', 'Image URL', 'Description'],
    [
      'Superior Room',
      20,
      18,
      2200000,
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=600',
      'Phòng Superior với thiết kế hiện đại, tinh tế (diện tích 32 m²). Tùy chọn 1 giường Queen lớn hoặc 2 giường Đơn, bàn làm việc tiện nghi, cửa kính lớn ngắm nhìn thành phố Hà Nội nhộn nhịp.'
    ],
    [
      'Deluxe Room',
      15,
      12,
      2800000,
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600',
      'Nâng tầm kỳ nghỉ tại phòng Deluxe sang trọng (diện tích 32 m²). Có bồn tắm ngâm sâu, buồng tắm vách kính, máy pha cà phê espresso cao cấp và các tiện ích công vụ thông minh.'
    ],
    [
      'Executive Room',
      10,
      10,
      3600000,
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=600',
      'Phòng Executive (tầng cao) mang lại sự đẳng cấp trọn vẹn. Đặc quyền vào Executive Lounge tại tầng 14 (ăn sáng riêng, cocktail tối miễn phí, đón tiếp vip) cùng bộ chăn ga gối lụa siêu mềm.'
    ],
    [
      'Executive Suite',
      5,
      3,
      5000000,
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600',
      'Căn hộ Suite cao cấp rộng rãi (64 m²), có phòng khách riêng biệt sang trọng để tiếp khách, phòng ngủ lộng lẫy và phòng tắm ốp đá cẩm thạch. Bao gồm tất cả các đặc quyền thượng hạng tại Executive Lounge.'
    ],
    [
      'Presidential Suite',
      1,
      1,
      22000000,
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=600',
      'Tuyệt tác vương giả bậc nhất Pullman Hanoi (diện tích 148 m²). Thiết kế hoàng gia tinh tế với phòng ngủ Master xa hoa, phòng khách trang trọng đầy cảm hứng, phòng làm việc riêng biệt và quầy bar cao cấp. Trải nghiệm trọn cuộc sống thượng lưu với quản gia phục vụ riêng, phòng tắm đá hoa cương ốp vàng và các đặc quyền tối thượng tại Executive Lounge.'
    ]
  ];

  const writeRoomsRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Rooms%20%26%20Availability!A1:F6?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: roomsData,
      }),
    }
  );

  if (!writeRoomsRes.ok) {
    throw new Error('Failed to write room headers and inventory to spreadsheet.');
  }

  // 2. Populate Bookings Log Sheet Headers
  const bookingsHeaders = [['Booking ID', 'Customer Name', 'CCCD / Passport', 'Phone', 'Checkin Date', 'Checkout Date', 'Room Type', 'Nights', 'Total Price', 'Status', 'Created At']];

  const writeBookingsRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Bookings%20Log!A1:K1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: bookingsHeaders,
      }),
    }
  );

  if (!writeBookingsRes.ok) {
    throw new Error('Failed to write booking headers to spreadsheet.');
  }

  return spreadsheetId;
};

// Fetch Rooms & Availability from Spreadsheet
export const fetchRoomsFromSheet = async (spreadsheetId: string, token: string): Promise<Room[]> => {
  const range = 'Rooms & Availability!A2:F50';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch rooms from Google Sheets. Checking sheet privileges or ID.');
  }

  const data = await res.json();
  const rows = data.values || [];

  const fetchedRooms: Room[] = rows.map((row: any) => ({
    roomType: row[0] || 'Unknown Room',
    totalRooms: parseInt(row[1]) || 0,
    availableRooms: parseInt(row[2]) || 0,
    pricePerNight: parseInt(row[3]) || 0,
    imageUrl: row[4] || '',
    description: row[5] || '',
  }));

  // Detect missing default rooms (e.g., Presidential Suite)
  const roomTypesInSheet = new Set(fetchedRooms.map(r => r.roomType.toLowerCase().trim()));
  const missingRooms: Room[] = [];

  for (const defaultRoom of DEFAULT_ROOMS) {
    if (!roomTypesInSheet.has(defaultRoom.roomType.toLowerCase().trim())) {
      missingRooms.push(defaultRoom);
    }
  }

  if (missingRooms.length > 0) {
    console.log('Detected missing rooms in your Google Sheet. Automatically self-healing and appending them:', missingRooms);
    
    // Attempt to write missing rooms back to the Google Sheet live
    for (let i = 0; i < missingRooms.length; i++) {
      const room = missingRooms[i];
      const nextRow = rows.length + 2 + i; // Offset: headers (Row 1) + 1-indexed conversion
      const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Rooms%20%26%20Availability!A${nextRow}:F${nextRow}?valueInputOption=USER_ENTERED`;

      try {
        await fetch(writeUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [[
              room.roomType,
              room.totalRooms,
              room.availableRooms,
              room.pricePerNight,
              room.imageUrl,
              room.description
            ]]
          })
        });
        console.log(`Successfully self-healed and appended "${room.roomType}" to sheet row ${nextRow}`);
      } catch (writeErr) {
        console.warn(`Could not automatically append missing room row to custom sheets:`, writeErr);
      }
    }

    return [...fetchedRooms, ...missingRooms];
  }

  return fetchedRooms;
};

// Fetch Bookings Log from Spreadsheet
export const fetchBookingsFromSheet = async (spreadsheetId: string, token: string): Promise<Booking[]> => {
  const range = 'Bookings Log!A2:K500';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch bookings from Google Sheets.');
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: any) => ({
    bookingId: row[0] || 'Unknown',
    customerName: row[1] || 'Unknown',
    cccd: row[2] || 'Unknown',
    phone: row[3] || 'Unknown',
    checkin: row[4] || 'Unknown',
    checkout: row[5] || 'Unknown',
    roomType: row[6] || 'Unknown',
    nights: parseInt(row[7]) || 0,
    totalPrice: parseInt(row[8]) || 0,
    status: row[9] || 'Chờ thanh toán',
    createdAt: row[10] || 'Unknown',
  }));
};

// Append a new booking Row to Bookings Log
export const appendBookingToSheet = async (
  spreadsheetId: string,
  token: string,
  booking: Booking
): Promise<void> => {
  const range = 'Bookings Log!A:K';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const body = {
    values: [
      [
        booking.bookingId,
        booking.customerName,
        booking.cccd,
        booking.phone,
        booking.checkin,
        booking.checkout,
        booking.roomType,
        booking.nights,
        booking.totalPrice,
        booking.status,
        booking.createdAt,
      ],
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to append booking to sheet: ${errorText}`);
  }
};

// Update Room Availability row in Spreadsheet
export const updateRoomAvailabilityInSheet = async (
  spreadsheetId: string,
  token: string,
  rooms: Room[],
  roomType: string,
  decrement: boolean = true
): Promise<void> => {
  // 1. Locate the correct row by roomType
  // The structure of values is: Row 2 is Superior, Row 3 is Deluxe, etc.
  // We can fetch the list of Room Types first or scan cell values.
  const range = 'Rooms & Availability!A2:C50'; // Fetch Room Type, Total, Available
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const fetchRes = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!fetchRes.ok) {
    throw new Error('Failed to locate rooms list to update inventory.');
  }

  const data = await fetchRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  let currentAvailable = 0;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].toLowerCase().trim() === roomType.toLowerCase().trim()) {
      rowIndex = i + 2; // Offset by 2 (A1 header is Row 1)
      currentAvailable = parseInt(rows[i][2]) || 0;
      break;
    }
  }

  if (rowIndex === -1) {
    console.warn(`Room type "${roomType}" not found in sheet. Skipping count update.`);
    return;
  }

  const newAvailable = decrement ? Math.max(0, currentAvailable - 1) : currentAvailable + 1;

  // 2. Write to cell C{rowIndex} (Available Rooms is column C)
  const cellRange = `Rooms & Availability!C${rowIndex}`;
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(cellRange)}?valueInputOption=USER_ENTERED`;

  const updateRes = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[newAvailable]],
    }),
  });

  if (!updateRes.ok) {
    throw new Error(`Failed to update room availability cell C${rowIndex}`);
  }
};
