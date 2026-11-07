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

