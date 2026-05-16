import { apiRequest } from './api.js';

const BASE = '/mentor/attendance-import';

/** Step 1 — Send sheet snippets to AI for field-mapping analysis */
export async function analyzeSheets(sheets) {
  // sheets: [{ sheetName, rows: object[] }]
  return apiRequest(`${BASE}/analyze`, {
    method: 'POST',
    body: JSON.stringify({ sheets }),
  });
}

/** Step 2 (optional) — Ask AI to infer dates for undated columns */
export async function inferDates(undatedColumns, anchorSessions, daysOfWeek) {
  return apiRequest(`${BASE}/infer-dates`, {
    method: 'POST',
    body: JSON.stringify({ undatedColumns, anchorSessions, daysOfWeek }),
  });
}

/** Step 3 — Dry-run: validate normalized data, get conflicts + gaps, create draft batch */
export async function dryRun(payload) {
  // payload: { filename, fileType, sheets, aiMapping }
  return apiRequest(`${BASE}/dry-run`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Step 4 — Commit the dry-run to the database */
export async function commitImport(batchDraftId, normalizedRows, conflictResolution = 'skip') {
  return apiRequest(`${BASE}/commit`, {
    method: 'POST',
    body: JSON.stringify({ batchDraftId, normalizedRows, conflictResolution }),
  });
}

/** Fetch paginated import history */
export async function getImportBatches(page = 1, limit = 20) {
  return apiRequest(`${BASE}/batches?page=${page}&limit=${limit}`);
}

/** Roll back a committed import batch */
export async function rollbackBatch(batchId) {
  return apiRequest(`${BASE}/rollback/${batchId}`, { method: 'POST' });
}
