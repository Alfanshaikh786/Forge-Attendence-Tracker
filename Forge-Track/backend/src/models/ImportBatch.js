import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const aiMappingEntrySchema = new mongoose.Schema({
  sheetName: String,
  columnName: String,
  dbField: String,
  confidence: Number,
  reasoning: String,
  overriddenByUser: { type: Boolean, default: false },
}, { _id: false });

const importBatchSchema = new mongoose.Schema(
  {
    batchId: { type: String, default: randomUUID, unique: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
    filename: { type: String, required: true },
    fileType: { type: String, enum: ['csv', 'xlsx', 'xls'], required: true },
    sheetsProcessed: [{ type: String }],
    status: {
      type: String,
      enum: ['dry_run', 'committed', 'rolled_back', 'failed'],
      default: 'dry_run',
    },

    // AI decisions made during analysis
    aiMapping: [aiMappingEntrySchema],

    // Summary produced during dry-run (before commit)
    dryRunSummary: {
      totalRecords: { type: Number, default: 0 },
      matched: { type: Number, default: 0 },
      conflicts: { type: Number, default: 0 },
      gaps: { type: Number, default: 0 },
      unknownStudents: { type: Number, default: 0 },
      unmappedColumns: [{ type: String }],
    },

    // Summary after commit
    commitSummary: {
      written: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      overwritten: { type: Number, default: 0 },
      warnings: [{ type: String }],
    },

    // IDs of records created — used for atomic rollback
    createdAttendanceIds: [{ type: mongoose.Schema.Types.ObjectId }],
    createdSessionIds: [{ type: mongoose.Schema.Types.ObjectId }],

    rollbackAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ImportBatch = mongoose.model('ImportBatch', importBatchSchema);
