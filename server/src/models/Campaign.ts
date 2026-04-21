import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  type: 'restock_alert' | 'flash_sale' | 'birthday_offer' | 'custom';
  message: string;
  audienceCount: number;
  status: 'sent' | 'failed';
  createdAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  type: { 
    type: String, 
    enum: ['restock_alert', 'flash_sale', 'birthday_offer', 'custom'], 
    required: true 
  },
  message: { type: String, required: true },
  audienceCount: { type: Number, required: true },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
}, {
  timestamps: true,
});

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
