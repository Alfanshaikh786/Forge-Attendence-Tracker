import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    topic: { type: String, required: true, trim: true },
    monthNumber: { type: Number, required: true },
    durationHours: { type: Number, default: 2 },
    sessionType: { type: String, default: 'offline', trim: true },
    notes: { type: String, default: null, trim: true },
    startTime: { type: String, default: null, trim: true }, // Format: "HH:mm"
    endTime: { type: String, default: null, trim: true },   // Format: "HH:mm"
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    meetingLink: { type: String, default: null, trim: true },
    location: { type: String, default: null, trim: true },
    isActive: { type: Boolean, default: true },
    importBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportBatch', default: null },
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
