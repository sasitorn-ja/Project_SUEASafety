# Frontend App

Next.js frontend ของโปรเจค SUEA Safety อยู่ในโฟลเดอร์นี้

## Environment

- ใช้ `frontend/.env.local` เป็น source of truth สำหรับ local development
- คัดลอกค่าตั้งต้นจาก `../.env.example`
- production runtime ไม่ใช้ไฟล์ในโฟลเดอร์นี้เป็นหลัก แต่ใช้ `../.env.production`

## Commands

```bash
npm install
npm run dev
npm run build
npm run start
npm run qa:e2e
```

สำหรับ database migration แบบ local จาก root:

```bash
node --env-file=frontend/.env.local scripts/run-migration.mjs scripts/migrations/<file>.sql
```

## Structure

- `src/app/` routing ของ Next.js
- `src/components/` UI และ feature components
- `src/services/` service wrappers
- `src/types/` domain types
- `src/utils/` domain utilities
- `public/` static assets
- `tests/e2e/` Playwright tests
