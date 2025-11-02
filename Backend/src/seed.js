// src/seed.js
import mongoose from "mongoose";

// src/seed.js
import { connectToMongoDB } from "./lib/db.js";
import User from "./models/User.js";
import Place from "./models/Place.js";
import TripSchedule from "./models/TripSchedule.js";
import Booking from "./models/Booking.js";
import Review from "./models/Review.js";
import Report from "./models/Report.js";
import TripApproval from "./models/TripApproval.js";

const usersData = [
  { username: "john_doe", email: "john@gmail.com", password: "password123", role: "user" },
  { username: "jane_admin", email: "admin@gmail.com", password: "admin123", role: "admin" },
  { username: "alice_traveler", email: "alice@gmail.com", password: "travel123", role: "user" },
  { username: "bob_explorer", email: "bob@gmail.com", password: "explore123", role: "user" },
  { username: "support_team", email: "support@gmail.com", password: "support123", role: "support" },
];

const placesData = [
  {
    name: "Vịnh Hạ Long",
    location: "Quảng Ninh, Việt Nam",
    description: "Di sản thế giới UNESCO với hàng ngàn đảo đá vôi và hang động kỳ thú.",
    image: "https://images.unsplash.com/photo-1572414874007-557edf1fd341?w=500",
    placeIdentifier: "HALONG_001",
  },
  {
    name: "Hồ Hoàn Kiếm",
    location: "Hà Nội, Việt Nam",
    description: "Hồ nước lịch sử với Tháp Rùa và Đền Ngọc Sơn.",
    image: "https://images.unsplash.com/photo-1580130684518-6b3d0c4e08e9?w=500",
    placeIdentifier: "HOANKIEM_002",
  },
  {
    name: "Phố cổ Hội An",
    location: "Quảng Nam, Việt Nam",
    description: "Phố cổ lung linh ánh đèn lồng, di sản văn hóa thế giới.",
    image: "https://images.unsplash.com/photo-1579783902614-a3bd2229a49f?w=500",
    placeIdentifier: "HOIAN_003",
  },
  {
    name: "Thác Bản Giốc",
    location: "Cao Bằng, Việt Nam",
    description: "Thác nước hùng vĩ nằm ở biên giới Việt - Trung.",
    image: "https://images.unsplash.com/photo-1600439519248-09096d4e7418?w=500",
    placeIdentifier: "BANGIOC_004",
  },
  {
    name: "Đồi chè Tâm Châu",
    location: "Hà Giang, Việt Nam",
    description: "Ruộng bậc thang chè xanh mướt, tuyệt đẹp vào mùa thu hoạch.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500",
    placeIdentifier: "TAMCHAU_005",
  },
];

const tripSchedulesData = [
  {
    title: "Khám phá Hà Nội 3N2Đ",
    description: "Hành trình khám phá thủ đô với ẩm thực đường phố và văn hóa.",
    budget: { flight: 2500000, hotel: 1800000, fun: 1200000 },
    days: [
      {
        day: 1,
        date: "2025-12-01",
        activities: [
          { time: "09:00", name: "Tham quan Hồ Hoàn Kiếm", cost: 0 },
          { time: "14:00", name: "Ăn bún chả Obama", cost: 80000 },
        ],
      },
      {
        day: 2,
        date: "2025-12-02",
        activities: [
          { time: "08:00", name: "Văn Miếu Quốc Tử Giám", cost: 30000 },
          { time: "16:00", name: "Street food tour", cost: 200000 },
        ],
      },
    ],
    image: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=500",
    hotelDefault: { name: "Hanoi Old Quarter Hotel", cost: 600000 },
    flightTicket: { airline: "Vietnam Airlines", cost: 2500000 },
    isPublic: true,
  },
  {
    title: "Hội An - Đà Nẵng 4N3Đ",
    description: "Kết hợp biển xanh, phố cổ và cầu Rồng phun lửa.",
    budget: { flight: 1800000, hotel: 2200000, fun: 1500000 },
    days: [
      {
        day: 1,
        date: "2025-12-10",
        activities: [
          { time: "14:00", name: "Check-in Phố cổ Hội An", cost: 120000 },
          { time: "19:00", name: "Dạo phố đêm", cost: 0 },
        ],
      },
    ],
    image: "https://images.unsplash.com/photo-1579783902614-a3bd2229a49f?w=500",
    hotelDefault: { name: "Hoi An Riverside Resort", cost: 750000 },
    flightTicket: { airline: "Bamboo Airways", cost: 1800000 },
    isPublic: true,
  },
  {
    title: "Du lịch Cao Bằng - Thác Bản Giốc",
    description: "Khám phá thiên nhiên hùng vĩ và văn hóa dân tộc Tày.",
    budget: { flight: 2000000, hotel: 1000000, fun: 800000 },
    days: [
      {
        day: 1,
        date: "2025-12-15",
        activities: [
          { time: "08:00", name: "Tham quan Thác Bản Giốc", cost: 50000 },
        ],
      },
    ],
    image: "https://images.unsplash.com/photo-1600439519248-09096d4e7418?w=500",
    hotelDefault: { name: "Cao Bang Eco Resort", cost: 500000 },
    flightTicket: { airline: "VietJet Air", cost: 2000000 },
    isPublic: true,
  },
];

// Hàm seed chính
async function seedDatabase() {
  try {
    console.log("🚀 Bắt đầu seed dữ liệu...");

    // 1. Tạo Users (bỏ qua nếu username hoặc email đã tồn tại)
    console.log("📝 Tạo Users...");
    const users = [];
    for (const userData of usersData) {
      const existingUser = await User.findOne({
        $or: [{ username: userData.username }, { email: userData.email }],
      });
      if (!existingUser) {
        const user = new User(userData);
        await user.save(); // Hook pre("save") sẽ mã hóa mật khẩu
        users.push(user);
        console.log(`✅ Thêm user: ${userData.username}`);
      } else {
        console.log(`⚠️ Bỏ qua user: ${userData.username} (đã tồn tại)`);
        users.push(existingUser); // Sử dụng user hiện có
      }
    }
    console.log(`✅ Đã xử lý ${users.length} users`);

    // 2. Tạo Places (bỏ qua nếu placeIdentifier đã tồn tại)
    console.log("📍 Tạo Places...");
    const places = [];
    for (const placeData of placesData) {
      const existingPlace = await Place.findOne({ placeIdentifier: placeData.placeIdentifier });
      if (!existingPlace) {
        const place = new Place(placeData);
        await place.save();
        places.push(place);
        console.log(`✅ Thêm place: ${placeData.name}`);
      } else {
        console.log(`⚠️ Bỏ qua place: ${placeData.name} (đã tồn tại)`);
        places.push(existingPlace);
      }
    }
    console.log(`✅ Đã xử lý ${places.length} places`);

    // 3. Tạo TripSchedules và tự động gán user + place
    console.log("🗓️ Tạo TripSchedules...");
    const tripSchedules = [];
    for (let scheduleData of tripSchedulesData) {
      scheduleData.user = users[Math.floor(Math.random() * users.length)]._id;
      scheduleData.days.forEach(day => {
        day.activities.forEach(activity => {
          const randomPlace = places[Math.floor(Math.random() * places.length)];
          activity.place = {
            _id: randomPlace._id,
            name: randomPlace.name,
            placeIdentifier: randomPlace.placeIdentifier,
          };
        });
      });
      const schedule = new TripSchedule(scheduleData);
      await schedule.save();
      tripSchedules.push(schedule);
    }
    console.log(`✅ Đã tạo ${tripSchedules.length} trip schedules`);

    // 4. Tạo Bookings
    console.log("🎫 Tạo Bookings...");
    const bookings = [];
    for (let i = 0; i < 10; i++) {
      const booking = new Booking({
        user: users[Math.floor(Math.random() * users.length)]._id,
        ...(Math.random() > 0.4
          ? { place: places[Math.floor(Math.random() * places.length)]._id }
          : { tripSchedule: tripSchedules[Math.floor(Math.random() * tripSchedules.length)]._id }),
        amount: Math.floor(Math.random() * 5000000) + 500000, // 500k - 5.5tr
        status: ["pending", "confirmed", "cancelled"][Math.floor(Math.random() * 3)],
        bookingDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
      await booking.save();
      bookings.push(booking);
    }
    console.log(`✅ Đã tạo ${bookings.length} bookings`);

    // 5. Tạo Reviews
    console.log("⭐ Tạo Reviews...");
    const reviews = [];
    for (let i = 0; i < 15; i++) {
      const review = new Review({
        user: users[Math.floor(Math.random() * users.length)]._id,
        targetType: Math.random() > 0.5 ? "Place" : "TripSchedule",
        targetId:
          Math.random() > 0.5
            ? places[Math.floor(Math.random() * places.length)]._id
            : tripSchedules[Math.floor(Math.random() * tripSchedules.length)]._id,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: generateRandomComment(),
        status: Math.random() > 0.1 ? "visible" : "hidden",
      });
      await review.save();
      reviews.push(review);
    }
    console.log(`✅ Đã tạo ${reviews.length} reviews`);

    // 6. Tạo Reports
    console.log("⚠️ Tạo Reports...");
    const reports = [];
    for (let i = 0; i < 7; i++) {
      const targetTypes = ["User", "TripSchedule", "Review", "Place"];
      const targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];
      let targetId;
      switch (targetType) {
        case "User":
          targetId = users[Math.floor(Math.random() * users.length)]._id;
          break;
        case "TripSchedule":
          targetId = tripSchedules[Math.floor(Math.random() * tripSchedules.length)]._id;
          break;
        case "Review":
          targetId = reviews[Math.floor(Math.random() * reviews.length)]._id;
          break;
        case "Place":
          targetId = places[Math.floor(Math.random() * places.length)]._id;
          break;
      }
      const report = new Report({
        reporter: users[Math.floor(Math.random() * users.length)]._id,
        targetType,
        targetId,
        reason: ["Spam", "Nội dung không phù hợp", "Thông tin sai lệch", "Quấy rối"][
          Math.floor(Math.random() * 4)
        ],
        description: `Báo cáo ${targetType} này vì có vấn đề về nội dung.`,
        status: ["pending", "reviewed"][Math.floor(Math.random() * 2)],
      });
      await report.save();
      reports.push(report);
    }
    console.log(`✅ Đã tạo ${reports.length} reports`);

    // 7. Tạo TripApprovals
    console.log("✅ Tạo TripApprovals...");
    const tripApprovals = [];
    for (let schedule of tripSchedules) {
      const approval = new TripApproval({
        tripSchedule: schedule._id,
        status: ["pending", "approved", "rejected"][Math.floor(Math.random() * 3)],
        admin: users.find((u) => u.role === "admin")._id,
        ...(Math.random() > 0.7 && { reason: "Không đáp ứng tiêu chuẩn công bố" }),
      });
      await approval.save();
      tripApprovals.push(approval);
    }
    console.log(`✅ Đã tạo ${tripApprovals.length} trip approvals`);

    console.log("🎉 Hoàn thành seed dữ liệu!");
    console.log("\n📊 THỐNG KÊ:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📍 Places: ${places.length}`);
    console.log(`   🗓️ TripSchedules: ${tripSchedules.length}`);
    console.log(`   🎫 Bookings: ${bookings.length}`);
    console.log(`   ⭐ Reviews: ${reviews.length}`);
    console.log(`   ⚠️ Reports: ${reports.length}`);
    console.log(`   ✅ Approvals: ${tripApprovals.length}`);
  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
  }
}

// Hàm tạo comment ngẫu nhiên
function generateRandomComment() {
  const templates = [
    "Tuyệt vời! Địa điểm rất đẹp và đáng để ghé thăm.",
    "Trải nghiệm rất tốt, sẽ quay lại lần nữa!",
    "Khá ổn nhưng cần cải thiện dịch vụ.",
    "Không đúng như kỳ vọng, hơi thất vọng.",
    "View đẹp mê hồn, rất đáng tiền!",
    "Địa điểm tuyệt đẹp, nhân viên thân thiện.",
    "Chuyến đi thú vị, recommend cho mọi người!",
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Chạy seed
async function main() {
  await connectToMongoDB();
  await seedDatabase();
  mongoose.connection.close();
}

main();