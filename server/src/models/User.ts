import mongoose, { Schema, type Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  smsOptIn: boolean;
  address?: string;
  city?: string;
  postalCode?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationCodeHash?: string;
  emailVerificationExpires?: Date;
  twoFactorSecret?: string;
  isTwoFactorEnabled: boolean;
  twoFactorEmailCode?: string;
  twoFactorEmailCodeExpires?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  phone: { type: String },
  smsOptIn: { type: Boolean, default: false },
  address: { type: String },
  city: { type: String },
  postalCode: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  emailVerificationToken: { type: String },
  emailVerificationCodeHash: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  twoFactorSecret: { type: String },
  isTwoFactorEnabled: { type: Boolean, default: false },
  twoFactorEmailCode: { type: String },
  twoFactorEmailCodeExpires: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLogin: { type: Date },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      const safeRet = ret as Record<string, unknown>;
      delete safeRet.password;
      delete safeRet.__v;
      delete safeRet.passwordResetToken;
      delete safeRet.emailVerificationToken;
      delete safeRet.twoFactorSecret;
      delete safeRet.twoFactorEmailCode;
      return safeRet;
    }
  }
});

export const User = mongoose.model<IUser>('User', UserSchema);
