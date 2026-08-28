import mongoose, { Document, Model, Schema } from 'mongoose';

/** One required connector per level, used to check writing submissions. */
export const LEVEL_CONNECTORS: Record<string, string[]> = {
  A1: ['und', 'oder', 'aber', 'auch', 'nicht'],
  A2: ['und', 'oder', 'aber', 'weil', 'dann', 'auch', 'denn'],
  B1: ['weil', 'obwohl', 'deshalb', 'trotzdem', 'wenn', 'dass', 'aber', 'denn', 'jedoch'],
  B2: ['obwohl', 'deshalb', 'trotzdem', 'sodass', 'damit', 'indem', 'während', 'nachdem', 'bevor'],
};

export interface IWritingTask extends Document {
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  taskType: 'sms' | 'email' | 'letter' | 'forum_post' | 'note';
  scenario: string;          // e.g. "Your friend Jan invites you to a birthday party..."
  prompt: string;            // The actual instruction shown to user
  threePoints: string[];     // Goethe requires 3 bullet points to address
  wordMin: number;
  wordMax: number;
  requiredConnectors: string[];
  modelAnswer: string;
  gradingRubric: {
    taskCompletion: string;
    coherence: string;
    vocabulary: string;
    grammar: string;
  };
  totalPoints: number;       // usually 12 (Goethe standard)
  isPublished: boolean;
}

const writingTaskSchema = new Schema<IWritingTask>({
  title: { type: String, required: true },
  level: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], required: true },
  taskType: { type: String, enum: ['sms', 'email', 'letter', 'forum_post', 'note'], required: true },
  scenario: { type: String, required: true },
  prompt: { type: String, required: true },
  threePoints: [{ type: String }],
  wordMin: { type: Number, default: 40 },
  wordMax: { type: Number, default: 50 },
  requiredConnectors: [{ type: String }],
  modelAnswer: { type: String, required: true },
  gradingRubric: {
    taskCompletion: { type: String },
    coherence: { type: String },
    vocabulary: { type: String },
    grammar: { type: String },
  },
  totalPoints: { type: Number, default: 12 },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

const WritingTask: Model<IWritingTask> = mongoose.model<IWritingTask>('WritingTask', writingTaskSchema);
export default WritingTask;
