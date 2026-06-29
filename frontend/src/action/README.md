# Action Layer

ใช้โฟลเดอร์นี้สำหรับ server actions ที่ทำหน้าที่เป็น bridge ระหว่าง `FormData` หรือ form submit กับ `services/`

กติกา:
- ใส่ `"use server"` เฉพาะไฟล์ที่เป็น server action จริง
- ห้ามมี UI
- ห้ามคุยกับ endpoint โดยตรงถ้า logic ควรอยู่ใน `src/services/`
