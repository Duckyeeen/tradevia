# TRADEVIA

TRADEVIA là demo marketplace B2B giúp doanh nghiệp khám phá nhà cung cấp, mô tả nhu cầu và xem kết quả matching. Dự án phục vụ đồ án môn Kỹ thuật Thương mại Điện tử và chạy trên máy cá nhân.

## Trạng thái hiện tại

- Frontend: React + Vite, có các màn hình demo Account, Feed, Supplier Profile, Buyer Request, Matching và Connections.
- Backend: Node.js + Express, cung cấp 8 API cho health, suppliers, requests, matching và connections.
- Matching: thuật toán rule-based có giải thích điểm theo 6 tiêu chí; không dùng AI hoặc dịch vụ ngoài.
- Dữ liệu backend: lưu trong các file JSON tại `server/data/`.
- API adapter phía client hỗ trợ `auto`, `live` và `mock`. Mặc định `auto` sẽ chuyển sang dữ liệu mock khi backend không truy cập được. Dữ liệu mock chỉ nằm trong bộ nhớ trình duyệt và được tạo lại khi tải lại trang.

Đây là demo MVP. Mock login không xác thực người dùng thật; account và bài đăng chưa được lưu qua backend API.

## Yêu cầu

- Node.js bản LTS và npm. Cả nhóm nên dùng cùng major version Node.js.
- Git.
- Chrome hoặc Edge để kiểm tra giao diện.

Kiểm tra cài đặt:

```sh
git --version
node --version
npm --version
```

## Cài đặt và chạy

Mở hai terminal tại thư mục gốc của repo `tradevia/`.

Terminal 1 — chạy backend:

```sh
cd server
npm install
npm run dev
```

Backend mặc định chạy tại `http://localhost:3000`. Giữ terminal này mở.

Terminal 2 — chạy frontend:

```sh
cd client
npm install
npm run dev
```

Mở địa chỉ Vite in trong terminal, mặc định là `http://localhost:5173`. Vite chuyển tiếp đường dẫn `/api` đến backend tại `http://127.0.0.1:3000`.

Các lệnh `cd`, `npm install` và `npm run dev` dùng được trong macOS Terminal, Windows PowerShell và Command Prompt. Sau khi sửa `package.json` của một phần, chạy lại `npm install` trong đúng thư mục đó.

### Cấu hình tùy chọn

Mặc định không cần tạo file `.env`. Nếu muốn đổi cổng proxy hoặc chế độ dữ liệu, sao chép `client/.env.example` thành `client/.env`, rồi chỉnh các giá trị:

```dotenv
VITE_API_MODE=auto
VITE_API_PROXY_TARGET=http://127.0.0.1:3000
VITE_API_TIMEOUT_MS=8000
```

- `auto`: ưu tiên backend thật; tự chuyển sang mock khi backend không phản hồi.
- `live`: chỉ dùng backend thật; báo lỗi nếu backend không chạy.
- `mock`: luôn dùng dữ liệu mock.

Sau khi đổi `.env`, khởi động lại Vite. Không commit file `.env`.

## Kiểm tra

Chạy unit test matching và backend:

```sh
cd server
npm test
```

Chạy test API adapter frontend:

```sh
cd client
npm test
```

Build frontend:

```sh
cd client
npm run build
```

Kiểm tra nhanh backend bằng trình duyệt tại `http://localhost:3000/api/health`. Kết quả bình thường có dạng:

```json
{"status":"ok","service":"tradevia-api"}
```

## API hiện có

| Method | Endpoint | Mục đích |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra backend |
| `GET` | `/api/suppliers` | Danh sách supplier; hỗ trợ `?tag=electronics` |
| `GET` | `/api/suppliers/:id` | Chi tiết supplier |
| `GET` | `/api/requests` | Danh sách Buyer Request |
| `POST` | `/api/requests` | Tạo Buyer Request |
| `POST` | `/api/matching` | Matching theo `{ "requestId": "request-001" }` |
| `GET` | `/api/connections` | Danh sách connection; có thể lọc bằng `buyerId` hoặc `supplierId` |
| `POST` | `/api/connections` | Tạo connection theo `requestId`, `buyerId`, `supplierId` |

Các field và quy tắc matching chi tiết nằm trong [TRADEVIA_CODEX_STARTER.md](TRADEVIA_CODEX_STARTER.md).

## Cấu trúc thư mục

```text
client/
  src/modules/       Giao diện theo module của nhóm
  src/services/      API client, xử lý lỗi và mock adapter
  src/data/          Dữ liệu demo phía client
  tests/             Test API adapter
server/
  src/services/      Matching rules
  src/utils/         Chuẩn hóa dữ liệu và đọc/ghi JSON
  src/tests/         Unit test matching
  data/              suppliers.json, requests.json, connections.json
TRADEVIA_CODEX_STARTER.md
TRADEVIA_REMAINING_WORK.md
```

## Quy tắc làm việc nhóm

- Làm trên branch được phân công; giữ `main` ổn định.
- Trước khi commit, kiểm tra `git status` và `git diff`.
- Không commit `node_modules/`, `client/.env`, thông tin đăng nhập hoặc file build `client/dist/`.
- Thành viên chỉ sửa module mình sở hữu. Trao đổi với Lead Developer trước khi đổi API contract, cấu hình package hoặc file dùng chung.
- Dùng camelCase nhất quán và cập nhật API contract khi team đồng ý thay đổi schema.

Phân công, data contract và checklist nghiệm thu nằm trong [TRADEVIA_REMAINING_WORK.md](TRADEVIA_REMAINING_WORK.md).
