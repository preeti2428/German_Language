import mongoose, { Document, Model } from 'mongoose';

export interface IVocabSet {
  word: string;
  translation: string;
  gender?: 'der' | 'die' | 'das' | 'none';
  audioUrl?: string;
}

export interface IExercise {
  type: string;
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  audioUrl?: string;
  points: number;
}

export interface ISession {
  sessionNumber: number;
  title: string;
  skillType: string;
  exercises: IExercise[];
}

export interface IStage extends Document {
  tier: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  stageNumber: number;
  theme: string;
  cityName: string;
  cityNameDe: string;
  emoji: string;
  vocabSet: IVocabSet[];
  grammarNote?: string;
  sessions: ISession[];
  bossTest: IExercise[];
  /** Precomputed sum of all question + boss XP, shown on the map. */
  totalXp?: number;
}

const exerciseSchema = new mongoose.Schema({
  // No enum: generated content uses the full question-type vocabulary
  // (translate, sentence_build, error_spot, …) and the frontend dispatches on it.
  type: { type: String, required: true },
  prompt: { type: String, required: true },
  options: { type: mongoose.Schema.Types.Mixed },
  correctAnswer: { type: String },
  audioUrl: { type: String },
  points: { type: Number, default: 10 }
});

const stageSchema = new mongoose.Schema({
  tier: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    required: true
  },
  stageNumber: { type: Number, required: true },
  theme: { type: String, required: true },
  cityName: { type: String, required: true, default: 'Unknown' },
  cityNameDe: { type: String, required: true, default: 'Unknown' },
  emoji: { type: String, required: true, default: '📍' },
  vocabSet: [{
    word: { type: String, required: true },
    translation: { type: String, required: true },
    gender: { type: String, enum: ['der', 'die', 'das', 'none'], default: 'none' },
    audioUrl: { type: String }
  }],
  grammarNote: { type: String },
  sessions: [{
    sessionNumber: { type: Number, required: true },
    title: { type: String, required: true },
    skillType: { type: String, required: true },
    exercises: [exerciseSchema]
  }],
  bossTest: [exerciseSchema],
  totalXp: { type: Number, default: 0 }
}, { timestamps: true });

const Stage: Model<IStage> = mongoose.model<IStage>('Stage', stageSchema);
export default Stage;
