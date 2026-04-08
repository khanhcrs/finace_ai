# FinanceAIApp - 📱 Ứng dụng Quản lý Tài chính (Mobile)

Đây là ứng dụng di động được xây dựng bằng **React Native (Expo)** và **TypeScript**.

## 🚀 Hướng dẫn cài đặt cho bạn bè khi Pull về

Để chạy được ứng dụng này, bạn cần thực hiện các bước sau:

### 1. Yêu cầu hệ thống
- Đã cài đặt [Node.js](https://nodejs.org/) (khuyên dùng bản LTS).
- Đã cài đặt ứng dụng **Expo Go** trên điện thoại (Android/iOS) để test.

### 2. Cài đặt thư viện
Sau khi pull code về, mở terminal tại thư mục `FinanceAIApp` và chạy lệnh:

```bash
npm install
```
Lệnh này sẽ tự động tải tất cả các thư viện cần thiết đã được định nghĩa trong `package.json` (như `lucide-react-native`, `expo-router`, `axios`, v.v.)

### 3. Cấu hình API (Lưu ý quan trọng)
Mở file `src/api/config.ts` và thay đổi `localhost` thành **Địa chỉ IP nội bộ** của máy tính bạn (ví dụ: `192.168.1.x`) để điện thoại có thể kết nối được với Backend Java đang chạy trên máy tính.

### 4. Chạy ứng dụng
Mở terminal và chạy:

```bash
npx expo start
```

- Quét mã QR bằng ứng dụng **Expo Go** trên Android.
- Quét mã QR bằng ứng dụng **Camera** trên iOS.

---
## 🛠 Các thư viện chính sử dụng
- `expo-router`: Điều hướng trang (File-based routing).
- `lucide-react-native`: Bộ icon hiện đại.
- `axios`: Gọi API từ Backend.
- `react-native-chart-kit`: Hiển thị biểu đồ thống kê.
- `AsyncStorage`: Lưu trữ thông tin đăng nhập và cài đặt cục bộ.
