import React, { useState } from 'react';
import { Calendar, Loader2, Lightbulb, CheckCircle2 } from 'lucide-react';
import { inferDates } from '../../lib/importApi';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * DateClarification — shown when session columns have no parseable date.
 * Props:
 *   undatedColumns: string[]         — column names without dates
 *   anchorSessions: { date, label }[] — known dated sessions from the same sheet
 *   onConfirm: (resolvedMap: { [colName]: string }) => void
 *   initial: { [colName]: string }   — any already-entered overrides
 */
export default function DateClarification({ undatedColumns, anchorSessions, onConfirm, initial = {} }) {
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [resolved, setResolved] = useState(initial);
  const [suggestions, setSuggestions] = useState(null); // AI suggestions
  const [loading, setLoading] = useState(false);

  if (!undatedColumns?.length) return null;

  function toggleDay(day) {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  async function handleInfer() {
    setLoading(true);
    try {
      const anchors = (anchorSessions || []).map(s => ({ date: s.date, label: s.label }));
      const result = await inferDates(undatedColumns, anchors, daysOfWeek);
      setSuggestions(result.suggestions || []);
      // Pre-populate resolved map with high-confidence suggestions
      const auto = {};
      for (const s of result.suggestions || []) {
        if (s.suggestedDate && s.confidence >= 0.8) {
          auto[s.columnName] = s.suggestedDate;
        }
      }
      setResolved(r => ({ ...r, ...auto }));
    } catch (err) {
      toast.error('AI inference failed — enter dates manually');
    } finally {
      setLoading(false);
    }
  }

  function handleManual(col, date) {
    setResolved(r => ({ ...r, [col]: date }));
  }

  const allResolved = undatedColumns.every(col => resolved[col]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-warning/8 border border-warning/25 rounded-xl">
        <Calendar size={18} className="text-warning mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-warning text-sm">Date Clarification Required</p>
          <p className="text-xs text-warning/80 mt-1">
            {undatedColumns.length} session column{undatedColumns.length > 1 ? 's have' : ' has'} no parseable date header.
            Select the days this class runs and click &quot;Ask AI&quot; to get suggestions, or enter dates manually.
          </p>
        </div>
      </div>

      {/* Day-of-week selector */}
      <div>
        <p className="text-xs font-bold text-fg-secondary uppercase tracking-widest mb-3">
          Class days (helps AI infer dates)
        </p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                daysOfWeek.includes(day)
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : 'bg-surface-inset text-fg-secondary border-border-default hover:border-accent/50'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* AI inference button */}
      <button
        onClick={handleInfer}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/40 text-accent rounded-xl text-sm font-semibold hover:bg-accent/20 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
        {loading ? 'Asking AI…' : 'Ask AI to infer dates'}
      </button>

      {/* Per-column resolution */}
      <div className="space-y-3">
        {undatedColumns.map(col => {
          const suggestion = suggestions?.find(s => s.columnName === col);
          const val = resolved[col] || '';

          return (
            <div key={col} className="p-4 bg-surface-inset border border-border-default rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-fg-primary">{col}</span>
                {val && <CheckCircle2 size={16} className="text-success" />}
              </div>

              {suggestion?.suggestedDate && (
                <div className="text-xs text-fg-tertiary bg-surface border border-border-subtle rounded-lg p-2 leading-relaxed">
                  <span className="font-semibold text-accent">AI suggests:</span>{' '}
                  <button
                    className="underline text-accent font-mono"
                    onClick={() => handleManual(col, suggestion.suggestedDate)}
                  >
                    {suggestion.suggestedDate}
                  </button>
                  {' '}({Math.round(suggestion.confidence * 100)}% confidence)
                  <br />
                  <span className="italic">{suggestion.reasoning}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="text-xs text-fg-tertiary shrink-0">Final date:</label>
                <input
                  type="date"
                  className="flex-1 bg-surface border border-border-default rounded-lg px-3 py-1.5 text-sm text-fg-primary focus:border-accent outline-none transition-colors"
                  value={val}
                  onChange={e => handleManual(col, e.target.value)}
                  required
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onConfirm(resolved)}
        disabled={!allResolved}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
      >
        {allResolved ? 'Confirm Dates & Continue' : `Enter all ${undatedColumns.filter(c => !resolved[c]).length} remaining dates`}
      </button>
    </div>
  );
}
