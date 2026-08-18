import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: 'learner' | 'creator' | 'teacher' | 'admin';
  nativeLanguage?: string;
  learningLanguage?: string;
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  xp: number;
  streak: {
    current: number;
    longest: number;
    lastActiveDate: Date;
  };
  achievements: mongoose.Types.ObjectId[];
  preferences: {
    darkMode: boolean;
    notifications: Record<string, any>;
  };
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  role: { 
    type: String, 
    enum: ['learner', 'creator', 'teacher', 'admin'], 
    default: 'learner' 
  },
  nativeLanguage: { type: String },
  learningLanguage: { type: String },
  level: { 
    type: String, 
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    default: 'A1'
  },
  xp: { type: Number, default: 0 },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now }
  },
  achievements: [{ type: Schema.Types.ObjectId, ref: 'Achievement' }],
  preferences: {
    darkMode: { type: Boolean, default: true },
    notifications: { type: Object, default: {} }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
