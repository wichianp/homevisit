🚀 ขั้นตอน Deploy
1. สร้าง Google Spreadsheet
ไปที่ sheets.google.com → สร้างไฟล์ใหม่ → คัดลอก ID จาก URL
2. เปิด Apps Script
ใน Spreadsheet → เมนู Extensions → Apps Script → วางโค้ดแทนที่ทั้งหมด
3. แก้ไข Config บรรทัดแรก
const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // ใส่ ID จริง
4. ทดสอบก่อน Deploy
กด ▶️ รันฟังก์ชัน testSave() → ตรวจสอบ Sheet ว่ามีข้อมูล
5. Deploy เป็น Web App

Deploy → New Deployment → Type: Web App
Execute as: Me
Who has access: Anyone (หรือ Anyone with Google Account)
กด Deploy → คัดลอก Web App URL

6. ใส่ URL ในไฟล์ HTML
แก้ const APPS_SCRIPT_URL = 'URL Web App ของคุณ';
