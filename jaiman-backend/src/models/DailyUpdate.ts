import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDailyUpdate extends Document {
  title: string;
  body: string;
  emoji?: string;
  type: 'announcement' | 'tip' | 'challenge' | 'event';
  author: mongoose.Types.ObjectId;
  pinned: boolean;
  publishedAt: Date;
}

const dailyUpdateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true },
    emoji: { type: String, default: '📢' },
    type: {
      type: String,
      enum: ['announcement', 'tip', 'challenge', 'event'],
      default: 'announcement',
    },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pinned: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const DailyUpdate: Model<IDailyUpdate> = mongoose.model<IDailyUpdate>('DailyUpdate', dailyUpdateSchema);
export default DailyUpdate;
