# Mộc Mạc API
(nơi để làm việc và thao tác với cơ sở dữ liệu, và xử lý các tiến trình nghiệp vụ nhằm mục đích
gọi dữ liệu ở tầng cơ sở dữ liệu và trả ra dưới dạng json (database -> backend (nodejs) -> frontend (angular)))

## Đăng nhập Google bằng Firebase

1. Trong Firebase Console, bật **Authentication → Sign-in method → Google**.
2. Trong **Authentication → Settings → Authorized domains**, thêm domain chạy frontend (thêm `localhost` khi chạy local).
3. Ở Firebase **Project settings → General → Your apps → Web app**, chép `apiKey`, `authDomain`, `projectId` và `appId` vào `my-app/src/environments/firebase.config.ts`.
4. Đặt cùng `projectId` vào `FIREBASE_PROJECT_ID` trong file `mocmac-api/.env`.
5. Nếu Google OAuth consent screen đang ở chế độ Testing, thêm tài khoản Google dùng để đăng nhập vào danh sách test users.
6. Khởi động lại backend và frontend. Tài khoản Google mới được tạo ở vai trò `customer`; tài khoản có email trùng với user hiện có sẽ dùng vai trò hiện tại.

Backend xác minh Firebase ID token trước khi cấp JWT của ứng dụng. Luồng xác minh này chỉ cần Firebase project ID; không đặt service-account key hoặc OAuth client secret trong frontend hay repository.

## Địa chỉ nhận hàng và voucher khi thanh toán

Địa chỉ được lưu trong mảng `addresses` của tài khoản MongoDB đang đăng nhập và có thể chọn lại ở lần checkout tiếp theo. API sổ địa chỉ là `GET/PUT /api/users/me/addresses` (yêu cầu JWT). Danh sách voucher đang hoạt động được trả qua `GET /api/coupons/available?orderTotal=<subtotal>`; checkout xác thực lại voucher và tính mức giảm ở backend.

Trang thanh toán riêng ở `/thanh-toan` tính phí vận chuyển 30.000đ cho đơn dưới 500.000đ và miễn phí ship từ 500.000đ. Tạo/cập nhật voucher chào mừng `NEW20` (20% đơn đầu, một lần mỗi khách hàng) và `FREESHIP` (giảm tối đa 30.000đ phí ship, không áp dụng khi đơn đã miễn ship) bằng `npm run seed:checkout-vouchers`. Cả hai voucher có hạn một năm từ lần seed đầu tiên; chạy lại lệnh không gia hạn ngày hết hạn.
