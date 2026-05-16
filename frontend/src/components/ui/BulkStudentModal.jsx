import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import Button from './Button';
import { bulkImportStudents } from '../../lib/api';

export const BulkStudentModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data);
          setStep(2);
        },
      });
    } else if (['xlsx', 'xls'].includes(extension)) {
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        setPreview(jsonData);
        setStep(2);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Unsupported file format. Please use CSV or XLSX.');
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      // Map preview data to expected backend format
      const formattedData = preview.map(row => ({
        fullName: row.fullName || row['Full Name'] || row.name || row.Name,
        usn: row.usn || row.USN || row['Roll No'] || row.RollNo,
        email: row.email || row.Email || row['Email ID'],
        department: row.department || row.Department || row.Branch || row.branch,
        batchYear: row.batchYear || row['Batch Year'] || row.Batch || row.batch
      }));

      const result = await bulkImportStudents(formattedData);
      toast.success(`Imported ${result.imported} students! (${result.skipped} skipped/duplicates)`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#0a0a0f] border border-cyber-border rounded shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between bg-cyber-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyber-neon/10 rounded">
              <Upload size={18} className="text-cyber-neon" />
            </div>
            <div>
              <h3 className="text-lg font-mono font-bold text-cyber-neon tracking-tight uppercase">Bulk Identity Import</h3>
              <p className="text-[10px] font-mono text-cyber-text-secondary uppercase">Batch Enrollment Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-cyber-text-secondary hover:text-cyber-neon transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-cyber-border rounded-xl p-12 flex flex-col items-center justify-center group hover:border-cyber-neon/50 hover:bg-cyber-neon/5 transition-all cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-cyber-surface border border-cyber-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText size={32} className="text-cyber-text-secondary group-hover:text-cyber-neon transition-colors" />
              </div>
              <p className="text-cyber-text font-mono text-sm mb-1 uppercase tracking-wider">Drag & Drop or Click</p>
              <p className="text-cyber-text-secondary font-mono text-[10px] uppercase">Supports .xlsx, .xls, .csv</p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                accept=".csv, .xlsx, .xls"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-cyber-surface/30 p-3 rounded border border-cyber-border">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-cyber-neon" />
                  <span className="text-sm font-mono text-cyber-text">{file?.name}</span>
                </div>
                <button onClick={handleReset} className="text-[10px] font-mono text-cyber-neon hover:underline uppercase">Change File</button>
              </div>

              <div className="max-h-[300px] overflow-auto border border-cyber-border rounded bg-black/40">
                <table className="w-full text-left font-mono text-[10px]">
                  <thead className="bg-cyber-surface sticky top-0">
                    <tr>
                      <th className="p-2 text-cyber-neon border-b border-cyber-border">Name</th>
                      <th className="p-2 text-cyber-neon border-b border-cyber-border">USN</th>
                      <th className="p-2 text-cyber-neon border-b border-cyber-border">Email</th>
                      <th className="p-2 text-cyber-neon border-b border-cyber-border">Dept</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="border-b border-cyber-border/30 last:border-0">
                        <td className="p-2 text-cyber-text">{row.fullName || row['Full Name'] || row.name || row.Name || '---'}</td>
                        <td className="p-2 text-cyber-text-secondary">{row.usn || row.USN || row['Roll No'] || row.RollNo || '---'}</td>
                        <td className="p-2 text-cyber-text-secondary">{row.email || row.Email || row['Email ID'] || '---'}</td>
                        <td className="p-2 text-cyber-text-secondary">{row.department || row.Department || row.Branch || '---'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[9px] font-mono text-cyber-text-secondary italic">
                * Showing first 50 entries out of {preview.length}. Password will default to USN.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cyber-border bg-cyber-surface/30 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            CANCEL
          </Button>
          <Button 
            variant="primary" 
            onClick={handleImport} 
            disabled={loading || step === 1}
            className="min-w-[120px]"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'INITIALIZE'}
          </Button>
        </div>
      </div>
    </div>
  );
};
