# Authentication System Design

## 1. Mục tiêu
Tài liệu này mô tả thiết kế hệ thống đầy đủ cho module `Authentication`, bao gồm:
- backend architecture
- API contract
- token và session strategy
- frontend UI/UX pattern
- security rule
- test strategy

Phạm vi gồm:
- đăng nhập
- đăng xuất
- làm mới access token
- xác thực request bằng access token
- lấy thông tin user hiện tại
- xử lý phiên hết hạn và tài khoản không hoạt động

Tài liệu này bám theo [authentication-requirement.md](/D:/study/uth/Cnpm/Project_CNPM/docs/requirements/authentication-requirement.md).

## 2. Bối cảnh hiện tại
Repo hiện có `User` model tại [backend/src/models/UserModel.js](/D:/study/uth/Cnpm/Project_CNPM/backend/src/models/UserModel.js) với các trường:
- `email`
- `password`
- `role`
- `status`

Hiện chưa có module auth độc lập. Một số flow trong repo vẫn đang dựa vào request giả lập hoặc kiểm tra rời rạc theo module. Vì vậy cần tách một lớp auth chuẩn dùng chung cho toàn backend.

## 3. Mục tiêu thiết kế
- Có một module auth duy nhất cho toàn hệ thống.
- Tách rõ xác thực khỏi phân quyền.
- Không tin dữ liệu user đến từ frontend ngoài token hợp lệ.
- Hỗ trợ frontend duy trì phiên ổn định với refresh flow.
- Dễ tích hợp cho các module `series`, `chapter`, `page`, `publish`, `task8`.

## 4. Kiến trúc tổng thể
### 4.1 Backend module structure
Đề xuất cấu trúc:
- `backend/src/modules/auth/controllers`
- `backend/src/modules/auth/services`
- `backend/src/modules/auth/repositories`
- `backend/src/modules/auth/routes`
- `backend/src/modules/auth/middlewares`
- `backend/src/modules/auth/validators`
- `backend/src/modules/auth/utils`
- `backend/src/modules/auth/constants`

### 4.2 Thành phần chính
- `AuthController`: nhận request và trả response.
- `AuthService`: xử lý login, logout, refresh, verify, me.
- `TokenService`: tạo và xác minh JWT.
- `PasswordService`: hash và compare password.
- `SessionRepository`: lưu và revoke refresh token/session.
- `AuthMiddleware`: xác thực access token, gắn `req.user`.

### 4.3 Phụ thuộc
- `jsonwebtoken`
- `bcryptjs`
- `mongoose`
- `dotenv`

## 5. Data design
### 5.1 User model
Tái sử dụng model hiện có:
- `id`
- `name`
- `email`
- `password`
- `role`
- `avatar`
- `status`
- `createdAt`
- `updatedAt`

### 5.2 Session hoặc RefreshToken model
Đề xuất thêm collection mới:
- `user_id`
- `token_hash`
- `expires_at`
- `revoked_at`
- `device_info`
- `ip_address`
- `created_at`
- `updated_at`

Lý do:
- hỗ trợ logout đúng nghĩa
- hỗ trợ revoke token
- hỗ trợ rotation refresh token
- hỗ trợ audit mức cơ bản

## 6. Token strategy
### 6.1 Access token
- Dùng JWT.
- Sống ngắn hạn, ví dụ 15-30 phút.
- Chứa:
  - `sub` là user id
  - `role`
  - `status` nếu cần
  - `iat`
  - `exp`

### 6.2 Refresh token
- Sống dài hơn access token, ví dụ 7-30 ngày.
- Không nên tin refresh token chỉ bằng chuỗi raw lưu client; nên hash trước khi lưu DB.
- Mỗi refresh token map tới một session record.

### 6.3 Rotation
Khuyến nghị bật refresh token rotation:
1. client gửi refresh token
2. backend xác minh
3. backend revoke token cũ
4. backend cấp access token mới và refresh token mới

## 7. API design
### 7.1 `POST /api/auth/login`
Request body:
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Success response:
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "Mangaka",
    "avatar": "",
    "status": "Active"
  }
}
```

Failure:
- `400` malformed input
- `401` invalid credentials
- `403` inactive or suspended account nếu muốn tách riêng

### 7.2 `POST /api/auth/logout`
Request:
- access token ở header
- refresh token ở body hoặc cookie tùy chiến lược

Response:
```json
{
  "message": "Logged out successfully"
}
```

### 7.3 `POST /api/auth/refresh`
Request body:
```json
{
  "refreshToken": "refresh-token"
}
```

Success response:
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

### 7.4 `GET /api/auth/me`
Response:
```json
{
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "Mangaka",
    "avatar": "",
    "status": "Active"
  }
}
```

## 8. Middleware chain
### 8.1 `requireAuth`
Luồng xử lý:
1. lấy header `Authorization`
2. xác minh format `Bearer`
3. verify JWT
4. lấy user từ DB nếu cần
5. kiểm tra user còn tồn tại và `status === Active`
6. gắn `req.user`
7. gọi `next()`

### 8.2 `attachCurrentUser`
Nếu cần tối ưu, có thể tách:
- verify token trước
- attach full user sau ở middleware khác cho route cần nhiều dữ liệu

## 9. Sequence flow
### 9.1 Login
1. user nhập email/password
2. frontend gọi `POST /api/auth/login`
3. backend validate input
4. backend tìm user theo email
5. backend compare password
6. backend kiểm tra `status`
7. backend tạo access token và refresh token
8. backend lưu refresh session
9. frontend lưu state phiên

### 9.2 Refresh token
1. access token hết hạn
2. frontend gọi `POST /api/auth/refresh`
3. backend verify refresh token
4. backend kiểm tra session chưa revoke
5. backend cấp token mới
6. frontend cập nhật token mới

### 9.3 Logout
1. user bấm đăng xuất
2. frontend gọi `POST /api/auth/logout`
3. backend revoke refresh session
4. frontend xóa local auth state

## 10. Error contract
### 10.1 Response shape khuyến nghị
```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Email hoặc mật khẩu không đúng."
  }
}
```

### 10.2 Error codes khuyến nghị
- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_MISSING`
- `AUTH_TOKEN_INVALID`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_REFRESH_INVALID`
- `AUTH_ACCOUNT_INACTIVE`
- `AUTH_ACCOUNT_SUSPENDED`

## 11. Security design
- Password phải hash bằng bcrypt.
- Không trả password trong bất kỳ response nào.
- JWT secret lưu ở env.
- Refresh token nên được hash khi lưu DB.
- Không cho phép client truyền `user_id` thay cho token.
- Không dùng header giả lập user trong production.
- Rate limit login nên được bổ sung ở gateway hoặc auth route về sau.

## 12. Frontend design
### 12.1 UI principles
- Ít ma sát
- Không reset form khi login lỗi
- Không rò rỉ thông tin đăng nhập
- Hiển thị state phiên rõ ràng

### 12.2 Component inventory
- `AuthShell`
- `LoginForm`
- `PasswordField`
- `InlineError`
- `AuthStatusBanner`
- `SessionExpiredModal`
- `CurrentUserChip`
- `LogoutButton`

### 12.3 Login page
- Một cột chính, tập trung vào form
- Mobile full width trừ margin ngoài
- Desktop panel 400-480px
- Field `email`, `password`
- Nút `Đăng nhập`
- Link `Quên mật khẩu` nếu có

### 12.4 Session expired UX
- frontend thử refresh ngầm trước
- nếu thất bại, hiển thị modal hoặc banner
- CTA chính `Đăng nhập lại`

### 12.5 User surface
- avatar
- name
- role text hoặc badge
- menu `Hồ sơ`, `Đăng xuất`

## 13. State management design
Store auth tối thiểu:
- `user`
- `accessToken`
- `isAuthenticated`
- `isRefreshing`
- `sessionStatus`

`sessionStatus` khuyến nghị:
- `unauthenticated`
- `authenticating`
- `authenticated`
- `refreshing`
- `expired`
- `logging_out`

## 14. Accessibility
- Form field có label rõ ràng
- Inline error gắn semantic với field
- Modal hết phiên focus vào CTA chính
- Không chỉ dùng màu để thể hiện lỗi

## 15. Logging và observability
Nên log:
- login success
- login failure
- refresh success/failure
- logout
- token verify failure bất thường

Không log:
- password
- raw refresh token
- full Authorization header

## 16. Test strategy
### 16.1 Unit test
- hash password
- compare password
- sign token
- verify token
- revoke session

### 16.2 Integration test
- login đúng
- login sai password
- login với tài khoản suspended
- gọi `me` với token hợp lệ
- gọi `me` với token hết hạn
- refresh thành công
- refresh bằng token revoked

### 16.3 Frontend test
- login form validation
- loading state khi submit
- session expired modal
- logout clears state

## 17. Migration plan cho repo hiện tại
1. Tạo module `auth` độc lập.
2. Thêm `Session` hoặc `RefreshToken` model.
3. Tạo routes `/api/auth/*`.
4. Gắn `requireAuth` vào các route nghiệp vụ.
5. Chuyển frontend sang login bằng token thật.
6. Loại bỏ mọi cơ chế giả lập user ở tầng request.

## 18. Acceptance criteria
- User đăng nhập được với account `Active`.
- Request không có token bị chặn `401`.
- Token sai hoặc hết hạn bị chặn `401`.
- Refresh flow hoạt động đúng.
- Logout revoke được session.
- Frontend xử lý được login, refresh và expired session theo một pattern thống nhất.

