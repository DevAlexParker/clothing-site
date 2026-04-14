import mongoose, { Schema, type Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  category: string;
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  isNewArrival?: boolean;
  merchant_id?: mongoose.Types.ObjectId;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  images: [{ type: String }],
  colors: [{
    name: { type: String, required: true },
    hex: { type: String, required: true },
  }],
  sizes: [{ type: String }],
  isNewArrival: { type: Boolean, default: false },
  merchant_id: { type: Schema.Types.ObjectId, ref: 'Merchant' },
}, {
  timestamps: true,
  toJSON: {
    // Map _id to id for frontend compatibility
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
