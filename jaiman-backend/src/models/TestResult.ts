import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IQuestionResult {
  questionNumber: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  explanation?: string;
}

export interface ISectionResult {
  sectionType: string;
  score: number;
  maxScore: number;
  questionResults: IQuestionResult[];
}

export interface ITestResult extends Document {
  userId: mongoose.Types.ObjectId;
  testPaperId: mongoose.Types.ObjectId;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  sectionResults: ISectionResult[];
  completedAt: Date;
}

const testResultSchema = new Schema<ITestResult>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  testPaperId: { type: Schema.Types.ObjectId, ref: 'TestPaper', required: true },
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 },
  sectionResults: { type: Schema.Types.Mixed, default: [] },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const TestResult: Model<ITestResult> = mongoose.model<ITestResult>('TestResult', testResultSchema);
export default TestResult;
