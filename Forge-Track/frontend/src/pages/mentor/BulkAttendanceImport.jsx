import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet, Bot, Eye, CheckCircle2,
  Upload, Loader2, RotateCcw, History, X,
  AlertTriangle, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

import FileDropZone     from '../../components/import/FileDropZone';
import SheetPicker      from '../../components/import/SheetPicker';
import MappingReview    from '../../components/import/MappingReview';
import DateClarification from '../../components/import/DateClarification';
import DryRunPreview    from '../../components/import/DryRunPreview';
import ImportHistory    from '../../components/import/ImportHistory';
import { analyzeSheets, dryRun, commitImport } from '../../lib/importApi';

// ─── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'Upload'   , icon: Upload         },
  { num: 2, label: 'Sheets'   , icon: FileSpreadsheet },
  { num: 3, label: 'AI Map'   , icon: Bot             },
  { num: 4, label: 'Preview'  , icon: Eye             },
  { num: 5, label: 'Done'     , icon: CheckCircle2    },
];

// ─── Stepper UI ────────────────────────────────────────────────────────────────
function Stepper({ current }) {
  return (
    <div className="flex items-center w-full max-w-2xl mx-auto mb-8 select-none">
      {STEPS.map((s, idx) => {
        const done    = current > s.num;
        const active  = current === s.num;
        const Icon    = s.icon;
        return (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                done   ? 'bg-accent border-accent text-white'           :
                active ? 'border-accent bg-accent/15 text-accent'      :
                         'border-border-default bg-surface-inset text-fg-tertiary'
              }`}>
                {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest hidden md:block transition-colors ${
                active ? 'text-accent' : done ? 'text-fg-secondary' : 'text-fg-tertiary'
              }`}>{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 transition-colors duration-500 ${
                current > s.num ? 'bg-accent' : 'bg-border-subtle'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Section card wrapper ──────────────────────────────────────────────────────
function StepCard({ title, subtitle, children }) {
  return (
    <div className="bg-surface-raised border border-border-subtle rounded-2xl p-6 md:p-8">
      {(title || subtitle) && (
        <div className="mb-6">
          {title    && <h3 className="text-lg font-bold text-fg-primary">{title}</h3>}
          {subtitle && <p className="text-sm text-fg-tertiary mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function BulkAttendanceImport() {
  // ── Wizard state ──
  const [step, setStep]   = useState(1);
  const [busy, setBusy]   = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ── File / sheet state ──
  const [filename, setFilename]       = useState('');
  const [fileType, setFileType]       = useState('xlsx');
  const [allSheets, setAllSheets]     = useState([]);   // [{ name, data, rowCount }]
  const [selectedNames, setSelectedNames] = useState([]);

  // ── AI analysis state ──
  const [analyses, setAnalyses]       = useState([]);   // [{ sheetName, analysis }]

  // ── Mapping overrides from user ──
  // userMapping[sheetName] = { studentIdentifier: string }
  const [userMapping, setUserMapping] = useState({});
  // dateOverrides[sheetName][columnName] = 'YYYY-MM-DD'
  const [dateOverrides, setDateOverrides] = useState({});

  // ── Dry-run result ──
  const [dryRunResult, setDryRunResult] = useState(null);
  const [conflictResolution, setConflictResolution] = useState('skip');

  // ── Commit result ──
  const [commitResult, setCommitResult] = useState(null);

  // ─── Derived ───────────────────────────────────────────────────────────────
  const selectedSheets = useMemo(
    () => allSheets.filter(s => selectedNames.includes(s.name)),
    [allSheets, selectedNames]
  );

  // How many session columns across all selected sheets still have no date?
  const undatedColumns = useMemo(() => {
    const out = [];
    for (const { sheetName, analysis } of analyses) {
      if (!selectedNames.includes(sheetName)) continue;
      for (const sc of analysis?.sessionColumns ?? []) {
        const resolved = dateOverrides?.[sheetName]?.[sc.columnName] || sc.inferredDate;
        if (!resolved) out.push({ sheetName, columnName: sc.columnName });
      }
    }
    return out;
  }, [analyses, selectedNames, dateOverrides]);

  const hasUndated = undatedColumns.length > 0;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  // Step 1 → 2: file parsed
  function handleSheetsParsed(sheets, fname, ftype) {
    setAllSheets(sheets);
    setFilename(fname);
    setFileType(ftype);
    setSelectedNames(sheets.map(s => s.name)); // default: select all
    setStep(2);
  }

  // Step 2 → 3: run AI analysis
  async function handleAnalyze() {
    if (!selectedNames.length) { toast.error('Select at least one sheet'); return; }
    setBusy(true);
    try {
      const snippets = selectedSheets.map(s => ({
        sheetName: s.name,
        rows: s.data.slice(0, 10),
      }));
      const result = await analyzeSheets(snippets);
      setAnalyses(result.analyses || []);

      // Seed userMapping with best-guess student identifier per sheet
      const initMapping = {};
      for (const { sheetName, analysis } of (result.analyses || [])) {
        const best = (analysis.studentIdentifiers || []).find(c => c.dbField === 'usn')
          ?? (analysis.studentIdentifiers || [])[0];
        initMapping[sheetName] = { studentIdentifier: best?.columnName || '' };
      }
      setUserMapping(initMapping);
      setStep(3);
    } catch (err) {
      toast.error('AI analysis failed: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  // Mapping review callbacks
  function handleMappingChange(sheetName, newMapping) {
    setUserMapping(m => ({ ...m, [sheetName]: newMapping }));
  }
  function handleDateOverride(sheetName, colName, date) {
    setDateOverrides(d => ({
      ...d,
      [sheetName]: { ...(d[sheetName] || {}), [colName]: date },
    }));
  }

  // Step 3 → 4: run dry-run
  async function handleDryRun() {
    // Validate: every sheet must have a student identifier
    for (const { sheetName } of analyses) {
      if (!userMapping[sheetName]?.studentIdentifier) {
        toast.error(`Select a student identifier for sheet "${sheetName}"`);
        return;
      }
    }
    setBusy(true);
    try {
      // Build payload
      const sheetsPayload = selectedSheets.map(sheet => {
        const analysis = analyses.find(a => a.sheetName === sheet.name)?.analysis;
        const mapping  = userMapping[sheet.name] || {};

        const sessionCols = (analysis?.sessionColumns || []).map(sc => ({
          columnName: sc.columnName,
          date: dateOverrides?.[sheet.name]?.[sc.columnName] || sc.inferredDate || null,
        }));

        return {
          sheetName: sheet.name,
          rows: sheet.data,
          mapping: {
            studentIdentifier: mapping.studentIdentifier,
            sessionColumns: sessionCols,
            presentValues: analysis?.presentValues || ['TRUE', 'true', '1', 'P', 'Yes', true, 1],
            absentValues:  analysis?.absentValues  || ['FALSE', 'false', '0', 'A', 'No', false, 0, ''],
          },
        };
      });

      // Flatten AI mapping entries for audit log
      const aiMapping = analyses.flatMap(({ sheetName, analysis }) => [
        ...(analysis.studentIdentifiers || []).map(c => ({
          sheetName, columnName: c.columnName, dbField: c.dbField,
          confidence: c.confidence, reasoning: c.reasoning,
          overriddenByUser: userMapping[sheetName]?.studentIdentifier !== c.columnName,
        })),
        ...(analysis.sessionColumns || []).map(c => ({
          sheetName, columnName: c.columnName, dbField: 'sessionDate',
          confidence: c.confidence, reasoning: c.reasoning,
          overriddenByUser: !!(dateOverrides?.[sheetName]?.[c.columnName]),
        })),
      ]);

      const result = await dryRun({ filename, fileType, sheets: sheetsPayload, aiMapping });
      setDryRunResult(result);
      setStep(4);
    } catch (err) {
      toast.error('Dry run failed: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  // Step 4 → 5: commit
  async function handleCommit() {
    if (!dryRunResult?.batchDraftId) {
      toast.error('No dry-run batch found. Please run the preview again.');
      return;
    }
    setBusy(true);
    try {
      const result = await commitImport(
        dryRunResult.batchDraftId,
        dryRunResult.normalizedRows,
        conflictResolution
      );
      setCommitResult(result);
      setStep(5);
      toast.success(`Import complete — ${result.written} records written`);
    } catch (err) {
      toast.error('Commit failed: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  // Reset everything
  function handleReset() {
    setStep(1);
    setFilename('');
    setFileType('xlsx');
    setAllSheets([]);
    setSelectedNames([]);
    setAnalyses([]);
    setUserMapping({});
    setDateOverrides({});
    setDryRunResult(null);
    setCommitResult(null);
    setConflictResolution('skip');
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-4xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-4xl font-bold text-fg-primary tracking-tight">
            Bulk Attendance <span className="text-accent">Import</span>
          </h2>
          <p className="text-fg-tertiary mt-2 max-w-xl text-sm">
            Upload any .xlsx or .csv attendance sheet. The AI maps columns, infers dates,
            detects conflicts, and previews everything before writing a single record.
          </p>
        </div>
        <button
          onClick={() => setShowHistory(h => !h)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-fg-secondary border border-border-default rounded-xl hover:border-accent/50 hover:text-accent transition-all"
        >
          <History size={14} />
          History
        </button>
      </div>

      {/* Import History slide-down */}
      {showHistory && (
        <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
          <ImportHistory onClose={() => setShowHistory(false)} />
        </div>
      )}

      {/* Stepper */}
      <Stepper current={step} />

      {/* ── Step 1: File Upload ──────────────────────────────────────── */}
      {step === 1 && (
        <StepCard>
          <FileDropZone onSheetsParsed={handleSheetsParsed} />
        </StepCard>
      )}

      {/* ── Step 2: Sheet Selection ──────────────────────────────────── */}
      {step === 2 && (
        <StepCard
          title="Select Sheets to Import"
          subtitle={`File: ${filename} · ${allSheets.length} non-empty sheet${allSheets.length !== 1 ? 's' : ''} found`}
        >
          <SheetPicker
            sheets={allSheets}
            selected={selectedNames}
            onChange={setSelectedNames}
          />
          <div className="flex justify-between mt-8 pt-5 border-t border-border-subtle">
            <button onClick={handleReset} className="flex items-center gap-2 text-sm text-fg-tertiary hover:text-fg-secondary transition-colors">
              <X size={16} /> Start over
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!selectedNames.length || busy}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
              {busy ? 'Analysing…' : 'Analyse with AI'}
            </button>
          </div>
        </StepCard>
      )}

      {/* ── Step 3: AI Mapping Review (+ Date Clarification) ─────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <StepCard
            title="AI Field Mapping"
            subtitle="Review how the AI mapped each column. Override anything below high-confidence or with a missing date."
          >
            <MappingReview
              analyses={analyses}
              userMapping={userMapping}
              onMappingChange={handleMappingChange}
              dateOverrides={dateOverrides}
              onDateOverride={handleDateOverride}
            />
          </StepCard>

          {/* Date clarification panel — shown only when columns are undated */}
          {hasUndated && (
            <StepCard
              title="Date Clarification Required"
              subtitle={`${undatedColumns.length} session column${undatedColumns.length > 1 ? 's' : ''} could not be dated automatically.`}
            >
              {undatedColumns.map(({ sheetName, columnName }) => {
                const analysis  = analyses.find(a => a.sheetName === sheetName)?.analysis;
                const anchors   = (analysis?.sessionColumns || [])
                  .filter(sc => sc.inferredDate || dateOverrides?.[sheetName]?.[sc.columnName])
                  .map(sc => ({
                    date:  dateOverrides?.[sheetName]?.[sc.columnName] || sc.inferredDate,
                    label: sc.columnName,
                  }));
                return (
                  <div key={`${sheetName}/${columnName}`} className="mb-4 last:mb-0">
                    <p className="text-xs font-bold text-fg-tertiary uppercase tracking-widest mb-2">
                      Sheet: {sheetName}
                    </p>
                    <DateClarification
                      undatedColumns={[columnName]}
                      anchorSessions={anchors}
                      initial={dateOverrides?.[sheetName] || {}}
                      onConfirm={(resolved) => {
                        for (const [col, date] of Object.entries(resolved)) {
                          handleDateOverride(sheetName, col, date);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </StepCard>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 text-sm text-fg-tertiary hover:text-fg-secondary transition-colors"
            >
              ← Back to sheets
            </button>
            <button
              onClick={handleDryRun}
              disabled={busy || hasUndated}
              title={hasUndated ? 'Resolve all undated columns first' : ''}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
              {busy ? 'Running preview…' : hasUndated ? `Fix ${undatedColumns.length} undated column${undatedColumns.length > 1 ? 's' : ''} first` : 'Run Dry-Run Preview'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Dry-Run Preview ────────────────────────────────────── */}
      {step === 4 && dryRunResult && (
        <div className="space-y-5">
          <StepCard
            title="Dry-Run Preview"
            subtitle="This is exactly what will be written to the database. Review carefully before confirming."
          >
            <DryRunPreview
              summary={dryRunResult.summary}
              conflicts={dryRunResult.conflicts}
              unknownStudents={dryRunResult.unknownStudents}
              gapReport={dryRunResult.gapReport}
              unmappedColumns={dryRunResult.unmappedColumns}
              conflictResolution={conflictResolution}
              onConflictResolutionChange={setConflictResolution}
            />
          </StepCard>

          {/* Warnings about unknown students */}
          {dryRunResult.unknownStudents?.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-warning/8 border border-warning/25 rounded-xl text-sm text-warning/90">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                {dryRunResult.unknownStudents.length} student(s) in the sheet are not registered in the database and will be skipped.
                Add them via <strong>Manage Students</strong> first if needed.
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="flex items-center gap-2 text-sm text-fg-tertiary hover:text-fg-secondary transition-colors">
              ← Back to mapping
            </button>
            <button
              onClick={handleCommit}
              disabled={busy || !dryRunResult.normalizedRows?.length}
              className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-bold text-sm hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xl shadow-accent/25"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {busy ? 'Committing…' : 'Confirm & Import'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Done ─────────────────────────────────────────────── */}
      {step === 5 && commitResult && (
        <StepCard>
          <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">
            <div className="w-24 h-24 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success">
              <CheckCircle2 size={48} strokeWidth={1.5} />
            </div>

            <div>
              <h3 className="text-2xl font-display font-bold text-fg-primary mb-2">Import Complete!</h3>
              <p className="text-fg-tertiary text-sm">All records have been saved to the database.</p>
            </div>

            {/* Result summary cards */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              {[
                { label: 'Written',    value: commitResult.written,    color: 'text-success' },
                { label: 'Overwritten', value: commitResult.overwritten, color: 'text-warning' },
                { label: 'Skipped',    value: commitResult.skipped,    color: 'text-fg-tertiary' },
              ].map(card => (
                <div key={card.label} className="bg-surface-inset border border-border-subtle rounded-xl p-4 text-center">
                  <p className={`text-2xl font-display font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-[10px] font-bold text-fg-tertiary uppercase tracking-widest mt-1">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {commitResult.warnings?.length > 0 && (
              <div className="w-full max-w-md text-left space-y-1 max-h-32 overflow-y-auto">
                <p className="text-xs font-bold text-fg-tertiary uppercase tracking-widest mb-2">Warnings ({commitResult.warnings.length})</p>
                {commitResult.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-warning italic">{w}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 border border-border-default text-fg-secondary rounded-xl font-semibold text-sm hover:border-accent/50 hover:text-accent transition-all"
              >
                <RotateCcw size={16} /> Import Another
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
              >
                <History size={16} /> View History
              </button>
            </div>
          </div>
        </StepCard>
      )}
    </div>
  );
}
