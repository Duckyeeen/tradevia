# Module: Feed & Search
- **Người phụ trách**: Thành viên 3
- **Nhánh Git**: `feature/feed`
- **Thư mục làm việc**: `client/src/modules/feed/`

## Nhiệm vụ
1. Hiển thị danh sách nhà cung cấp và yêu cầu trên bảng tin.
2. Tìm kiếm theo từ khóa.
3. Bộ lọc theo Industry Tags.

## Sử dụng API:
```javascript
import { getSuppliers } from '../../services/api.js';
// Lấy danh sách: getSuppliers({ tag: 'electronics', search: 'PCB' })
```

