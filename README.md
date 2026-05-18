🚀 ขั้นตอน Deploy
1. สร้าง Google Spreadsheet
  <br/>ไปที่ sheets.google.com → สร้างไฟล์ใหม่ → คัดลอก ID จาก URL
2. เปิด Apps Script
  <br/>ใน Spreadsheet → เมนู Extensions → Apps Script → วางโค้ดแทนที่ทั้งหมด ลงใน Code.gs
3. แก้ไข Config บรรทัดแรก
  <br/>const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // ใส่ ID จริง
4. ทดสอบก่อน Deploy
  <br/>กด ▶️ รันฟังก์ชัน testSave() → ตรวจสอบ Sheet ว่ามีข้อมูล
5. Deploy เป็น Web App
  <br/>Deploy → New Deployment → Type: Web App
  <br/>Execute as: Me
  <br/>Who has access: Anyone (หรือ Anyone with Google Account)
  <br/>กด Deploy → คัดลอก Web App URL

6. ใส่ URL Web App ในไฟล์ HTML (index.html)
   <br/>แก้ const APPS_SCRIPT_URL = 'URL Web App ของคุณ';
7. อัปโหลดไฟล์ index.html ขึ้นโฮสต์
   
