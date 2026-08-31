import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBooking extends Document {
  student: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId; // Jai or any teacher
  date: string;        // ISO date string, e.g. "2026-08-27"
  timeSlot: string;    // e.g. "10:00", "14:30"
  durationMinutes: number;
  topic?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  meetLink?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelReason?: string;
  paymentOrderId?: string;
}

const bookingSchema = new mongoose.Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },       // "YYYY-MM-DD"
    timeSlot: { type: String, required: true },   // "HH:mm"
    durationMinutes: { type: Number, default: 30 },
    topic: { type: String },
    notes: { type: String },
    price: { type: Number, default: 1000 },
    paymentOrderId: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    meetLink: { type: String },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

// Prevent double-booking: same teacher + date + slot
bookingSchema.index({ teacher: 1, date: 1, timeSlot: 1 }, { unique: true });

const Booking: Model<IBooking> = mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;
