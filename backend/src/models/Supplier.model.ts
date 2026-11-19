import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierAddress {
  region: string;
  comuna: string;
  city?: string;
  street: string;
  number: string;
  reference?: string;
  postalCode?: string;
}

export interface ISupplier extends Document {
  companyName: string;
  rut?: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  address: ISupplierAddress;
  // Campos planos sincronizados con SupplierManagementView.tsx
  region: string;
  city: string;
  street: string;
  number: string;
  reference: string;
  postalCode: string;
  productsOffered: string;
  website: string;
  orderDays: string;
  deliveryDays: string;
  minimumPurchase: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierAddressSchema = new Schema<ISupplierAddress>(
  {
    region: { type: String, default: '' },
    comuna: { type: String, default: '' },
    city: { type: String, default: '' },
    street: { type: String, default: '' },
    number: { type: String, default: '' },
    reference: { type: String, default: '' },
    postalCode: { type: String, default: '' },
  },
  { _id: false }
);

const SupplierSchema = new Schema<ISupplier>(
  {
    companyName: { type: String, required: true, trim: true },
    rut: { type: String, trim: true, sparse: true },
    contactName: { type: String, required: true, trim: true },
    contactRole: { type: String, default: '', trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: SupplierAddressSchema, default: () => ({}) },
    // Campos planos directos para el frontend
    region: { type: String, default: 'Región de Valparaíso' },
    city: { type: String, default: 'Viña del Mar' },
    street: { type: String, default: '' },
    number: { type: String, default: 'S/N' },
    reference: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    productsOffered: { type: String, required: true, default: '' },
    website: { type: String, default: '' },
    orderDays: { type: String, default: '' },
    deliveryDays: { type: String, default: '' },
    minimumPurchase: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: 'suppliers',
    timestamps: true,
  }
);

export const SupplierModel =
  mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);