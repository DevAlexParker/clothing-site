import mongoose, { Schema, type Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  metadata: any;
  ip: string;
  userAgent: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String },
  metadata: { type: Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
