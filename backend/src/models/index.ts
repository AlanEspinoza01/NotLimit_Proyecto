export * from './Branch.model';
export * from './User.model';
export * from './Product.model';
export * from './Order.model';
export * from './Expense.model';
export * from './Supplier.model';
export * from './Review.model';
export * from './SystemAlert.model';
export * from './StoreSettings.model';

export const MONGODB_COLLECTIONS = [
  'users',
  'branches',
  'products',
  'orders',
  'expenses',
  'suppliers',
  'reviews',
  'system_alerts',
  'store_settings',
] as const;
