import mongoose from 'mongoose';

const importLogSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
    totalRows: { type: Number, required: true },
    importedRows: { type: Number, required: true },
    skippedRows: { type: Number, required: true },
    warnings: [{ type: String }],
    columnMapping: { type: mongoose.Schema.Types.Mixed }, // Stores the Gemini-detected mapping
    status: { type: String, enum: ['completed', 'partial', 'failed'], default: 'completed' },
  },
  { timestamps: true }
);

export const ImportLog = mongoose.model('ImportLog', importLogSchema);
