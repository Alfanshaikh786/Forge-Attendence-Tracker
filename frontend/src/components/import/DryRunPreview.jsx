import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Users, Calendar, Columns, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * DryRunPreview — tabbed summary of the dry-run result before committing.
 * Props:
 *   summary: { totalRecords, matched, conflicts, gaps, unknownStudents, unmappedColumns }
 *   conflicts: [{ date, topic, existingCount }]
 *   unknownStudents: string[]
 *   gapReport: { missingStudents, uncoveredSessions, perStudentGaps, summary }
 *   unmappedColumns: string[]
 *   conflictResolution: 'skip' | 'overwrite'
 *   onConflictResolutionChange: (val) => void
 */
export default function DryRunPreview({
  summary,
  conflicts,
  unknownStudents,
  gapReport,
  unmappedColumns,
  conflictResolution,
  onConflictResolutionChange,
}) {
  const [tab, setTab] = useState('overview');

  const tabs = [
    { id: 'overview',   label: 'Overview',        icon: CheckCircle2 },
    { id: 'conflicts',  label: `Conflicts (${conflicts?.length ?? 0})`,  icon: AlertTriangle },
    { id: 'gaps',       label: `Gaps (${(gapReport?.missingStudents?.length ?? 0) + (gapReport?.uncoveredSessions?.length ?? 0)})`, icon: Users },
    { id: 'unmapped',   label: `Unmapped (${unmappedColumns?.length ?? 0})`, icon: Columns },
  ];

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Records',     value: summary?.totalRecords ?? 0, color: 'text-fg-primary' },
          { label: 'Matched Students',  value: summary?.matched ?? 0,      color: 'text-success' },
          { label: 'Conflicts',         value: summary?.conflicts ?? 0,    color: 'text-warning' },
          { label: 'Unknown Students',  value: summary?.unknownStudents ?? 0, color: 'text-danger' },
        ].map(card => (
          <div key={card.label} className="bg-surface-inset border border-border-subtle rounded-xl p-4 text-center">
            <p className={`text-3xl font-display font-bold ${card.color}`}>{card.value}</p>
            <p className="text-[10px] font-bold text-fg-tertiary uppercase tracking-widest mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-inset rounded-xl p-1">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold flex-1 justify-center transition-all duration-150 ${
                tab === t.id
                  ? 'bg-surface text-fg-primary shadow-sm'
                  : 'text-fg-tertiary hover:text-fg-secondary'
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[180px]">
        {tab === 'overview' && (
          <div className="space-y-3 text-sm text-fg-secondary">
            <p className="text-success flex items-center gap-2">
              <CheckCircle2 size={16} />
              {summary?.matched ?? 0} records will be written for known students.
            </p>
            {(summary?.conflicts ?? 0) > 0 && (
              <p className="text-warning flex items-center gap-2">
                <AlertTriangle size={16} />
                {summary.conflicts} sessions already have attendance data. See the Conflicts tab.
              </p>
            )}
            {(summary?.unknownStudents ?? 0) > 0 && (
              <p className="text-danger flex items-center gap-2">
                <Users size={16} />
                {summary.unknownStudents} student USN(s) not found in the database — they will be skipped.
              </p>
            )}
            {(unmappedColumns?.length ?? 0) > 0 && (
              <p className="text-fg-tertiary flex items-center gap-2">
                <Columns size={16} />
                {unmappedColumns.length} column(s) could not be mapped to any date — they will be ignored.
              </p>
            )}
            {gapReport?.summary && (
              <p className="text-fg-tertiary italic text-xs mt-2 border-t border-border-subtle pt-3">
                {gapReport.summary}
              </p>
            )}
          </div>
        )}

        {tab === 'conflicts' && (
          <div className="space-y-3">
            {!conflicts?.length ? (
              <p className="text-sm text-success flex items-center gap-2">
                <CheckCircle2 size={16} /> No conflicts detected.
              </p>
            ) : (
              <>
                <div className="flex items-start gap-3 p-3 bg-warning/8 border border-warning/25 rounded-xl text-sm text-warning/90 mb-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>These session dates already have attendance records. Choose how to handle them:</span>
                </div>
                <div className="flex gap-3 mb-4">
                  {[
                    { val: 'skip',      label: 'Skip duplicates', desc: 'Keep existing records' },
                    { val: 'overwrite', label: 'Overwrite',       desc: 'Replace with uploaded data' },
                  ].map(opt => (
                    <label key={opt.val} className={`flex-1 flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      conflictResolution === opt.val
                        ? 'border-accent bg-accent/8'
                        : 'border-border-default hover:border-accent/50'
                    }`}>
                      <input
                        type="radio"
                        name="conflictRes"
                        value={opt.val}
                        checked={conflictResolution === opt.val}
                        onChange={() => onConflictResolutionChange(opt.val)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-semibold text-fg-primary">{opt.label}</p>
                        <p className="text-xs text-fg-tertiary">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {conflicts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-surface-inset border border-warning/20 rounded-xl text-xs">
                      <span className="font-mono text-warning">{c.date}</span>
                      <span className="text-fg-secondary truncate mx-3">{c.topic}</span>
                      <span className="font-bold text-fg-tertiary shrink-0">{c.existingCount} existing</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'gaps' && (
          <div className="space-y-4">
            {!gapReport?.hasGaps ? (
              <p className="text-sm text-success flex items-center gap-2">
                <CheckCircle2 size={16} /> No gaps detected — all students and sessions are covered.
              </p>
            ) : (
              <>
                {gapReport.missingStudents?.length > 0 && (
                  <Section title={`Students missing from upload (${gapReport.missingStudents.length})`} icon={Users}>
                    {gapReport.missingStudents.map(s => (
                      <div key={s.usn} className="flex items-center justify-between text-xs px-3 py-2 bg-surface-inset rounded-lg">
                        <span className="font-mono text-fg-secondary">{s.usn}</span>
                        <span className="text-fg-tertiary">{s.fullName}</span>
                      </div>
                    ))}
                  </Section>
                )}
                {gapReport.uncoveredSessions?.length > 0 && (
                  <Section title={`DB sessions not covered (${gapReport.uncoveredSessions.length})`} icon={Calendar}>
                    {gapReport.uncoveredSessions.map(s => (
                      <div key={s.date} className="flex items-center justify-between text-xs px-3 py-2 bg-surface-inset rounded-lg">
                        <span className="font-mono text-fg-secondary">{s.date}</span>
                        <span className="text-fg-tertiary truncate ml-3">{s.topic}</span>
                      </div>
                    ))}
                  </Section>
                )}
                {gapReport.unknownStudents?.length > 0 && (
                  <Section title={`Unknown USNs (will be skipped) (${gapReport.unknownStudents.length})`} icon={Users} danger>
                    {gapReport.unknownStudents.map(s => (
                      <div key={s.usn} className="text-xs px-3 py-2 bg-surface-inset rounded-lg font-mono text-danger">
                        {s.usn}
                      </div>
                    ))}
                  </Section>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'unmapped' && (
          <div className="space-y-2">
            {!unmappedColumns?.length ? (
              <p className="text-sm text-success flex items-center gap-2">
                <CheckCircle2 size={16} /> All columns were successfully mapped.
              </p>
            ) : (
              <>
                <p className="text-xs text-fg-tertiary mb-3">
                  These columns could not be matched to a session date and will be ignored during import.
                </p>
                {unmappedColumns.map(col => (
                  <div key={col} className="px-3 py-2 bg-surface-inset border border-border-subtle rounded-lg text-xs font-mono text-fg-secondary">
                    {col}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, danger, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`border rounded-xl overflow-hidden ${danger ? 'border-danger/25' : 'border-border-default'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-inset text-left"
      >
        <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${danger ? 'text-danger' : 'text-fg-secondary'}`}>
          <Icon size={13} />{title}
        </span>
        {open ? <ChevronUp size={14} className="text-fg-tertiary" /> : <ChevronDown size={14} className="text-fg-tertiary" />}
      </button>
      {open && <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">{children}</div>}
    </div>
  );
}
