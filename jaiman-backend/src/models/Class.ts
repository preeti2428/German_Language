import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IClass extends Document {
  teacher: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: 'live' | 'vod';
  level: string;
  scheduledAt?: Date;
  videoUrl?: string;
  duration?: number;
  transcript?: string;
  notesUrl?: string;
  participants: mongoose.Types.ObjectId[];
  maxParticipants?: number;
  tags: string[];
}

const classSchema = new mongoose.Schema({
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['live', 'vod'], required: true },
  level: { type: String, required: true },
  scheduledAt: { type: Date },
  videoUrl: { type: String },
  duration: { type: Number },
  transcript: { type: String },
  notesUrl: { type: String },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  maxParticipants: { type: Number },
  tags: [{ type: String }]
}, {
  timestamps: true
});

const ClassModel: Model<IClass> = mongoose.model<IClass>('Class', classSchema);
export default ClassModel;
