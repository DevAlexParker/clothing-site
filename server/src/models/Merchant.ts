import mongoose from 'mongoose';

const merchantSchema = new mongoose.Schema({
  brandName: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Merchant = mongoose.model('Merchant', merchantSchema);
