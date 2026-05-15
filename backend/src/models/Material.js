import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

export const Material = mongoose.model('Material', materialSchema);
