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
<<<<<<< HEAD
  emailVerificationToken?: string;
  twoFactorSecret?: string;
  isTwoFactorEnabled: boolean;
  twoFactorEmailCode?: string;
  twoFactorEmailCodeExpires?: Date;
=======
  emailVerificationCodeHash?: string;
  emailVerificationExpires?: Date;
>>>>>>> c967962844a16a7917e4a5a23110c522ad11e1de
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
<<<<<<< HEAD
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  emailVerificationToken: { type: String },
  twoFactorSecret: { type: String },
  isTwoFactorEnabled: { type: Boolean, default: false },
  twoFactorEmailCode: { type: String },
  twoFactorEmailCodeExpires: { type: Date },
=======
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  emailVerificationCodeHash: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
>>>>>>> c967962844a16a7917e4a5a23110c522ad11e1de
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
