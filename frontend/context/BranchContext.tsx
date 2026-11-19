import React, { createContext, useContext, useState, useEffect } from 'react';
import { Branch, BranchScheduleBlock } from '../types';
import { INITIAL_BRANCHES } from '../services/mockData';

const STORAGE_KEY = 'nl_branches_v2';

export const SCHEDULE_DAY_OPTIONS = [
  { key: 'Lun', full: 'Lunes' },
  { key: 'Mar', full: 'Martes' },
  { key: 'Mié', full: 'Miércoles' },
  { key: 'Jue', full: 'Jueves' },
  { key: 'Vie', full: 'Viernes' },
  { key: 'Sáb', full: 'Sábado' },
  { key: 'Dom', full: 'Domingo' },
  { key: 'Feriados', full: 'Feriados' }
] as const;

export const formatDaysToSmartLabel = (days: string[]): string => {
  if (!days || days.length === 0) return 'Personalizado';
  const order = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Feriados'];
  const sorted = [...days].sort((a, b) => order.indexOf(a) - order.indexOf(b));

  const hasFeriados = sorted.includes('Feriados');
  const weekDaysOnly = sorted.filter(d => d !== 'Feriados');

  const fullSingleMap: Record<string, string> = {
    Lun: 'Lunes',
    Mar: 'Martes',
    Mié: 'Miércoles',
    Jue: 'Jueves',
    Vie: 'Viernes',
    Sáb: 'Sábado',
    Dom: 'Domingo'
  };

  let baseLabel = '';
  if (weekDaysOnly.length === 0) {
    return 'Feriados';
  } else if (weekDaysOnly.length === 1) {
    baseLabel = fullSingleMap[weekDaysOnly[0]] || weekDaysOnly[0];
  } else {
    const indices = weekDaysOnly.map(d => order.indexOf(d));
    const isConsecutive = indices.every((val, i) => i === 0 || val === indices[i - 1] + 1);
    if (isConsecutive && weekDaysOnly.length >= 2) {
      if (weekDaysOnly.length === 2) {
        baseLabel = `${weekDaysOnly[0]} y ${weekDaysOnly[1]}`;
      } else {
        baseLabel = `${weekDaysOnly[0]} - ${weekDaysOnly[weekDaysOnly.length - 1]}`;
      }
    } else {
      const allButLast = weekDaysOnly.slice(0, -1).join(', ');
      const last = weekDaysOnly[weekDaysOnly.length - 1];
      baseLabel = `${allButLast} y ${last}`;
    }
  }

  if (hasFeriados) {
    return `${baseLabel} y Feriados`;
  }
  return baseLabel;
};

export const buildHoursTextFromBlock = (block: Partial<BranchScheduleBlock>): string => {
  if (block.isClosed) return 'Cerrado';
  if (block.openTime && block.closeTime) {
    const suffix = block.note && block.note.trim() ? ` ${block.note.trim()}` : '';
    return `${block.openTime} a ${block.closeTime} hrs${suffix}`;
  }
  return (block.hoursText || '10:30 a 19:30 hrs').trim();
};

const parseLegacyLineToBlock = (
  rawLine: string,
  fallbackLabel: string,
  defaultDays: string[],
  idSuffix: string
): BranchScheduleBlock => {
  const trimmed = (rawLine || '').trim();
  let dayLabel = fallbackLabel;
  let hoursPart = trimmed;

  if (trimmed.includes(':')) {
    const idx = trimmed.indexOf(':');
    const rawDay = trimmed.slice(0, idx).trim();
    hoursPart = trimmed.slice(idx + 1).trim();
    if (/^lunes a viernes$/i.test(rawDay)) dayLabel = 'Lun - Vie';
    else if (/^lunes a s[aá]bado$/i.test(rawDay)) dayLabel = 'Lun - Sáb';
    else if (/^s[aá]bados?$/i.test(rawDay)) dayLabel = 'Sábado';
    else if (/^domingos?$/i.test(rawDay)) dayLabel = 'Domingo';
    else if (/^domingos? y feriados$/i.test(rawDay)) dayLabel = 'Dom y Feriados';
    else if (rawDay) dayLabel = rawDay;
  }

  const isClosed = /cerrado/i.test(hoursPart);
  const timeMatch = hoursPart.match(/(\d{1,2}:\d{2})\s*(?:a|-)\s*(\d{1,2}:\d{2})/i);
  const openTime = timeMatch ? timeMatch[1].padStart(5, '0') : isClosed ? '11:00' : '10:30';
  const closeTime = timeMatch ? timeMatch[2].padStart(5, '0') : isClosed ? '17:00' : '19:30';

  let note = '';
  if (timeMatch) {
    const afterTimes = hoursPart
      .replace(timeMatch[0], '')
      .replace(/hrs\.?/i, '')
      .trim();
    if (afterTimes) note = afterTimes;
  }

  return {
    id: `blk_${idSuffix}`,
    days: defaultDays,
    dayLabel,
    isClosed,
    openTime,
    closeTime,
    note,
    hoursText: isClosed ? 'Cerrado' : hoursPart || `${openTime} a ${closeTime} hrs`
  };
};

export const deriveScheduleBlocksFromLegacy = (
  weekdays?: string,
  saturday?: string,
  sunday?: string
): BranchScheduleBlock[] => {
  return [
    parseLegacyLineToBlock(
      weekdays || 'Lunes a Viernes: 10:30 a 19:30 hrs',
      'Lun - Vie',
      ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
      '1'
    ),
    parseLegacyLineToBlock(
      saturday || 'Sábados: 11:00 a 17:00 hrs',
      'Sábado',
      ['Sáb'],
      '2'
    ),
    parseLegacyLineToBlock(
      sunday || 'Domingos: Cerrado',
      'Domingo',
      ['Dom'],
      '3'
    )
  ];
};

export const getBranchScheduleBlocks = (branch?: Partial<Branch>): BranchScheduleBlock[] => {
  if (branch?.scheduleBlocks && Array.isArray(branch.scheduleBlocks) && branch.scheduleBlocks.length > 0) {
    return branch.scheduleBlocks.map((b, idx) => ({
      ...b,
      id: b.id || `blk_${idx + 1}`,
      dayLabel: (b.dayLabel || 'Lun - Vie').replace(/:$/, '').trim(),
      hoursText: b.isClosed ? 'Cerrado' : (b.hoursText || buildHoursTextFromBlock(b)).trim()
    }));
  }
  return deriveScheduleBlocksFromLegacy(
    branch?.scheduleWeekdays,
    branch?.scheduleSaturday,
    branch?.scheduleSunday
  );
};

export const composeBranchPickupScheduleFromBlocks = (blocks?: BranchScheduleBlock[]): string => {
  if (!blocks || blocks.length === 0) {
    return 'Lun - Vie: 10:30 a 19:30 hrs · Sábado: 11:00 a 17:00 hrs';
  }
  return blocks
    .map(b => {
      const label = (b.dayLabel || 'Horario').replace(/:$/, '').trim();
      const hrs = b.isClosed ? 'Cerrado' : (b.hoursText || buildHoursTextFromBlock(b)).trim();
      return `${label}: ${hrs}`;
    })
    .join(' · ');
};

export const CASA_MATRIZ_BRANCH: Branch = {
  id: 'casa_matriz',
  name: 'Casa Matriz / Central (Corporativo)',
  code: 'CORP-00',
  address: 'Operaciones Centrales (Sin Punto Físico)',
  city: 'Casa Matriz',
  phone: '+56 9 0000 0001',
  managerName: 'Dueño / Super Administrador',
  isActive: true,
  colorTag: '#0055ea',
  region: 'Región Metropolitana',
  adminEmail: 'root@nolimits.cl',
  adminRut: '16.111.222-3',
  createdAt: '2024-01-01',
  isPhysicalStore: false,
  allowPickup: false,
  isCorporate: true
};

const DEFAULT_BRANCH_SCHEDULES: Record<
  string,
  {
    scheduleWeekdays: string;
    scheduleSaturday: string;
    scheduleSunday: string;
    scheduleBlocks: BranchScheduleBlock[];
    returnInstructions: string;
    badge: string;
  }
> = {
  vina_del_mar: {
    scheduleWeekdays: 'Lunes a Viernes: 10:30 a 19:30 hrs',
    scheduleSaturday: 'Sábados: 11:00 a 17:00 hrs',
    scheduleSunday: 'Domingos y Feriados: Cerrado',
    scheduleBlocks: [
      {
        id: 'vina_blk_1',
        days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
        dayLabel: 'Lun - Vie',
        isClosed: false,
        openTime: '10:30',
        closeTime: '19:30',
        note: '',
        hoursText: '10:30 a 19:30 hrs'
      },
      {
        id: 'vina_blk_2',
        days: ['Sáb'],
        dayLabel: 'Sábado',
        isClosed: false,
        openTime: '11:00',
        closeTime: '17:00',
        note: '',
        hoursText: '11:00 a 17:00 hrs'
      },
      {
        id: 'vina_blk_3',
        days: ['Dom'],
        dayLabel: 'Domingo',
        isClosed: true,
        openTime: '11:00',
        closeTime: '17:00',
        note: '',
        hoursText: 'Cerrado'
      }
    ],
    returnInstructions: 'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.',
    badge: 'Tienda Matriz & Devolución Rápida'
  },
  valparaiso: {
    scheduleWeekdays: 'Lunes a Viernes: 11:00 a 19:00 hrs',
    scheduleSaturday: 'Sábados: 11:00 a 16:30 hrs',
    scheduleSunday: 'Domingos: Cerrado',
    scheduleBlocks: [
      {
        id: 'valpo_blk_1',
        days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
        dayLabel: 'Lun - Vie',
        isClosed: false,
        openTime: '11:00',
        closeTime: '19:00',
        note: '',
        hoursText: '11:00 a 19:00 hrs'
      },
      {
        id: 'valpo_blk_2',
        days: ['Sáb'],
        dayLabel: 'Sábado',
        isClosed: false,
        openTime: '11:00',
        closeTime: '16:30',
        note: '',
        hoursText: '11:00 a 16:30 hrs'
      },
      {
        id: 'valpo_blk_3',
        days: ['Dom'],
        dayLabel: 'Domingo',
        isClosed: true,
        openTime: '11:00',
        closeTime: '16:30',
        note: '',
        hoursText: 'Cerrado'
      }
    ],
    returnInstructions: 'Módulo Express Drop-off para cambios de talla inmediatos y pruebas de calce.',
    badge: 'Hub Urbano Puerto'
  },
  quilpue: {
    scheduleWeekdays: 'Lunes a Viernes: 10:00 a 20:00 hrs (Continuado)',
    scheduleSaturday: 'Sábados: 10:00 a 20:00 hrs',
    scheduleSunday: 'Domingos: 11:00 a 16:00 hrs',
    scheduleBlocks: [
      {
        id: 'quilpue_blk_1',
        days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
        dayLabel: 'Lun - Vie',
        isClosed: false,
        openTime: '10:00',
        closeTime: '20:00',
        note: '(Continuado)',
        hoursText: '10:00 a 20:00 hrs (Continuado)'
      },
      {
        id: 'quilpue_blk_2',
        days: ['Sáb'],
        dayLabel: 'Sábado',
        isClosed: false,
        openTime: '10:00',
        closeTime: '20:00',
        note: '',
        hoursText: '10:00 a 20:00 hrs'
      },
      {
        id: 'quilpue_blk_3',
        days: ['Dom'],
        dayLabel: 'Domingo',
        isClosed: false,
        openTime: '11:00',
        closeTime: '16:00',
        note: '',
        hoursText: '11:00 a 16:00 hrs'
      }
    ],
    returnInstructions: 'Punto oficial de recepción de prendas para inspección técnica y retiro de nueva prenda.',
    badge: 'Horario Extendido'
  }
};

export const composeBranchPickupSchedule = (
  weekdays?: string,
  saturday?: string,
  sunday?: string
): string => {
  const parts = [
    (weekdays || 'Lunes a Viernes: 10:30 a 19:30 hrs').trim(),
    (saturday || 'Sábados: 11:00 a 17:00 hrs').trim(),
    (sunday || 'Domingos y Feriados: Cerrado').trim()
  ].filter(Boolean);
  return parts.join(' · ');
};

export const formatBranchPickupSummary = (branch?: Branch): string => {
  if (!branch) return 'Lun - Vie: 10:30 a 19:30 hrs · Sábado: 11:00 a 17:00 hrs';
  if (branch.scheduleBlocks && branch.scheduleBlocks.length > 0) {
    return composeBranchPickupScheduleFromBlocks(branch.scheduleBlocks);
  }
  if (branch.pickupSchedule && branch.pickupSchedule.trim()) {
    return branch.pickupSchedule.trim();
  }
  return composeBranchPickupSchedule(
    branch.scheduleWeekdays,
    branch.scheduleSaturday,
    branch.scheduleSunday
  );
};

const normalizeBranchDefaults = (b: Branch): Branch => {
  if (b.id === 'casa_matriz' || b.isCorporate) {
    return {
      ...b,
      ...CASA_MATRIZ_BRANCH,
      name: 'Casa Matriz / Central (Corporativo)',
      isPhysicalStore: false,
      allowPickup: false,
      isCorporate: true
    };
  }

  const preset = DEFAULT_BRANCH_SCHEDULES[b.id] || {
    scheduleWeekdays: 'Lunes a Viernes: 10:30 a 19:30 hrs',
    scheduleSaturday: 'Sábados: 11:00 a 17:00 hrs',
    scheduleSunday: 'Domingos y Feriados: Cerrado',
    scheduleBlocks: deriveScheduleBlocksFromLegacy(
      b.scheduleWeekdays || 'Lunes a Viernes: 10:30 a 19:30 hrs',
      b.scheduleSaturday || 'Sábados: 11:00 a 17:00 hrs',
      b.scheduleSunday || 'Domingos: Cerrado'
    ),
    returnInstructions: 'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.',
    badge: 'Punto Oficial de Retiro'
  };

  const resolvedBlocks =
    b.scheduleBlocks && Array.isArray(b.scheduleBlocks) && b.scheduleBlocks.length > 0
      ? getBranchScheduleBlocks(b)
      : b.scheduleWeekdays || b.scheduleSaturday || b.scheduleSunday
      ? deriveScheduleBlocksFromLegacy(
          b.scheduleWeekdays || preset.scheduleWeekdays,
          b.scheduleSaturday || preset.scheduleSaturday,
          b.scheduleSunday || preset.scheduleSunday
        )
      : preset.scheduleBlocks;

  const firstBlock = resolvedBlocks[0];
  const secondBlock = resolvedBlocks[1];
  const thirdBlock = resolvedBlocks[2];

  const scheduleWeekdays = firstBlock
    ? `${firstBlock.dayLabel}: ${firstBlock.isClosed ? 'Cerrado' : firstBlock.hoursText}`
    : b.scheduleWeekdays || preset.scheduleWeekdays;
  const scheduleSaturday = secondBlock
    ? `${secondBlock.dayLabel}: ${secondBlock.isClosed ? 'Cerrado' : secondBlock.hoursText}`
    : b.scheduleSaturday || preset.scheduleSaturday;
  const scheduleSunday = thirdBlock
    ? `${thirdBlock.dayLabel}: ${thirdBlock.isClosed ? 'Cerrado' : thirdBlock.hoursText}`
    : b.scheduleSunday || preset.scheduleSunday;

  const pickupSchedule = composeBranchPickupScheduleFromBlocks(resolvedBlocks);

  return {
    ...b,
    isPhysicalStore: b.isPhysicalStore !== false,
    allowPickup: b.allowPickup !== false,
    scheduleBlocks: resolvedBlocks,
    scheduleWeekdays,
    scheduleSaturday,
    scheduleSunday,
    pickupSchedule,
    returnInstructions: b.returnInstructions || preset.returnInstructions,
    badge: b.badge || preset.badge
  };
};

const ensureCasaMatriz = (list: Branch[]): Branch[] => {
  const hasCasaMatriz = list.some(b => b.id === 'casa_matriz' || b.isCorporate);
  const result = hasCasaMatriz ? list : [CASA_MATRIZ_BRANCH, ...list];
  return result.map(normalizeBranchDefaults);
};

const SEEDED_DEFAULT_BRANCHES: Branch[] = ensureCasaMatriz(
  INITIAL_BRANCHES.map(b => ({
    ...b,
    region: b.region || (b.id === 'casa_matriz' ? 'Región Metropolitana' : 'Región de Valparaíso'),
    adminEmail:
      b.adminEmail ||
      (b.id === 'vina_del_mar'
        ? 'admin.vina@nolimits.cl'
        : b.id === 'valparaiso'
        ? 'admin.valpo@nolimits.cl'
        : b.id === 'quilpue'
        ? 'admin.quilpue@nolimits.cl'
        : 'root@nolimits.cl'),
    adminRut:
      b.adminRut ||
      (b.id === 'vina_del_mar'
        ? '16.482.910-3'
        : b.id === 'valparaiso'
        ? '17.820.453-K'
        : b.id === 'quilpue'
        ? '18.390.112-5'
        : '16.111.222-3'),
    createdAt: b.createdAt || '2024-01-15'
  }))
);

const syncInformativeConfigWithBranches = (branchList: Branch[]) => {
  try {
    const infoKey = 'nl_admin_informative_config_v1';
    const raw = localStorage.getItem(infoKey);
    const current = raw ? JSON.parse(raw) : {};
    const vina = branchList.find(b => b.id === 'vina_del_mar');
    const valpo = branchList.find(b => b.id === 'valparaiso');
    const quilpue = branchList.find(b => b.id === 'quilpue');

    const next = { ...current };
    if (vina) {
      next.retiroSucursalVina = `📍 ${vina.name}\n${vina.address}, ${vina.city}\nHorario de Retiro: ${formatBranchPickupSummary(vina)}`;
    }
    if (valpo) {
      next.retiroSucursalValpo = `📍 ${valpo.name}\n${valpo.address}, ${valpo.city}\nHorario de Retiro: ${formatBranchPickupSummary(valpo)}`;
    }
    if (quilpue) {
      next.retiroSucursalQuilpue = `📍 ${quilpue.name}\n${quilpue.address}, ${quilpue.city}\nHorario de Retiro: ${formatBranchPickupSummary(quilpue)}`;
    }
    localStorage.setItem(infoKey, JSON.stringify(next));
    window.dispatchEvent(new Event('nl_informative_config_updated'));
  } catch {
    // ignore storage errors
  }
};

interface BranchContextType {
  branches: Branch[];
  activeBranchId: string; // 'all' or branch id
  setActiveBranchId: (id: string) => void;
  activeBranch: Branch | undefined;
  getBranchById: (id: string) => Branch | undefined;
  addBranch: (branch: Branch) => void;
  updateBranch: (branch: Branch) => void;
  deleteBranch: (id: string) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return ensureCasaMatriz(parsed);
        }
      }
    } catch {
      // fallback
    }
    return SEEDED_DEFAULT_BRANCHES;
  });

  const [activeBranchId, setActiveBranchId] = useState<string>('all');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
      syncInformativeConfigWithBranches(branches);
      window.dispatchEvent(new Event('nl_branches_updated'));
    } catch (e) {
      console.warn('Could not persist branches:', e);
    }
  }, [branches]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBranches(ensureCasaMatriz(parsed));
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const activeBranch = branches.find(b => b.id === activeBranchId);

  const getBranchById = (id: string) => branches.find(b => b.id === id);

  const addBranch = (newBranch: Branch) => {
    setBranches(prev => [normalizeBranchDefaults(newBranch), ...prev]);
  };

  const updateBranch = (updated: Branch) => {
    const normalized = normalizeBranchDefaults(updated);
    setBranches(prev => prev.map(b => (b.id === normalized.id ? normalized : b)));
  };

  const deleteBranch = (id: string) => {
    if (id === 'casa_matriz' || id === 'central') {
      console.warn('Cannot delete Casa Matriz / Central (Corporativo)');
      return;
    }
    setBranches(prev => prev.filter(b => b.id !== id));
    if (activeBranchId === id) {
      setActiveBranchId('all');
    }
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        activeBranchId,
        setActiveBranchId,
        activeBranch,
        getBranchById,
        addBranch,
        updateBranch,
        deleteBranch
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};


