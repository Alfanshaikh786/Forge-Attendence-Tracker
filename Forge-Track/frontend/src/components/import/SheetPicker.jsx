import React from 'react';
import { FileSpreadsheet, CheckSquare, Square } from 'lucide-react';

/**
 * SheetPicker — lists all non-empty sheets from the parsed workbook.
 * Lets the user select one or more sheets to send for AI analysis.
 */
export default function SheetPicker({ sheets, selected, onChange }) {
  function toggle(name) {
    if (selected.includes(name)) {
      onChange(selected.filter(n => n !== name));
    } else {
      onChange([...selected, name]);
    }
  }

  function toggleAll() {
    if (selected.length === sheets.length) {
      onChange([]);
    } else {
      onChange(sheets.map(s => s.name));
    }
  }

  const allSelected = selected.length === sheets.length && sheets.length > 0;

  return (
    <div className="space-y-4">
      {/* Select all toggle */}
      <button
        onClick={toggleAll}
        className="flex items-center gap-2 text-xs font-semibold text-fg-secondary hover:text-accent transition-colors"
      >
        {allSelected
          ? <CheckSquare size={16} className="text-accent" />
          : <Square size={16} />
        }
        {allSelected ? 'Deselect all' : 'Select all sheets'}
      </button>

      <div className="space-y-3">
        {sheets.map((sheet) => {
          const isSelected = selected.includes(sheet.name);
          return (
            <label
              key={sheet.name}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-accent bg-accent/8 shadow-[0_0_0_1px_var(--accent-primary)]'
                  : 'border-border-default bg-surface-inset hover:border-accent/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-accent/20 text-accent' : 'bg-surface text-fg-tertiary'
                }`}>
                  <FileSpreadsheet size={16} />
                </div>
                <div>
                  <p className="font-semibold text-fg-primary text-sm">{sheet.name}</p>
                  <p className="text-xs text-fg-tertiary">{sheet.rowCount} rows</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={isSelected}
                onChange={() => toggle(sheet.name)}
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                isSelected ? 'bg-accent border-accent' : 'border-border-default'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-warning/80 italic">
          Select at least one sheet to continue.
        </p>
      )}
    </div>
  );
}
