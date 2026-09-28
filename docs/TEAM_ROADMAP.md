# StudyHub — Team Roadmap

Mục tiêu của tài liệu này là để ba thành viên có thể phát triển song song mà hạn chế đụng file và merge conflict.

## Nguyên tắc chung

- Mỗi thành viên sở hữu module của mình từ route → controller → model → UI.
- Không đưa business logic mới trực tiếp vào `App.jsx`.
- API mới phải có validation đầu vào, status code hợp lý và message rõ ràng.
- Schema mới phải có index nếu có trường search/filter/unique thường xuyên.
- Không commit `.env`, token, secret hoặc credential.
- Mỗi chức năng phải có test checklist trong PR.

---

## Thành viên 1 — Auth & Admin

### Mức ưu tiên P0

#### 1. Refresh token / session lifecycle

Hiện access token có thời hạn nhưng chưa có refresh-token flow hoàn chỉnh.

Đề xuất API:

```text
POST /api/auth/refresh
POST /api/auth/logout
```

Acceptance criteria:

- access token ngắn hạn;
- refresh token có thời hạn dài hơn;
- refresh token có thể bị revoke khi logout;
- user bị block không thể refresh;
- refresh token không chứa password/secret;
- frontend tự refresh khi access token hết hạn.

### Mức ưu tiên P1

#### 2. Chuẩn hoá auth/admin error response

Format đề xuất:

```json
{
  "message": "Mô tả lỗi",
  "code": "AUTH_INVALID_TOKEN"
}
```

#### 3. Audit log quản trị

Theo dõi:

- ai duyệt / từ chối tài liệu;
- ai đổi role user;
- ai block / unblock user;
- ai xử lý report.

---

## Thành viên 2 — Documents & Subjects

### Mức ưu tiên P0

#### 1. Tạo Subject module thật

Hiện `Document.subjectId` đã tham chiếu model `Subject`, nhưng module Subject chưa hoàn chỉnh.

Cần có:

```text
backend/models/Subject.js
backend/controllers/subjectController.js
backend/routes/subjectRoutes.js
```

Schema gợi ý:

```text
code        String, unique
name        String
faculty     String
createdAt   Date
updatedAt   Date
```

API:

```text
GET    /api/subjects
GET    /api/subjects/:id
POST   /api/subjects
PUT    /api/subjects/:id
DELETE /api/subjects/:id
```

Quyền:

- GET: public
- create/update/delete: admin

Acceptance criteria:

- `code` unique;
- document mới dùng `subjectId` hợp lệ;
- frontend upload lấy danh sách subject từ API, không hard-code;
- filter trang Home lấy subject thật;
- xoá subject đang có document phải được chặn hoặc xử lý rõ.

### Mức ưu tiên P1

#### 2. Search/filter server-side

Hỗ trợ query:

```text
q
subject
fileType
sort
page
limit
```

Sort gợi ý:

- newest
- mostViewed
- mostDownloaded
- highestRated

#### 3. Kiểm soát counter

Không để view/download tăng vô hạn do refresh spam.

---

## Thành viên 3 — Reviews & Reports

### Mức ưu tiên P0

#### 1. Hoàn thiện review lifecycle

Hiện đã có create/list/delete.

Nên thêm:

```text
PUT /api/reviews/:id
```

Acceptance criteria:

- user chỉ sửa review của chính mình;
- rating phải 1–5;
- comment có giới hạn độ dài;
- cập nhật/xoá đều tính lại `avgRating`;
- admin có thể xoá review vi phạm.

#### 2. Chống duplicate report ở database

Ngoài check trong controller, thêm compound unique index:

```text
{ documentId: 1, reporterId: 1 }
```

Acceptance criteria:

- hai request đồng thời vẫn không tạo duplicate;
- xử lý lỗi duplicate thành HTTP 409;
- report status vẫn hỗ trợ pending / resolved / dismissed.

### Mức ưu tiên P1

#### 3. Report details

Tách:

```text
reasonType
details
```

Ví dụ:

- wrong_subject
- copyright
- spam
- malicious_file
- other

---

## Shared backlog — cả nhóm

### P0 — API client phía frontend

Hiện nhiều component tự ghép:

```js
import.meta.env.VITE_API_URL || "http://localhost:5000/api"
```

Nên gom thành:

```text
frontend/src/lib/api.js
```

Mục tiêu:

- base URL một chỗ;
- tự gắn Authorization;
- xử lý 401 thống nhất;
- hỗ trợ refresh token về sau.

### P0 — Validation

Tối thiểu cần validate:

- Mongo ObjectId
- email
- password
- pagination
- status enum
- rating
- file metadata

### P1 — Tests

Backend:

- auth
- permission
- document CRUD
- report duplicate
- review duplicate
- admin authorization

Frontend:

- ProtectedRoute
- login/register
- upload form
- search/filter

### P1 — CI

GitHub Actions:

```text
frontend: npm ci → npm run lint → npm run build
backend: npm ci → npm test
```

---

## Thứ tự triển khai khuyến nghị

### Sprint A

- TV1: refresh token
- TV2: Subject module
- TV3: update review + unique report index

Ba task này chủ yếu nằm ở ba vùng code khác nhau nên ít conflict.

### Sprint B

- TV1: audit log
- TV2: sort/search nâng cao
- TV3: report reason/details
- cả nhóm: API client chung

### Sprint C

- tests
- CI
- deploy
- regression test toàn hệ thống

## Definition of Done

Một task chỉ được xem là xong khi:

- API hoạt động với dữ liệu MongoDB thật;
- UI không còn mock cho chức năng đó;
- quyền truy cập đúng role;
- error state được xử lý;
- refresh trang không làm mất trạng thái quan trọng;
- không lộ secret;
- có checklist test trong PR;
- frontend build thành công.
