# Module: Feed & Search
- **Người phụ trách**: Thành viên 3 (Danh)
- **Nhánh Git**: `feature/feed`
- **Thư mục làm việc**: `client/src/modules/feed/`

## Nhiệm vụ
1. Hiển thị bảng tin bài đăng (posts) ưu tiên theo industry tags của account.
2. Hiển thị danh sách nhà cung cấp gợi ý theo tags.
3. Tìm kiếm theo từ khóa (tên, nội dung, dịch vụ, địa điểm).
4. Bộ lọc theo Industry Tags (Gợi ý / Tất cả / tag cụ thể).
5. Xử lý trạng thái: loading, empty, error.
6. Mở chi tiết supplier qua callback `onSelectSupplier(id)`.

## Files
- `FeedView.jsx` — Component chính
- `postData.js` — Mock data bài đăng

## Sử dụng API:
```javascript
import { getSuppliers } from '../../services/api.js';
// Lấy danh sách: getSuppliers({ tag: 'electronics', search: 'PCB' })
```

## Props nhận từ App.jsx
- `onSelectSupplier(supplierId)` — callback mở supplier detail
- `industryTags` — mảng tags từ account đang chọn (do Thành viên 2 cung cấp)
