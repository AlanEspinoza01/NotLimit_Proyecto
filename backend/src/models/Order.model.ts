import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrderItem {
  productId?: Types.ObjectId | string | null;
  sku: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
}

export interface IShippingAddress {
  region: string;
  comuna: string;
  street: string;
  number: string;
  apartment?: string;
  postalCode?: string;
}

export interface IShippingDetails {
  courier: string;
  trackingNumber?: string;
  address: IShippingAddress;
}

export interface IPaymentVoucher {
  voucherNumber: string;
  pdfUrl: string;
  emissionDate: Date;
}

export interface IStatusAuditLog {
  status: string;
  timestamp: string;
  note?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId?: Types.ObjectId | null;
  guestEmail?: string | null;
  customerEmail?: string;
  customerName: string;
  customerRut: string;
  customerPhone: string;
  branchId: string;
  branchName?: string;
  items: IOrderItem[];
  itemsSummary?: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  confirmedRevenue: number;
  paymentStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'REFUNDED';
  paymentMethod: string;
  deliveryType: 'envio' | 'retiro';
  pickupBranchId?: string | null;
  shippingDetails?: IShippingDetails | null;
  status: string;
  fulfillmentStatus: string;
  cancellationReason?: string;
  cancelledAt?: string;
  statusAuditLog?: IStatusAuditLog[];
  paymentVoucher?: IPaymentVoucher | null;
  registeredByAdmin: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.Mixed, default: null },
    sku: { type: String, default: 'SKU-GEN', trim: true },
    name: { type: String, required: true, trim: true },
    size: { type: String, default: 'Única', trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    region: { type: String, default: '' },
    comuna: { type: String, default: '' },
    street: { type: String, default: '' },
    number: { type: String, default: '' },
    apartment: { type: String, default: '' },
    postalCode: { type: String, default: '' },
  },
  { _id: false }
);

const ShippingDetailsSchema = new Schema<IShippingDetails>(
  {
    courier: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    address: { type: ShippingAddressSchema, default: () => ({}) },
  },
  { _id: false }
);

const PaymentVoucherSchema = new Schema<IPaymentVoucher>(
  {
    voucherNumber: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    emissionDate: { type: Date, default: Date.now },
  },
  { _id: false }
);

const StatusAuditLogSchema = new Schema<IStatusAuditLog>(
  {
    status: { type: String, required: true },
    timestamp: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    guestEmail: { type: String, default: null, lowercase: true, trim: true },
    customerEmail: { type: String, default: '', lowercase: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerRut: { type: String, default: 'Sin RUT', trim: true },
    customerPhone: { type: String, default: '+56 9 0000 0000', trim: true },
    branchId: { type: String, ref: 'Branch', required: true },
    branchName: { type: String, default: '' },
    items: { type: [OrderItemSchema], required: true, default: [] },
    itemsSummary: { type: String, default: '' },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    confirmedRevenue: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'REFUNDED'],
      default: 'CONFIRMED',
    },
    paymentMethod: { type: String, required: true, trim: true },
    deliveryType: {
      type: String,
      enum: ['envio', 'retiro'],
      default: 'retiro',
    },
    pickupBranchId: { type: String, ref: 'Branch', default: null },
    shippingDetails: { type: ShippingDetailsSchema, default: null },
    status: { type: String, default: 'Pago Confirmando' },
    fulfillmentStatus: { type: String, default: 'Pago Confirmando' },
    cancellationReason: { type: String, default: '' },
    cancelledAt: { type: String, default: '' },
    statusAuditLog: { type: [StatusAuditLogSchema], default: [] },
    paymentVoucher: { type: PaymentVoucherSchema, default: null },
    registeredByAdmin: { type: String, default: 'Sistema Web' },
  },
  {
    collection: 'orders',
    timestamps: true,
  }
);

export const OrderModel =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);