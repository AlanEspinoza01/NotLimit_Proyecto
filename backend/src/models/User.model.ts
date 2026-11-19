import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserAddress {
  id: string;
  alias: string;
  region: string;
  comuna: string;
  street: string;
  number: string;
  apartment?: string;
  postalCode?: string;
  notes?: string;
  isDefault: boolean;
}

export interface IPreferentialReport {
  id: string;
  date: string;
  reason: string;
  benefit?: string;
  notes?: string;
  recordedBy: string;
}

export interface IBlacklistReport {
  id: string;
  date: string;
  reason: string;
  debtAmount?: number;
  notes?: string;
  recordedBy: string;
}

export type UserRoleType = 'registered' | 'branch_admin' | 'super_admin';

export interface IUser extends Document {
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  rut?: string;
  passwordHash?: string | null;
  tokenVersion: number;
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  googleId?: string | null;
  phone: string;
  avatarUrl: string;
  role: UserRoleType;
  branchId?: string | null;
  loyaltyPoints: number;
  lastPointsReason: string;
  tags: string[];
  totalOrdersCount: number;
  totalSpentClp: number;
  isActive: boolean;
  wishlistProductIds: Types.ObjectId[];
  addresses: IUserAddress[];
  preferentialReports: IPreferentialReport[];
  blacklistReports: IBlacklistReport[];
  createdAt: Date;
  updatedAt: Date;
}

const UserAddressSchema = new Schema<IUserAddress>(
  {
    id: { type: String, required: true },
    alias: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    comuna: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    number: { type: String, required: true, trim: true },
    apartment: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    notes: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const PreferentialReportSchema = new Schema<IPreferentialReport>(
  {
    id: { type: String, required: true },
    date: { type: String, default: () => new Date().toLocaleString('es-CL') },
    reason: { type: String, required: true },
    benefit: { type: String, default: '' },
    notes: { type: String, default: '' },
    recordedBy: { type: String, default: 'Super Admin' },
  },
  { _id: false }
);

const BlacklistReportSchema = new Schema<IBlacklistReport>(
  {
    id: { type: String, required: true },
    date: { type: String, default: () => new Date().toLocaleString('es-CL') },
    reason: { type: String, required: true },
    debtAmount: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
    recordedBy: { type: String, default: 'Super Admin' },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, default: '', trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: '', trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    rut: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, default: null, select: false },
    tokenVersion: { type: Number, default: 0, min: 0, select: false },
    failedLoginAttempts: { type: Number, default: 0, min: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },
    googleId: { type: String, default: null, sparse: true },
    phone: { type: String, default: '', trim: true },
    avatarUrl: { type: String, default: '' },
    role: {
      type: String,
      enum: ['registered', 'branch_admin', 'super_admin'],
      default: 'registered',
    },
    branchId: { type: String, ref: 'Branch', default: null },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    lastPointsReason: { type: String, default: '' },
    tags: { type: [String], default: ['Normal'] },
    totalOrdersCount: { type: Number, default: 0, min: 0 },
    totalSpentClp: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    wishlistProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    addresses: { type: [UserAddressSchema], default: [] },
    preferentialReports: { type: [PreferentialReportSchema], default: [] },
    blacklistReports: { type: [BlacklistReportSchema], default: [] },
  },
  {
    collection: 'users',
    timestamps: true,
  }
);

export const UserModel =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);