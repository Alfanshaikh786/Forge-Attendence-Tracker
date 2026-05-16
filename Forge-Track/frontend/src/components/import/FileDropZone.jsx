import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

/**
 * FileDropZone — accepts .csv and .xlsx/.xls files.
 * On successful parse calls onSheetsParsed([{ name, data: object[], rowCount }])
 * For a single-sheet CSV it skips directly to the sheet picker with one entry.
 */
export default function FileDropZone({ onSheetsParsed }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      toast.error('Unsupported format. Use .csv, .xlsx, or .xls');
      return;
    }
    setLoading(true);
    try {
      if (ext === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const sheets = [{ name: 'CSV Data', data: result.data, rowCount: result.data.length }];
            onSheetsParsed(sheets, file.name, 'csv');
            setLoading(false);
          },
          error: (err) => {
            toast.error('CSV parse error: ' + err.message);
            setLoading(false);
          },
        });
      } else {
        const buffer = await file.arrayBuffer();
        // cellDates converts Excel serial date numbers to JS Date objects
        const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
        const sheets = wb.SheetNames
          .map(name => {
            const ws = wb.Sheets[name];

            // Read raw rows (array of arrays) so we can detect the real header row
            const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

            // Heuristic: find a header row that contains common identifier keywords
            const ID_KEYWORDS = /usn|email|name|roll|admission|id|sl|sno/i;
            let headerRowIndex = raw.findIndex(r => Array.isArray(r) && r.some(c => typeof c === 'string' && ID_KEYWORDS.test(c)));

            // Fallback to first row if nothing found
            if (headerRowIndex === -1) headerRowIndex = 0;

            const headers = raw[headerRowIndex].map((h, i) => (h && String(h).trim()) || `__EMPTY_${i}`);

            const dataRows = raw.slice(headerRowIndex + 1);
            const data = dataRows.map(row => {
              const obj = {};
              for (let i = 0; i < headers.length; i++) {
                obj[headers[i]] = row[i] !== undefined ? row[i] : '';
              }
              return obj;
            });

            return { name, data, rowCount: data.length };
          })
          .filter(s => s.rowCount > 0);

        if (sheets.length === 0) {
          toast.error('No data found in the uploaded file');
          setLoading(false);
          return;
        }
        onSheetsParsed(sheets, file.name, ext);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to read file: ' + err.message);
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !loading && inputRef.current?.click()}
      className={clsx(
        'relative flex flex-col items-center justify-center min-h-[340px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group select-none',
        dragging
          ? 'border-accent bg-accent/10 scale-[1.01]'
          : 'border-border-default hover:border-accent/60 hover:bg-surface-raised/40'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />

      <div className={clsx(
        'w-24 h-24 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300',
        dragging ? 'bg-accent/20 text-accent scale-110' : 'bg-surface-inset text-fg-tertiary group-hover:text-accent group-hover:bg-accent/10'
      )}>
        {loading
          ? <Loader2 size={40} strokeWidth={1.5} className="animate-spin text-accent" />
          : dragging
            ? <FileSpreadsheet size={40} strokeWidth={1.5} />
            : <Upload size={40} strokeWidth={1.5} />
        }
      </div>

      <h3 className="text-xl font-bold text-fg-primary mb-2">
        {loading ? 'Parsing file…' : dragging ? 'Drop it!' : 'Drop your spreadsheet here'}
      </h3>
      <p className="text-sm text-fg-tertiary mb-6">
        {loading ? 'Extracting sheets and rows…' : 'or click to browse your files'}
      </p>

      <div className="flex items-center gap-3">
        {['.xlsx', '.xls', '.csv'].map(ext => (
          <span
            key={ext}
            className="px-2.5 py-1 bg-surface-raised border border-border-subtle rounded-lg text-xs font-mono text-fg-secondary"
          >
            {ext}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-fg-tertiary mt-6 uppercase tracking-widest font-semibold">
        Max 200 students × 60 sessions
      </p>
    </div>
  );
}
