// Claves de persistencia del sistema
export const STORAGE_ORDERS_KEY = 'nl_admin_purchase_orders_v1';
export const STORAGE_SUPER_ADMIN_ORDERS_KEY = 'nl_super_admin_purchase_orders_v3';
export const STORAGE_ALERTS_KEY = 'nl_admin_system_alerts_v8';
export const STORAGE_REMINDERS_KEY = 'nl_admin_scheduled_reminders_v1';
export const STORAGE_SALES_HISTORY_KEY = 'nl_admin_sales_history_v1';
export const STORAGE_GLOBAL_SALES_HISTORY_KEY = 'nolimits_sales_history_records';

// Opciones de Plazos de Expiración del Recordatorio según requerimiento estricto:
// (1hs ,2hs ,4hs ,8hs ,12hs ,24hs (1 dia),48hs (2 dias))
export const REMINDER_DEADLINE_OPTIONS = [
  { value: 1, label: '1 hora (1hs) - Expiración Rápida' },
  { value: 2, label: '2 horas (2hs) - Reserva Live' },
  { value: 4, label: '4 horas (4hs) - Corte Turno Tarde' },
  { value: 8, label: '8 horas (8hs) - Mismo Día' },
  { value: 12, label: '12 horas (12hs) - Hasta Medianoche' },
  { value: 24, label: '24 horas (1 día) - Estándar' },
  { value: 48, label: '48 horas (2 días) - Máximo Permitido' }
];

// Opciones de Courier de envío requeridas: Starken, bluexpress, Paket
export const SHIPPING_COURIERS = [
  { id: 'Starken', name: 'Starken', time: '24 a 48 hrs hábiles', cost: 3990, badge: 'Cobertura Nacional' },
  { id: 'bluexpress', name: 'bluexpress', time: 'Express 24 hrs', cost: 4490, badge: 'Entrega Prioritaria' },
  { id: 'Paket', name: 'Paket', time: '48 a 72 hrs', cost: 3290, badge: 'Económico' }
];

export function formatCLP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$ 0';
  return '$ ' + Math.round(amount).toLocaleString('es-CL');
}

export function parseCLPInput(text: string): number {
  const clean = text.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

export interface ProductItemInSale {
  id: string;
  name: string;
  description?: string;
  price: number; // Precio final con descuento si aplica
  normalPrice: number;
  discountPercent?: number;
  weightGrams: number;
  section: string;
  category: string;
  subCategory: string;
  specialCategory: string;
  tags: string[];
  sizes: Array<{ size: string; quantity: number }>;
  totalUnits: number;
  images: string[];
}

export interface CompletedSaleModalData {
  orderNumber: string;
  status: string;
  customerName: string;
  email: string;
  phone: string;
  total: number;
  deadlineHours?: number;
  products: ProductItemInSale[];
  deliveryType: 'retiro' | 'envio';
  fullAddress: string;
  courier: string;
  instruction?: string;
  registeredByAdmin: string;
}
