import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILecture {
  title: string;
  videoUrl: string;
  duration?: number;   // minutes
  isFree: boolean;     // preview lecture visible to non-enrolled
  order: number;
}

export interface INote {
  title: string;
  fileUrl?: string;    // PDF URL
  content?: string;   // markdown/plain text
}

export interface IDPPQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface IModule extends Document {
  batch: mongoose.Types.ObjectId;
  title: string;
  order: number;
  lectures: ILecture[];
  notes: INote[];
  dpp: IDPPQuestion[];
}

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  duration: { type: Number },
  isFree: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String },
  content: { type: String },
});

const dppSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
});

const moduleSchema = new mongoose.Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    lectures: [lectureSchema],
    notes: [noteSchema],
    dpp: [dppSchema],
  },
  { timestamps: true }
);

const ModuleModel: Model<IModule> = mongoose.model<IModule>('Module', moduleSchema);
export default ModuleModel;
