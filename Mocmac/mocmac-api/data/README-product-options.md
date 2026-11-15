# Ảnh và phiên bản sản phẩm

`product-options.json` là cấu hình cho 49 sản phẩm; 15 sản phẩm có 34 phiên bản mẫu phục vụ bài web. Giá gốc của mỗi sản phẩm được giữ nguyên ở phiên bản mặc định. Các lựa chọn mới là dữ liệu mẫu đã được người dùng chấp thuận, chưa phải dữ liệu tồn kho thực tế.

Ảnh bổ sung nằm trong `public/uploads/catalog-gallery` và `public/uploads/catalog-reference`. Nguồn từng ảnh được ghi trong `product-image-sources.json`. Ảnh tham khảo có nhãn riêng trên trang chi tiết. Hai chế độ cận cảnh hiển thị từ ảnh đầu tiên của phiên bản đang chọn, không phải ảnh chụp thêm góc mới.

Để kiểm tra cấu hình với MongoDB, chạy từ thư mục `mocmac-api`:

```powershell
node scripts/import-product-options.js
```

Để cập nhật sau khi sửa JSON, cung cấp một đường dẫn sao lưu mới:

```powershell
node scripts/import-product-options.js --apply --backup ./backups/product-options-before.json
```

Script chỉ cập nhật `images` và `variants`, kiểm tra tên/mã sản phẩm, giữ nguyên mô tả, giá gốc và đánh giá. File `my-app/public/data/product.json` đã được đồng bộ cùng dữ liệu để giữ các lựa chọn khi nạp danh mục lại.

Sau khi thay đổi mã backend, khởi động lại tiến trình API để nạp schema phiên bản sản phẩm và thông tin phiên bản trong đơn hàng. Giỏ hàng cũ vẫn dùng được; các dòng mới lưu mã phiên bản riêng. API xác định lại giá và nhãn phiên bản từ danh mục khi tạo đơn, thay vì tin giá do trình duyệt gửi lên.
