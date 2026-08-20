import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  questionId: string;
  stopId: mongoose.Types.ObjectId;
  sessionNumber: number;
  skillType: string;
  questionType: string;
  questionText: string;
  options?: any;
  correctAnswer?: any;
  audioUrl?: string;
  imageUrl?: string;
  xpValue: number;
  orderInSession?: number;
}

const QuestionSchema = new Schema({
  questionId: { type: String, required: true, unique: true }, // e.g. koln_v01
  stopId: { type: Schema.Types.ObjectId, ref: "Stage", required: true },
  sessionNumber: { type: Number, required: true },
  skillType: { type: String, enum: ["vocab", "grammar", "listening", "speaking", "reading", "writing"], required: true },
  questionType: { type: String, required: true }, // mcq, fill_blank, matching, etc.
  questionText: { type: String, required: true },
  options: { type: Schema.Types.Mixed }, // array ya object dono handle karega
  correctAnswer: { type: Schema.Types.Mixed },
  audioUrl: { type: String }, // Cloudinary URL yahan aayega
  imageUrl: { type: String },
  xpValue: { type: Number, default: 5 },
  orderInSession: { type: Number }
}, { timestamps: true });

export default mongoose.model<IQuestion>("Question", QuestionSchema);
