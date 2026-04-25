import mongoose, { Schema, type Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  category: string;
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  stock: number;
  isNewArrival?: boolean;
  gender: 'men' | 'women' | 'unisex';
  merchant_id?: mongoose.Types.ObjectId;
  isDeleted?: boolean;
  deletedAt?: Date;
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
  stock: { type: Number, default: 0, min: 0 },
  isNewArrival: { type: Boolean, default: false },
  gender: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
  merchant_id: { type: Schema.Types.ObjectId, ref: 'Merchant' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, {
  timestamps: true,
  toJSON: {
    // Map _id to id for frontend compatibility
    virtuals: true,
    transform: (_doc, ret) => {
      const safeRet = ret as Record<string, unknown>;
      const objectId = safeRet._id;
      safeRet.id = typeof objectId === 'string' ? objectId : String(objectId);
      delete safeRet._id;
      delete safeRet.__v;
      return safeRet;
    }
  }
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
