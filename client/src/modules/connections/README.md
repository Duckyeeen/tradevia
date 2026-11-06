# Module: Connections
- **Người phụ trách**: Thành viên 5
- **Nhánh Git**: `feature/matching-connection`
- **Thư mục làm việc**: `client/src/modules/connections/`

## Nhiệm vụ
1. Hiển thị danh sách kết nối đối tác và trạng thái (`pending`, `accepted`).
2. Tích hợp nút gửi kết nối từ kết quả matching hoặc trang chi tiết đối tác.

## Sử dụng API:
```javascript
import { getConnections, createConnection } from '../../services/api.js';
// getConnections()
// createConnection({ requestId, buyerId, supplierId })
```

