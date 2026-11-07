# Module: Account & Industry Tags
- **Người phụ trách**: Thành viên 2
- **Nhánh Git**: `feature/account`
- **Thư mục làm việc**: `client/src/modules/account/`

## Nhiệm vụ
1. Mock login với 2 loại tài khoản: Personal và Business.
2. Quản lý Business profile cơ bản.
3. Cho phép chọn và lưu danh sách Industry tags của doanh nghiệp.

## Demo accounts và interface chia sẻ

Tài khoản được giữ trong bộ nhớ của phiên hiện tại; refresh trang sẽ khôi phục mặc định Business.

```js
{
  id: 'buyer-001',
  accountType: 'business', // 'business' | 'personal'
  displayName: 'Minh Nguyen',
  companyName: 'TRADEVIA Demo Buyer',
  industryTags: ['electronics', 'manufacturing'],
}
```

- Business demo: `buyer-001`, Minh Nguyen, TRADEVIA Demo Buyer.
- Personal demo: `buyer-002`, Linh Tran.
- Industry tags khả dụng: `electronics`, `manufacturing`, `logistics`, `textile`, `sustainability`, `automation`.
- Quy tắc tags đang áp dụng: Business chọn nhiều industry tags; Personal chọn nhiều interest tags. Cả hai dùng cùng vocabulary để Feed và Buyer Request không cần ánh xạ lại.
- Module React có thể đọc account bằng `useCurrentAccount()` từ `./accountStore.js` (đường dẫn tương đối từ thư mục Account). Code ngoài React có thể dùng `getCurrentAccount()` và đăng ký cập nhật với `subscribeCurrentAccount(listener)`.
- `selectDemoAccount(id)` và `updateCurrentAccount(updates)` cập nhật state và thông báo cho subscribers.

## Kiểm tra

```powershell
cd client
node --test src/modules/account/account.test.js
npm.cmd test
npm.cmd run build
```

## Checklist đối chiếu `work.md` — Member 2

| Trạng thái | Tiêu chí | Đối chiếu hiện tại | Nguyên nhân / cách hoàn thiện |
|---|---|---|---|
| ✅ Hoàn tất | Rà soát và hoàn thiện `AccountView` trong module được giao | Có chọn account, hiển thị profile, sửa tên công ty Business và chọn/bỏ chọn tags. | Không cần thêm việc trong phạm vi hiện tại. |
| ✅ Hoàn tất | Có một Business và một Personal demo với ID/field nhất quán | Business `buyer-001`, Personal `buyer-002`; cùng shape camelCase. Business ID khớp buyer của request seed. | Giữ IDs này làm dữ liệu demo ổn định. |
| ✅ Hoàn tất theo giả định đã ghi nhận | Áp dụng tag rule | Business và Personal đều chọn nhiều tags; vocabulary được dùng thống nhất. | Rule đang áp dụng được ghi ngay ở trên; nếu nhóm chọn rule Business khác, cập nhật selector và test cùng nhau. |
| ✅ Hoàn tất | Cho Feed và Buyer Request đọc account/tags đang chọn | Feed và Request dùng `useCurrentAccount()`; filter “Tags của tôi” khớp supplier với bất kỳ tag nào của account, Request gửi `buyerId` và tags hiện tại. App chuyển `buyerId` của response request sang Matching. Connections lọc theo buyer hiện tại. | Không cần provider hoặc thư viện state mới; các module đọc trực tiếp store đang có. |
| ✅ Hoàn tất | Refresh có hành vi rõ ràng; không thêm xác thực thật | README/UI ghi account chỉ lưu trong bộ nhớ phiên; refresh khôi phục Business `buyer-001`. | Nếu demo cần giữ lựa chọn sau refresh, bổ sung localStorage sau khi xác nhận yêu cầu; hiện không cần cho luồng cơ bản. |
| ✅ Hoàn tất về contract | Bàn giao object shape và tag list cho Danh/Ân | Shape, IDs, tag list và hook được ghi ở README; Feed và Request đã import hook và dùng đúng contract. | Handoff có trong code/docs. Nhóm có thể rà lại rule trong review nếu cần thay đổi. |
| ✅ Hoàn tất | Kiểm thử module và build frontend | Account tests, client/API tests, account-flow test và Vite build đều chạy đạt sau integration. | Dùng các lệnh ở mục Kiểm tra. |
| ✅ Hoàn tất | Làm việc trên nhánh riêng và bàn giao code | `feature/account` được tạo từ `main` đã cập nhật; code Account đã commit và push. | PR/review vẫn cần được Kiên thực hiện theo quy trình nhóm. |

### Còn thiếu để đạt completion criteria của Member 2

- [x] Feed dùng toàn bộ tags account làm filter mặc định (OR), có filter một tag, “Tất cả”, search, loading, lỗi và empty state.
- [x] Buyer Request nhận đúng `buyerId` và tags từ account hiện tại.
- [x] Rule dùng nhiều industry tags cho Business và nhiều interest tags cho Personal đã ghi nhận làm lựa chọn triển khai.
- [x] Account owner shape/tag list và import interface được ghi trong README và được các module tích hợp dùng.
- [x] Chạy Account tests, client tests, flow test, build và `git diff --check` sau integration.

### Checklist smoke test sau integration

1. Mở Account, chọn Business; kiểm tra `buyer-001`, tên công ty và tags mặc định.
2. Thay đổi tags, mở Feed; xác nhận tags của account xuất hiện và filter mặc định theo tag đầu tiên.
3. Mở Buyer Request; xác nhận payload dùng `buyerId: buyer-001` và tags vừa chọn.
4. Chọn Personal; xác nhận account là `buyer-002`, tags Personal được giữ riêng, Request đổi sang buyer tương ứng.
5. Submit request, chạy Matching, gửi connection; xác nhận connection có đúng buyer và xuất hiện trong Connections của account đó.
6. Refresh; xác nhận trở về Business mặc định theo hành vi hiện tại.
7. Chạy Account tests, client tests, account-flow test và frontend build bằng các lệnh ở mục Kiểm tra.

