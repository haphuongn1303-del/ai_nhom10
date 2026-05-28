/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room } from './types';

export const PULLMAN_INFO = {
  name: 'Pullman Hanoi Hotel',
  address: '40 Cát Linh, Quận Đống Đa, Hà Nội, Việt Nam',
  phone: '+84 24 3733 0688',
  email: 'h7579@accor.com',
  website: 'https://all.accor.com/hotel/7579/index.vi.shtml',
  rating: '5-star Luxury Hotel',
  amenities: [
    {
      id: 'fit-lounge',
      name: 'Fit Lounge (Phòng Tập Gym)',
      description: 'Phòng tập thể thao hoạt động 24/7 tại tầng 2, được trang bị đầy đủ thiết bị tim mạch và tăng cường thể lực hiện đại.',
    },
    {
      id: 'swimming-pool',
      name: 'Bể Bơi Ngoài Trời',
      description: 'Được thiết kế tinh tế bên cạnh khu vườn xanh mướt, mang lại không gian thư giãn tuyệt đối cho khách lưu trú.',
    },
    {
      id: 'la-cheminee',
      name: 'Nhà hàng La Cheminée',
      description: 'Nằm tại tầng 1, phục vụ ẩm thực phong phú với sự kết hợp hoàn hảo giữa ẩm thực quốc tế và hương vị Việt Nam truyền thống đầu thực thụ.',
    },
    {
      id: 'mint-bar',
      name: 'Mint Bar',
      description: 'Quầy bar tại sảnh chính, nơi trò chuyện lý tưởng và thưởng thức cocktail đặc sắc, bia thủ công cùng các món ăn nhẹ.',
    },
    {
      id: 'executive-lounge',
      name: 'Executive Lounge (Sảnh Thượng Hạng)',
      description: 'Tận hưởng bữa sáng riêng biệt, trà chiều sang trọng và cocktail tối miễn phí dành cho khách đặt phòng hạng Executive trở lên.',
    },
    {
      id: 'spa',
      name: 'Wellness Spa & Sauna',
      description: 'Khu xông hơi trị liệu và spa chuyên nghiệp, giúp tái tạo năng lượng sau một ngày làm việc hoặc khám phá Hà Nội.',
    }
  ],
  attractions: [
    {
      name: 'Văn Miếu - Quốc Tử Giám',
      distance: '1.0 km',
      description: 'Trường đại học đầu tiên của Việt Nam, biểu tượng nho học và văn hóa lâu đời.'
    },
    {
      name: 'Lăng Chủ tịch Hồ Chí Minh & Chùa Một Cột',
      distance: '1.5 km',
      description: 'Khu di tích lưu niệm thiêng liêng và ngôi chùa độc đáo hình hoa sen tọa lạc giữa lòng thủ đô.'
    },
    {
      name: 'Hoàng thành Thăng Long',
      distance: '1.8 km',
      description: 'Di sản văn hóa thế giới UNESCO với bề dày lịch sử hơn 1000 năm.'
    },
    {
      name: 'Hồ Hoàn Kiếm & Phố Cổ Hà Nội',
      distance: '3.0 km',
      description: 'Trái tim của thủ đô với Tháp Rùa cổ kính, Đền Ngọc Sơn và các con phố nghề sầm uất.'
    }
  ]
};

export const DEFAULT_ROOMS: Room[] = [
  {
    roomType: 'Superior Room',
    totalRooms: 20,
    availableRooms: 18,
    pricePerNight: 2200000,
    imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=600',
    description: 'Phòng Superior với thiết kế hiện đại, tinh tế (diện tích 32 m²). Tùy chọn 1 giường Queen lớn hoặc 2 giường Đơn, bàn làm việc tiện nghi, cửa kính lớn ngắm nhìn thành phố Hà Nội nhộn nhịp.'
  },
  {
    roomType: 'Deluxe Room',
    totalRooms: 15,
    availableRooms: 12,
    pricePerNight: 2800000,
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600',
    description: 'Nâng tầm kỳ nghỉ tại phòng Deluxe sang trọng (diện tích 32 m²). Có bồn tắm ngâm sâu, buồng tắm vách kính, máy pha cà phê espresso cao cấp và các tiện ích công vụ thông minh.'
  },
  {
    roomType: 'Executive Room',
    totalRooms: 10,
    availableRooms: 10,
    pricePerNight: 3600000,
    imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=600',
    description: 'Phòng Executive (tầng cao) mang lại sự đẳng cấp trọn vẹn. Đặc quyền vào Executive Lounge tại tầng 14 (ăn sáng riêng, cocktail tối miễn phí, đón tiếp vip) cùng bộ chăn ga gối lụa siêu mềm.'
  },
  {
    roomType: 'Executive Suite',
    totalRooms: 5,
    availableRooms: 3,
    pricePerNight: 5000000,
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600',
    description: 'Căn hộ Suite cao cấp rộng rãi (64 m²), có phòng khách riêng biệt sang trọng để tiếp khách, phòng ngủ lộng lẫy và phòng tắm ốp đá cẩm thạch. Bao gồm tất cả các đặc quyền thượng hạng tại Executive Lounge.'
  },
  {
    roomType: 'Presidential Suite',
    totalRooms: 1,
    availableRooms: 1,
    pricePerNight: 22000000,
    imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=600',
    description: 'Tuyệt tác vương giả bậc nhất Pullman Hanoi (diện tích 148 m²). Thiết kế hoàng gia tinh tế với phòng ngủ Master xa hoa, phòng khách trang trọng đầy cảm hứng, phòng làm việc riêng biệt và quầy bar cao cấp. Trải nghiệm trọn cuộc sống thượng lưu với quản gia phục vụ riêng, phòng tắm đá hoa cương ốp vàng và các đặc quyền tối thượng tại Executive Lounge.'
  }
];
