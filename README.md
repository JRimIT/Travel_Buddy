# 🧳 TravelBuddy

TravelBuddy là một ứng dụng du lịch toàn diện giúp người dùng lên kế hoạch, chia sẻ và khám phá các điểm đến du lịch. Ứng dụng tích hợp AI để đề xuất lịch trình du lịch thông minh, tính năng mạng xã hội để chia sẻ trải nghiệm, và hệ thống đặt phòng/booking.

## ✨ Tính năng chính

### 📱 Ứng dụng Mobile (React Native)
- **Lập kế hoạch du lịch**: Tạo lịch trình chi tiết với ngày tháng, hoạt động, và ngân sách
- **Gợi ý AI thông minh**: Sử dụng AI để đề xuất lịch trình, địa điểm và hoạt động phù hợp
- **Feed xã hội**: Chia sẻ bài viết, hình ảnh, like, comment và lưu bài viết
- **Quản lý profile**: Cập nhật thông tin cá nhân, ảnh đại diện
- **Tìm kiếm địa điểm**: Khám phá các điểm đến, nhà hàng, khách sạn xung quanh
- **Tính toán lộ trình**: So sánh phương tiện di chuyển và đề xuất tuyến đường
- **Đặt vé/Booking**: Đặt vé máy bay, khách sạn, xe khách, tàu hỏa
- **Tin nhắn real-time**: Chat với hỗ trợ viên và người dùng khác

### 🖥️ Backend API (Node.js/Express)
- RESTful API với Swagger documentation
- Xác thực JWT và OAuth (Google, Facebook)
- Xử lý upload ảnh với Cloudinary
- WebSocket/Socket.IO cho chat real-time
- Tích hợp AI (Google Generative AI, OpenAI)
- Quản lý database MongoDB với Mongoose

### 👨‍💼 Admin Dashboard (Next.js)
- Quản lý người dùng và bài viết
- Xem và xử lý báo cáo
- Quản lý lịch trình du lịch
- Hỗ trợ khách hàng
- Thống kê và phân tích

## 🛠️ Công nghệ sử dụng

### Frontend Mobile
- **Framework**: React Native với Expo
- **Navigation**: Expo Router
- **State Management**: Redux Toolkit, Zustand
- **UI Components**: React Native Paper, React Native Vector Icons
- **Maps**: React Native Maps, Leaflet Maps
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js với Express.js
- **Database**: MongoDB với Mongoose
- **Authentication**: JWT, Passport.js (Google, Facebook)
- **File Upload**: Multer, Cloudinary
- **Real-time**: Socket.IO, WebSocket
- **AI Integration**: Google Generative AI, OpenAI
- **Documentation**: Swagger/OpenAPI
- **Email**: Nodemailer
- **SMS**: Twilio

### Admin Frontend
- **Framework**: Next.js 15
- **UI**: Tailwind CSS, Radix UI, Shadcn/ui
- **State Management**: SWR, React Hook Form
- **Charts**: Recharts

## 📁 Cấu trúc dự án

```
Travel_Buddy/
├── Backend/                 # Node.js/Express API Server
│   ├── src/
│   │   ├── config/         # Cấu hình (JWT, Session, Swagger)
│   │   ├── controller/     # Controllers xử lý business logic
│   │   ├── middleware/     # Middleware (auth, validation)
│   │   ├── models/         # MongoDB Schemas
│   │   ├── routes/         # API Routes
│   │   ├── services/       # Services (email, etc.)
│   │   └── lib/            # Utilities (db, cloudinary)
│   ├── public/             # Static files & uploads
│   └── package.json
│
├── Frontend/               # React Native Mobile App
│   ├── app/               # Expo Router pages
│   ├── components/        # React components
│   ├── constants/         # Constants & configs
│   ├── redux/            # Redux store & slices
│   ├── store/            # Zustand stores
│   ├── utils/            # Utility functions
│   └── package.json
│
├── admin-fe/              # Next.js Admin Dashboard
│   ├── src/
│   │   ├── app/          # Next.js app directory
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities
│   └── package.json
│
└── package.json          # Root package.json
```

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js >= 18.x
- MongoDB (local hoặc MongoDB Atlas)
- npm hoặc yarn
- Expo CLI (cho mobile app)

### 1. Clone repository

```bash
git clone <repository-url>
cd Travel_Buddy
```

### 2. Cài đặt Backend

```bash
cd Backend
npm install

# Tạo file .env với các biến môi trường cần thiết
# Xem phần Environment Variables bên dưới

# Chạy server
npm start
```

Backend server sẽ chạy tại `http://localhost:3000` (hoặc PORT được cấu hình trong .env)

### 3. Cài đặt Frontend Mobile

```bash
cd Frontend
npm install

# Cấu hình API_URL trong constants/api.js hoặc .env

# Chạy Expo development server
npm start
# hoặc
npx expo start

# Scan QR code với Expo Go app trên điện thoại
# hoặc chạy trên simulator/emulator
npm run android  # Android
npm run ios      # iOS
```

### 4. Cài đặt Admin Frontend

```bash
cd admin-fe
npm install

# Tạo file .env.local với API URL

# Chạy development server
npm run dev
```

Admin dashboard sẽ chạy tại `http://localhost:3001`

## 🔐 Biến môi trường

### Backend (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/travelbuddy
# hoặc MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/travelbuddy

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=your_session_secret

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OAuth - Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth - Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# AI Services
GOOGLE_AI_API_KEY=your_google_ai_api_key
OPENAI_API_KEY=your_openai_api_key

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# CORS
CORS_ORIGIN=http://localhost:8081,http://localhost:3001
```

### Frontend (.env hoặc constants/api.js)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_google_android_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
```

### Admin Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 📚 API Documentation

API documentation được cung cấp qua Swagger UI khi backend server đang chạy:

```
http://localhost:3000/api-docs
```

### Các API endpoints chính:

- **Authentication**: `/api/auth/*`
  - POST `/api/auth/register` - Đăng ký
  - POST `/api/auth/login` - Đăng nhập
  - POST `/api/auth/google` - Đăng nhập với Google
  - POST `/api/auth/facebook` - Đăng nhập với Facebook

- **Posts**: `/api/posts/*`
  - GET `/api/posts` - Lấy tất cả bài viết
  - POST `/api/posts` - Tạo bài viết mới
  - GET `/api/posts/:id` - Lấy chi tiết bài viết
  - PUT `/api/posts/:id` - Cập nhật bài viết
  - DELETE `/api/posts/:id` - Xóa bài viết
  - POST `/api/posts/:id/like` - Like/Unlike bài viết
  - POST `/api/posts/:id/comments` - Thêm comment

- **Trip Schedule**: `/api/tripSchedule/*`
  - GET `/api/tripSchedule` - Lấy lịch trình
  - POST `/api/tripSchedule` - Tạo lịch trình mới
  - GET `/api/tripSchedule/:id` - Lấy chi tiết lịch trình

- **Places**: `/api/places/*`
  - GET `/api/places/search` - Tìm kiếm địa điểm
  - GET `/api/places/nearby` - Địa điểm xung quanh

- **AI**: `/api/AI/*`
  - POST `/api/AI/suggest` - Gợi ý lịch trình AI
  - POST `/api/AI/chat` - Chat với AI

- **Conversation**: `/api/conversation/*`
  - GET `/api/conversation` - Lấy danh sách cuộc trò chuyện
  - POST `/api/conversation` - Tạo cuộc trò chuyện mới
  - GET `/api/conversation/:id/messages` - Lấy tin nhắn

- **Admin**: `/api/admin/*`
  - GET `/api/admin/users` - Quản lý người dùng
  - GET `/api/admin/posts` - Quản lý bài viết
  - GET `/api/admin/reports` - Xem báo cáo

## 🎯 Hướng dẫn sử dụng

### Cho người dùng mobile:

1. **Đăng ký/Đăng nhập**: Tạo tài khoản hoặc đăng nhập bằng Google/Facebook
2. **Lập kế hoạch du lịch**:
   - Chọn điểm đến và số ngày
   - Nhập ngân sách
   - Nhận gợi ý AI hoặc tạo thủ công
   - Lưu và chia sẻ lịch trình
3. **Khám phá**: Xem feed bài viết, lưu bài viết yêu thích, follow người dùng
4. **Đặt vé**: Đặt vé máy bay, khách sạn, xe khách trực tiếp trong app

### Cho admin:

1. Truy cập admin dashboard
2. Đăng nhập với quyền admin
3. Quản lý người dùng, bài viết, và xử lý báo cáo
4. Xem thống kê và phân tích

## 🧪 Testing

```bash
# Backend
cd Backend
npm test

# Frontend
cd Frontend
npm test
```

## 📦 Build cho production

### Backend

```bash
cd Backend
npm install --production
NODE_ENV=production npm start
```

### Frontend Mobile

```bash
cd Frontend
# Build APK (Android)
eas build --platform android

# Build IPA (iOS)
eas build --platform ios
```

### Admin Frontend

```bash
cd admin-fe
npm run build
npm start
```

## 🤝 Đóng góp

Contributions are welcome! Vui lòng:

1. Fork the repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- TravelBuddy Team

## 📞 Liên hệ

Nếu có thắc mắc hoặc cần hỗ trợ, vui lòng tạo issue trên GitHub repository.

---

**Lưu ý**: Đảm bảo bạn đã cấu hình đầy đủ các biến môi trường trước khi chạy ứng dụng. Một số tính năng yêu cầu API keys từ các dịch vụ bên thứ ba (Cloudinary, Google AI, OpenAI, etc.).

