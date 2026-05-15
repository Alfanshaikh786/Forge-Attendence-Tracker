import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },
    unreadCounts: {
      type: Map,
      of: Number,
      default: new Map()
    }
  },
  { timestamps: true }
);

conversationSchema.index({ participantIds: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
