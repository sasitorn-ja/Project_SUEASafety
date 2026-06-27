# SUEA Safety (Project_SUEASafety)

โปรเจครวมของแอป **SUEA Safety** ที่นำสองโปรเจคที่ทีมแยกกันทำมารวมเป็นโค้ดเบสเดียว:

- **Safety Effort** — จากโปรเจค `SueaSafety-main` (ฐาน)
- **Safety Culture** — จากโปรเจค `Safety Hub`

## Stack

- Next.js 15 (App Router) · React 18 · TypeScript
- Tailwind CSS v4 (`@tailwindcss/postcss`, design tokens แบบ `@theme` ใน `frontend/src/app/globals.css`)
- shadcn (base-nova) + `@base-ui/react` + `sonner` + `cmdk` + `next-themes`
- Leaflet (หน้า Check-in ของ Safety Effort)

## Repo Layout

```text
Project_SUEASafety/
├── backend/                  # backend/domain code และ repository layer
├── frontend/                 # Next.js frontend app แบบ standalone
│   ├── package.json
│   ├── public/
│   ├── src/
│   └── tests/
├── scripts/                  # cross-repo / deployment / database scripts
├── outputs/                  # reports และ generated artifacts
└── package.json              # root orchestration scripts
```

## Scripts

ที่ root:

```bash
npm run dev:frontend
npm run build:frontend
npm run start:frontend
npm run test:e2e
```

รันตรงจาก frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
```

## Environment Files

- `frontend/.env.local` ใช้สำหรับ local frontend development และ Next API routes ตอนพัฒนา
- `.env.production` ใช้สำหรับ Docker, PM2, deploy, และ production/backend runtime
- `.env.example` คือ template กลางสำหรับ onboarding

ตัวอย่าง flow:

```bash
cp .env.example frontend/.env.local
# แล้วกรอกค่าที่จำเป็นสำหรับ local dev
```

## โครงสร้าง routing (สถาปัตยกรรมแบบผสม)

โปรเจคนี้รวมสองรูปแบบ routing ไว้ในแอปเดียวอย่างตั้งใจ:

- **Safety Effort** วิ่งผ่าน *client bridge* เดิม: `[[...slug]]` (optional catch-all) → `LegacyShell` → `NextAppClient` → `App.tsx` → `router-compat`
- **Safety Culture** เป็น *App Router page* จริง: `frontend/src/app/safety-culture/**`

route ที่เจาะจง (`/safety-culture`) จะถูกจับโดยเพจจริงก่อน catch-all เสมอ ส่วน `/` และ route ของ Safety Effort ตกไปที่ bridge

เมนูของ Safety Effort (`App.tsx`) จะนำทางไปโมดูล Hub ด้วย full-page navigation (`window.location.assign`) ส่วนหน้า Hub ใช้ `AppShell` (topbar/bottom-nav) ของตัวเอง

## Source layout

```text
frontend/src/
  app/
    layout.tsx              # layout รวม: fonts (Noto Sans Thai, Sarabun) + AppProviders + Tooltip + Toaster
    globals.css             # Tailwind v4 + design tokens + custom classes (รวมจากสองฝั่ง)
    [[...slug]]/            # bridge → Safety Effort
    safety-culture/         # โมดูล Safety Culture (จาก Hub)
  features/safety-effort/   # หน้าจอ Safety Effort (จากฐาน)
  components/
    ui/                     # shadcn primitives (Hub)
    layout/                 # app-shell, topbars, bottom-nav (Hub)
    safety-culture/         # คอมโพเนนต์เฉพาะโมดูล (Hub)
    TigerMascot, RestrictedDatePicker   # จากฐาน
  providers/app-providers.tsx  # state ส่วนกลาง + localStorage (Hub)
  lib/
    router-compat.tsx       # bridge router (ฐาน)
    safety-culture.ts       # ข้อมูล/helper (Hub)
    utils.ts                # cn() (รวม)
  assets/images/            # รูป import ผ่าน webpack (ฐาน/มาสคอต Leaflet)
frontend/public/images/     # asset ของ Hub (มาสคอต, gallery)
```

## หมายเหตุการรัน (สำคัญ)

- ถ้าจะรัน frontend ตรง ให้ทำใน `frontend/`
- โฟลเดอร์ `node_modules/` ที่ติดมาถูกติดตั้งบน Linux — **ก่อนรันบนเครื่องคุณให้ลบแล้วติดตั้งใหม่**:
  ```bash
  cd frontend
  rm -rf node_modules .next
  npm install
  npm run dev
  ```
- local env ของ frontend อยู่ที่ `frontend/.env.local`
- production env ของ deploy/runtime อยู่ที่ `.env.production`
- alias มาตรฐานของ frontend คือ `@/*` → `./src/*`
- backend alias ใน frontend คือ `@backend/*` → `../backend/*`
- หลังแยก repo structure แล้ว ควรรัน `npm run build:frontend` หรือ `cd frontend && npm run build` เพื่อยืนยัน runtime

ดูรายละเอียดสิ่งที่เปลี่ยน/ตัดสินใจได้ที่ `MERGE_NOTES.md`
