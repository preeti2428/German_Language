import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISectionScore {
  sectionType: 'listening' | 'reading' | 'writing' | 'speaking';
  earned: number;
  total: number;
  writingFeedback?: string;  // AI feedback for writing sections
}

export interface ITestResult extends Document {
  userId: mongoose.Types.ObjectId;
  testPaperId: mongoose.Types.ObjectId;
  answers: Record<string, string | string[]>;  // questionNumber -> answer
  sectionScores: ISectionScore[];
  totalEarned: number;
  totalMarks: number;
  passed: boolean;
  timeTaken: number;   // minutes
  completedAt: Date;
}

const testResultSchema = new Schema<ITestResult>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  testPaperId: { type: Schema.Types.ObjectId, ref: 'TestPaper', required: true },
  answers: { type: Schema.Types.Mixed, default: {} },
  sectionScores: [{
    sectionType: { type: String, enum: ['listening', 'reading', 'writing', 'speaking'] },
    earned: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    writingFeedback: { type: String },
  }],
  totalEarned: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  timeTaken: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const TestResult: Model<ITestResult> = mongoose.model<ITestResult>('TestResult', testResultSchema);
export default TestResult;
