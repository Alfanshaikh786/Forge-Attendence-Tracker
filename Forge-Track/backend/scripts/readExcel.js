import XLSX from 'xlsx';
import path from 'path';

const filePath = "d:/ForgeTrack-main/Forge-Track/Data Engineering and AI - Actual Program.xlsx";

function readExcel() {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    console.log('--- HEADERS ---');
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
    console.log('--- END ---');
  } catch (error) {
    console.error('Error reading Excel:', error);
  }
}

readExcel();
