import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const CONFIDENCE_CONFIG = {
  high:   { min: 0.90, color: 'text-success', bg: 'bg-success/10',  border: 'border-success/30',  label: 'High',   icon: CheckCircle2 },
  medium: { min: 0.75, color: 'text-warning', bg: 'bg-warning/10',  border: 'border-warning/30',  label: 'Review', icon: AlertTriangle },
  low:    { min: 0,    color: 'text-danger',  bg: 'bg-danger/10',   border: 'border-danger/30',   label: 'Low',    icon: XCircle },
};

function getConf(score) {
  if (score >= 0.90) return CONFIDENCE_CONFIG.high;
  if (score >= 0.75) return CONFIDENCE_CONFIG.medium;
  return CONFIDENCE_CONFIG.low;
}

function ConfidenceBadge({ score }) {
  const cfg = getConf(score);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
      <Icon size={10} />
      {cfg.label} ({Math.round(score * 100)}%)
    </span>
  );
}

function ReasoningTooltip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1 text-fg-tertiary hover:text-accent transition-colors"
        title="AI reasoning"
      >
        <Info size={13} />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-30 w-64 bg-surface-raised border border-border-default rounded-xl p-3 shadow-xl text-xs text-fg-secondary leading-relaxed">
          {text}
        </div>
      )}
    </div>
  );
}

/**
 * MappingReview — shows per-sheet AI analysis results.
 * Props:
 *   analyses: [{ sheetName, analysis: { studentIdentifiers, sessionColumns, overallConfidence, aiUsed } }]
 *   userMapping: { [sheetName]: { studentIdentifier, sessionColumns: [{ columnName, date }] } }
 *   onMappingChange: (sheetName, newMapping) => void
 *   dateOverrides: { [sheetName]: { [colName]: string } }
 *   onDateOverride: (sheetName, colName, date) => void
 */
export default function MappingReview({ analyses, userMapping, onMappingChange, dateOverrides, onDateOverride }) {
  const [expanded, setExpanded] = useState({});

  if (!analyses?.length) return null;

  return (
    <div className="space-y-5">
      {!analyses[0]?.analysis?.aiUsed && (
        <div className="flex items-start gap-3 p-3 bg-warning/8 border border-warning/25 rounded-xl text-sm text-warning/90">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>AI is unavailable — using heuristic field detection. Please verify all mappings carefully before proceeding.</span>
        </div>
      )}

      {analyses.map(({ sheetName, analysis }) => {
        const isExpanded = expanded[sheetName] !== false; // default open
        const mapping = userMapping?.[sheetName] || {};
        const overallConf = analysis?.overallConfidence ?? 0;
        const confCfg = getConf(overallConf);

        const studentIdCols = analysis?.studentIdentifiers ?? [];
        const sessionCols   = analysis?.sessionColumns ?? [];
        const ignoredCols   = analysis?.ignoredColumns ?? [];

        // Derive the best default student identifier
        const bestId = studentIdCols.find(c => c.dbField === 'usn') 
          ?? studentIdCols.find(c => c.dbField === 'email') 
          ?? studentIdCols[0];

        function handleIdChange(e) {
          onMappingChange(sheetName, { ...mapping, studentIdentifier: e.target.value });
        }

        function handleDateChange(colName, newDate) {
          onDateOverride(sheetName, colName, newDate);
        }

        // Build current sessionColumns from analysis + overrides
        const currentSessions = sessionCols.map(sc => ({
          columnName: sc.columnName,
          date: dateOverrides?.[sheetName]?.[sc.columnName] ?? sc.inferredDate ?? '',
          confidence: sc.confidence,
          needsUserDate: sc.needsUserDate,
          reasoning: sc.reasoning,
        }));

        const lowConfCount = [...studentIdCols, ...sessionCols].filter(c => c.confidence < 0.75).length;
        const undatedCount = sessionCols.filter(sc => !dateOverrides?.[sheetName]?.[sc.columnName] && !sc.inferredDate).length;

        return (
          <div key={sheetName} className="border border-border-default rounded-2xl overflow-hidden">
            {/* Sheet header */}
            <button
              className="w-full flex items-center justify-between px-5 py-4 bg-surface-inset hover:bg-surface-raised transition-colors text-left"
              onClick={() => setExpanded(e => ({ ...e, [sheetName]: !isExpanded }))}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-fg-primary">{sheetName}</span>
                <ConfidenceBadge score={overallConf} />
                {lowConfCount > 0 && (
                  <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full border border-warning/30">
                    {lowConfCount} needs review
                  </span>
                )}
                {undatedCount > 0 && (
                  <span className="text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full border border-danger/30">
                    {undatedCount} undated
                  </span>
                )}
              </div>
              {isExpanded ? <ChevronUp size={18} className="text-fg-tertiary" /> : <ChevronDown size={18} className="text-fg-tertiary" />}
            </button>

            {isExpanded && (
              <div className="p-5 space-y-6 border-t border-border-subtle">
                {/* Student identifier selector */}
                <div>
                  <p className="text-[10px] font-bold text-fg-tertiary uppercase tracking-widest mb-3">
                    Primary Student Identifier
                  </p>
                  <select
                    className="w-full max-w-xs bg-surface-inset border border-border-default rounded-lg px-3 py-2 text-sm text-fg-primary focus:border-accent outline-none transition-colors"
                    value={mapping.studentIdentifier || bestId?.columnName || ''}
                    onChange={handleIdChange}
                  >
                    <option value="">— Select identifier column —</option>
                    {studentIdCols.map(c => (
                      <option key={c.columnName} value={c.columnName}>
                        {c.columnName} → {c.dbField} ({Math.round(c.confidence * 100)}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Session column mappings */}
                <div>
                  <p className="text-[10px] font-bold text-fg-tertiary uppercase tracking-widest mb-3">
                    Session Columns ({sessionCols.length})
                  </p>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {currentSessions.map(sc => {
                      const cfg = getConf(sc.confidence);
                      return (
                        <div
                          key={sc.columnName}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}
                        >
                          <span className="font-mono text-xs text-fg-secondary w-40 truncate shrink-0">
                            {sc.columnName}
                          </span>
                          <ArrowRight size={12} className="text-fg-tertiary shrink-0" />
                          {sc.date ? (
                            <span className="text-xs text-success font-mono shrink-0">{sc.date}</span>
                          ) : (
                            <span className="text-xs text-danger font-semibold shrink-0 italic">needs date</span>
                          )}
                          <input
                            type="date"
                            className="ml-auto bg-surface border border-border-default rounded-lg px-2 py-1 text-xs text-fg-primary focus:border-accent outline-none"
                            value={dateOverrides?.[sheetName]?.[sc.columnName] || sc.inferredDate || ''}
                            onChange={e => handleDateChange(sc.columnName, e.target.value)}
                          />
                          <ConfidenceBadge score={sc.confidence} />
                          <ReasoningTooltip text={sc.reasoning || 'No reasoning available'} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ignored columns */}
                {ignoredCols.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-fg-tertiary uppercase tracking-widest mb-2">
                      Ignored Columns (scores, links, etc.)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ignoredCols.map(col => (
                        <span key={col} className="px-2 py-1 bg-surface-inset border border-border-subtle rounded text-xs font-mono text-fg-tertiary line-through">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
