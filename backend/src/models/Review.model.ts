import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  orderId?: Types.ObjectId | null;
  userName: string;
  title: string;
  rating: number;
  comment: string;
  productSize: string;
  branchPurchased: string;
  photos: string[];
  likes: number;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}
 
const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    userName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    productSize: { type: String, default: '' },
    branchPurchased: { type: String, default: '' },
    photos: { type: [String], default: [] },
    likes: { type: Number, default: 0, min: 0 },
    isHidden: { type: Boolean, default: false },
  },
  {
    collection: 'reviews',
    timestamps: true,
  }
);

export const ReviewModel =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
