# Module: Matching UI
- **Người phụ trách**: Thành viên 5
- **Nhánh Git**: `feature/matching-connection`
- **Thư mục làm việc**: `client/src/modules/matching/`

## Nhiệm vụ
1. Giao diện chạy và hiển thị kết quả Matching.
2. Hiển thị tổng điểm Score và biểu đồ chi tiết Breakdown 6 tiêu chí.
3. Cảnh báo các trường thiếu `missingData`.
4. Nút bấm gửi yêu cầu kết nối nhanh.

## Sử dụng API:
```javascript
import { runMatching } from '../../services/api.js';
// runMatching('request-001')
```

