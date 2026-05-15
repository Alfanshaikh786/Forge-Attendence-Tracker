import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    usn: { type: String, required: true, unique: true, uppercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String, required: true, trim: true },
    phone: { type: String, default: null, trim: true },
    batchYear: { type: Number, required: true }, // e.g., 2024 or 2025
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for mentor queries
studentSchema.index({ mentorId: 1 });
studentSchema.index({ authUserId: 1 });

export const Student = mongoose.model('Student', studentSchema);
