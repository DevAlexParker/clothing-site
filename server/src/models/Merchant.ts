import mongoose from 'mongoose';

const merchantSchema = new mongoose.Schema({
  brandName: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  aiSettings: {
    toneOfVoice: { type: String, default: 'friendly and professional' },
    styleFocus: { type: String, default: 'modern minimalist' }
  }
}, { timestamps: true });

export const Merchant = mongoose.model('Merchant', merchantSchema);
