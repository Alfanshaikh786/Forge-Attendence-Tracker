import XLSX from 'xlsx';
import path from 'path';

const filePath = 'd:/ForgeTrack-main/Data Engineering and AI - Actual Program.xlsx';

async function analyzeExcel() {
  try {
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);
    
    // Check Bootcamp Data sheet
    const sheetName = 'Bootcamp Data';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`\nAnalyzing "${sheetName}" (${data.length} rows)`);
    if (data.length > 0) {
      console.log('First 10 rows:');
      data.slice(0, 10).forEach((row, i) => {
        console.log(`Row ${i}:`, row);
      });
    }
  } catch (err) {
    console.error('Error reading Excel:', err);
  }
}

analyzeExcel();
