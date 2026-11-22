
import mongoose, { Schema, Document } from 'mongoose';

export interface ISizeItem {
  id?: string;
  size: string;
  quantity: number;
  stock?: number;
}

export interface IProduct extends Document {
  sku: string;
  title: string;
  name: string;
  description: string;
  price: number;
  normalPrice: number;
  salePrice: number;
  discountPercent: number;
  weightGrams: number;
  section: string;
  category: string;
  subcategory: string;
  subCategory?: string;
  specialCategory?: string;
  tags: string[];
  images: string[];
  sizeBreakdown: ISizeItem[];
  sizes: string[];
  totalStock: number;
  stock: number;
  soldUnits: number;
  branchId: string;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SizeItemSchema = new Schema<ISizeItem>(
  {
    id: { type: String, default: '1' },
    size: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    name: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    normalPrice: { type: Number, default: 0, min: 0 },
    salePrice: { type: Number, default: 0, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    weightGrams: { type: Number, default: 500, min: 0 },
    section: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    subcategory: { type: String, default: 'General', trim: true },
    subCategory: { type: String, default: 'General', trim: true },
    specialCategory: { type: String, default: '', trim: true, enum: ['', 'Productos destacados', 'Live Drop', 'Producto Personalizado'] },
    tags: { type: [String], default: [] },
    images: { type: [String], default: [] },
    sizeBreakdown: { type: [SizeItemSchema], default: [] },
    sizes: { type: [String], default: [] },
    totalStock: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    soldUnits: { type: Number, default: 0, min: 0 },
    branchId: { type: String, ref: 'Branch', default: 'casa_matriz' },
    isHidden: { type: Boolean, default: false },
  },
  {
    collection: 'products',
    timestamps: true,
  }
);

export const ProductModel =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
