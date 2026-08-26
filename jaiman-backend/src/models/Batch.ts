import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAnnouncement {
  title: string;
  body: string;
  createdAt: Date;
}

export interface IBatch extends Document {
  title: string;
  description: string;
  teacher: mongoose.Types.ObjectId;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  price: number;               // 0 = free
  thumbnail?: string;
  isPublished: boolean;
  enrollmentDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  maxStudents?: number;
  enrolledStudents: mongoose.Types.ObjectId[];
  modules: mongoose.Types.ObjectId[];
  announcements: IAnnouncement[];
  tags: string[];
}

const batchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    description: { type: String, default: '' },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    level: {
      type: String,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      required: true,
    },
    price: { type: Number, default: 0, min: 0 }, // 0 = free
    thumbnail: { type: String },
    isPublished: { type: Boolean, default: false },
    enrollmentDeadline: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
    maxStudents: { type: Number },
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    modules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
    announcements: [
      {
        title: { type: String, required: true },
        body: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

const Batch: Model<IBatch> = mongoose.model<IBatch>('Batch', batchSchema);
export default Batch;
