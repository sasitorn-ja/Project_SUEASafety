# Domain + Layer Architecture

โครงสร้างเป้าหมายของโปรเจค:

```text
src/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   └── <domain>/
├── action/
├── services/
├── types/
├── utils/
│   ├── <domain>/
│   └── schema/
├── hook/
└── lib/
```

กติกาหลัก:
- `types/<domain>Type.ts` export ได้เฉพาะ `type` และ `interface`
- `services/<domain>Services.ts` รวมการเรียก API หรือ data access ของ domain
- `action/<domain>Actions.ts` ใช้กับ server action หรือ form bridge
- `utils/<domain>/` เก็บ constants, mappers, table config, validation ที่เฉพาะ domain
- `components/<domain>/` เก็บ feature UI และ view logic
- `app/**/page.tsx` ทำหน้าที่ compose เป็นหลัก ไม่ควรมี fetch หรือ helper ยาว
- `lib/` เก็บ shared cross-domain utilities เท่านั้น
- `components/ui/` ห้าม import feature/domain code ย้อนกลับ

template domain:

```text
src/
├── types/exampleType.ts
├── services/exampleServices.ts
├── action/exampleActions.ts
├── utils/example/
│   └── exampleConfig.ts
├── components/example/
│   └── ExampleManager.tsx
└── app/example/page.tsx
```

naming:
- ใช้ชื่อ domain ตาม business capability เช่น `pointRules`, `adminUsers`, `locationMaster`
- component หลักของ domain ใช้ชื่อ `...Manager`, `...PageContent`, หรือชื่อที่สื่อหน้าที่ชัดเจน
- service ใช้ชื่อกริยาเช่น `getPointRules`, `savePointRule`, `getAdminUsers`, `updateAdminUserRoles`
