# แผนรื้อโครงสร้างใหม่ — SUEA Safety (ConhisSystem style + shadcn ทั้งระบบ)

เป้าหมาย: รื้อโปรเจคให้เป็นโครงเดียวที่สะอาด มืออาชีพ — **ทุกหน้าเป็น App Router route เดี่ยว ๆ**, **เลิก legacy bridge ทั้งหมด**, **ใช้ shadcn/ui ทั้งระบบ**, จัดโฟลเดอร์ตามแบบ `ConhisSystem_FrontEnd` เป๊ะ

---

## 1. หลักการ (Design principles)

1. **หนึ่งหน้า = หนึ่ง route = หนึ่งไฟล์ `page.tsx`** ไม่มี SPA ก้อนเดียวอีกต่อไป
2. **เลิก bridge ทั้งชุด** — ลบ `router-compat`, `LegacyShell`, `NextAppClient`, `[[...slug]]`, `App.tsx`, `pages/_document`, `pages/_error`
3. **ระบบนำทางชุดเดียว** — มี layout/nav เดียว (shadcn) ใช้ร่วมทุกหน้า ไม่มีเมนูสองชุด
4. **UI ทั้งระบบเป็น shadcn/ui** — ทุก primitive (ปุ่ม, การ์ด, อินพุต, ตาราง, dialog ฯลฯ) มาจาก `components/ui/`
5. **แยกชั้นชัดเจน** — `app/` = routing เท่านั้น, logic อยู่ใน `components/<feature>/`, `hook/`, `services/`, `types/`, `utils/`, `lib/`
6. **ไม่มีโค้ดซ้ำ** — ปุ่ม/การ์ด/เมนู/ฟอร์ม มีที่เดียว ใช้ซ้ำทั้งระบบ

---

## 2. โครงสร้างปลายทาง (ยึดตาม ConhisSystem_FrontEnd)

```text
Project_SUEASafety/
├─ .env                         # ค่าคอนฟิก (API base url ฯลฯ)
├─ components.json              # shadcn config
├─ next.config.js
├─ postcss.config.mjs
├─ tailwind.config.js
├─ tsconfig.json
├─ README.md
├─ public/
│  └─ images/ (branding, mascots, gallery)
└─ src/
   ├─ middleware.ts             # auth/redirect guard (โครงเปล่าไว้ก่อน)
   ├─ ProviderTheme.tsx         # รวม ThemeProvider + AppStateProvider ครอบทั้งแอป
   ├─ app/                      # ROUTING ชั้นเดียว — แต่ละโฟลเดอร์ = หนึ่งหน้า
   │  ├─ layout.tsx             # root layout → ProviderTheme + fonts + Toaster + AppShell
   │  ├─ globals.css
   │  ├─ page.tsx               # หน้าแรก → redirect ไป /safety-effort/category
   │  ├─ loading.tsx  error.tsx  not-found.tsx
   │  ├─ safety-effort/
   │  │  ├─ category/page.tsx
   │  │  ├─ checkin/page.tsx
   │  │  ├─ activity/page.tsx
   │  │  ├─ create-post/page.tsx
   │  │  ├─ linewalk/page.tsx
   │  │  ├─ safety-contact/page.tsx
   │  │  ├─ assessment-summary/page.tsx
   │  │  └─ admin/page.tsx
   │  ├─ were-ok/
   │  │  ├─ page.tsx  fit-to-drive/  kyt/  pre-trip/  route-briefing/
   │  ├─ safety-culture/
   │  │  ├─ page.tsx  leaderboard/  rewards/  post/
   │  │  ├─ admin-event/  admin-reward/  admin-leaderboard/
   │  ├─ work-permit/page.tsx
   │  └─ notifications/page.tsx
   ├─ components/
   │  ├─ ui/                    # shadcn primitives (ชุดเต็ม — §4)
   │  ├─ layout/                # AppShell, Topbar, Sidebar, BottomNav (นำทางชุดเดียว)
   │  ├─ safety-effort/         # คอมโพเนนต์เฉพาะโมดูล (แตกจาก screen เดิม)
   │  ├─ were-ok/
   │  ├─ safety-culture/
   │  ├─ work-permit/
   │  ├─ Loading.tsx            # shared (เหมือนตัวอย่าง)
   │  ├─ ModalLoading.tsx
   │  ├─ DynamicIcon.tsx        # เรนเดอร์ไอคอน lucide แบบ dynamic
   │  ├─ MenuHeaderDescription.tsx
   │  ├─ TigerMascot.tsx
   │  ├─ DataTable.tsx          # ตารางกลาง (บน shadcn table)
   │  ├─ Combobox.tsx
   │  ├─ InputSearch.tsx
   │  ├─ FormAction.tsx
   │  └─ theme-provider.tsx     # ครอบ next-themes
   ├─ hook/                     # (สะกดตามตัวอย่าง — เอกพจน์)
   │  ├─ use-app-state.ts
   │  ├─ use-app-actions.ts
   │  ├─ use-media-query.ts
   │  └─ use-scroll-hide.ts
   ├─ services/
   │  ├─ storage.service.ts     # อ่าน/เขียน localStorage (ย้ายจาก app-providers)
   │  └─ safety-culture.service.ts
   ├─ types/
   │  ├─ index.ts               # type รวม (ย้ายจาก app-providers)
   │  ├─ safety-culture.ts
   │  ├─ were-ok.ts
   │  └─ assets.d.ts
   ├─ utils/
   │  ├─ date.ts
   │  └─ format.ts
   └─ lib/
      └─ utils.ts               # cn()
```

> หมายเหตุ: สะกด `hook/` (เอกพจน์) ตามตัวอย่าง ConhisSystem เป๊ะ และคง `app/` ไว้เป็นชั้น routing ของ Next 15 (ตัวอย่างใช้ Next App Router เช่นกัน — มี middleware.ts, components.json, ProviderTheme.tsx)

---

## 3. การ map ทุกหน้า → route เดี่ยว (เลิก bridge)

| โมดูล | route เดิม (bridge) | route ใหม่ (App Router) | ไฟล์ logic ใหม่ |
|---|---|---|---|
| Safety Effort | `/category` | `/safety-effort/category` | `components/safety-effort/category/*` |
| Safety Effort | `/checkin` | `/safety-effort/checkin` | `components/safety-effort/checkin/*` (Leaflet) |
| Safety Effort | `/activity` | `/safety-effort/activity` | `components/safety-effort/activity/*` |
| Safety Effort | `/create-post` | `/safety-effort/create-post` | `components/safety-effort/create-post/*` |
| Safety Effort | `/linewalk` | `/safety-effort/linewalk` | `components/safety-effort/linewalk/*` |
| Safety Effort | `/safety-contact` | `/safety-effort/safety-contact` | `components/safety-effort/safety-contact/*` |
| Safety Effort | `/assessment-summary` | `/safety-effort/assessment-summary` | `components/safety-effort/assessment-summary/*` |
| Safety Effort | `/safety-admin` | `/safety-effort/admin` | `components/safety-effort/admin/*` |
| We're OK | (App Router อยู่แล้ว) | `/were-ok/**` | `components/were-ok/*` |
| Safety Culture | (App Router อยู่แล้ว) | `/safety-culture/**` | `components/safety-culture/*` |
| Work Permit | `/work-permit` | `/work-permit` (placeholder) | `components/work-permit/*` |
| Notifications | `/notifications` | `/notifications` (placeholder) | — |

**การแปลงเชิงเทคนิคในแต่ละ screen:**
- `useNavigate()` / `useLocation()` (router-compat) → `useRouter()` / `usePathname()` (`next/navigation`)
- `navigate("/checkin")` → `router.push("/safety-effort/checkin")`
- `location.state` (ใช้ส่ง state ข้ามหน้า เช่น linewalkStarted) → ย้ายไป global store (`hook/use-app-state`) หรือ query param
- แตก screen ก้อนใหญ่ (เช่น Checkin 1,811 บรรทัด) เป็น sub-component ย่อยใน `components/safety-effort/checkin/` + `page.tsx` บาง ๆ ที่แค่ประกอบร่าง

---

## 4. UI: shadcn/ui ทั้งระบบ

**primitive ที่มีแล้ว:** `button, card, dialog, input, label, sheet, sonner, textarea, tooltip, badge`

**ต้องเพิ่ม (ผ่าน shadcn):**
`dropdown-menu, select, tabs, table, calendar, popover, command, form, separator, avatar, scroll-area, skeleton, switch, checkbox, radio-group, accordion, alert-dialog`

**คอมโพเนนต์ประกอบที่สร้างบน primitive (วางที่ `components/` root แบบตัวอย่าง):**
- `DataTable` (บน `table` + sort/filter) — แทนตารางที่เขียนเองในหลายหน้า
- `Combobox` (บน `popover` + `command`)
- `InputSearch`, `FormAction`, `ModalLoading`, `Loading`, `DynamicIcon`, `MenuHeaderDescription`

**สิ่งที่ถูกแทน/ลบ:**
- inline style จำนวนมากในหน้า Safety Effort → แทนด้วย shadcn + Tailwind tokens
- `RestrictedDatePicker` เดิม → ทำใหม่บน shadcn `calendar` + `popover`
- ปุ่มเขียนเอง/SVG icon inline ใน `App.tsx` → ใช้ `button` + `lucide-react`

---

## 5. ระบบ navigation/layout ชุดเดียว

- รวมเมนูสองชุด (nav ใน `App.tsx` + `AppShell` ของ Hub) → เหลือชุดเดียวใน `components/layout/`
  - `AppShell.tsx` (กรอบหลัก), `Topbar.tsx`, `Sidebar.tsx`, `BottomNav.tsx`
- เมนูทั้งหมดมาจาก **config เดียว** เช่น `lib/nav-config.ts` (รายการ section + route + icon + flag เปิด/ปิด) ใช้ร่วมทั้ง desktop/mobile
- active state ใช้ `usePathname()` ที่เดียว — ไม่มีปัญหาสีค้างอีก
- ทุกหน้า render ภายใต้ `AppShell` จาก root layout → ไม่ต้องห่อ AppShell ในแต่ละ page เอง

---

## 6. State / services / types / hooks (แยกชั้น)

ตอนนี้ `providers/app-providers.tsx` ก้อนเดียว ~500 บรรทัด (types + state + localStorage + business logic ปนกัน) จะแยกเป็น:

- **`types/`** — ย้าย type ทั้งหมด (Post, LeaderboardTeam, SafetyCultureEventConfig, HealthData, KytData ฯลฯ)
- **`services/storage.service.ts`** — ฟังก์ชันอ่าน/เขียน localStorage + normalize (ดึงออกจาก provider)
- **`hook/use-app-state.ts`, `hook/use-app-actions.ts`** — context hooks (เดิมอยู่ใน provider)
- **`ProviderTheme.tsx`** — รวม `theme-provider` (next-themes) + `AppStateProvider` ครอบทั้งแอป
- **`utils/`** — `formatLocalDate`, `addDays`, ฟังก์ชันคำนวณคะแนน ฯลฯ

---

## 7. สิ่งที่จะถูกลบทิ้ง

`src/App.tsx` · `src/NextAppClient.tsx` · `src/app/LegacyShell.tsx` · `src/app/[[...slug]]/` · `src/lib/router-compat.tsx` · `src/pages/_document.tsx` · `src/pages/_error.tsx` · `src/features/` (ย้ายเนื้อหาไป `components/safety-effort/`) · `src/styles.css` (รวมคลาสที่ยังใช้เข้าหรือ globals)

---

## 8. ลำดับการ migrate (เป็นเฟส ลด risk)

- **เฟส A — วางโครงโฟลเดอร์เปล่า** ตาม §2 + ตั้ง shadcn (`components.json`, เพิ่ม primitive ครบ) + `ProviderTheme` + `lib/nav-config` + layout/AppShell ชุดเดียว
- **เฟส B — แยกชั้น state** ย้าย provider → `types/`+`services/`+`hook/`+`ProviderTheme` (ยังไม่แตะ UI หน้า)
- **เฟส C — ย้าย We're OK + Safety Culture** เข้าโครงใหม่ (ปรับ import path, ใช้ AppShell กลาง, เอา AppShell ในเพจออก)
- **เฟส D — ย้าย Safety Effort ออกจาก bridge** ทีละหน้า: สร้าง `app/safety-effort/<x>/page.tsx` + แตก screen เป็น component + เปลี่ยน router-compat → next/navigation. เรียงจากหน้าง่ายไปยาก: SafetyContact → CreatePost → AssessmentSummary → Category → SafetyAdmin → Activity → Linewalk → Checkin
- **เฟส E — แปลง UI เป็น shadcn** รีแฟกเตอร์ inline style → shadcn ทีละหน้า (ทำต่อจาก D ได้ หรือทยอยทำ)
- **เฟส F — ลบของเก่า** (App.tsx, bridge, pages/) แล้ว `tsc --noEmit` + `npm run build` + ไล่เทสต์ทุก route

> เฟส D–E คือส่วนที่หนักสุด (Safety Effort ~6,300 บรรทัด) แนะนำทำทีละหน้าและทดสอบทันที เพื่อไม่ให้แอปพังทั้งระบบ

---

## 9. ความเสี่ยง / จุดที่ต้องระวัง

- **หน้าหนัก (Checkin/Linewalk/Activity)** พึ่ง inline style + logic เยอะ การรีไรต์เป็น shadcn ต้องทำทีละหน้าและทดสอบ ไม่งั้นพังง่าย
- **state ข้ามหน้า** เดิมส่งผ่าน `location.state` (bridge) — ต้องย้ายไป global store/query param ก่อนลบ bridge
- **Leaflet (Checkin)** ต้อง `dynamic(..., { ssr:false })` ใน App Router
- **build ของ Tailwind v4** ทดสอบบนเครื่องคุณ (sandbox นี้ build ไม่จบ)

## 10. จุดที่ต้องเคาะก่อนผมลงมือ

1. **route prefix ของ Safety Effort:** ใช้ `/safety-effort/<x>` (เป็นระเบียบ, แนะนำ) หรือคง path สั้น `/<x>` เดิม (เช่น `/category`)?
2. **หน้าแรก (`/`):** redirect ไป `/safety-effort/category` หรือ `/were-ok`?
3. **ขอบเขตเฟสที่จะให้ทำในรอบนี้:** ทำถึงเฟส C (โครง+แยกชั้น+ย้าย Hub) ก่อน แล้วค่อยทยอย D–E (Safety Effort) หรือให้ลุยยาวทั้งหมดในรอบเดียว?

เคาะ 3 ข้อนี้แล้วผมเริ่มทำตามเฟส A→F ได้เลยครับ
