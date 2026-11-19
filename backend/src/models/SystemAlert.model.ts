import mongoose, { Schema, Document } from 'mongoose';

export interface IAlertProductItem {
  id: string;
  name: string;
  quantity: number;
  size: string;
  price: number;
  sku: string;
  image?: string;
  images?: string[];
  description?: string;
  category?: string;
}

export interface IAlertShippingAddress {
  region: string;
  comuna: string;
  street: string;
  number: string;
  apartment?: string;
  postalCode?: string;
  notes?: string;
}

export interface ISystemAlert extends Document {
  category: string;
  title: string;
  description: string;
  severity?: string;
  customerName: string;
  customerRut: string;
  customerPhone: string;
  customerEmail: string;
  branchId: string;
  deliveryType?: 'envio' | 'retiro' | null;
  deliveryMethodText: string;
  shippingCourier?: string;
  shippingCostClp?: number;
  shippingAddress?: IAlertShippingAddress | null;
  orderNumber?: string | null;
  amount: number;
  productName?: string;
  productLink?: string;
  products: IAlertProductItem[];
  referencePhotos?: string[];
  timeLimitText: string;
  dueHours: number;
  status: 'active' | 'resolved' | 'dismissed';
  resolvedAt?: string;
  replyNote?: string;
  paymentResolutionStatus?: 'confirmed' | 'cancelled';
  returnReviewStatus?: 'approved' | 'rejected';
  rejectionReason?: string;
  trackingCode?: string;
  registeredByAdmin?: string;
  isAutomated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertProductItemSchema = new Schema<IAlertProductItem>(
  {
    id: { type: String, default: () => `item_${Date.now()}` },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    size: { type: String, default: 'Única' },
    price: { type: Number, default: 0, min: 0 },
    sku: { type: String, default: 'NL-SKU' },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
  },
  { _id: false }
);

const AlertShippingAddressSchema = new Schema<IAlertShippingAddress>(
  {
    region: { type: String, default: '' },
    comuna: { type: String, default: '' },
    street: { type: String, default: '' },
    number: { type: String, default: '' },
    apartment: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const SystemAlertSchema = new Schema<ISystemAlert>(
  {
    category: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    severity: { type: String, default: 'high' },
    customerName: { type: String, default: '' },
    customerRut: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    branchId: { type: String, ref: 'Branch', default: 'casa_matriz' },
    deliveryType: { type: String, enum: ['envio', 'retiro', null], default: null },
    deliveryMethodText: { type: String, default: '' },
    shippingCourier: { type: String, default: '' },
    shippingCostClp: { type: Number, default: 0 },
    shippingAddress: { type: AlertShippingAddressSchema, default: null },
    orderNumber: { type: String, default: null },
    amount: { type: Number, default: 0, min: 0 },
    productName: { type: String, default: '' },
    productLink: { type: String, default: '' },
    products: { type: [AlertProductItemSchema], default: [] },
    referencePhotos: { type: [String], default: [] },
    timeLimitText: { type: String, default: '24 horas' },
    dueHours: { type: Number, default: 24 },
    status: {
      type: String,
      enum: ['active', 'resolved', 'dismissed'],
      default: 'active',
    },
    resolvedAt: { type: String, default: '' },
    replyNote: { type: String, default: '' },
    paymentResolutionStatus: { type: String, default: '' },
    returnReviewStatus: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    trackingCode: { type: String, default: '' },
    registeredByAdmin: { type: String, default: 'Super Admin' },
    isAutomated: { type: Boolean, default: true },
  },
  {
    collection: 'system_alerts',
    timestamps: true,
  }
);

export const SystemAlertModel =
  mongoose.models.SystemAlert || mongoose.model<ISystemAlert>('SystemAlert', SystemAlertSchema);