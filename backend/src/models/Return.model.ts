import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReturnProductItem {
  id: string;
  name: string;
  quantity: number;
  size: string;
  price: number;
  sku: string;
  image?: string;
}

export interface IReturnShippingAddress {
  region: string;
  comuna: string;
  street: string;
  number: string;
  apartment?: string;
  postalCode?: string;
  notes?: string;
}

export interface IReturn extends Document {
  ticketNumber: string;
  orderId?: Types.ObjectId | null;
  orderNumber: string;
  userId?: Types.ObjectId | null;
  customerName: string;
  customerRut: string;
  customerPhone: string;
  customerEmail: string;
  reason: string;
  notes: string;
  products: IReturnProductItem[];
  totalAmount: number;
  evidencePhotos: string[];
  returnMethod: 'branch_dropoff' | 'courier_shipping';
  deliveryType: 'retiro' | 'envio';
  branchId: string;
  targetBranchName: string;
  returnCourier?: string;
  shippingCostClp: number;
  paidByStore: boolean;
  shippingAddress?: IReturnShippingAddress | null;
  status:
    | 'Solicitud recibida'
    | 'Revisión de equipo'
    | 'Aprobada'
    | 'Rechazada'
    | 'Envió a punto'
    | 'Retiro Presencial';
  returnReviewStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  trackingCode?: string;
  replyNote?: string;
  resolvedAt?: string;
  reviewedByAdmin?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnProductItemSchema = new Schema<IReturnProductItem>(
  {
    id: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    size: { type: String, default: 'Única', trim: true },
    price: { type: Number, default: 0, min: 0 },
    sku: { type: String, default: 'NL-SKU', trim: true },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const ReturnShippingAddressSchema = new Schema<IReturnShippingAddress>(
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

const ReturnSchema = new Schema<IReturn>(
  {
    ticketNumber: { type: String, required: true, unique: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    orderNumber: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customerName: { type: String, required: true, trim: true },
    customerRut: { type: String, default: '', trim: true },
    customerPhone: { type: String, default: '', trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    reason: { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true },
    products: { type: [ReturnProductItemSchema], required: true, default: [] },
    totalAmount: { type: Number, default: 0, min: 0 },
    evidencePhotos: { type: [String], required: true, default: [] },
    returnMethod: {
      type: String,
      enum: ['branch_dropoff', 'courier_shipping'],
      default: 'branch_dropoff',
    },
    deliveryType: {
      type: String,
      enum: ['retiro', 'envio'],
      default: 'retiro',
    },
    branchId: { type: String, ref: 'Branch', default: 'vina_del_mar' },
    targetBranchName: { type: String, default: '' },
    returnCourier: { type: String, default: '' },
    shippingCostClp: { type: Number, default: 0, min: 0 },
    paidByStore: { type: Boolean, default: true },
    shippingAddress: { type: ReturnShippingAddressSchema, default: null },
    status: {
      type: String,
      enum: [
        'Solicitud recibida',
        'Revisión de equipo',
        'Aprobada',
        'Rechazada',
        'Envió a punto',
        'Retiro Presencial',
      ],
      default: 'Solicitud recibida',
    },
    returnReviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },
    trackingCode: { type: String, default: '' },
    replyNote: { type: String, default: '' },
    resolvedAt: { type: String, default: '' },
    reviewedByAdmin: { type: String, default: '' },
  },
  {
    collection: 'returns',
    timestamps: true,
  }
);

export const ReturnModel =
  mongoose.models.Return || mongoose.model<IReturn>('Return', ReturnSchema);