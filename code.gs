// ============================================================
//  ระบบบันทึกการเยี่ยมบ้านนักเรียน — Google Apps Script
//  วางไฟล์นี้ใน Google Apps Script แล้ว Deploy เป็น Web App
// ============================================================

// ---- CONFIG ----
// เปลี่ยน SHEET_ID เป็น ID ของ Google Spreadsheet ที่ต้องการ
// (ดู ID จาก URL: https://docs.google.com/spreadsheets/d/<<SHEET_ID>>/edit)
const SHEET_ID   = 'xxxxxxxxx';// ใส่ ID จริง
const SHEET_NAME = 'data';   // ชื่อ sheet tab

// คอลัมน์หัวตาราง (ตรงกับ order ใน appendRow)
const HEADERS = [
  'ลำดับ',
  'รหัสนักเรียน',
  'ชื่อ-สกุล',
  'ระดับชั้น',
  'ห้องเรียน',
  'เบอร์โทรผู้ปกครอง',
  'ตำบล/แขวง',
  'อำเภอ/เขต',
  'จังหวัด',
  'บันทึกผลการเยี่ยมบ้าน',
  'Latitude',
  'Longitude',
  'Google Maps Link',
  'วันที่บันทึก',
  'เวลาบันทึก',
];

// ============================================================
//  doGet — ให้บริการอ่านข้อมูล (ไม่บังคับ ใช้สำหรับ debug)
// ============================================================
function doGet(e) {
  const action = e.parameter.action || 'ping';

  if (action === 'ping') {
    return jsonResponse({ status: 'ok', message: 'Server is running' });
  }

  if (action === 'getAll') {
    return jsonResponse(getAllRecords());
  }

  return jsonResponse({ status: 'error', message: 'Unknown action' });
}

// ============================================================
//  doPost — รับข้อมูลจากหน้าเว็บแล้วบันทึกลง Sheet
// ============================================================
function doPost(e) {
  try {
    // รองรับทั้ง JSON body และ form data
    let data;
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    const action = data.action || 'save';

    if (action === 'save') {
      const result = saveRecord(data);
      return jsonResponse(result);
    }

    if (action === 'delete') {
      const result = deleteRecord(data.stdId);
      return jsonResponse(result);
    }

    if (action === 'getDeletePassword') {
      const result = getDeletePassword();
      return jsonResponse(result);
    }

    return jsonResponse({ status: 'error', message: 'Unknown action' });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ============================================================
//  saveRecord — เพิ่มแถวใหม่ลงใน Sheet
// ============================================================
function saveRecord(data) {
  const sheet  = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  const seq    = lastRow; // ลำดับ = จำนวนแถวปัจจุบัน (ไม่นับ header)

  const now    = new Date();
  const dateStr = Utilities.formatDate(now, 'Asia/Bangkok', 'dd/MM/yyyy');
  const timeStr = Utilities.formatDate(now, 'Asia/Bangkok', 'HH:mm:ss');

  const lat = parseFloat(data.lat) || '';
  const lng = parseFloat(data.lng) || '';
  const mapsLink = (lat && lng)
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : '';

  const row = [
    seq,
    sanitize(data.id),
    sanitize(data.name),
    sanitize(data.level),
    sanitize(data.room),
    sanitize(data.phone),
    sanitize(data.subdistrict),
    sanitize(data.district),
    sanitize(data.province),
    sanitize(data.note),
    lat,
    lng,
    mapsLink,
    dateStr,
    timeStr,
  ];

  sheet.appendRow(row);

  // ถ้ามี Maps Link ให้ทำเป็น Hyperlink
  if (mapsLink) {
    const newRow  = sheet.getLastRow();
    const linkCol = HEADERS.indexOf('Google Maps Link') + 1;
    sheet.getRange(newRow, linkCol).setFormula(
      `=HYPERLINK("${mapsLink}","📍 เปิดแผนที่")`
    );
  }

  // จัดรูปแบบแถวที่เพิ่งบันทึก
  formatLastRow(sheet);

  return {
    status  : 'success',
    message : 'บันทึกข้อมูลสำเร็จ',
    row     : sheet.getLastRow(),
    seq     : seq,
    date    : dateStr,
    time    : timeStr,
  };
}

// ============================================================
//  getAllRecords — อ่านข้อมูลทั้งหมดจาก Sheet (JSON)
// ============================================================
function getAllRecords() {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { status: 'success', data: [] };

  const range  = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
  const values = range.getValues();

  const data = values.map((row, i) => ({
    rowIndex     : i + 2,
    seq          : row[0],
    id           : row[1],
    name         : row[2],
    level        : row[3],
    room         : row[4],
    phone        : row[5],
    subdistrict  : row[6],
    district     : row[7],
    province     : row[8],
    note         : row[9],
    lat          : row[10],
    lng          : row[11],
    mapsLink     : row[12],
    date         : row[13],
    time         : row[14],
  }));

  return { status: 'success', data };
}

// ============================================================
//  deleteRecord — ลบแถวตาม rowIndex (1-based)
// ============================================================

function deleteRecord(stdId) {

  const sheet = getOrCreateSheet();

  const data = sheet.getDataRange().getDisplayValues();

  const rowIndex = data.findIndex(row =>
    String(row[1]) === String(stdId)
  );

  if (rowIndex !== -1) {

    sheet.deleteRow(rowIndex + 1);

    return {
      status: 'success',
      message: `ลบข้อมูล ${stdId} แล้ว`
    };
  }

  return {
    status: 'error',
    message: `ไม่พบข้อมูล ${stdId}`
  };
}

// ==============================
// GET PASSWORD
// ==============================
function getDeletePassword() {

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('config');

  // cell A2 เก็บรหัส
  const password =
    sheet.getRange('A2').getDisplayValue();

  return {
        status: 'success',
        password: hashPassword(password)
      }
}

function hashPassword(password) {

  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password
  );

  const hash = rawHash.map(function(b) {

    const v = (b < 0 ? b + 256 : b)
      .toString(16);

    return v.padStart(2, '0');

  }).join('');

  return hash;
}

// ============================================================
//  getOrCreateSheet — ดึง Sheet หรือสร้างใหม่พร้อม Header
// ============================================================
function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupHeader(sheet);
  } else if (sheet.getLastRow() === 0) {
    setupHeader(sheet);
  }

  return sheet;
}

// ============================================================
//  setupHeader — สร้างและจัดรูปแบบแถว Header
// ============================================================
function setupHeader(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);

  // สไตล์ Header
  headerRange
    .setBackground('#1a56db')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.setRowHeight(1, 36);

  // กำหนดความกว้างคอลัมน์
  const colWidths = [50, 90, 160, 70, 70, 120, 120, 120, 100, 220, 90, 90, 110, 90, 80];
  colWidths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  // แช่แข็งแถว Header
  sheet.setFrozenRows(1);

  // Auto filter
  sheet.getRange(1, 1, 1, HEADERS.length).createFilter();
}

// ============================================================
//  formatLastRow — จัดรูปแบบแถวข้อมูลล่าสุด
// ============================================================
function formatLastRow(sheet) {
  const lastRow   = sheet.getLastRow();
  const range     = sheet.getRange(lastRow, 1, 1, HEADERS.length);
  const isEven    = (lastRow % 2 === 0);

  range
    .setBackground(isEven ? '#f0f4ff' : '#ffffff')
    .setFontSize(10)
    .setVerticalAlignment('middle');

  sheet.setRowHeight(lastRow, 28);

  // คอลัมน์ลำดับ — จัดกลาง
  sheet.getRange(lastRow, 1).setHorizontalAlignment('center');
  // คอลัมน์ชั้น/ห้อง — จัดกลาง
  sheet.getRange(lastRow, 4).setHorizontalAlignment('center');
  sheet.getRange(lastRow, 5).setHorizontalAlignment('center');
  // คอลัมน์พิกัด — จัดกลาง
  sheet.getRange(lastRow, 11).setHorizontalAlignment('center');
  sheet.getRange(lastRow, 12).setHorizontalAlignment('center');
}

// ============================================================
//  jsonResponse — ส่ง JSON กลับพร้อม CORS header
// ============================================================
function jsonResponse(obj) {
  const output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ============================================================
//  sanitize — ป้องกัน injection เบื้องต้น
// ============================================================
function sanitize(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  // ป้องกัน formula injection
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')  || str.startsWith('0')) {
    return "'" + str;
  }
  return str;
}

// ============================================================
//  testSave — ทดสอบบันทึกข้อมูลตัวอย่าง (รันใน Editor ได้เลย)
// ============================================================
function testSave() {
  const testData = {
    id          : '65001',
    name        : 'ทดสอบ ระบบ',
    level       : 'ม.1',
    room        : '1',
    phone       : '0812345678',
    subdistrict : 'ตำบลสุเทพ',
    district    : 'อำเภอเมือง',
    province    : 'เชียงใหม่',
    note        : 'ทดสอบบันทึกข้อมูล',
    lat         : 18.796143,
    lng         : 98.979263,
    action      : 'save',
  };
  const result = saveRecord(testData);
  Logger.log(JSON.stringify(result, null, 2));
}

// ============================================================
//  testGetAll — ทดสอบอ่านข้อมูลทั้งหมด
// ============================================================
function testGetAll() {
  const result = getAllRecords();
  Logger.log(JSON.stringify(result, null, 2));
}
