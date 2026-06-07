# Authentication Module Requirement

## 1. Mục đích
Module `Authentication` chịu trách nhiệm xác minh danh tính người dùng và quản lý phiên đăng nhập cho toàn hệ thống Manga Editorial & Production Management System.

Mục tiêu là tách riêng phần đăng nhập, đăng xuất, quản lý token, xác thực request và cung cấp thông tin người dùng hiện tại thành một module độc lập để mọi module nghiệp vụ khác có thể dùng chung.

## 2. Phạm vi
### 2.1 In scope
- Đăng nhập bằng `email` và `password`.
- Đăng xuất.
- Làm mới access token bằng refresh token.
- Xác thực request bằng access token.
- Cung cấp endpoint lấy thông tin user hiện tại.
- Chặn truy cập nếu tài khoản không hợp lệ hoặc không hoạt động.

### 2.2 Out of scope
- Phân quyền theo role hoặc permission.
- Social login.
- MFA/2FA.
- Passwordless login.
- SSO enterprise.

## 3. Actors
- Người dùng hệ thống: `Mangaka`, `Assistant`, `Tantou Editor`, `Editorial Board`, `Admin`.
- Frontend web app.
- Backend modules cần xác thực request.

## 4. Use cases chính
### UC-01: Đăng nhập
User nhập `email` và `password`.
Hệ thống xác minh tài khoản và trả về token cùng profile cơ bản.

### UC-02: Đăng xuất
User kết thúc phiên hiện tại.
Hệ thống vô hiệu hóa refresh token hoặc session tương ứng.

### UC-03: Làm mới token
Client gửi refresh token hợp lệ để lấy access token mới.

### UC-04: Xác thực request
Client gửi access token trong header `Authorization: Bearer <token>`.
Middleware xác minh token trước khi cho qua các API bảo vệ.

### UC-05: Lấy thông tin user hiện tại
Frontend gọi endpoint `me` để lấy profile cơ bản sau khi đã đăng nhập.

## 5. Yêu cầu chức năng
### 5.1 Đăng nhập
- Nhận `email` và `password`.
- Kiểm tra email tồn tại.
- So sánh mật khẩu bằng hashing an toàn.
- Từ chối tài khoản có `status` khác `Active`.
- Trả về:
  - `accessToken`
  - `refreshToken` nếu dùng refresh flow
  - `user`: `id`, `name`, `email`, `role`, `avatar`, `status`

### 5.2 Đăng xuất
- Cho phép đăng xuất phiên hiện tại.
- Refresh token của phiên đó phải bị vô hiệu hóa hoặc đánh dấu thu hồi.

### 5.3 Làm mới token
- Chỉ chấp nhận refresh token hợp lệ, chưa hết hạn, chưa bị thu hồi.
- Trả access token mới.
- Có thể xoay refresh token nếu hệ thống áp dụng refresh token rotation.

### 5.4 Xác thực request
- Kiểm tra access token ở mọi API yêu cầu xác thực.
- Nếu thiếu token, trả `401 Unauthorized`.
- Nếu token sai, hết hạn hoặc không hợp lệ, trả `401 Unauthorized`.
- Nếu user không còn tồn tại hoặc bị khóa sau khi token được cấp, request phải bị từ chối.

### 5.5 Endpoint `me`
- Trả về profile hiện tại của user đã xác thực.
- Không trả `password` hoặc dữ liệu nhạy cảm.

## 6. Yêu cầu phi chức năng
- Password phải được hash trước khi lưu.
- Không lưu password dạng plain text.
- Token phải có thời hạn rõ ràng.
- Access token nên ngắn hạn.
- Refresh token nên dài hạn hơn access token.
- Module phải dùng lại được cho toàn bộ backend.
- Cần có test cho login, logout, refresh, verify token và trạng thái tài khoản.

## 7. API đề xuất
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

Nếu dự án muốn cho phép tự tạo tài khoản:
- `POST /api/auth/register`

## 8. Data model tối thiểu
### User
- `id`
- `name`
- `email`
- `password`
- `role`
- `avatar`
- `status`
- `createdAt`
- `updatedAt`

### Session hoặc RefreshToken
- `id`
- `userId`
- `token`
- `expiresAt`
- `revokedAt`
- `createdAt`

## 9. Rule hệ thống
- Không cho tài khoản `Inactive` hoặc `Suspended` đăng nhập.
- Không cho client tự khai báo danh tính user trong request body để thay cho token.
- Không dùng header giả lập user cho môi trường production.
- Nếu token hết hạn, client phải refresh hoặc đăng nhập lại.

## 10. Tích hợp với module khác
Module `Authentication` là nền tảng cho:
- `series`
- `chapter`
- `page`
- `publish`
- `task8`
- các dashboard theo role

Mọi module trên phải lấy user hiện tại từ auth context của backend thay vì nhận `user_id` từ frontend như một nguồn tin cậy.

## 11. Acceptance criteria
- User đăng nhập thành công khi nhập đúng thông tin và account đang `Active`.
- User không đăng nhập được khi sai mật khẩu hoặc tài khoản bị khóa.
- Request không có token bị chặn với `401`.
- Request có token sai hoặc hết hạn bị chặn với `401`.
- Frontend gọi được `GET /api/auth/me` để lấy profile hiện tại.
- Các API nghiệp vụ dùng chung middleware xác thực thay vì tự cài riêng.

## 12. MVP priority
### P1
- Login
- Logout
- Verify token
- `me` endpoint

### P2
- Refresh token
- Change password
- Session invalidation

### P3
- Register
- Password reset
- Session history

## 13. Ghi chú triển khai theo repo hiện tại
Repo hiện có `User` model ở [backend/src/models/UserModel.js](D:/study/uth/Cnpm/Project_CNPM/backend/src/models/UserModel.js), đã có các trường `email`, `password`, `role`, `status`.

Hiện chưa có module auth độc lập. Một số phần trong repo vẫn đang giả lập user hoặc role ở tầng request, nên cần thay bằng middleware xác thực chuẩn của module này.

