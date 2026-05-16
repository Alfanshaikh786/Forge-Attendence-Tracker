import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Database, RotateCcw, AlertTriangle, Loader2, History } from 'lucide-react';
import { getImportBatches, rollbackBatch } from '../../lib/importApi';
import toast from 'react-hot-toast';

function StatusPillBadge({ status }) {
  const map = {
    committed:    { label: 'Committed',    color: 'text-success',  bg: 'bg-success/10',  border: 'border-success/30' },
    dry_run:      { label: 'Draft',        color: 'text-warning',  bg: 'bg-warning/10',  border: 'border-warning/30' },
    rolled_back:  { label: 'Rolled Back',  color: 'text-fg-tertiary', bg: 'bg-surface-raised', border: 'border-border-default' },
    failed:       { label: 'Failed',       color: 'text-danger',   bg: 'bg-danger/10',   border: 'border-danger/30' },
  };
  const cfg = map[status] || map.failed;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

/**
 * ImportHistory — paginated list of all past import batches with rollback action.
 */
export default function ImportHistory({ onClose }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolling, setRolling] = useState(null); // batchId being rolled back
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  async function load(p = 1) {
    setLoading(true);
    try {
      const data = await getImportBatches(p, LIMIT);
      setBatches(data.batches || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load import history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(page); }, [page]);

  async function handleRollback(batch) {
    if (!confirm(`Roll back "${batch.filename}"? This will delete ${batch.commitSummary?.written ?? '?'} attendance records created by this import.`)) return;
    setRolling(batch._id);
    try {
      const result = await rollbackBatch(batch._id);
      toast.success(`Rolled back: ${result.deletedAttendance} records removed`);
      load(page);
    } catch (err) {
      toast.error('Rollback failed: ' + err.message);
    } finally {
      setRolling(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-fg-primary flex items-center gap-2">
          <History size={18} className="text-accent" />
          Import History
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-xs text-fg-tertiary hover:text-fg-secondary transition-colors">
            ✕ Close
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-fg-tertiary">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading…
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-12 text-fg-tertiary text-sm">
          <Database size={32} className="mx-auto mb-3 opacity-30" />
          No import history yet.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {batches.map(batch => (
              <div
                key={batch._id}
                className="flex items-center justify-between p-4 bg-surface-inset border border-border-default rounded-xl gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-fg-primary truncate">{batch.filename}</p>
                    <StatusPillBadge status={batch.status} />
                  </div>
                  <p className="text-xs text-fg-tertiary">
                    {new Date(batch.uploadedAt).toLocaleString()} ·{' '}
                    Sheets: {batch.sheetsProcessed?.join(', ')} ·{' '}
                    Written: {batch.commitSummary?.written ?? 0} ·{' '}
                    Skipped: {batch.commitSummary?.skipped ?? 0}
                  </p>
                </div>
                {batch.status === 'committed' && (
                  <button
                    onClick={() => handleRollback(batch)}
                    disabled={rolling === batch._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-danger border border-danger/30 rounded-lg hover:bg-danger/10 transition-all disabled:opacity-50"
                    title="Roll back this import"
                  >
                    {rolling === batch._id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <RotateCcw size={13} />
                    }
                    Rollback
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex items-center justify-between text-xs text-fg-tertiary pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-border-default hover:bg-surface-raised disabled:opacity-30 transition-all"
              >
                ← Prev
              </button>
              <span>Page {page} of {Math.ceil(total / LIMIT)}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / LIMIT)}
                className="px-3 py-1.5 rounded-lg border border-border-default hover:bg-surface-raised disabled:opacity-30 transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
