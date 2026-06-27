# SUEA Safety (Project_SUEASafety)

โปรเจครวมของแอป **SUEA Safety** ที่นำสองโปรเจคที่ทีมแยกกันทำมารวมเป็นโค้ดเบสเดียว:

- **Safety Effort** — จากโปรเจค `SueaSafety-main` (ฐาน)
- **Safety Culture** — จากโปรเจค `Safety Hub`

## Stack

- Next.js 15 (App Router) · React 18 · TypeScript
- Tailwind CSS v4 (`@tailwindcss/postcss`, design tokens แบบ `@theme` ใน `src/app/globals.css`)
- shadcn (base-nova) + `@base-ui/react` + `sonner` + `cmdk` + `next-themes`
- Leaflet (หน้า Check-in ของ Safety Effort)

## Scripts

```bash
npm install      # ติดตั้ง dependency (รันใหม่บนเครื่องคุณ ดู "หมายเหตุการรัน")
npm run dev      # dev server
npm run build    # production build
npm run start    # serve production build
```

## โครงสร้าง routing (สถาปัตยกรรมแบบผสม)

โปรเจคนี้รวมสองรูปแบบ routing ไว้ในแอปเดียวอย่างตั้งใจ:

- **Safety Effort** วิ่งผ่าน *client bridge* เดิม: `[[...slug]]` (optional catch-all) → `LegacyShell` → `NextAppClient` → `App.tsx` → `router-compat`
- **Safety Culture** เป็น *App Router page* จริง: `src/app/safety-culture/**`

route ที่เจาะจง (`/safety-culture`) จะถูกจับโดยเพจจริงก่อน catch-all เสมอ ส่วน `/` และ route ของ Safety Effort ตกไปที่ bridge

เมนูของ Safety Effort (`App.tsx`) จะนำทางไปโมดูล Hub ด้วย full-page navigation (`window.location.assign`) ส่วนหน้า Hub ใช้ `AppShell` (topbar/bottom-nav) ของตัวเอง

## Source layout

```text
src/
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
public/images/              # asset ของ Hub (มาสคอต, gallery)
```

## หมายเหตุการรัน (สำคัญ)

- โฟลเดอร์ `node_modules/` ที่ติดมาถูกติดตั้งบน Linux — **ก่อนรันบนเครื่องคุณให้ลบแล้วติดตั้งใหม่**:
  ```bash
  rm -rf node_modules package-lock.json .next
  npm install
  npm run dev
  ```
- alias มาตรฐานของโปรเจคนี้คือ `@/*` → `./src/*`
- การรวมผ่านการตรวจ `npx tsc --noEmit` แล้ว (ไม่มี type error) แต่ควรรัน `npm run build`/`npm run dev` บนเครื่องคุณเพื่อยืนยัน runtime อีกครั้ง

ดูรายละเอียดสิ่งที่เปลี่ยน/ตัดสินใจได้ที่ `MERGE_NOTES.md`
