import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserProgress extends Document {
  userId: mongoose.Types.ObjectId;
  currentTier: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  completedStages: mongoose.Types.ObjectId[];
  unlockedStages: mongoose.Types.ObjectId[];
  stageProgress: {
    stageId: mongoose.Types.ObjectId;
    completedSessions: number[];
  }[];
  totalXp: number;
}

const userProgressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true
  },
  currentTier: { 
    type: String, 
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    default: 'A1'
  },
  completedStages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stage' }],
  unlockedStages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stage' }],
  stageProgress: [{
    stageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stage' },
    completedSessions: [{ type: Number }]
  }],
  totalXp: { type: Number, default: 0 }
}, { timestamps: true });

const UserProgress: Model<IUserProgress> = mongoose.model<IUserProgress>('UserProgress', userProgressSchema);
export default UserProgress;
