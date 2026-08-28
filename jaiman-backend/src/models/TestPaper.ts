import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITestQuestion {
  questionNumber: number;
  type: 'mcq' | 'fill_blank' | 'true_false' | 'match' | 'writing';
  prompt: string;
  audioText?: string;   // text to TTS for listening questions
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
}

export interface ITestSection {
  sectionType: 'listening' | 'reading' | 'writing' | 'speaking';
  title: string;
  instructions: string;
  timeLimit?: number;   // minutes for this section
  questions: ITestQuestion[];
}

export interface ITestPaper extends Document {
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  source: 'goethe' | 'sample' | 'telc' | 'osd';
  year?: number;
  totalTime: number;       // minutes
  totalMarks: number;
  passingMarks: number;
  sections: ITestSection[];
  isPublished: boolean;
  tags: string[];
}

const questionSchema = new Schema<ITestQuestion>({
  questionNumber: { type: Number, required: true },
  type: { type: String, enum: ['mcq', 'fill_blank', 'true_false', 'match', 'writing'], required: true },
  prompt: { type: String, required: true },
  audioText: { type: String },
  options: [{ type: String }],
  correctAnswer: { type: Schema.Types.Mixed },
  points: { type: Number, default: 5 },
  explanation: { type: String },
});

const sectionSchema = new Schema<ITestSection>({
  sectionType: { type: String, enum: ['listening', 'reading', 'writing', 'speaking'], required: true },
  title: { type: String, required: true },
  instructions: { type: String, required: true },
  timeLimit: { type: Number },
  questions: [questionSchema],
});

const testPaperSchema = new Schema<ITestPaper>({
  title: { type: String, required: true },
  level: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], required: true },
  source: { type: String, enum: ['goethe', 'sample', 'telc', 'osd'], default: 'sample' },
  year: { type: Number },
  totalTime: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true },
  sections: [sectionSchema],
  isPublished: { type: Boolean, default: true },
  tags: [{ type: String }],
}, { timestamps: true });

const TestPaper: Model<ITestPaper> = mongoose.model<ITestPaper>('TestPaper', testPaperSchema);
export default TestPaper;
