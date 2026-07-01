# System Inventory Summary

Generated: 2026-07-01T12:04:48.310Z

## Upload Image Limits

- Backend `/api/uploads` accepts only `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Backend max is `MAX_UPLOAD_BYTES`, default `5 MB` per uploaded file.
- Shared frontend uploader tries to normalize images to about `1 MB`, max dimension `1280px`, before sending to backend.

| Page/Area | Use | Count | Client limit | Server limit | Types |
| --- | --- | --- | --- | --- | --- |
| /safety-culture/post | โพสต์ Safety Culture แนบรูป | สูงสุด 5 รูปต่อโพสต์ | แปลงรูปเป็น JPEG ด้านยาวไม่เกิน 1600px, quality 0.78 ก่อนอัปโหลด | หลัง normalize ส่งเข้า /api/uploads ต้องไม่เกิน 5 MB ต่อไฟล์ | JPEG, PNG, WebP, GIF ผ่าน input image/* แต่ท้ายทาง backend รับเฉพาะ image/jpeg, image/png, image/webp, image/gif |
| /profile | รูปโปรไฟล์ผู้ใช้ | 1 รูป | ไฟล์ต้นฉบับต้องไม่เกิน 3 MB | หลัง normalize ส่งเข้า /api/uploads ต้องไม่เกิน 5 MB ต่อไฟล์ | JPEG, PNG, WebP, GIF ผ่าน input image/* แต่ท้ายทาง backend รับเฉพาะ image/jpeg, image/png, image/webp, image/gif |
| /safety-culture/admin-event | รูปกิจกรรม/feed event ในหน้า admin | 1 รูปต่อ event draft | อ่านเป็น Data URL เพื่อ preview/state ในหน้า admin; ยังไม่ผ่าน /api/uploads ใน flow นี้ | ยังไม่มี server upload limit เพราะยังไม่บันทึกเป็น media_assets | input accept=image/* |
| Safety Effort evidence media | ไฟล์หลักฐานจาก Linewalk/Safety Contact/assessment ถ้าเรียก uploadSafetyEffortMedia | ขึ้นกับ flow ที่เรียกใช้งาน | normalize เป็นเป้าหมายไม่เกิน 1 MB, ด้านยาวไม่เกิน 1280px; ถ้าต้นฉบับเกิน 20 MB จะ reject | หลัง normalize ส่งเข้า /api/uploads ต้องไม่เกิน 5 MB ต่อไฟล์ | JPEG, PNG, WebP, GIF; GIF ที่เกิน 1 MB จะ reject ฝั่ง client |
| /api/assistant/chat | รูปสำหรับผู้ช่วย Safety วิเคราะห์ภาพ | 1 data:image ต่อข้อความ | ส่งเป็น data URL ไม่ใช่ media upload ปกติ | จำกัดด้วย MAX_IMAGE_CHARS ใน route assistant | data:image/* |

## API Inventory

- Registry definitions: 163
- Unique method+path routes: 163

### API Count By Module

| Module | Routes |
| --- | --- |
| Assessment | 8 |
| Assessment Admin | 9 |
| Assistant | 1 |
| Audit | 1 |
| Auth | 4 |
| Awareness | 1 |
| Awareness Admin | 5 |
| Check-in | 8 |
| Corrective Action | 6 |
| Holidays | 3 |
| Locations | 15 |
| Media | 5 |
| Notifications | 7 |
| Organizations | 6 |
| Reports | 8 |
| Rewards Admin | 6 |
| Safety Awareness | 2 |
| Safety Culture | 27 |
| Safety Culture Admin | 6 |
| Safety Effort | 15 |
| Settings | 2 |
| System | 2 |
| Uploads | 5 |
| Users/IAM | 11 |

### API Routes

| Module | Method | Path | Purpose | Caller | Auth | Pagination | Risk | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | GET | /api/auth/session | อ่าน session ผู้ใช้ปัจจุบัน | ทุกหน้า | User | No | Small | Existing |
| Auth | GET | /api/auth/login | เริ่ม RMC SSO login | Login | Public | No | Small | Existing |
| Auth | GET | /api/auth/callback/rmc-sso | รับ callback จาก RMC SSO | SSO provider | Public/OIDC | No | Small | Existing |
| Auth | GET | /api/auth/logout | ออกจากระบบและล้าง session | Header/Profile | User | No | Small | Existing |
| Assistant | POST | /api/assistant/chat | คุยกับผู้ช่วย Safety | Floating assistant | User | No | Medium | Existing |
| Locations | GET | /api/locations/plants | รายการโรงงานสำหรับ check-in/search | Check-in, Admin | User | Required page/pageSize | High if unpaged | Existing |
| Locations | GET | /api/locations/offices | รายการสำนักงานสำหรับ check-in/search | Check-in, Admin | User | Required page/pageSize | High if unpaged | Existing |
| Locations | GET | /api/locations/sites | รายการ site งานสำหรับ check-in/search | Check-in, Admin | User | Required page/pageSize | High if unpaged | Existing |
| Locations | GET | /api/locations/custom | รายการ location ที่ admin เพิ่มเอง | Admin, Check-in | User | Required page/pageSize | Medium | Existing |
| Locations | GET | /api/locations/map?type=&bbox=&zoom= | marker สำหรับแผนที่ตาม viewport | Check-in map | User | Required bbox + cap | Critical if returns all | Existing |
| Locations | GET | /api/locations/search?type=&q=&limit= | autocomplete location | Check-in search box | User | Required limit <= 50 | Medium | Existing |
| Locations | GET | /api/locations/:id | รายละเอียด location เดียว | Check-in detail, Admin | User | No | Small | Existing |
| Locations | POST | /api/locations | เพิ่ม location ใหม่ | Admin | Admin | No | Small | Existing |
| Locations | PATCH | /api/locations/:id | แก้ไข location | Admin | Admin | No | Small | Existing |
| Locations | DELETE | /api/locations/:id | soft delete location | Admin | Admin | No | Small | Existing |
| Locations | GET | /api/safety-effort/locations | รายการ location เดิมใน repo | Check-in/Admin | User | Optional limit | High if raised too much | Existing |
| Locations | POST | /api/safety-effort/locations | เพิ่ม location เดิมใน repo | Admin | Admin | No | Small | Existing |
| Locations | GET | /api/safety-effort/locations/:id | อ่าน location เดิมรายตัว | Admin/Check-in | User | No | Small | Existing |
| Locations | PATCH | /api/safety-effort/locations/:id | แก้ location เดิม | Admin | Admin | No | Small | Existing |
| Locations | DELETE | /api/safety-effort/locations/:id | soft delete location เดิม | Admin | Admin | No | Small | Existing |
| Check-in | POST | /api/checkins | บันทึก check-in พร้อม GPS จริงและ selected location | Check-in | User | No | Small | Existing |
| Check-in | GET | /api/checkins/me?from=&to=&page=&pageSize= | ประวัติ check-in ของฉัน | Profile/History | User | Required | Medium | Existing |
| Check-in | GET | /api/checkins?locationId=&userId=&from=&to=&page=&pageSize= | admin ดู check-in ทั้งหมด | Safety Admin | Admin | Required | High | Existing |
| Check-in | GET | /api/checkins/:id | รายละเอียด check-in | Admin/History | User/Admin | No | Small | Existing |
| Safety Effort | GET | /api/safety-effort | API module briefing เดิม | Dev/Admin | User | No | Small | Existing |
| Safety Effort | POST | /api/safety-effort/activities | เริ่มกิจกรรม Safety Effort จาก check-in | Category/Activity | User | No | Small | Existing |
| Safety Effort | GET | /api/safety-effort/activities/me?status=&page=&pageSize= | กิจกรรมของฉัน | Dashboard/Profile | User | Required | Medium | Existing |
| Safety Effort | GET | /api/safety-effort/activities/:id | รายละเอียดกิจกรรม | Linewalk/Summary | User | No | Small | Existing |
| Safety Effort | PATCH | /api/safety-effort/activities/:id | อัปเดตสถานะกิจกรรม | Linewalk/Summary | User | No | Small | Existing |
| Safety Effort | POST | /api/safety-effort/submissions | บันทึก Linewalk/Safety Contact พร้อมคำตอบและรูปแบบ structured | Assessment Summary | User | No | Medium | Existing |
| Safety Effort | GET | /api/safety-effort/submissions/me?page=&pageSize= | ประวัติ submission ของผู้ใช้ | Profile/History | User | Required | Medium | Existing |
| Safety Effort | GET | /api/safety-effort/submissions/legacy/me?from=&to= | สรุปข้อมูล Linewalk/Safety Contact เดิมจาก safety_old ของผู้ใช้ปัจจุบัน | Dashboard/Category | User | No | Small | Existing |
| Safety Effort | GET | /api/safety-effort/submissions/legacy/coverage?limit= | ตรวจ coverage การแมพ safety_old.CreatedBy กับ users.username | Admin/Operations | Admin | Optional limit | Small | Existing |
| Safety Effort | GET | /api/safety-effort/submissions?from=&to=&activityType=&page=&pageSize= | รายงาน submissions ทั้งระบบ | Safety Admin Report/Export | Admin | Required | High | Existing |
| Safety Effort | PATCH | /api/safety-effort/submissions/:id | แก้ข้อมูลรายงาน submission | Safety Admin Export Report | Admin | No | Small | Existing |
| Safety Effort | DELETE | /api/safety-effort/submissions/:id | soft delete submission | Safety Admin Report History | Admin | No | Small | Existing |
| Assessment | GET | /api/safety-effort/assessment-templates?locationType=&activityType= | ดึง template แบบประเมิน | Linewalk | User | No | Medium | Existing |
| Assessment | POST | /api/safety-effort/assessment-runs | สร้าง/ส่งแบบประเมิน | Assessment Summary | User | No | Medium | Existing |
| Assessment | GET | /api/safety-effort/assessment-runs/:id | อ่านผลแบบประเมิน | History/Admin | User/Admin | No | Medium | Existing |
| Assessment | GET | /api/safety-effort/assessment-runs?from=&to=&locationType=&page=&pageSize= | รายงานแบบประเมิน | Safety Admin | Admin | Required | High | Existing |
| Assessment | GET | /api/safety-effort/assessment-runs/export?from=&to=&format=xlsx | export รายงานแบบประเมิน | Safety Admin | Admin | Stream/export job | High | Existing |
| Safety Effort | POST | /api/safety-effort/findings | บันทึก safety finding | Linewalk/Observation | User | No | Small | Existing |
| Safety Effort | POST | /api/safety-effort/corrective-actions | สร้างงานแก้ไข | Admin/Finding | Admin | No | Small | Existing |
| Safety Effort | GET | /api/safety-effort/corrective-actions?status=&assigneeId=&page=&pageSize= | รายการงานแก้ไข | Admin/Dashboard | User/Admin | Required | Medium | Existing |
| Safety Culture | GET | /api/safety-culture/posts?category=&cursor=&limit= | feed posts | Safety Culture feed | User | Cursor required | High if unpaged | Existing |
| Safety Culture | POST | /api/safety-culture/comments/:id/reactions | เพิ่มหรือเปลี่ยนความรู้สึกต่อความคิดเห็น | Feed/Post detail | User | No | Small | Existing |
| Safety Culture | DELETE | /api/safety-culture/comments/:id/reactions | ยกเลิกความรู้สึกต่อความคิดเห็น | Feed/Post detail | User | No | Small | Existing |
| Safety Culture | POST | /api/safety-culture/posts | สร้าง post | Post page | User | No | Small | Existing |
| Safety Culture | GET | /api/safety-culture/posts/:id | รายละเอียด post | Post detail/notification | User | No | Medium | Existing |
| Safety Culture | PATCH | /api/safety-culture/posts/:id | แก้ post | My post/admin | Owner/Admin | No | Small | Existing |
| Safety Culture | DELETE | /api/safety-culture/posts/:id | soft delete post | My post/admin | Owner/Admin | No | Small | Existing |
| Safety Culture | POST | /api/safety-culture/posts/:id/comments | เพิ่ม comment | Feed/Post detail | User | No | Small | Existing |
| Safety Culture | GET | /api/safety-culture/posts/:id/comments?cursor=&limit= | โหลด comments เพิ่ม | Post detail | User | Cursor required | Medium | Existing |
| Safety Culture | PATCH | /api/safety-culture/comments/:id | แก้ comment ของตัวเอง | Feed/Post detail | Owner | No | Small | Existing |
| Safety Culture | DELETE | /api/safety-culture/comments/:id | ลบ comment ของตัวเอง | Feed/Post detail | Owner | No | Small | Existing |
| Safety Culture | POST | /api/safety-culture/posts/:id/reactions | like/reaction | Feed | User | No | Small | Existing |
| Safety Culture | DELETE | /api/safety-culture/posts/:id/reactions | ยกเลิก reaction | Feed | User | No | Small | Existing |
| Safety Culture | GET | /api/safety-culture/events?status=&page=&pageSize= | รายการกิจกรรม culture | Feed/Admin Event | User | Required | Medium | Existing |
| Safety Culture | POST | /api/safety-culture/events | สร้างกิจกรรม | Admin Event | Admin | No | Small | Existing |
| Safety Culture | PATCH | /api/safety-culture/events/:id | แก้กิจกรรม | Admin Event | Admin | No | Small | Existing |
| Safety Culture | DELETE | /api/safety-culture/events/:id | ลบกิจกรรม | Admin Event | Admin | No | Small | Existing |
| Safety Culture | GET | /api/safety-culture/leaderboard?scope=&period= | leaderboard | Leaderboard | User | Limit/cached | Medium | Existing |
| Safety Culture | GET | /api/safety-culture/rewards | catalog ของรางวัล | Rewards | User | No or page | Medium | Existing |
| Safety Culture | POST | /api/safety-culture/rewards/:id/redeem | แลกรางวัล | Rewards | User | No | Small | Existing |
| Safety Awareness | GET | /api/safety-awareness/questions?date= | คำถาม awareness ของวัน | Popup/Admin | User | No | Small | Existing |
| Safety Awareness | POST | /api/safety-awareness/attempts | ส่งคำตอบ awareness | Popup | User | No | Small | Existing |
| Notifications | GET | /api/notifications?cursor=&limit= | inbox notifications | Notifications | User | Cursor required | Medium | Existing |
| Notifications | PATCH | /api/notifications/:id/read | mark read | Notifications | User | No | Small | Existing |
| Notifications | POST | /api/notifications/broadcast | ส่ง notification จาก admin/event | Admin | Admin | No | Small | Existing |
| Uploads | POST | /api/uploads | upload รูป/ไฟล์กลางระบบ | Safety Effort, Culture, Profile | User | No | Upload size limit | Existing |
| Uploads | GET | /api/uploads/:id | อ่าน metadata ไฟล์ | Any detail page | User | No | Small | Existing |
| Uploads | GET | /api/uploads/:id/download | download/private signed URL | Image viewer/report | User | No | File | Existing |
| Uploads | DELETE | /api/uploads/:id | ลบ/ยกเลิก attachment | Draft/Admin | Owner/Admin | No | Small | Existing |
| Uploads | POST | /api/uploads/cleanup-drafts | cleanup draft media | Scheduled job | System/Admin | Batch cap | Medium | Existing |
| Organizations | GET | /api/organizations/tree | อ่านโครงสร้างองค์กรแบบ tree | Admin, Profile, Location admin | Admin/User scoped | No or shallow depth | Medium | Existing |
| Organizations | GET | /api/organizations?parentId=&type=&page=&pageSize= | รายการองค์กรแบบแบ่งหน้า | Admin | Admin | Required | Medium | Existing |
| Organizations | GET | /api/organizations/:id | รายละเอียดองค์กร | Admin/Profile | Admin/User scoped | No | Small | Existing |
| Organizations | POST | /api/organizations | สร้างองค์กร | Admin | Admin | No | Small | Existing |
| Organizations | PATCH | /api/organizations/:id | แก้ข้อมูลองค์กร | Admin | Admin | No | Small | Existing |
| Organizations | DELETE | /api/organizations/:id | soft delete องค์กร | Admin | Admin | No | Small | Existing |
| Users/IAM | GET | /api/users/me | โปรไฟล์ผู้ใช้ปัจจุบัน | Profile/Header | User | No | Small | Existing |
| Users/IAM | PATCH | /api/users/me | แก้ profile ผู้ใช้ | Profile | User | No | Small | Existing |
| Users/IAM | GET | /api/users?search=&organizationId=&role=&page=&pageSize= | ค้นผู้ใช้ | Admin, Assign action | Admin | Required | Medium | Existing |
| Users/IAM | GET | /api/users/:id | รายละเอียดผู้ใช้ | Admin | Admin | No | Small | Existing |
| Users/IAM | PATCH | /api/users/:id/status | เปลี่ยนสถานะ user | Admin | Admin | No | Small | Existing |
| Users/IAM | GET | /api/roles | รายการ role | Admin | Admin | No | Small | Existing |
| Users/IAM | POST | /api/roles | สร้าง role | Admin | Admin | No | Small | Existing |
| Users/IAM | PATCH | /api/roles/:id | แก้ role | Admin | Admin | No | Small | Existing |
| Users/IAM | GET | /api/permissions | รายการ permission | Admin | Admin | No | Small | Existing |
| Users/IAM | PUT | /api/users/:id/roles | กำหนด roles ให้ user | Admin | Admin | No | Small | Existing |
| Users/IAM | PUT | /api/roles/:id/permissions | กำหนด permissions ให้ role | Admin | Admin | No | Small | Existing |
| Check-in | GET | /api/checkins/nearby?lat=&lng=&radiusM=&type= | สถานที่ใกล้ฉัน | Check-in | User | Limit required | Medium | Existing |
| Check-in | POST | /api/checkins/:id/attachments | ผูกรูป/หลักฐานกับ check-in | Check-in | User | No | Small | Existing |
| Check-in | DELETE | /api/checkins/:id/attachments/:attachmentId | ลบหลักฐาน check-in | Check-in/Admin | Owner/Admin | No | Small | Existing |
| Check-in | GET | /api/checkins/stats?from=&to=&locationType= | สถิติ check-in | Dashboard/Admin | Admin | Aggregate | Medium | Existing |
| Assessment Admin | GET | /api/safety-effort/assessment-templates/:id | รายละเอียด template | Safety Admin | Admin | No | Medium | Existing |
| Assessment Admin | POST | /api/safety-effort/assessment-templates | สร้าง template | Safety Admin | Admin | No | Medium | Existing |
| Assessment Admin | PATCH | /api/safety-effort/assessment-templates/:id | แก้ template metadata | Safety Admin | Admin | No | Small | Existing |
| Assessment Admin | POST | /api/safety-effort/assessment-templates/:id/publish | publish template version | Safety Admin | Admin | No | Small | Existing |
| Assessment Admin | POST | /api/safety-effort/assessment-templates/:id/archive | archive template | Safety Admin | Admin | No | Small | Existing |
| Assessment Admin | GET | /api/safety-effort/assessment-templates/:id/questions | รายการคำถามใน template | Safety Admin/Linewalk | User/Admin | No | Medium | Existing |
| Assessment Admin | POST | /api/safety-effort/assessment-templates/:id/questions | เพิ่มคำถาม | Safety Admin | Admin | No | Small | Existing |
| Assessment Admin | PATCH | /api/safety-effort/questions/:id | แก้คำถาม | Safety Admin | Admin | No | Small | Existing |
| Assessment Admin | DELETE | /api/safety-effort/questions/:id | ลบ/disable คำถาม | Safety Admin | Admin | No | Small | Existing |
| Assessment | POST | /api/safety-effort/assessment-runs/:id/submit | submit draft assessment | Assessment Summary | User | No | Small | Existing |
| Assessment | PATCH | /api/safety-effort/assessment-runs/:id/draft | save draft | Linewalk | User | No | Medium | Existing |
| Assessment | POST | /api/safety-effort/assessment-runs/:id/attachments | ผูกรูปกับ run/answer | Linewalk | User | No | Small | Existing |
| Reports | GET | /api/safety-effort/reports/summary?from=&to=&locationType= | summary cards สำหรับ admin | Safety Admin | Admin | Aggregate | Medium | Existing |
| Reports | GET | /api/safety-effort/reports/by-location?from=&to=&type=&page=&pageSize= | รายงานแยก location | Safety Admin | Admin | Required | High | Existing |
| Reports | GET | /api/safety-effort/reports/by-user?from=&to=&page=&pageSize= | รายงานแยกผู้ประเมิน | Safety Admin | Admin | Required | High | Existing |
| Reports | GET | /api/safety-effort/reports/linewalk-overview?from=&to= | ภาพรวม Line walk จาก submission จริง แยกพื้นที่ สถานะ และ BU | Safety Admin | Admin | Aggregate | Medium | Existing |
| Reports | GET | /api/safety-effort/reports/findings?from=&to=&status=&page=&pageSize= | รายงาน finding | Safety Admin | Admin | Required | High | Existing |
| Reports | POST | /api/exports | สร้าง export job | Admin | Admin | Async | High | Existing |
| Reports | GET | /api/exports/:id | สถานะ export job | Admin | Admin | No | Small | Existing |
| Reports | GET | /api/exports/:id/download | download export file | Admin | Admin | File | File | Existing |
| Corrective Action | GET | /api/safety-effort/findings?status=&severity=&page=&pageSize= | รายการ findings | Admin/Dashboard | User/Admin | Required | High | Existing |
| Corrective Action | GET | /api/safety-effort/findings/:id | รายละเอียด finding | Admin/Assignee | User/Admin | No | Medium | Existing |
| Corrective Action | PATCH | /api/safety-effort/findings/:id | แก้ finding | Admin/Reporter | Owner/Admin | No | Small | Existing |
| Corrective Action | PATCH | /api/safety-effort/corrective-actions/:id | อัปเดต action | Assignee/Admin | Assignee/Admin | No | Small | Existing |
| Corrective Action | POST | /api/safety-effort/corrective-actions/:id/complete | ปิดงานแก้ไข | Assignee/Admin | Assignee/Admin | No | Small | Existing |
| Corrective Action | POST | /api/safety-effort/corrective-actions/:id/comments | comment ใน action | Assignee/Admin | User | No | Small | Existing |
| Safety Culture Admin | GET | /api/safety-culture/posts/admin?status=&page=&pageSize= | admin moderation list | Admin Culture | Admin | Required | High | Existing |
| Safety Culture Admin | POST | /api/safety-culture/posts/:id/approve | approve post | Admin Culture | Admin | No | Small | Existing |
| Safety Culture Admin | POST | /api/safety-culture/posts/:id/reject | reject post | Admin Culture | Admin | No | Small | Existing |
| Safety Culture | GET | /api/safety-culture/events/:id | รายละเอียดกิจกรรม | Feed/Admin | User | No | Medium | Existing |
| Safety Culture | POST | /api/safety-culture/events/:id/notify | ส่ง notification กิจกรรม | Admin Event | Admin | Batch/queue | Medium | Existing |
| Safety Culture | GET | /api/safety-culture/points/me | คะแนนของฉัน | Profile/Rewards | User | No | Small | Existing |
| Safety Culture | GET | /api/safety-culture/points/me/transactions?cursor=&limit= | ledger คะแนนของฉัน | Profile history | User | Cursor | Medium | Existing |
| Safety Culture Admin | GET | /api/safety-culture/points/rules | กติกาคะแนน | Admin | Admin | No | Small | Existing |
| Safety Culture Admin | PATCH | /api/safety-culture/points/rules/:id | แก้กติกาคะแนน | Admin | Admin | No | Small | Existing |
| Safety Culture Admin | POST | /api/safety-culture/points/adjustments | ปรับคะแนน manual | Admin | Admin | No | Small | Existing |
| Rewards Admin | POST | /api/safety-culture/rewards | สร้างของรางวัล | Admin Reward | Admin | No | Small | Existing |
| Rewards Admin | PATCH | /api/safety-culture/rewards/:id | แก้ของรางวัล | Admin Reward | Admin | No | Small | Existing |
| Rewards Admin | DELETE | /api/safety-culture/rewards/:id | ซ่อน/ลบของรางวัล | Admin Reward | Admin | No | Small | Existing |
| Rewards Admin | GET | /api/safety-culture/reward-redemptions?status=&page=&pageSize= | รายการแลกรางวัล | Admin Reward | Admin | Required | High | Existing |
| Rewards Admin | PATCH | /api/safety-culture/reward-redemptions/:id/status | อัปเดตสถานะแลกรางวัล | Admin Reward | Admin | No | Small | Existing |
| Rewards Admin | POST | /api/safety-culture/rewards/:id/inventory-transactions | ปรับ stock ของรางวัล | Admin Reward | Admin | No | Small | Existing |
| Awareness Admin | GET | /api/safety-awareness/questions/admin?page=&pageSize=&category= | คลังคำถาม awareness | Admin Awareness | Admin | Required | Medium | Existing |
| Awareness Admin | POST | /api/safety-awareness/questions | สร้างคำถาม awareness | Admin Awareness | Admin | No | Small | Existing |
| Awareness Admin | PATCH | /api/safety-awareness/questions/:id | แก้คำถาม awareness | Admin Awareness | Admin | No | Small | Existing |
| Awareness Admin | DELETE | /api/safety-awareness/questions/:id | disable คำถาม awareness | Admin Awareness | Admin | No | Small | Existing |
| Awareness | GET | /api/safety-awareness/attempts/me?from=&to=&page=&pageSize= | ประวัติ awareness ของฉัน | Profile | User | Required | Medium | Existing |
| Awareness Admin | GET | /api/safety-awareness/attempts?from=&to=&userId=&page=&pageSize= | รายงาน awareness | Admin Awareness | Admin | Required | High | Existing |
| Holidays | GET | /api/holidays?year= | รายการวันหยุด | Admin Awareness/Effort | User/Admin | No | Small | Existing |
| Holidays | POST | /api/holidays | เพิ่มวันหยุด | Admin | Admin | No | Small | Existing |
| Holidays | DELETE | /api/holidays/:id | ลบวันหยุด | Admin | Admin | No | Small | Existing |
| Notifications | POST | /api/notifications/:id/archive | archive notification | Notifications | User | No | Small | Existing |
| Notifications | PATCH | /api/notifications/read-all | mark all read | Notifications | User | No | Small | Existing |
| Notifications | GET | /api/notifications/preferences | notification preferences | Profile | User | No | Small | Existing |
| Notifications | PATCH | /api/notifications/preferences | แก้ notification preferences | Profile | User | No | Small | Existing |
| Media | POST | /api/uploads/:id/link | ผูก media กับ owner | Any module | Owner/Admin | No | Small | Existing |
| Media | DELETE | /api/uploads/:id/link | ถอด media จาก owner | Any module | Owner/Admin | No | Small | Existing |
| Media | GET | /api/media?ownerType=&ownerId= | อ่าน media ของ owner | Detail/report | User | Limit | Medium | Existing |
| Media | POST | /api/uploads/presign | ขอ signed upload URL | Mobile/Web | User | No | Small | Existing |
| Media | POST | /api/uploads/:id/complete | ยืนยัน upload direct-to-storage | Mobile/Web | User | No | Small | Existing |
| Safety Culture | GET | /api/safety-culture/teams | อ่านทีม จำนวนสมาชิก Coin สี หัวหน้า สมาชิก และ Division ต้นทาง | Admin Leaderboard | User | No | Small | Existing |
| Safety Culture | POST | /api/safety-culture/teams | สร้างทีมใหม่พร้อมหัวหน้าและสมาชิก | Admin Leaderboard | Admin | No | Small | Existing |
| Safety Culture | PUT | /api/safety-culture/teams | แก้ชื่อทีม หัวหน้า และสมาชิก | Admin Leaderboard | Admin | No | Small | Existing |
| Settings | GET | /api/safety-settings?key= | อ่านค่า safety settings จากฐานจริง | Safety Admin/DatePicker | User | No | Small | Existing |
| Settings | PUT | /api/safety-settings | บันทึกค่า safety settings ลงฐานจริง | Safety Admin | Admin | No | Small | Existing |
| Audit | GET | /api/audit-logs?actor=&entity=&from=&to=&page=&pageSize= | audit trail | Admin/Security | Admin | Required | High | Existing |
| System | GET | /api/health | health check | Infra | Public/Internal | No | Small | Existing |
| System | GET | /api/version | app/api version | Infra/Debug | Public/Internal | No | Small | Existing |

## CPAC_Safety Tables

- Database: CPAC_Safety
- Tables: 46

| Table | What it stores | Rows est. | Columns | Indexes | FKs | Engine |
| --- | --- | --- | --- | --- | --- | --- |
| api_docs_access_users | รายชื่อผู้ใช้ที่มีสิทธิ์เข้า API Docs/OpenAPI | 1 | 5 | 3 | 0 | InnoDB |
| archived_notifications | รายการ notification ที่ผู้ใช้ archive แล้ว | 0 | 9 | 2 | 1 | InnoDB |
| assessment_answers | คำตอบย่อยใน assessment/checklist แต่ละครั้ง | 0 | 8 | 3 | 2 | InnoDB |
| assessment_attachments | ไฟล์แนบหลักฐานของ assessment run | 0 | 9 | 4 | 3 | InnoDB |
| assessment_questions | คำถาม/หัวข้อ checklist สำหรับ assessment | 26 | 10 | 2 | 1 | InnoDB |
| assessment_runs | รอบการทำ assessment / Linewalk / Safety Contact | 0 | 9 | 5 | 3 | InnoDB |
| assessment_templates | แม่แบบ checklist/assessment | 3 | 9 | 4 | 1 | InnoDB |
| audit_logs | ประวัติการกระทำสำคัญสำหรับ audit | 9 | 9 | 4 | 1 | InnoDB |
| awareness_answers | คำตอบของแบบทดสอบ Safety Awareness | 66 | 7 | 3 | 2 | InnoDB |
| awareness_attempts | รอบการทำ Safety Awareness ของผู้ใช้ | 36 | 7 | 3 | 1 | InnoDB |
| awareness_questions | คลังคำถาม Safety Awareness | 122 | 7 | 2 | 0 | InnoDB |
| checkin_attachments | ไฟล์แนบของ check-in | 0 | 7 | 3 | 2 | InnoDB |
| checkins | ข้อมูล check-in รวมตำแหน่งที่เลือก/ตำแหน่งจริง | 119 | 21 | 10 | 1 | InnoDB |
| comment_reactions | reaction ต่อ comment | 5 | 6 | 3 | 2 | InnoDB |
| comments | ความคิดเห็นใน Safety Culture posts | 41 | 7 | 4 | 2 | InnoDB |
| corrective_action_comments | ความคิดเห็น/บันทึกติดตาม corrective action | 0 | 8 | 3 | 2 | InnoDB |
| corrective_actions | งานแก้ไข/ติดตามจาก safety finding หรือ assessment | 0 | 9 | 4 | 2 | InnoDB |
| export_jobs | คิว export/report jobs | 0 | 11 | 4 | 1 | InnoDB |
| holidays | วันหยุด/ปฏิทินที่ใช้คำนวณงานและ awareness | 0 | 5 | 2 | 0 | InnoDB |
| locations | สถานที่ใน CPAC_Safety โดยเฉพาะ custom/admin และ snapshot ที่ระบบใช้ | 4 | 23 | 10 | 2 | InnoDB |
| media_assets | metadata ไฟล์รูป/สื่อที่อัปโหลด | 43 | 24 | 7 | 1 | InnoDB |
| notification_preferences | การตั้งค่าการแจ้งเตือนของผู้ใช้ | 0 | 6 | 1 | 1 | InnoDB |
| notifications | notification ของผู้ใช้ | 128 | 9 | 4 | 1 | InnoDB |
| organizations | หน่วยงาน/โครงสร้างองค์กรในระบบ | 0 | 10 | 4 | 1 | InnoDB |
| permissions | สิทธิ์ย่อยของระบบ | 0 | 5 | 2 | 0 | InnoDB |
| point_balances | ยอด Coin/คะแนนคงเหลือของผู้ใช้ | 9 | 3 | 2 | 1 | InnoDB |
| point_rules | กติกาการให้คะแนน | 1 | 7 | 3 | 0 | InnoDB |
| point_transactions | ประวัติรับ/ใช้คะแนน | 214 | 12 | 5 | 2 | InnoDB |
| post_media | ความสัมพันธ์โพสต์กับ media_assets | 14 | 4 | 4 | 2 | InnoDB |
| posts | โพสต์ Safety Culture feed | 34 | 13 | 7 | 1 | InnoDB |
| reactions | reaction ต่อโพสต์ | 12 | 4 | 3 | 2 | InnoDB |
| reward_inventory_transactions | ประวัติ stock รางวัลเข้า/ออก | 16 | 8 | 3 | 1 | InnoDB |
| reward_redemptions | ประวัติแลกรางวัล | 21 | 9 | 6 | 3 | InnoDB |
| rewards | รายการรางวัลในร้านแลกของ | 6 | 10 | 4 | 0 | InnoDB |
| role_permissions | ความสัมพันธ์ role กับ permission | 0 | 2 | 2 | 2 | InnoDB |
| roles | บทบาทผู้ใช้ | 0 | 6 | 2 | 0 | InnoDB |
| safety_activities | กิจกรรม safety | 0 | 11 | 3 | 1 | InnoDB |
| safety_culture_events | กิจกรรม/event/banner ของ Safety Culture | 20 | 12 | 4 | 1 | InnoDB |
| safety_effort_submissions | submission จริงของ Safety Effort เช่น Linewalk/Safety Contact/custom activity | 44 | 19 | 5 | 3 | InnoDB |
| safety_findings | finding/ประเด็นความปลอดภัย | 0 | 10 | 4 | 2 | InnoDB |
| safety_old | ข้อมูล legacy safety เดิม ถ้ายังเหลือในฐาน | 1637 | 4 | 0 | 0 | InnoDB |
| safety_settings | ค่า config กลาง เช่น categories, awareness, reward, point condition | 7 | 5 | 2 | 1 | InnoDB |
| team_members | สมาชิกทีม Safety Culture | 10 | 4 | 5 | 2 | InnoDB |
| teams | ทีม Safety Culture | 16 | 9 | 6 | 2 | InnoDB |
| user_roles | ความสัมพันธ์ผู้ใช้กับบทบาท | 4 | 4 | 3 | 3 | InnoDB |
| users | บัญชีผู้ใช้และข้อมูลจาก SSO/LINE/profile | 10 | 27 | 9 | 1 | InnoDB |

