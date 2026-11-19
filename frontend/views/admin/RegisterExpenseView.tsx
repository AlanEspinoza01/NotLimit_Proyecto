import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Receipt,
  DollarSign,
  Calendar,
  Layers,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Store,
  PlusCircle,
  TrendingDown,
  AlertCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  X,
  Lock,
  Building2
} from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { INITIAL_BRANCHES } from '../../services/mockData';
import { OFFICIAL_CATEGORY_NAMES } from '../../services/shippingQuotesEngine';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import api from '../../api/axios';

export interface ExpenseRecord {
  id: string;
  folio?: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  branchId: string;
  branchName: string;
  supplierId?: string | null;
  supplierName?: string;
  paymentMethod?: string;
  registeredBy: string;
  createdAt: string;
}

interface SupplierOption {
  id: string;
  companyName: string;
  productsOffered: string;
}

// Categorías Especiales EXCLUSIVAS para "Registrar Gasto"
const SPECIAL_EXPENSE_CATEGORIES = [
  'Compra a Proveedor',
  'Servicios',
  'Pérdida',
  'Sueldo Empleado',
  'Otros'
];

// Normalizar documento de MongoDB al formato ExpenseRecord del frontend
const normalizeExpenseFromDB = (doc: any): ExpenseRecord => {
  const rawDate = doc.date
    ? String(doc.date).substring(0, 10)
    : doc.expenseDate
    ? new Date(doc.expenseDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return {
    id: doc._id?.toString() || doc.id || `exp_${Date.now()}`,
    description: doc.description || doc.title || 'Gasto Operativo',
    amount: Number(doc.amount ?? doc.amountClp) || 0,
    category: doc.category || 'Otros',
    date: rawDate,
    branchId:
      doc.branchId === 'branch-corporativo' ? 'casa_matriz' : doc.branchId || 'casa_matriz',
    branchName: doc.branchName || 'Casa Matriz / Central (Corporativo)',
    supplierId: doc.supplierId ? String(doc.supplierId) : null,
    supplierName: doc.supplierName || '',
    paymentMethod: doc.paymentMethod || 'Transferencia / Caja',
    registeredBy: doc.registeredBy || 'Root Administrator',
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString()
  };
};

export const RegisterExpenseView: React.FC = () => {
  const { currentUser } = useAuth();
  const { branches } = useBranch();
  const navigate = useNavigate();

  const allBranches = branches.length > 0 ? branches : INITIAL_BRANCHES;
  const isBranchAdmin = currentUser?.role === 'branch_admin';
  const assignedBranchId = isBranchAdmin ? (currentUser?.branchId || 'vina_del_mar') : null;
  const activeBranchObj = useMemo(() => {
    if (!assignedBranchId) return null;
    return (
      allBranches.find((b) => b.id === assignedBranchId) ||
      INITIAL_BRANCHES.find((b) => b.id === assignedBranchId) ||
      null
    );
  }, [allBranches, assignedBranchId]);

  // Lista de categorías de catálogo oficiales (excluyendo 'Otros' porque ya está en especiales)
  const catalogCategories = useMemo(() => {
    return OFFICIAL_CATEGORY_NAMES.filter((c) => c !== 'Otros');
  }, []);

  // Lista total de categorías disponibles en Registrar Gasto
  const allAvailableCategories = useMemo(() => {
    return [...SPECIAL_EXPENSE_CATEGORIES, ...catalogCategories];
  }, [catalogCategories]);

  // Proveedores reales cargados desde MongoDB para vincular cuando la categoría es "Compra a Proveedor"
  const [suppliersList, setSuppliersList] = useState<SupplierOption[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  // Estado del formulario
  const [description, setDescription] = useState<string>('');
  const [rawAmount, setRawAmount] = useState<string>(''); // Valor numérico en string
  const [formattedAmount, setFormattedAmount] = useState<string>(''); // Con auto-separador
  const [category, setCategory] = useState<string>('Compra a Proveedor');
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [branchId, setBranchId] = useState<string>(assignedBranchId || 'casa_matriz');

  useEffect(() => {
    if (isBranchAdmin && assignedBranchId) {
      setBranchId(assignedBranchId);
    }
  }, [isBranchAdmin, assignedBranchId]);

  // Filtro por año en el Historial de Gastos
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Estado de mensajes y confirmación
  const [successDialog, setSuccessDialog] = useState<boolean>(false);
  const [lastRegisteredAmount, setLastRegisteredAmount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Modal de confirmación para eliminar gasto
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);

  // Historial de gastos conectado a MongoDB
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Descargar gastos y proveedores desde MongoDB
  const fetchExpensesAndSuppliers = async () => {
    setIsRefreshing(true);
    try {
      const [expRes, suppRes] = await Promise.allSettled([
        api.get('/admin/expenses'),
        api.get('/admin/suppliers')
      ]);

      if (expRes.status === 'fulfilled' && expRes.value.data?.success) {
        const normalized = (expRes.value.data.data || []).map(normalizeExpenseFromDB);
        setExpenses(normalized);
        localStorage.setItem('nolimits_expenses_records', JSON.stringify(normalized));
      }

      if (suppRes.status === 'fulfilled' && suppRes.value.data?.success) {
        const supps = (suppRes.value.data.data || []).map((s: any) => ({
          id: s._id?.toString() || s.id,
          companyName: s.companyName || 'Proveedor',
          productsOffered: s.productsOffered || ''
        }));
        setSuppliersList(supps);
      }
    } catch (error) {
      console.error('Error sincronizando gastos desde MongoDB:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndSuppliers();
  }, []);

  // Recargar historial de gastos desde MongoDB
  const handleRefreshExpenses = () => {
    fetchExpensesAndSuppliers();
  };

  // Gastos acotados a la sucursal específica si es Admin de Sucursal
  const branchScopedExpenses = useMemo(() => {
    if (isBranchAdmin && assignedBranchId) {
      return expenses.filter((exp) => exp.branchId === assignedBranchId);
    }
    return expenses;
  }, [expenses, isBranchAdmin, assignedBranchId]);

  // Rango de años que inicia en 2026 y queda abierto hacia el futuro de forma indefinida
  const startYear = 2026;
  const currentNumYear = selectedYear === 'all' ? 2026 : (parseInt(selectedYear, 10) || 2026);
  const currentMaxYear = Math.max(startYear + 15, currentNumYear + 5);

  const dynamicYears = useMemo(() => {
    let maxYear = currentMaxYear;
    branchScopedExpenses.forEach((exp) => {
      if (exp.date && exp.date.length >= 4) {
        const y = parseInt(exp.date.substring(0, 4), 10);
        if (!isNaN(y) && y > maxYear) {
          maxYear = y;
        }
      }
    });

    const list: number[] = [];
    for (let y = startYear; y <= maxYear; y++) {
      list.push(y);
    }
    return list;
  }, [currentMaxYear, branchScopedExpenses]);

  // Controles con flechas anterior y siguiente para el año
  const handlePrevYear = () => {
    if (selectedYear === 'all') return;
    const currentNum = parseInt(selectedYear, 10);
    if (!isNaN(currentNum) && currentNum > 2026) {
      setSelectedYear((currentNum - 1).toString());
    }
  };

  const handleNextYear = () => {
    if (selectedYear === 'all') {
      setSelectedYear('2026');
      return;
    }
    const currentNum = parseInt(selectedYear, 10);
    if (!isNaN(currentNum)) {
      setSelectedYear((currentNum + 1).toString());
    } else {
      setSelectedYear('2026');
    }
  };

  // Gastos filtrados por el año seleccionado
  const filteredExpenses = useMemo(() => {
    if (selectedYear === 'all') return branchScopedExpenses;
    return branchScopedExpenses.filter((exp) => exp.date && exp.date.startsWith(selectedYear));
  }, [branchScopedExpenses, selectedYear]);

  // Total gastado en el filtro seleccionado
  const filteredTotalSpent = useMemo(() => {
    return filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  }, [filteredExpenses]);

  // Exportar a Excel (formato CSV con codificación UTF-8 BOM compatible con Microsoft Excel)
  const handleExportExcel = () => {
    const BOM = '\uFEFF';
    const separator = ';';
    const headers = [
      'Fecha',
      'Descripción',
      'Categoría',
      'Proveedor',
      'Sucursal / Centro',
      'Dinero Gastado (CLP)',
      'Registrado Por'
    ].join(separator);

    const rows = filteredExpenses
      .map((exp) =>
        [
          `"${exp.date}"`,
          `"${exp.description.replace(/"/g, '""')}"`,
          `"${exp.category}"`,
          `"${exp.supplierName || '-'}"`,
          `"${exp.branchName}"`,
          exp.amount,
          `"${exp.registeredBy}"`
        ].join(separator)
      )
      .join('\n');

    const csvContent = BOM + headers + '\n' + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const yearLabel = selectedYear === 'all' ? 'Todos_Los_Anos' : `Ano_${selectedYear}`;
    link.setAttribute('download', `NoLimits_Historial_Gastos_${yearLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const yearLabel =
      selectedYear === 'all' ? 'Todos los Años (Historial Completo)' : `Año ${selectedYear}`;
    const totalCLP = filteredTotalSpent.toLocaleString('es-CL');
    const tableRows = filteredExpenses
      .map(
        (exp) => `
      <tr>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-family: monospace; font-size: 11px;">${exp.date}</td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-weight: 600; font-size: 11px;">${exp.description}</td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-size: 11px;">${exp.category}</td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-size: 11px;">${exp.branchName}</td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; color: #b91c1c; font-weight: bold; font-family: monospace; font-size: 11px;">-$${exp.amount.toLocaleString('es-CL')} CLP</td>
      </tr>
    `
      )
      .join('');

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>No Limits - Historial de Gastos (${yearLabel})</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #111827; }
              .header { border-bottom: 2px solid #003c74; padding-bottom: 12px; margin-bottom: 16px; }
              h1 { color: #003c74; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; }
              .subtitle { font-size: 11px; color: #4b5563; margin-top: 4px; }
              .meta-box { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 8px 12px; border-radius: 4px; font-size: 11px; margin-bottom: 16px; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { background-color: #003c74; color: #ffffff; padding: 8px 8px; text-align: left; font-size: 11px; border: 1px solid #002a52; }
              .total-box { margin-top: 18px; text-align: right; font-size: 13px; font-weight: bold; color: #b91c1c; border-top: 2px solid #e5e7eb; padding-top: 10px; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>No Limits Apparel - Reporte Oficial de Gastos</h1>
              <div class="subtitle">Auditoría Super Administrador // Sistema Financiero de Egresos</div>
            </div>
            <div class="meta-box">
              <strong>Filtro aplicado:</strong> ${yearLabel} &nbsp;|&nbsp;
              <strong>Total registros:</strong> ${filteredExpenses.length} &nbsp;|&nbsp;
              <strong>Fecha de emisión:</strong> ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 85px;">Fecha</th>
                  <th>Descripción del Gasto</th>
                  <th style="width: 140px;">Categoría</th>
                  <th style="width: 180px;">Sucursal / Centro</th>
                  <th style="width: 130px; text-align: right;">Dinero Gastado</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div class="total-box">
              TOTAL GASTOS REGISTRADOS: -$${totalCLP} CLP
            </div>
          </body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1500);
      }, 300);
    }
  };

  // Manejador del campo numérico con auto-separador de miles (formato chileno)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const numericOnly = inputVal.replace(/\D/g, '');

    if (!numericOnly) {
      setRawAmount('');
      setFormattedAmount('');
      return;
    }

    const num = parseInt(numericOnly, 10);
    setRawAmount(numericOnly);
    setFormattedAmount(num.toLocaleString('es-CL'));
    setErrorMsg('');
  };

  // Manejar envío del formulario de registro hacia MongoDB
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setErrorMsg('Debe ingresar una descripción del gasto.');
      return;
    }

    const numAmount = parseInt(rawAmount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Debe ingresar un monto válido mayor a 0 para el dinero gastado.');
      return;
    }

    if (!category) {
      setErrorMsg('Debe seleccionar una categoría para el gasto.');
      return;
    }

    if (!date) {
      setErrorMsg('Debe seleccionar una fecha para el gasto.');
      return;
    }

    const effectiveBranchId = isBranchAdmin && assignedBranchId ? assignedBranchId : branchId;

    // Determinar nombre de sucursal
    const branchName =
      effectiveBranchId === 'casa_matriz' ||
      effectiveBranchId === 'central' ||
      effectiveBranchId === 'branch-corporativo'
        ? 'Casa Matriz / Central (Corporativo)'
        : allBranches.find((b) => b.id === effectiveBranchId)?.city ||
          INITIAL_BRANCHES.find((b) => b.id === effectiveBranchId)?.city ||
          'Sucursal';

    const chosenSupplier =
      category === 'Compra a Proveedor' && selectedSupplierId
        ? suppliersList.find((s) => s.id === selectedSupplierId)
        : undefined;

    const payload = {
      title: description.trim(),
      description: description.trim(),
      amount: numAmount,
      amountClp: numAmount,
      category,
      date,
      branchId: effectiveBranchId,
      branchName,
      supplierId: chosenSupplier ? chosenSupplier.id : null,
      supplierName: chosenSupplier ? chosenSupplier.companyName : '',
      registeredBy: currentUser?.name || 'Root Administrator'
    };

    try {
      const response = await api.post('/admin/expenses', payload);
      if (response.data?.success) {
        const createdRecord = normalizeExpenseFromDB(response.data.data);
        const nextList = [createdRecord, ...expenses];
        setExpenses(nextList);
        localStorage.setItem('nolimits_expenses_records', JSON.stringify(nextList));
        setLastRegisteredAmount(numAmount);
        setSuccessDialog(true);

        // Limpiar campos para el siguiente registro
        setDescription('');
        setRawAmount('');
        setFormattedAmount('');
        setSelectedSupplierId('');
        setErrorMsg('');
      }
    } catch (error: any) {
      console.error('Error registrando gasto en MongoDB:', error);
      setErrorMsg(
        error.response?.data?.message || 'Ocurrió un error al registrar el gasto en MongoDB.'
      );
    }
  };

  // Confirmar eliminación del gasto seleccionado en MongoDB
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      const response = await api.delete(`/admin/expenses/${expenseToDelete.id}`);
      if (response.data?.success) {
        const nextList = expenses.filter((exp) => exp.id !== expenseToDelete.id);
        setExpenses(nextList);
        localStorage.setItem('nolimits_expenses_records', JSON.stringify(nextList));
      }
    } catch (error) {
      console.error('Error eliminando gasto de MongoDB:', error);
      setErrorMsg('No se pudo eliminar el gasto de la base de datos.');
    } finally {
      setExpenseToDelete(null);
    }
  };

  // Métricas acumuladas (acotadas a la sucursal si es Admin de Sucursal)
  const totalSpent = useMemo(() => {
    return branchScopedExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  }, [branchScopedExpenses]);

  const maxExpense = useMemo(() => {
    if (branchScopedExpenses.length === 0) return 0;
    return Math.max(...branchScopedExpenses.map((e) => e.amount));
  }, [branchScopedExpenses]);

  // Color de badge por categoría
  const getCategoryBadgeClass = (catName: string) => {
    switch (catName) {
      case 'Compra a Proveedor':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Servicios':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Pérdida':
      case 'Perdida':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'Sueldo Empleado':
      case 'Sueldo empleado':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Otros':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-4 font-sans text-gray-900 pb-16">
      <WindowFrame
        title={
          isBranchAdmin && activeBranchObj
            ? `BRANCH_EXPENSES.SYS - [Registrar Gasto - Sucursal ${activeBranchObj.city}]`
            : 'SUPER_ROOT_EXPENSES.SYS - [Módulo de Registro de Gastos & Egresos]'
        }
        icon={<PixelIcon name="notepad" size={16} />}
        statusBarText={
          isBranchAdmin && activeBranchObj
            ? `ADMIN SUCURSAL (${activeBranchObj.city.toUpperCase()}) // REGISTRO DE GASTOS DE SUCURSAL // TOTAL SUCURSAL: $${totalSpent.toLocaleString('es-CL')} CLP`
            : `AUDITORÍA SUPER ADMIN // REGISTRO DE GASTOS EN MONGODB // CATEGORÍAS DISPONIBLES: ${allAvailableCategories.length} // TOTAL REGISTRADO: $${totalSpent.toLocaleString('es-CL')} CLP`
        }
      >
        <div className="space-y-4">
          {/* Cabecera y Navegación Superior */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Link to="/admin/inventory">
                  <button
                    type="button"
                    className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1 font-semibold"
                    title="Regresar a Gestión de Inventario"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-green-700" />
                    <span>Inventario</span>
                  </button>
                </Link>

                {/* Cuadro FINANZAS & EGRESOS con texto blanco puro */}
                <span
                  data-force-white="true"
                  className={`${
                    isBranchAdmin ? 'bg-blue-700' : 'bg-red-700'
                  } !text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs tracking-wider uppercase shadow-xs select-none inline-block`}
                  style={{ color: '#ffffff' }}
                >
                  {isBranchAdmin && activeBranchObj
                    ? `ADMIN SUCURSAL · ${activeBranchObj.city.toUpperCase()}`
                    : 'FINANZAS & EGRESOS'}
                </span>

                <h2 className="text-sm font-extrabold text-[#003c74] uppercase tracking-wide">
                  {isBranchAdmin && activeBranchObj
                    ? `Registrar Gasto — Sucursal ${activeBranchObj.city} (${activeBranchObj.name})`
                    : 'Registrar Gasto del Sistema'}
                </h2>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {isBranchAdmin && activeBranchObj
                  ? `Ingreso y control de egresos exclusivos de ${activeBranchObj.city} (${activeBranchObj.name}).`
                  : 'Ingreso de egresos operativos, sueldos, compras a proveedores, pérdidas y servicios sincronizados con MongoDB.'}
              </p>
            </div>
          </div>

          {/* Tarjetas KPI de Gastos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-red-900 flex items-center justify-between">
                <span>TOTAL GASTOS REGISTRADOS</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-black text-red-700 mt-1 font-mono">
                ${totalSpent.toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {branchScopedExpenses.length} egresos contabilizados{' '}
                {isBranchAdmin && activeBranchObj ? `en ${activeBranchObj.city}` : 'en MongoDB'}
              </div>
            </div>

            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                <span>MAYOR EGRESO REGISTRADO</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-gray-900 mt-1 font-mono">
                ${maxExpense.toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Gasto con mayor impacto financiero
              </div>
            </div>

            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-indigo-900 flex items-center justify-between">
                <span>CATEGORÍAS DE EGRESO</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-900 mt-1 font-mono">
                {allAvailableCategories.length} Tipos
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                5 Especiales + {catalogCategories.length} de Catálogo
              </div>
            </div>
          </div>

          {/* FORMULARIO DE REGISTRO DE GASTO (DISEÑO WINDOWS XP) */}
          <div className="bg-[#f0f4f8] border border-[#7f9db9] p-4 winxp-bevel-out space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-300 pb-2">
              <Receipt className="w-5 h-5 text-red-700" />
              <h3 className="font-bold text-xs text-blue-950 uppercase tracking-wide">
                Formulario de Ingreso de Nuevo Gasto
              </h3>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-300 text-red-800 text-xs p-2.5 rounded-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. CAMPO: DESCRIPCIÓN */}
                <div className="space-y-1">
                  <label htmlFor="expense-description" className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                    <span>Descripción del Gasto:</span>
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="expense-description"
                    type="text"
                    required
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Ej: Pago de sueldos, compra insumos telas, reposición etiquetas..."
                    className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner"
                  />
                  <p className="text-[10px] text-gray-500">
                    Escriba el detalle o motivo exacto del egreso para control contable.
                  </p>
                </div>

                {/* 2. CAMPO: DINERO GASTADO (NUMÉRICO CON AUTO-SEPARADOR) */}
                <div className="space-y-1">
                  <label htmlFor="expense-amount" className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-green-700" />
                    <span>Dinero Gastado ($ CLP):</span>
                    <span className="text-red-600">*</span>
                    <span className="text-[10px] text-blue-600 font-normal bg-blue-50 px-1 py-0.2 rounded-xs border border-blue-200">
                      Auto-separador de miles activo
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-xs text-gray-500 select-none">
                      $
                    </span>
                    <input
                      id="expense-amount"
                      type="text"
                      inputMode="numeric"
                      required
                      value={formattedAmount}
                      onChange={handleAmountChange}
                      placeholder="0"
                      className="w-full bg-white border border-[#7f9db9] pl-7 pr-3 py-1.5 text-sm font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {rawAmount
                      ? `Monto exacto: $${parseInt(rawAmount, 10).toLocaleString('es-CL')} Pesos Chilenos`
                      : 'Ingrese sólo números; los separadores de miles se agregan automáticamente.'}
                  </p>
                </div>

                {/* 3. CAMPO: CATEGORÍA (ESPECIALES EXCLUSIVAS + LÍNEAS DE CATÁLOGO) */}
                <div className="space-y-1">
                  <label htmlFor="expense-category" className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-700" />
                    <span>Categoría:</span>
                    <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="expense-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner cursor-pointer font-semibold"
                  >
                    <optgroup label="Categorías Especiales (Exclusivas de Gastos)">
                      <option value="Compra a Proveedor">★ Compra a Proveedor (Telas, insumos, packaging)</option>
                      <option value="Servicios">★ Servicios (Luz, agua, internet, arriendo, software)</option>
                      <option value="Pérdida">★ Pérdida (Mermas, roturas, prendas dañadas)</option>
                      <option value="Sueldo Empleado">★ Sueldo Empleado (Remuneraciones personal y turnos)</option>
                      <option value="Otros">★ Otros (Gastos varios operativos no clasificados)</option>
                    </optgroup>
                    <optgroup label="Líneas de Productos / Catálogo">
                      {catalogCategories.map((catName) => (
                        <option key={catName} value={catName}>
                          Línea: {catName}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-gray-500">
                    Categorías especiales exclusivas de egresos: <strong>Pérdida</strong>, <strong>Sueldo Empleado</strong>, <strong>Otros</strong>, <strong>Servicios</strong> y <strong>Compra a Proveedor</strong>.
                  </p>
                </div>

                {/* 4. CAMPO: FECHA (SELECCIÓN CALENDARIO) */}
                <div className="space-y-1">
                  <label htmlFor="expense-date" className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>Fecha:</span>
                    <span className="text-red-600">*</span>
                    <span className="text-[10px] text-amber-700 font-normal">
                      (Selector de Calendario)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="expense-date"
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner cursor-pointer font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Haga clic en el icono para desplegar el selector de fecha interactivo.
                  </p>
                </div>

                {/* SELECTOR OPCIONAL DE PROVEEDOR (CONECTADO A MONGODB SUPPLIERS) */}
                {category === 'Compra a Proveedor' && (
                  <div className="space-y-1 md:col-span-2 bg-amber-50/70 border border-amber-300 p-2.5 rounded-xs">
                    <label htmlFor="expense-supplier" className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-800" />
                      <span>Proveedor Asociado en MongoDB (Opcional):</span>
                    </label>
                    <select
                      id="expense-supplier"
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner cursor-pointer font-semibold"
                    >
                      <option value="">-- Sin proveedor específico / Compra directa --</option>
                      {suppliersList.map((s) => (
                        <option key={s.id} value={s.id}>
                          🏢 {s.companyName} {s.productsOffered ? `— (${s.productsOffered.slice(0, 60)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 5. SUCURSAL / CENTRO DE COSTOS (BLOQUEADO AUTOMÁTICAMENTE SI ES ADMIN DE SUCURSAL) */}
                <div className="space-y-1 md:col-span-2">
                  <label htmlFor="expense-branch" className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-blue-700" />
                    <span>Sucursal / Centro de Costos:</span>
                  </label>
                  {isBranchAdmin && activeBranchObj ? (
                    <div className="w-full bg-blue-50 border border-blue-400 px-2.5 py-1.5 text-xs font-bold text-[#003c74] flex items-center justify-between shadow-inner">
                      <span>
                        🏪 {activeBranchObj.city} — {activeBranchObj.name} (Asignada automáticamente a:{' '}
                        {currentUser?.name || activeBranchObj.managerName || 'Administrador'})
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 border border-blue-300 rounded-xs">
                        <Lock className="w-3 h-3 text-blue-700" />
                        <span>Sucursal Fija</span>
                      </span>
                    </div>
                  ) : (
                    <select
                      id="expense-branch"
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner cursor-pointer font-bold"
                    >
                      <option value="casa_matriz">🏢 Casa Matriz / Central (Corporativo) - Operaciones Dueño</option>
                      {allBranches
                        .filter((b) => b.id !== 'casa_matriz' && b.id !== 'branch-corporativo' && !b.isCorporate)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            🏪 {b.city} — {b.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Botones de Acción del Formulario */}
              <div className="pt-3 border-t border-gray-300 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDescription('');
                    setRawAmount('');
                    setFormattedAmount('');
                    setSelectedSupplierId('');
                    setErrorMsg('');
                  }}
                  className="winxp-button text-xs py-1.5 px-4 text-gray-800"
                >
                  Limpiar
                </button>

                <button
                  type="submit"
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4 text-blue-800" />
                  <span>Registrar Gasto en el Sistema</span>
                </button>
              </div>
            </form>
          </div>

          {/* TABLA DE AUDITORÍA: HISTORIAL DE GASTOS REGISTRADOS */}
          <div className="bg-white border border-[#7f9db9] p-3 shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-800" />
                <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide">
                  {isBranchAdmin && activeBranchObj
                    ? `Historial de Gastos — Sucursal ${activeBranchObj.city}`
                    : 'Historial de Gastos Registrados'}
                </h4>
                <span className="text-[11px] text-gray-500 font-semibold">
                  ({filteredExpenses.length} de {branchScopedExpenses.length} registros)
                </span>
              </div>

              {/* Controles de Filtrado por Año, Actualización y Exportación */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Botón Actualizar */}
                <button
                  type="button"
                  onClick={handleRefreshExpenses}
                  className="winxp-button text-xs py-1 px-2.5 text-gray-800 font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-blue-50 transition-colors"
                  title="Actualizar registros desde MongoDB"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>

                {/* SELECTOR DE AÑO CON FLECHITAS (◀ / ▶) */}
                <div className="flex items-center bg-white border border-gray-400 p-0.5 text-xs shadow-inner">
                  <Calendar className="w-3.5 h-3.5 text-blue-800 ml-1.5" />
                  <span className="font-bold text-gray-700 text-[11px] ml-1">Año:</span>

                  <button
                    type="button"
                    disabled={selectedYear === 'all' || parseInt(selectedYear, 10) <= 2026}
                    onClick={handlePrevYear}
                    className={`px-1.5 py-0.5 text-xs font-bold transition-colors ${
                      selectedYear === 'all' || parseInt(selectedYear, 10) <= 2026
                        ? 'text-gray-300 cursor-not-allowed select-none'
                        : 'text-blue-900 hover:bg-blue-100 cursor-pointer'
                    }`}
                  >
                    ◀
                  </button>

                  <select
                    id="filter-year-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="text-xs bg-transparent focus:outline-none cursor-pointer font-bold text-blue-900 px-1 py-0.5"
                    aria-label="Seleccionar Año Fiscal"
                  >
                    <option value="all">Todos los años</option>
                    {dynamicYears.map((yr) => (
                      <option key={yr} value={yr.toString()}>
                        Año {yr}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleNextYear}
                    className="px-1.5 py-0.5 text-xs font-bold text-blue-900 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    ▶
                  </button>
                </div>

                {/* Botones de Exportación */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-gray-300">
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="winxp-button text-xs py-1 px-2.5 text-red-900 font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-red-700" />
                    <span>Exportar a PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="winxp-button text-xs py-1 px-2.5 text-green-900 font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-green-700" />
                    <span>Exportar a Excel</span>
                  </button>
                </div>
              </div>
            </div>

            {selectedYear !== 'all' && (
              <div className="bg-blue-50 border border-blue-200 p-2 text-xs text-blue-900 flex items-center justify-between">
                <span>
                  Filtro activo para el año <strong>{selectedYear}</strong>: se registran {filteredExpenses.length} egresos contables.
                </span>
                <span className="font-bold font-mono text-red-700">
                  Subtotal año {selectedYear}: -${filteredTotalSpent.toLocaleString('es-CL')} CLP
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200">
                <thead className="bg-[#e4ebf5] text-blue-950 font-bold border-b border-gray-300 text-[11px]">
                  <tr>
                    <th className="py-1.5 px-2">Fecha</th>
                    <th className="py-1.5 px-2">Descripción</th>
                    <th className="py-1.5 px-2">Categoría</th>
                    <th className="py-1.5 px-2">Sucursal / Centro</th>
                    <th className="py-1.5 px-2 text-right">Dinero Gastado</th>
                    <th className="py-1.5 px-2 text-center w-14">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500 italic">
                        No hay gastos registrados en MongoDB para el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-1.5 px-2 font-mono text-[11px] text-gray-700 whitespace-nowrap">
                          {exp.date}
                        </td>
                        <td className="py-1.5 px-2 font-semibold text-gray-900 max-w-sm truncate" title={exp.description}>
                          <div>{exp.description}</div>
                          {exp.supplierName && (
                            <div className="text-[10px] text-amber-800 font-normal">
                              Proveedor: {exp.supplierName}
                            </div>
                          )}
                        </td>
                        <td className="py-1.5 px-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-xs border ${getCategoryBadgeClass(exp.category)}`}
                          >
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-gray-700">
                          {exp.branchName}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-red-700 text-xs whitespace-nowrap">
                          -${exp.amount.toLocaleString('es-CL')} CLP
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(exp)}
                            className="text-gray-400 hover:text-red-700 p-1 rounded-xs transition-colors cursor-pointer"
                            title="Eliminar este gasto de MongoDB"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </WindowFrame>

      {/* MODAL WINDOWS XP: CONFIRMACIÓN PARA ELIMINAR GASTO */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <WindowFrame
            title="CONFIRMAR_ELIMINACION.EXE - [Advertencia del Sistema]"
            icon={<PixelIcon name="warning" size={16} />}
            showControls={true}
            onClose={() => setExpenseToDelete(null)}
            statusBarText="ADVERTENCIA SUPER ADMIN // CONFIRMACIÓN DE ELIMINACIÓN REQUERIDA"
            className="max-w-md w-full shadow-2xl"
          >
            <div className="p-4 space-y-4 font-sans text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 border border-red-300 rounded-full text-red-700 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-red-900">
                    ¿Estás seguro de que deseas eliminar este gasto?
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    Esta acción eliminará el registro contable de forma definitiva en MongoDB y ajustará el total de egresos en el sistema.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 p-2.5 rounded-xs space-y-1 text-gray-800">
                <div>
                  <span className="font-bold text-gray-600">Descripción: </span>
                  <span className="font-semibold">{expenseToDelete.description}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="font-bold text-gray-600">Categoría: </span>
                    <span className="font-semibold">{expenseToDelete.category}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-600">Fecha: </span>
                    <span className="font-mono">{expenseToDelete.date}</span>
                  </div>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200">
                  <span className="font-bold text-gray-600">Monto a eliminar: </span>
                  <span className="font-mono font-bold text-red-700">
                    -${expenseToDelete.amount.toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-300 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExpenseToDelete(null)}
                  className="winxp-button text-xs py-1.5 px-4 text-gray-800 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="winxp-button text-xs py-1.5 px-4 font-bold !text-black border border-red-700 bg-red-100 hover:bg-red-200 cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                  style={{ color: '#000000' }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-700" />
                  <span style={{ color: '#000000' }} className="!text-black">
                    Sí, Eliminar Gasto
                  </span>
                </button>
              </div>
            </div>
          </WindowFrame>
        </div>
      )}

      {/* DIÁLOGO MODAL WINDOWS XP DE ÉXITO AL REGISTRAR */}
      {successDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <WindowFrame
            title="SISTEMA CONTABLE - [Gasto Registrado con Éxito]"
            icon={<PixelIcon name="info" size={16} />}
            showControls={true}
            onClose={() => setSuccessDialog(false)}
            statusBarText="OPERACIÓN CONFIRMADA // LIBRO DIARIO MONGODB ACTUALIZADO"
            className="max-w-md w-full shadow-2xl"
          >
            <div className="p-4 space-y-3 font-sans">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-blue-900">
                    ¡Gasto Contabilizado en MongoDB!
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Se ha registrado exitosamente el egreso por un valor de{' '}
                    <strong className="font-mono text-red-700 font-bold">
                      ${lastRegisteredAmount.toLocaleString('es-CL')} CLP
                    </strong>{' '}
                    en la base de datos de NoLimits.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-300 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuccessDialog(false)}
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 cursor-pointer"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </WindowFrame>
        </div>
      )}
    </div>
  );
};

export default RegisterExpenseView;