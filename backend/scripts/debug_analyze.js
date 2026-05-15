import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import { analyzeSheetStructure } from '../src/services/ai/analyzeSheetStructure.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    const samplePath = path.resolve(__dirname, '../../docs/Data Engineering and AI - Actual Program.xlsx');
    console.log('Reading', samplePath);
    const wb = xlsx.readFile(samplePath, { cellDates: true });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    // Mimic frontend parsing: detect header row if first row(s) are empty
    const raw = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const ID_KEYWORDS = /usn|email|name|roll|admission|id|sl|sno/i;
    let headerRowIndex = raw.findIndex(r => Array.isArray(r) && r.some(c => typeof c === 'string' && ID_KEYWORDS.test(c)));
    if (headerRowIndex === -1) headerRowIndex = 0;
    const headers = raw[headerRowIndex].map((h, i) => (h && String(h).trim()) || `__EMPTY_${i}`);
    const dataRows = raw.slice(headerRowIndex + 1);
    const rows = dataRows.map(row => {
      const obj = {};
      for (let i = 0; i < headers.length; i++) obj[headers[i]] = row[i] !== undefined ? row[i] : '';
      return obj;
    });
    const snippet = rows.slice(0, 10);
    console.log('Parsed rows:', snippet.length);
    console.log('Snippet preview:', JSON.stringify(snippet, null, 2));
    const analysis = await analyzeSheetStructure(sheetName, snippet);
    console.log('Analysis result:');
    console.dir(analysis, { depth: 5, colors: false });
  } catch (err) {
    console.error('Debug run failed:', err);
    process.exitCode = 2;
  }
}

run();
