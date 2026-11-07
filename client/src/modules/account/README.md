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
| 🟡 Một phần | Áp dụng tag rule đã thống nhất | UI hiện cho cả Business và Personal chọn nhiều tags; rule Business chưa được team ghi nhận là quyết định chính thức. | Để hoàn thiện nhanh, ghi nhận quy tắc “Business được chọn nhiều industry tags; Personal được chọn nhiều interest tags”, rồi giữ nguyên UI và thêm acceptance vào quyết định UI/UX chung. |
| 🟡 Một phần | Cho Feed và Buyer Request đọc account/tags đang chọn | `accountStore.js` cung cấp `useCurrentAccount()`, `getCurrentAccount()`, subscription và hàm cập nhật; hiện Feed/Request chưa import hoặc tiêu thụ store. | Feed owner đọc `industryTags` qua hook để khởi tạo/lọc feed; Request owner dùng `id` làm `buyerId` và `industryTags` để điền payload. Nếu cần state React tập trung, Lead có thể nối hook tại `App.jsx`; nhánh Account hiện không sửa file chung theo quy trình. |
| ✅ Hoàn tất | Refresh có hành vi rõ ràng; không thêm xác thực thật | README/UI ghi account chỉ lưu trong bộ nhớ phiên; refresh khôi phục Business `buyer-001`. | Nếu demo cần giữ lựa chọn sau refresh, bổ sung localStorage sau khi xác nhận yêu cầu; hiện không cần cho luồng cơ bản. |
| 🟡 Một phần | Bàn giao object shape và tag list cho Danh/Ân | Shape, IDs, tag list và hook đã ghi trong README; chưa có xác nhận Danh/Ân đã nhận handoff. | Dùng nội dung README trong PR/trao đổi nhóm; khi tích hợp, kiểm tra Feed và Request dùng đúng tags/ID nêu trên. |
| ✅ Hoàn tất | Kiểm thử module và build frontend | Account tests 4/4, client tests 13/13, Vite build thành công. `git diff --check` cũng đạt trước commit code. | Chạy lại ba lệnh trong mục Kiểm tra sau khi Feed/Request tích hợp. |
| ✅ Hoàn tất | Làm việc trên nhánh riêng và bàn giao code | `feature/account` được tạo từ `main` đã cập nhật; code Account đã commit và push. | PR/review vẫn cần được Kiên thực hiện theo quy trình nhóm. |

### Còn thiếu để đạt completion criteria của Member 2

- [ ] Feed dùng tags của account hiện tại thay cho lựa chọn rời rạc.
- [ ] Buyer Request nhận đúng `buyerId` và tags từ account hiện tại.
- [ ] Nhóm ghi nhận quy tắc nhiều tags cho Business, hoặc cập nhật UI/store nếu chọn rule khác.
- [ ] Danh và Ân xác nhận đã nhận shape/tag list trong README.
- [ ] Chạy lại Account tests, client tests, build và smoke test đổi account → Feed → Buyer Request sau integration.

### Checklist smoke test sau integration

1. Mở Account, chọn Business; kiểm tra `buyer-001`, tên công ty và tags mặc định.
2. Thay đổi tags, mở Feed; xác nhận tags của account xuất hiện và ảnh hưởng filter/gợi ý.
3. Mở Buyer Request; xác nhận payload dùng `buyerId: buyer-001` và tags vừa chọn.
4. Chọn Personal; xác nhận account là `buyer-002`, tags Personal được giữ riêng, Request đổi sang buyer tương ứng.
5. Refresh; xác nhận trở về Business mặc định theo hành vi hiện tại.
6. Chạy test Account, client tests và frontend build bằng các lệnh ở mục Kiểm tra.

