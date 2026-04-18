import mongoose, { Schema, type Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationCodeHash?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  emailVerificationCodeHash: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      const safeRet = ret as Record<string, unknown>;
      delete safeRet.password;
      delete safeRet.__v;
      return safeRet;
    }
  }
});

export const User = mongoose.model<IUser>('User', UserSchema);
