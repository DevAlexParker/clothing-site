import mongoose, { Schema, type Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface IOrder extends Document {
  orderId: string;
  createdAt: Date;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  customerInfo: {
    fullName: string;
    email: string;
    addressLine1: string;
    city: string;
    postalCode: string;
  };
  items: IOrderItem[];
  totalAmount: number;
  paymentIntentId?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'stripe' | 'cod';
  userId?: string;
  trackingHistory: {
    status: string;
    message: string;
    timestamp: Date;
  }[];
  isDeleted: boolean;
  deletedAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  productPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  selectedSize: { type: String, required: true },
  selectedColor: { type: String, required: true },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'cod'],
    default: 'stripe',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentIntentId: { type: String },
  trackingHistory: [{
    status: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
  customerInfo: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    addressLine1: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      const safeRet = ret as Record<string, unknown>;
      safeRet.id = safeRet.orderId;
      delete safeRet._id;
      delete safeRet.__v;
      return safeRet;
    }
  }
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

