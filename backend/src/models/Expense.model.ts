import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExpense extends Document {
  title: string;
  description: string;
  category: string;
  amount: number;
  amountClp: number;
  date: string;
  expenseDate: Date;
  branchId: string;
  branchName: string;
  supplierId?: Types.ObjectId | null;
  supplierName?: string;
  paymentMethod?: string;
  registeredBy: string;
  recordedBy?: Types.ObjectId | null;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, default: '', trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    amountClp: { type: Number, default: 0, min: 0 },
    date: { type: String, required: true },
    expenseDate: { type: Date, default: Date.now },
    branchId: { type: String, ref: 'Branch', required: true },
    branchName: { type: String, default: '' },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null },
    supplierName: { type: String, default: '' },
    paymentMethod: { type: String, default: 'Transferencia / Caja' },
    registeredBy: { type: String, default: 'Root Administrator' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    receiptUrl: { type: String, default: '' },
  },
  {
    collection: 'expenses',
    timestamps: true,
  }
);

export const ExpenseModel =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);