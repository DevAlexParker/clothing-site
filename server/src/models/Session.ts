import mongoose, { Schema, type Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  userAgent: string;
  ip: string;
  deviceType: string;
  os: string;
  browser: string;
  lastActive: Date;
  isValid: boolean;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  refreshToken: { type: String, required: true, unique: true },
  userAgent: { type: String },
  ip: { type: String },
  deviceType: { type: String },
  os: { type: String },
  browser: { type: String },
  lastActive: { type: Date, default: Date.now },
  isValid: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export const Session = mongoose.model<ISession>('Session', SessionSchema);
