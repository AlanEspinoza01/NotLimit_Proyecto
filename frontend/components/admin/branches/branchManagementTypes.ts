import { BranchScheduleBlock } from '../../../types';

export interface BranchEditFormState {
  name: string;
  region: string;
  city: string;
  address: string;
  phone: string;
  managerName: string;
  badge: string;
  returnInstructions: string;
  scheduleBlocks: BranchScheduleBlock[];
  adminEmail: string;
  adminRut: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  isActive: boolean;
}

export interface QuickScheduleFormState {
  badge: string;
  phone: string;
  managerName: string;
  returnInstructions: string;
  scheduleBlocks: BranchScheduleBlock[];
}

export interface DetectedBranchChange {
  field: string;
  oldVal: string;
  newVal: string;
}

export const createDefaultScheduleBlocks = (): BranchScheduleBlock[] => [
  {
    id: `blk_${Date.now()}_1`,
    days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    dayLabel: 'Lun - Vie',
    isClosed: false,
    openTime: '10:30',
    closeTime: '19:30',
    note: '',
    hoursText: '10:30 a 19:30 hrs'
  },
  {
    id: `blk_${Date.now()}_2`,
    days: ['Sáb'],
    dayLabel: 'Sábado',
    isClosed: false,
    openTime: '11:00',
    closeTime: '17:00',
    note: '',
    hoursText: '11:00 a 17:00 hrs'
  },
  {
    id: `blk_${Date.now()}_3`,
    days: ['Dom'],
    dayLabel: 'Domingo',
    isClosed: true,
    openTime: '11:00',
    closeTime: '16:00',
    note: '',
    hoursText: 'Cerrado'
  }
];

export const SCHEDULE_PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  createBlocks: () => BranchScheduleBlock[];
}> = [
  {
    id: 'clasico',
    label: 'Clásico (Lun-Vie + Sáb)',
    description: 'Lun a Vie normal, Sábado medio día y Domingo cerrado',
    createBlocks: () => [
      {
        id: `p_clas_1_${Date.now()}`,
        days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
        dayLabel: 'Lun - Vie',
        isClosed: false,
        openTime: '10:30',
        closeTime: '19:30',
        note: '',
        hoursText: '10:30 a 19:30 hrs'
      },
      {
        id: `p_clas_2_${Date.now()}`,
        days: ['Sáb'],
        dayLabel: 'Sábado',
        isClosed: false,
        openTime: '11:00',
        closeTime: '17:00',
        note: '',
        hoursText: '11:00 a 17:00 hrs'
      },
      {
        id: `p_clas_3_${Date.now()}`,
        days: ['Dom'],
        dayLabel: 'Domingo',
        isClosed: true,
        openTime: '11:00',
        closeTime: '16:00',
        note: '',
        hoursText: 'Cerrado'
      }
    ]
  },
  {
    id: 'diferenciado_viernes',
    label: 'Lun-Jue + Viernes Extendido + Fin de Semana',
    description: 'Ideal cuando el viernes o sábado tienen horario distinto al resto de la semana',
    createBlocks: () => [
      {
        id: `p_dif_1_${Date.now()}`,
        days: ['Lun', 'Mar', 'Mié', 'Jue'],
        dayLabel: 'Lun - Jue',
        isClosed: false,
        openTime: '11:00',
        closeTime: '19:00',
        note: '',
        hoursText: '11:00 a 19:00 hrs'
      },
      {
        id: `p_dif_2_${Date.now()}`,
        days: ['Vie'],
        dayLabel: 'Viernes',
        isClosed: false,
        openTime: '11:00',
        closeTime: '20:30',
        note: '(Drop Day)',
        hoursText: '11:00 a 20:30 hrs (Drop Day)'
      },
      {
        id: `p_dif_3_${Date.now()}`,
        days: ['Sáb'],
        dayLabel: 'Sábado',
        isClosed: false,
        openTime: '11:00',
        closeTime: '18:00',
        note: '',
        hoursText: '11:00 a 18:00 hrs'
      },
      {
        id: `p_dif_4_${Date.now()}`,
        days: ['Dom', 'Feriados'],
        dayLabel: 'Domingo y Feriados',
        isClosed: true,
        openTime: '11:00',
        closeTime: '16:00',
        note: '',
        hoursText: 'Cerrado'
      }
    ]
  },
  {
    id: 'martes_a_domingo',
    label: 'Martes a Domingo (Lunes Cerrado)',
    description: 'Para tiendas o showrooms que descansan los lunes y abren todo el fin de semana',
    createBlocks: () => [
      {
        id: `p_mad_1_${Date.now()}`,
        days: ['Lun'],
        dayLabel: 'Lunes',
        isClosed: true,
        openTime: '11:00',
        closeTime: '18:00',
        note: '',
        hoursText: 'Cerrado'
      },
      {
        id: `p_mad_2_${Date.now()}`,
        days: ['Mar', 'Mié', 'Jue', 'Vie'],
        dayLabel: 'Mar - Vie',
        isClosed: false,
        openTime: '11:00',
        closeTime: '19:30',
        note: '',
        hoursText: '11:00 a 19:30 hrs'
      },
      {
        id: `p_mad_3_${Date.now()}`,
        days: ['Sáb', 'Dom'],
        dayLabel: 'Sáb y Dom',
        isClosed: false,
        openTime: '11:30',
        closeTime: '18:00',
        note: '',
        hoursText: '11:30 a 18:00 hrs'
      }
    ]
  },
  {
    id: 'mall_continuado',
    label: 'Horario Mall Extendido (Lun - Dom)',
    description: 'Abierto todos los días en horario continuado',
    createBlocks: () => [
      {
        id: `p_mall_1_${Date.now()}`,
        days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
        dayLabel: 'Lun - Vie',
        isClosed: false,
        openTime: '10:00',
        closeTime: '20:00',
        note: '(Continuado)',
        hoursText: '10:00 a 20:00 hrs (Continuado)'
      },
      {
        id: `p_mall_2_${Date.now()}`,
        days: ['Sáb'],
        dayLabel: 'Sábado',
        isClosed: false,
        openTime: '10:00',
        closeTime: '20:00',
        note: '',
        hoursText: '10:00 a 20:00 hrs'
      },
      {
        id: `p_mall_3_${Date.now()}`,
        days: ['Dom'],
        dayLabel: 'Domingo',
        isClosed: false,
        openTime: '11:00',
        closeTime: '16:00',
        note: '',
        hoursText: '11:00 a 16:00 hrs'
      }
    ]
  }
];

// Format Chilean RUT (e.g., 12.345.678-9)
export const formatChileanRut = (val: string): string => {
  const clean = val.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let formattedBody = '';
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) formattedBody = '.' + formattedBody;
    formattedBody = body[i] + formattedBody;
  }
  return `${formattedBody}-${dv}`;
};
