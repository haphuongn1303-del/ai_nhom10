/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room } from '../types';

// Helpers for Dynamic Pricing based on available rooms inventory
function getDynamicPrice(basePrice: number, availableRooms: number): number {
  if (availableRooms >= 15) {
    return basePrice * 0.90; // 10% discount
  } else if (availableRooms >= 10) {
    return basePrice * 0.95; // 5% discount
  } else if (availableRooms <= 3) {
    return basePrice * 1.10; // 10% markup
  } else if (availableRooms <= 5) {
    return basePrice * 1.05; // 5% markup
  }
  return basePrice;
}

function getPriceRuleLabel(availableRooms: number): string {
  if (availableRooms >= 15) return 'Giảm cực ưu đãi 10% (do còn dồi dào từ 15 phòng trống)';
  if (availableRooms >= 10) return 'Ưu đãi giảm 5% (do còn dồi dào từ 10 phòng trống)';
  if (availableRooms <= 3) return 'Tăng 10% (do khan hiếm cực độ còn từ 3 phòng trống)';
  if (availableRooms <= 5) return 'Tăng 5% (do khan hiếm còn từ 5 phòng trống)';
  return 'Giá thường tiêu chuẩn';
}

export function simulateChatBotOffline(messages: any[], roomsData: Room[]): string {
  const lastUserMsg = messages[messages.length - 1].text.toLowerCase().trim();
  let reply = '';

  const getRoomSummary = (r: Room) => {
    const dPrice = getDynamicPrice(r.pricePerNight, r.availableRooms);
    const ruleLabel = getPriceRuleLabel(r.availableRooms);
    return `🏨 **${r.roomType}** - Còn lại *${r.availableRooms}* phòng trống.
- Giá bán thực tế: **${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(dPrice)} / đêm** *(áp dụng quy tắc cung cầu: ${ruleLabel})*
- Tiện ích phòng: _${r.description}_`;
  };

  // 1. Greetings & Welcomes
  if (lastUserMsg === 'chào' || lastUserMsg.includes('xin chào') || lastUserMsg.includes('hello') || lastUserMsg.includes('hi ') || lastUserMsg === 'hi') {
    reply = 'Dạ! Pullman Hanoi xin kính chào Quý khách! 🌸 Thật vinh hạnh khi được đón tiếp và hỗ trợ Quý khách hôm nay.\n\nPullman Hanoi có thể giúp Quý khách cập nhật giá phòng trống trực tiếp áp dụng chính sách cung cầu thông minh, chuẩn bị hồ sơ đặt phòng nghỉ dưỡng, tư vấn bàn tiệc tại nhà hàng La Cheminée, quầy bar Mint Bar hoặc cung cấp thông tin trải nghiệm 5 sao tiện ích. Quý khách muốn bắt đầu bằng dịch vụ nào hôm nay ạ?';
  }
  // 2. WiFi Queries
  else if (lastUserMsg.includes('wifi') || lastUserMsg.includes('mạng') || lastUserMsg.includes('internet') || lastUserMsg.includes('mật khẩu')) {
    reply = 'Dạ thưa Quý khách, tại toàn bộ khuôn viên sảnh chính, nhà hàng và phòng nghỉ của Khách sạn Pullman Hanoi đều được trang bị hệ thống internet không dây tốc độ cao hoàn toàn miễn phí:\n\n📶 **Tên Wifi**: `@Pullman_Hanoi_Guest`\n🔑 **Mật khẩu**: Không yêu cầu mật khẩu (Quý khách chỉ cần bấm kết nối rồi tick chọn đồng ý với điều khoản trên trang chào đón là có thể lướt mạng tốc độ cao ngay).\n\nNếu Quý khách có gặp bất kỳ trở ngại nào về mặt kỹ thuật, xin vui lòng bấm số nội bộ `0` tại phòng để Pullman Hanoi điều động kỹ thuật viên IT hỗ trợ lập tức ạ! Quý khách có cần tư vấn thêm dịch vụ nào khác không ạ?';
  }
  // 3. Check-in & Check-out Standard Policies
  else if (lastUserMsg.includes('giờ nhận') || lastUserMsg.includes('giờ trả') || lastUserMsg.includes('check-in') || lastUserMsg.includes('checkin') || lastUserMsg.includes('checkout') || lastUserMsg.includes('nhận phòng') || lastUserMsg.includes('trả phòng')) {
    reply = 'Dạ thưa Quý khách, thời gian nhận phòng và trả phòng tiêu chuẩn tại Pullman Hanoi được quy định như sau:\n\n⏱️ **Giờ Nhận Phòng (Check-in)**: Từ **14:00 giờ chiều**.\n⏱️ **Giờ Trả Phòng (Check-out)**: Trước **12:00 giờ trưa** ngày hôm sau.\n\n*Lưu ý từ Pullman Hanoi dành cho Quý khách*:\n- Quý khách có yêu cầu Nhận phòng sớm hoặc Trả phòng muộn, Pullman Hanoi luôn sẵn sàng sắp xếp tùy thuộc vào điều kiện phòng trống thực tế của ngày lưu trú (có thể đi kèm phụ phí nhỏ theo chính sách tập đoàn).\n- Các hạng phòng VIP **Executive** sẽ được ưu tiên hỗ trợ linh động giờ nhận/trả phòng sớm miễn phí nếu trạng thái phòng trống sẵn sàng ạ!\n\nQuý khách có cần Pullman Hanoi hỗ trợ tư vấn đặt phòng cho kỳ nghỉ sắp tới không ạ?';
  }
  // 4. Breakfast, Buffet & La Cheminee restaurant & Mint Bar
  else if (lastUserMsg.includes('ăn') || lastUserMsg.includes('sáng') || lastUserMsg.includes('nhà hàng') || lastUserMsg.includes('cheminée') || lastUserMsg.includes('bar') || lastUserMsg.includes('mint') || lastUserMsg.includes('uống') || lastUserMsg.includes('buffet')) {
    reply = 'Dạ thưa Quý khách, Pullman Hanoi tự hào mang đến cho Quý khách hành trình tinh hoa ẩm thực đỉnh cao với 2 không gian ẩm thực sang trọng:\n\n🍽️ **Nhà hàng La Cheminée** (Tầng 1):\n- *Buffet Sáng*: Phục vụ từ 06:00 đến 10:30 sáng hàng ngày với đa dạng ẩm thực Âu - Á chọn lọc phong phú.\n- *Ẩm thực gọi món A-la-carte*: Mở cửa phục vụ trưa & tối đến 22:00 đặc sắc.\n\n☕ **Mint Bar** (Sảnh chính - Tầng trệt):\n- Mở cửa từ 07:00 sáng đến 23:30 đêm. Là vị trí lý tưởng để Quý khách tiếp khách công việc hay nhâm nhi cocktail Signature cao cấp.\n\nQuý khách có cần Pullman Hanoi hỗ trợ đặt giữ bàn tiệc buffet sáng hoặc tư vấn giá phòng kèm buffet miễn phí cho Quý khách hôm nay không ạ?';
  }
  // 5. Spa, Gym, Sauna & Swimming Pool
  else if (lastUserMsg.includes('tiện ích') || lastUserMsg.includes('dịch vụ') || lastUserMsg.includes('bể bơi') || lastUserMsg.includes('hồ bơi') || lastUserMsg.includes('gym') || lastUserMsg.includes('spa') || lastUserMsg.includes('tập') || lastUserMsg.includes('sauna') || lastUserMsg.includes('xông hơi') || lastUserMsg.includes('massage')) {
    reply = 'Dạ thưa Quý khách, Pullman Hanoi trang bị sẵn các dịch vụ chăm sóc phục hồi sức khỏe trọn vẹn dành cho Quý khách tại khu vực **Tầng 2**:\n\n💪 **Fit Lounge (Phòng Gym)**: Trang thiết bị hiện đại từ Technogym, hoạt động liên tục **24/7**.\n🏊 **Bể Bơi Ngoài Trời**: Hồ bơi ngọc bích hòa mình với thiên nhiên mở cửa từ 06:00 đến 21:00 hàng ngày, hoàn toàn miễn phí cho Quý khách lưu trú.\n💆 **Wellness Spa & Sauna**: Liệu trình xông hơi và massage chuyên sâu bấm huyệt nuôi dưỡng sinh lực cơ thể.\n\nQuý khách có muốn Pullman Hanoi giúp Quý khách đặt lịch hẹn trải nghiệm thư giãn tinh tế trước với lễ tân Spa không ạ?';
  }
  // 6. Executive VIP Perks Lounge on 14th Floor
  else if (lastUserMsg.includes('executive') || lastUserMsg.includes('suite') || lastUserMsg.includes('lounge') || lastUserMsg.includes('đặc quyền') || lastUserMsg.includes('vip')) {
    reply = 'Dạ thưa Quý khách, khi lựa chọn lưu trú tại các hạng phòng hạng sang **Executive Room** hoặc **Executive Suite**, Quý khách sẽ tự động nhận về chuỗi đặc quyền phục vụ thượng hạng tuyệt mật tại sảnh **Executive Lounge tầng 14**:\n\n👑 **Các Đặc Quyền Đặc Biệt Bao Gồm**:\n- Thủ tục Nhận/Trả phòng riêng tư nhanh chóng tại tầng 14.\n- Bữa sáng riêng phong phú, trà chiều sang chảnh từ 14:30 - 16:30.\n- Giờ Vàng Cocktail tối miễn phí cùng các món ăn Canapes nhẹ nhàng từ 17:30 - 19:30.\n- Miễn phí thuê phòng họp riêng trong 2 giờ và giặt là 2 đồ mỗi ngày.\n\nĐây chắc chắn là lựa chọn hoàn mỹ cho chuyến lưu trú của Quý khách. Quý khách có muốn Pullman Hanoi đặt ngay hôm nay không ạ?';
  }
  // 7. Location & Sightseeing Guidance
  else if (lastUserMsg.includes('địa chỉ') || lastUserMsg.includes('vị trí') || lastUserMsg.includes('ở đâu') || lastUserMsg.includes('địa điểm') || lastUserMsg.includes('du lịch') || lastUserMsg.includes('vui chơi') || lastUserMsg.includes('gần đây') || lastUserMsg.includes('đi đâu')) {
    reply = 'Dạ thưa Quý khách, Khách sạn Pullman Hanoi ngụ tại địa điểm vàng trung tâm di sản: số **40 Cát Linh, Quận Đống Đa, Hà Nội, Việt Nam**.\n\nTừ vị trí này, Quý khách dễ dàng di chuyển tham quan các danh thắng nổi tiếng:\n🏛️ **Văn Miếu - Quốc Tử Giám**: Chỉ cách 1.0 km.\n🌸 **Lăng Bác & Chùa Một Cột**: Cách 1.5 km.\n🏰 **Hoàng thành Thăng Long**: Khoảng 1.8 km.\n🌳 **Hồ Hoàn Kiếm**: 3.0 km dạo bộ di chuyển.\n\nQuý khách có cần Pullman Hanoi giúp Quý khách gọi xe đưa đón di chuyển chất lượng cao hay không ạ?';
  }
  // 8. Room specs queries / price lists
  else if (lastUserMsg.includes('phòng') || lastUserMsg.includes('loại phòng') || lastUserMsg.includes('giá phòng') || lastUserMsg.includes('giá')) {
    const listDescription = (roomsData || [])
      .map((r) => getRoomSummary(r))
      .join('\n\n');
    reply = `Dạ thưa Quý khách! Pullman Hanoi vô cùng hân hạnh gửi đến Quý khách danh sách các hạng phòng nghỉ dưỡng 5 sao sang trọng đang sẵn sàng phục vụ cùng mức giá bán áp dụng linh hoạt theo số lượng phòng trống thực tế:\n\n${listDescription}\n\nQuý khách ấn tượng với thiết kế của loại phòng nào chưa ạ? Quý khách chỉ cần cho Pullman Hanoi biết tên loại phòng mong muốn để Pullman Hanoi bắt đầu giữ chỗ tốt nhất ngay nhé!`;
  }
  // 9. Process exact booking command or detect booking intent
  else if (lastUserMsg.includes('đặt') || lastUserMsg.includes('superior') || lastUserMsg.includes('deluxe') || lastUserMsg.includes('executive') || lastUserMsg.includes('suite') || lastUserMsg.includes('presidential')) {
    // Detect which room type the guest chosen
    let detectedRoom = 'Superior Room';
    if (lastUserMsg.includes('deluxe')) detectedRoom = 'Deluxe Room';
    if (lastUserMsg.includes('executive room') || (lastUserMsg.includes('executive') && !lastUserMsg.includes('suite'))) detectedRoom = 'Executive Room';
    if (lastUserMsg.includes('suite') && !lastUserMsg.includes('presidential')) detectedRoom = 'Executive Suite';
    if (lastUserMsg.includes('presidential')) detectedRoom = 'Presidential Suite';

    // Verify inventory of this chosen room
    const matchedRoom = (roomsData || []).find(r => r.roomType.toLowerCase().trim() === detectedRoom.toLowerCase().trim());
    const availableCount = matchedRoom ? matchedRoom.availableRooms : 0;

    if (availableCount <= 0) {
      // Room class has exhaustively sold out
      const availableAlternatives = (roomsData || [])
        .filter(r => r.availableRooms > 0)
        .map(r => `• **${r.roomType}** (Còn trống ${r.availableRooms} phòng)`)
        .join('\n');

      if (lastUserMsg.includes('không muốn đổi') || lastUserMsg.includes('không đổi') || lastUserMsg.includes('không hạng phòng khác') || lastUserMsg.includes('không đồng ý') || lastUserMsg === 'không') {
        reply = 'Pullman Hanoi xin chân thành cảm ơn Quý khách đã liên hệ và hy vọng sẽ được phục vụ Quý khách trong tương lai gần.';
      } else {
        reply = `Dạ thưa Quý khách, hiện tại rất tiếc vì hạng phòng cao cấp **${detectedRoom}** tại Pullman Hanoi đã hết phòng trống mất rồi ạ.\n\nQuý khách có muốn đổi sang hạng phòng khác với chất lượng vượt trội hiện tại vẫn đang còn phòng sẵn sàng hay không ạ? Dưới đây là các lựa chọn hạng phòng đang trống hỗ trợ Quý khách:\n\n${availableAlternatives || '• Rất tiếc, tất cả các hạng phòng hôm nay đều đã đầy!'}\n\nQuý khách có hài lòng với phương án đổi phòng này không ạ? Nếu Quý khách không muốn đổi và từ chối, vui lòng phản hồi lại để Pullman Hanoi biết nhé.`;
      }
    } else {
      // Active booking path
      reply = `Dạ vâng ạ! Pullman Hanoi rất hân hạnh được hỗ trợ Quý khách giữ phòng **${detectedRoom}** đạt chất lượng dịch vụ 5 sao hôm nay.\n\nĐể Pullman Hanoi tiến hành tự động thiết lập chứng từ đặt phòng và đẩy thông tin trực tiếp, đồng bộ cập nhật lên trang quản lý Google Sheets, kính mong Quý khách cung cấp đầy đủ 5 thông tin sau đây:\n\n1. Họ và tên Quý khách (Tên người đại diện nhận phòng)\n2. Số căn cước công dân (CCCD) hoặc Số hộ chiếu (Passport) của Quý khách\n3. Số điện thoại liên hệ nhận xác nhận\n4. Ngày bắt đầu nhận phòng (Check-in) (Ví dụ: 2026-05-22)\n5. Ngày trả phòng (Check-out) (Ví dụ: 2026-05-24)\n\n*Quý khách vui lòng nhập các thông tin này một cách tự nhiên (ví dụ: "Họ tên: Nguyễn Văn A, CCCD: 12345678, SĐT: 0912345678, nhận phòng 2026-05-22, trả phòng 2026-05-24") để Pullman Hanoi tạo hóa đơn VietQR chuyển khoản đồng bộ tức thì cho Quý khách nhé ạ!*`;
    }
  }
  // 10. Extract customer booking files upload to trigger payment
  else if ((lastUserMsg.includes('cccd') || lastUserMsg.includes('sđt') || lastUserMsg.includes('thông tin') || lastUserMsg.includes('hộ chiếu') || lastUserMsg.includes('passport')) || (lastUserMsg.includes('ngày') && lastUserMsg.match(/\d/))) {
    
    // Check if user specifically declines or doesn't want alternative rooms in context of sold out
    if (lastUserMsg.includes('không đổi') || lastUserMsg.includes('không muốn đổi') || lastUserMsg.includes('không chọn') || lastUserMsg === 'không') {
      reply = 'Pullman Hanoi xin chân thành cảm ơn Quý khách đã liên hệ và hy vọng sẽ được phục vụ Quý khách trong tương lai gần.';
      return reply;
    }

    // Attempt parsing some values
    const names = lastUserMsg.match(/(nguyễn\s+[a-z\s]+|trần\s+[a-z\s]+|lê\s+[a-z\s]+|vũ\s+[a-z\s]+|phạm\s+[a-z\s]+|họ tên[:\s]+[a-z\s]+)/i);
    const guestName = names ? names[0].replace(/họ tên[:\s]+/i, '').trim().toUpperCase() : 'NGUYỄN QUÝ KHÁCH';
    const cccds = lastUserMsg.match(/\d{9,12}/) || ['012356789012'];
    const phones = lastUserMsg.match(/(0\d{9})/) || ['0912345678'];

    // Identify checkin date
    const checkinMatch = lastUserMsg.match(/(2026-\d{2}-\d{2})/) || ['2026-05-22'];
    const checkoutMatch = lastUserMsg.match(/(2026-\d{2}-\d{2})/) || ['2026-05-24'];

    // Compute number of nights automatically from dates
    let nights = 1;
    try {
      const d1 = new Date(checkinMatch[0]);
      const d2 = new Date(checkoutMatch[0]);
      const diff = Math.abs(d2.getTime() - d1.getTime());
      nights = Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
    } catch {
      nights = 2;
    }

    let rType = 'Superior Room';
    if (lastUserMsg.includes('deluxe')) rType = 'Deluxe Room';
    if (lastUserMsg.includes('executive room')) rType = 'Executive Room';
    if (lastUserMsg.includes('suite') && !lastUserMsg.includes('presidential')) rType = 'Executive Suite';
    if (lastUserMsg.includes('presidential')) rType = 'Presidential Suite';

    // Verify inventory of this chosen room
    const matchedRoom = (roomsData || []).find(r => r.roomType.toLowerCase().trim() === rType.toLowerCase().trim());
    const availableCount = matchedRoom ? matchedRoom.availableRooms : 0;

    if (availableCount <= 0) {
      const availableAlternatives = (roomsData || [])
        .filter(r => r.availableRooms > 0)
        .map(r => `• **${r.roomType}** (Còn trống ${r.availableRooms} phòng)`)
        .join('\n');

      reply = `Dạ thưa Quý khách, hiện tại hạng phòng **${rType}** đã bán hết phòng trống mất rồi ạ.\n\nQuý khách có muốn đổi sang hạng phòng khác vẫn còn phòng sẵn có sau đây hay không ạ?\n\n${availableAlternatives || '• Rất tiếc, tất cả các hạng phòng hiện tại đều đầy!'}\n\nNếu Quý khách không muốn đổi hạng phòng khác, vui lòng phản hồi lại để Pullman Hanoi biết nhé.`;
    } else {
      reply = `Dạ! Pullman Hanoi xin trân trọng cảm ơn Quý khách đã tin tưởng cung cấp thông tin đặt phòng nghỉ dưỡng tại Khách sạn Pullman Hanoi Hotel.\n\nPullman Hanoi đã tóm tắt lại thông tin đặt phòng và bảng thanh toán của Quý khách như sau:\n\n👤 **Tên Quý khách**: ${guestName}\n💳 **CCCD / Passport**: ${cccds[0]}\n📞 **Số điện thoại**: ${phones[0]}\n🏨 **Hạng phòng chọn**: ${rType}\n📅 **Thời gian lưu trú**: Từ **${checkinMatch[0]}** đến **${checkoutMatch[0]}** (Tự động tính: **${nights} đêm**)\n\nHệ thống Google Sheets quản trị cốt lõi đã tích hợp đồng bộ thành công. Ngay bây giờ, một **Bảng quét chuyển khoản ngân hàng VietQR chính thức kèm thông tin chi tiết hóa đơn** đã sẵn sàng ngay góc phải màn hình của Quý khách.\n\nKính xin Quý khách kiểm duyệt lại nội dung dòng tiền thanh toán và tiến hành quét QR, sau đó nhấn nút "Đã thanh toán" sau khi hoàn tất để kích hoạt giữ phòng thành công nhé ạ!\n\n\`\`\`json\n{\n  "action": "CREATE_BOOKING",\n  "customerName": "${guestName}",\n  "cccd": "${cccds[0]}",\n  "phone": "${phones[0]}",\n  "checkin": "${checkinMatch[0]}",\n  "checkout": "${checkoutMatch[0]}",\n  "roomType": "${rType}"\n}\n\`\`\`\n\nNếu Quý khách cần chỉnh sửa bất kỳ thông tin cá nhân hay ngày ở nào, xin vui lòng gửi tin nhắn sửa đổi trực tiếp tại khung chat này, Pullman Hanoi luôn ở đây sẵn sàng hỗ trợ Quý khách!`;
    }
  }
  // 11. Generic response / default
  else {
    if (lastUserMsg.includes('không đổi') || lastUserMsg.includes('không chọn') || lastUserMsg.includes('không muốn đổi') || lastUserMsg === 'không') {
      reply = 'Pullman Hanoi xin chân thành cảm ơn Quý khách đã liên hệ và hy vọng sẽ được phục vụ Quý khách trong tương lai gần.';
    } else {
      reply = 'Dạ Pullman Hanoi xin nghe ạ. Quý khách có thể thoải mái đặt bất cứ câu hỏi nào tiếp theo về thông tin các loại phòng 5 sao còn trống, cập nhật biến động giá, giờ nhận/trả phòng, các tiện ích La Cheminée hay Wellness Spa để Pullman Hanoi hân hạnh giải đáp tỉ mỉ, đầy đủ nhất cho Quý khách nhé ạ!';
    }
  }

  return reply;
}
