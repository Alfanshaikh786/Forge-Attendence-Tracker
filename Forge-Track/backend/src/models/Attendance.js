import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
    markedAt: { type: Date, default: Date.now },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    importLabel: { type: String, default: null, trim: true },
    importBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportBatch', default: null },
  },
  { timestamps: true }
);

// Unique constraint: one attendance record per student per session
attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });
// Index for efficient queries by session
attendanceSchema.index({ sessionId: 1 });
// Index for efficient queries by student
attendanceSchema.index({ studentId: 1 });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
