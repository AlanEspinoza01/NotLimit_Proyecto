import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduleBlock {
  id: string;
  days: string[];
  dayLabel: string;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  note: string;
  hoursText: string;
}

export interface IBranch extends Document<string> {
  _id: string;
  name: string;
  code: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  managerName: string;
  adminEmail: string;
  adminRut: string;
  adminPassword?: string;
  badge: string;
  pickupSchedule: string;
  returnInstructions: string;
  scheduleBlocks: IScheduleBlock[];
  allowPickup: boolean;
  isActive: boolean;
  isPhysicalStore: boolean;
  isCorporate: boolean;
  colorTag: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleBlockSchema = new Schema<IScheduleBlock>(
  {
    id: { type: String, required: true },
    days: { type: [String], default: [] },
    dayLabel: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
    openTime: { type: String, default: '' },
    closeTime: { type: String, default: '' },
    note: { type: String, default: '' },
    hoursText: { type: String, default: '' },
  },
  { _id: false }
);

const BranchSchema = new Schema<IBranch>(
  {
    _id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    city: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    managerName: { type: String, default: '', trim: true },
    adminEmail: { type: String, default: '', lowercase: true, trim: true },
    adminRut: { type: String, default: '', trim: true },
    adminPassword: { type: String, default: '' },
    badge: { type: String, default: 'Punto Oficial de Retiro' },
    pickupSchedule: { type: String, default: '' },
    returnInstructions: { type: String, default: '' },
    scheduleBlocks: { type: [ScheduleBlockSchema], default: [] },
    allowPickup: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isPhysicalStore: { type: Boolean, default: true },
    isCorporate: { type: Boolean, default: false },
    colorTag: { type: String, default: '#0055ea' },
  },
  {
    collection: 'branches',
    timestamps: true,
  }
);

export const BranchModel =
  mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);