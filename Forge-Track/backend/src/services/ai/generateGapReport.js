/**
 * Deterministic gap report generator — no AI needed.
 * Compares the normalized attendance rows against the DB state to surface:
 *   1. Students in the DB who are absent from the upload
 *   2. Sessions (dates) in the DB not covered by the upload
 *   3. Students in the upload not found in the DB (unknown students)
 */

/**
 * @param {object[]} normalizedRows   - [{ usn, date, status }]
 * @param {object[]} dbStudents       - [{ usn, fullName }]
 * @param {object[]} dbSessions       - [{ date: ISOString, topic }]
 * @returns {GapReport}
 */
export function generateGapReport(normalizedRows, dbStudents, dbSessions) {
  // Build sets for quick lookup
  const uploadedUsns = new Set(normalizedRows.map(r => String(r.usn).trim().toUpperCase()));
  const uploadedDates = new Set(normalizedRows.map(r => r.date)); // YYYY-MM-DD strings

  const dbUsnSet = new Set(dbStudents.map(s => String(s.usn).trim().toUpperCase()));
  const dbDateSet = new Set(
    dbSessions.map(s => {
      const d = new Date(s.date);
      return d.toISOString().split('T')[0];
    })
  );

  // Students in DB but NOT in the upload
  const missingStudents = dbStudents
    .filter(s => !uploadedUsns.has(String(s.usn).trim().toUpperCase()))
    .map(s => ({ usn: s.usn, fullName: s.fullName }));

  // Sessions in DB but NOT covered by the upload
  const uncoveredSessions = dbSessions
    .filter(s => {
      const dateStr = new Date(s.date).toISOString().split('T')[0];
      return !uploadedDates.has(dateStr);
    })
    .map(s => ({
      date: new Date(s.date).toISOString().split('T')[0],
      topic: s.topic,
    }));

  // Students in upload but NOT in DB (will be skipped on commit)
  const unknownStudents = [...uploadedUsns]
    .filter(usn => !dbUsnSet.has(usn))
    .map(usn => ({ usn }));

  // Per-student per-date coverage: students missing attendance for specific dates
  const perStudentGaps = [];
  for (const student of dbStudents) {
    const usn = String(student.usn).trim().toUpperCase();
    for (const dateStr of uploadedDates) {
      const hasRecord = normalizedRows.some(
        r => String(r.usn).trim().toUpperCase() === usn && r.date === dateStr
      );
      if (!hasRecord) {
        perStudentGaps.push({ usn, fullName: student.fullName, date: dateStr });
      }
    }
  }

  const summary = [
    `${missingStudents.length} student(s) in the database have no rows in this upload.`,
    `${uncoveredSessions.length} session date(s) in the database are not covered by this upload.`,
    `${unknownStudents.length} student USN(s) in the upload are not registered in the database — they will be skipped.`,
  ].join(' ');

  return {
    missingStudents,
    uncoveredSessions,
    unknownStudents,
    perStudentGaps,
    summary,
    hasGaps: missingStudents.length > 0 || uncoveredSessions.length > 0 || unknownStudents.length > 0,
  };
}
