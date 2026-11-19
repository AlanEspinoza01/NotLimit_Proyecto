// Esquema de Etiquetas de Clientes (Permite combinaciones múltiples e independientes)
export type CustomerTag = 'Normal' | 'Lista Preferencial' | 'Lista Negra';

export interface BlacklistReport {
  id: string;
  date: string;
  reason: string;
  debtAmount?: number; // Opcional
  notes?: string;
  recordedBy: string;
}

export interface PreferentialReport {
  id: string;
  date: string;
  reason: string;
  benefit?: string;
  notes?: string;
  recordedBy: string;
}

export interface CustomerRecord {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  email: string;
  phone: string;
  compras: number;
  puntosClub: number;
  totalGastado: number;
  // Sistema de etiquetas dinámicas (en lugar de estados excluyentes)
  etiquetas: CustomerTag[];
  fechaRegistro: string;
  // Registros acumulados
  blacklistReports: BlacklistReport[];
  preferentialReports: PreferentialReport[];
}

export const STORAGE_CUSTOMERS_KEY = 'nl_admin_customers_directory_v1';

// Formato de moneda chilena
export function formatCLP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$ 0';
  return '$ ' + Math.round(amount).toLocaleString('es-CL');
}

// Normalizador para asegurar compatibilidad con versiones previas guardadas en localStorage
export function normalizeCustomer(c: any): CustomerRecord {
  let tags: CustomerTag[] = [];
  if (Array.isArray(c.etiquetas) && c.etiquetas.length > 0) {
    tags = [...c.etiquetas];
  } else if (Array.isArray(c.tags) && c.tags.length > 0) {
    tags = [...c.tags];
  } else if (c.estado) {
    tags = [c.estado as CustomerTag];
  }

  // Sincronizar etiquetas con reportes existentes si no estaban reflejadas
  if (c.blacklistReports && c.blacklistReports.length > 0 && !tags.includes('Lista Negra')) {
    tags.push('Lista Negra');
  }
  if (c.preferentialReports && c.preferentialReports.length > 0 && !tags.includes('Lista Preferencial')) {
    tags.push('Lista Preferencial');
  }

  // Si tiene etiquetas especiales, removemos 'Normal' redundante
  if (tags.length > 1 && tags.includes('Normal')) {
    tags = tags.filter((t) => t !== 'Normal');
  }

  // Si no tiene ninguna, asignar 'Normal' por defecto
  if (tags.length === 0) {
    tags = ['Normal'];
  }

  return {
    id: c.id || `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    nombre: c.nombre || 'Cliente',
    apellido: c.apellido || 'NoLimits',
    rut: c.rut || '11.111.111-1',
    email: c.email || 'cliente@live.cl',
    phone: c.phone || '+56 9 0000 0000',
    compras: typeof c.compras === 'number' ? c.compras : 0,
    puntosClub: typeof c.puntosClub === 'number' ? c.puntosClub : 0,
    totalGastado: typeof c.totalGastado === 'number' ? c.totalGastado : 0,
    etiquetas: tags,
    fechaRegistro: c.fechaRegistro || '2026-01-01',
    blacklistReports: Array.isArray(c.blacklistReports) ? c.blacklistReports : [],
    preferentialReports: Array.isArray(c.preferentialReports) ? c.preferentialReports : []
  };
}

// Datos iniciales ricos con casos de clientes de Lista Preferencial, Lista Negra y clientes mixtos
export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cust_01',
    nombre: 'Valeria',
    apellido: 'Neo-Goth',
    rut: '19.482.110-3',
    email: 'valeria.neogoth@gmail.com',
    phone: '+56 9 8412 9012',
    compras: 8,
    puntosClub: 450,
    totalGastado: 389920,
    etiquetas: ['Lista Preferencial'],
    fechaRegistro: '2025-11-12',
    blacklistReports: [],
    preferentialReports: [
      {
        id: 'rep_pref_01',
        date: '2026-03-10 14:30',
        reason: 'Cliente VIP frecuente en Live Streams nocturnos. Pago instantáneo por Webpay y reseñas fotográficas destacadas.',
        benefit: '15% Descuento Permanente + Envíos Prioritarios Starken',
        recordedBy: 'Super Admin'
      },
      {
        id: 'rep_pref_02',
        date: '2026-04-02 18:00',
        reason: 'Embajadora comunitaria: recomendó la tienda a 5 clientes nuevos en Viña del Mar y Valparaíso.',
        benefit: '+200 Puntos Club otorgados',
        recordedBy: 'Super Admin'
      }
    ]
  },
  {
    id: 'cust_02',
    nombre: 'Franco',
    apellido: 'Navarrete C.',
    rut: '18.992.334-5',
    email: 'franco.n99@live.cl',
    phone: '+56 9 7788 1122',
    compras: 2,
    puntosClub: 10,
    totalGastado: 45990,
    etiquetas: ['Lista Negra'],
    fechaRegistro: '2026-01-14',
    blacklistReports: [
      {
        id: 'rep_bl_01',
        date: '2026-02-14 21:15',
        reason: 'Comprobante de transferencia adulterado (falso PDF de banco Santander) durante Live Stream.',
        debtAmount: 64980,
        notes: 'Intentó retirar en sucursal Valparaíso sin abono real verificado por tesorería.',
        recordedBy: 'Super Admin'
      },
      {
        id: 'rep_bl_02',
        date: '2026-03-20 19:40',
        reason: 'Reincidencia de reserva con bloqueo de stock de 3 chaquetas cyber-góticas sin realizar el pago.',
        debtAmount: 39990,
        notes: 'Comportamiento agresivo al solicitarle la regularización del comprobante.',
        recordedBy: 'Super Admin'
      }
    ],
    preferentialReports: []
  },
  {
    id: 'cust_03',
    nombre: 'Matías',
    apellido: 'Bustos',
    rut: '17.654.890-1',
    email: 'matias.bustos@outlook.com',
    phone: '+56 9 9123 4567',
    compras: 5,
    puntosClub: 180,
    totalGastado: 215400,
    etiquetas: ['Normal'],
    fechaRegistro: '2026-02-01',
    blacklistReports: [],
    preferentialReports: []
  },
  {
    id: 'cust_04',
    nombre: 'Carolina',
    apellido: 'Pizarro T.',
    rut: '20.104.992-1',
    email: 'carito.piz@outlook.com',
    phone: '+56 9 6655 4433',
    compras: 1,
    puntosClub: 0,
    totalGastado: 24990,
    etiquetas: ['Lista Negra'],
    fechaRegistro: '2026-02-20',
    blacklistReports: [
      {
        id: 'rep_bl_03',
        date: '2026-03-02 22:10',
        reason: 'Reserva constante en transmisiones en vivo sin concretar pago, reteniendo stock físico.',
        debtAmount: 24990,
        notes: 'Se le otorgaron 48 horas de gracia pero no respondió los correos de cobranza.',
        recordedBy: 'Super Admin'
      }
    ],
    preferentialReports: []
  },
  {
    // Caso de ejemplo real: Cliente de compras altas que siempre paga, pero con reporte de comportamiento rudo
    id: 'cust_05',
    nombre: 'Ignacio',
    apellido: 'Soto Morales',
    rut: '18.492.381-4',
    email: 'ignacio.soto@gmail.com',
    phone: '+56 9 8451 9283',
    compras: 7,
    puntosClub: 410,
    totalGastado: 348970,
    etiquetas: ['Lista Preferencial', 'Lista Negra'], // Doble etiqueta
    fechaRegistro: '2026-02-15',
    blacklistReports: [
      {
        id: 'rep_bl_04',
        date: '2026-10-21 11:30',
        reason: 'Trato grosero y reclamos agresivos a dependientes en local físico, exigiendo atención inmediata.',
        notes: 'Siempre paga sus prendas y compra volumen, pero se advierte a dependientes mantener protocolo estricto.',
        recordedBy: 'Super Admin'
      }
    ],
    preferentialReports: [
      {
        id: 'rep_pref_ignacio',
        date: '2026-09-12 16:20',
        reason: 'Cliente de alto poder adquisitivo. Compra drops completos de polerones y chaquetas Y2K.',
        benefit: 'Despacho prioritario el mismo día',
        recordedBy: 'Super Admin'
      }
    ]
  },
  {
    id: 'cust_06',
    nombre: 'Camila',
    apellido: 'Rojas',
    rut: '19.876.543-2',
    email: 'camila.rojas@gmail.com',
    phone: '+56 9 5544 3322',
    compras: 6,
    puntosClub: 320,
    totalGastado: 279500,
    etiquetas: ['Normal'],
    fechaRegistro: '2026-01-08',
    blacklistReports: [],
    preferentialReports: []
  },
  {
    id: 'cust_07',
    nombre: 'Valentina',
    apellido: 'Cyber-Queen',
    rut: '18.332.198-K',
    email: 'vale.cyberq@gmail.com',
    phone: '+56 9 9988 7766',
    compras: 12,
    puntosClub: 890,
    totalGastado: 564900,
    etiquetas: ['Lista Preferencial'],
    fechaRegistro: '2025-10-04',
    blacklistReports: [],
    preferentialReports: [
      {
        id: 'rep_pref_03',
        date: '2026-01-20 16:00',
        reason: 'Cliente Top 1 de la tienda online con más de 10 pedidos completos sin devoluciones ni atrasos.',
        benefit: 'Acceso VIP a Lanzamientos con 1 hora de anticipación',
        recordedBy: 'Super Admin'
      }
    ]
  },
  {
    id: 'cust_08',
    nombre: 'Lucas',
    apellido: 'Vera',
    rut: '20.334.881-9',
    email: 'lucas.vera@yahoo.com',
    phone: '+56 9 4433 2211',
    compras: 4,
    puntosClub: 140,
    totalGastado: 179960,
    etiquetas: ['Normal'],
    fechaRegistro: '2026-03-01',
    blacklistReports: [],
    preferentialReports: []
  },
  {
    id: 'cust_09',
    nombre: 'Sofía',
    apellido: 'Moraga',
    rut: '19.112.445-8',
    email: 'sofia.moraga@gmail.com',
    phone: '+56 9 3322 1100',
    compras: 3,
    puntosClub: 90,
    totalGastado: 134970,
    etiquetas: ['Normal'],
    fechaRegistro: '2026-03-12',
    blacklistReports: [],
    preferentialReports: []
  },
  {
    id: 'cust_10',
    nombre: 'Gonzalo',
    apellido: 'Aliste',
    rut: '16.890.123-4',
    email: 'gonzalo.aliste@empresa.cl',
    phone: '+56 9 8877 6655',
    compras: 7,
    puntosClub: 510,
    totalGastado: 412000,
    etiquetas: ['Lista Preferencial'],
    fechaRegistro: '2025-12-01',
    blacklistReports: [],
    preferentialReports: [
      {
        id: 'rep_pref_04',
        date: '2026-02-18 12:00',
        reason: 'Excelente puntualidad en retiros físicos en sucursal Viña del Mar y compras mayoristas de accesorios.',
        benefit: 'Packaging coleccionable de regalo en cada pedido',
        recordedBy: 'Super Admin'
      }
    ]
  }
];
