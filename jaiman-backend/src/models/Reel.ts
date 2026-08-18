import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReel extends Document {
  creator: mongoose.Types.ObjectId;
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  language: string;
  level: string;
  tags: string[];
  duration: number;
  likes: number;
  views: number;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

const reelSchema = new mongoose.Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  language: { type: String, required: true },
  level: { type: String, required: true },
  tags: [{ type: String }],
  duration: { type: Number, required: true },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  quiz: {
    question: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: Number }
  }
}, {
  timestamps: true
});

const Reel: Model<IReel> = mongoose.model<IReel>('Reel', reelSchema);
export default Reel;
