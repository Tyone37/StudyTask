# Student Task Manager

Ứng dụng Angular + Express + MySQL để sinh viên quản lý todo, ghi chú và
deadline học tập.

## Chạy lần đầu

```powershell
cd "D:\Angular Project\To Do\Dự án"
npm install
Copy-Item .env.example .env
npm run setup:db
npm run dev
```

Sau khi chạy:

- Angular: http://localhost:4200
- Backend API: http://localhost:3000/api/health

## Lệnh thường dùng

```powershell
npm run setup:db   # tạo database, bảng MySQL và migration cột Google Login
npm run check:db   # kiểm tra kết nối MySQL
npm run dev        # chạy backend và Angular cùng lúc
npm run build      # build Angular
```

`setup:db` chỉ chạy `CREATE DATABASE IF NOT EXISTS`, `CREATE TABLE IF NOT
EXISTS` và các migration an toàn. Script có guard từ chối chạy nếu schema chứa
`DROP`, `TRUNCATE` hoặc `DELETE FROM`, để tránh xóa nhầm dữ liệu dự án khác.

## API chính

- `GET /api/config`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/me`
- `GET /api/dashboard`
- `GET /api/todos`
- `POST /api/todos`
- `PATCH /api/todos/:id`
- `DELETE /api/todos/:id`
- `GET /api/notes`
- `POST /api/notes`
- `DELETE /api/notes/:id`
- `GET /api/deadlines`
- `POST /api/deadlines`
- `PATCH /api/deadlines/:id`
