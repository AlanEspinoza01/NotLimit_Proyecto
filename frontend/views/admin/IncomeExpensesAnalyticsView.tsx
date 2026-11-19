import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Store,
  ArrowLeft,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { INITIAL_BRANCHES } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import api from '../../api/axios';
import {
  IncomeExpensesBarChart,
  MonthlyFinanceData
} from '../../components/admin/IncomeExpensesBarChart';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const MONTH_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic'
];

// Función auxiliar para normalizar IDs de Casa Matriz
const normalizeBranchKey = (rawBranchId?: string | null): string => {
  if (!rawBranchId) return 'casa_matriz';
  if (rawBranchId === 'branch-corporativo' || rawBranchId === 'central') {
    return 'casa_matriz';
  }
  return rawBranchId;
};

// Función auxiliar para extraer año y mes (0-11) de forma segura desde strings ISO o YYYY-MM-DD
const extractYearAndMonth = (rawDate: any): { year: number; month: number } | null => {
  if (!rawDate) return null;
  const str = String(rawDate).trim();

  // Si viene en formato YYYY-MM-DD (evita desfases de zona horaria UTC)
  const ymdMatch = str.match(/^(\d{4})-(\d{2})/);
  if (ymdMatch) {
    return {
      year: parseInt(ymdMatch[1], 10),
      month: parseInt(ymdMatch[2], 10) - 1
    };
  }

  const parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth()
    };
  }
  return null;
};

export const IncomeExpensesAnalyticsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { branches } = useBranch();
  const allBranches = useMemo(() => {
    const raw = branches.length > 0 ? branches : INITIAL_BRANCHES;
    const seen = new Set<string>();
    return raw.filter((b) => {
      const k = normalizeBranchKey(b.id);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [branches]);

  const isBranchAdmin = currentUser?.role === 'branch_admin';
  const assignedBranchId = isBranchAdmin ? (currentUser?.branchId || 'vina_del_mar') : null;
  const activeBranchObj = assignedBranchId
    ? allBranches.find((b) => b.id === assignedBranchId) || allBranches[0]
    : null;

  // Estados interactivos para filtros (inicia en 2026)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    assignedBranchId || 'all'
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Datos reales descargados desde MongoDB
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [dbExpenses, setDbExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (isBranchAdmin && assignedBranchId) {
      setSelectedBranchId(assignedBranchId);
    }
  }, [isBranchAdmin, assignedBranchId]);

  // Descargar órdenes y gastos reales desde MongoDB
  const fetchFinancialData = async () => {
    setIsRefreshing(true);
    try {
      const [ordersRes, expensesRes] = await Promise.allSettled([
        api.get('/admin/orders'),
        api.get('/admin/expenses')
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.success) {
        setDbOrders(ordersRes.value.data.data || []);
      }

      if (expensesRes.status === 'fulfilled' && expensesRes.value.data?.success) {
        setDbExpenses(expensesRes.value.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando datos financieros desde MongoDB:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const handleRefresh = () => {
    fetchFinancialData();
  };

  // Rango de años que inicia en 2026 y queda abierto hacia el futuro
  const startYear = 2026;
  const currentMaxYear = Math.max(startYear + 10, selectedYear + 5);
  const dynamicYears = useMemo(() => {
    const list: number[] = [];
    for (let y = startYear; y <= currentMaxYear; y++) {
      list.push(y);
    }
    return list;
  }, [currentMaxYear]);

  // Cálculo de datos mensuales reales (Enero a Diciembre) desde MongoDB
  const monthlyData: MonthlyFinanceData[] = useMemo(() => {
    const incomeByMonth = new Array(12).fill(0);
    const expensesByMonth = new Array(12).fill(0);
    const normalizedFilterBranch =
      selectedBranchId === 'all' ? 'all' : normalizeBranchKey(selectedBranchId);

    // 1. Sumar Ingresos desde las órdenes reales de MongoDB (excluyendo órdenes canceladas/rechazadas)
    dbOrders.forEach((order) => {
      const statusUpper = String(order.status || '').toUpperCase();
      const paymentUpper = String(order.paymentStatus || '').toUpperCase();
      if (
        statusUpper === 'CANCELADO' ||
        statusUpper === 'CANCELLED' ||
        statusUpper === 'ANULADO' ||
        paymentUpper === 'REJECTED' ||
        paymentUpper === 'REFUNDED'
      ) {
        return;
      }

      const orderBranch = normalizeBranchKey(order.branchId || order.pickupBranchId);
      if (normalizedFilterBranch !== 'all' && orderBranch !== normalizedFilterBranch) {
        return;
      }

      const dateInfo = extractYearAndMonth(order.createdAt || order.date);
      if (!dateInfo || dateInfo.year !== selectedYear) return;

      const orderTotal = Number(order.total ?? order.totalAmount ?? 0) || 0;
      if (dateInfo.month >= 0 && dateInfo.month < 12) {
        incomeByMonth[dateInfo.month] += orderTotal;
      }
    });

    // 2. Sumar Gastos desde los egresos reales de MongoDB
    dbExpenses.forEach((exp) => {
      const expBranch = normalizeBranchKey(exp.branchId);
      if (normalizedFilterBranch !== 'all' && expBranch !== normalizedFilterBranch) {
        return;
      }

      const dateInfo = extractYearAndMonth(exp.date || exp.expenseDate || exp.createdAt);
      if (!dateInfo || dateInfo.year !== selectedYear) return;

      const expAmount = Number(exp.amount ?? exp.amountClp ?? 0) || 0;
      if (dateInfo.month >= 0 && dateInfo.month < 12) {
        expensesByMonth[dateInfo.month] += expAmount;
      }
    });

    return MONTH_NAMES.map((name, index) => ({
      monthIndex: index,
      monthName: name,
      shortName: MONTH_SHORT[index],
      income: Math.round(incomeByMonth[index]),
      expenses: Math.round(expensesByMonth[index])
    }));
  }, [dbOrders, dbExpenses, selectedYear, selectedBranchId]);

  // Totales acumulados del año
  const totalAnnualIncome = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.income, 0);
  }, [monthlyData]);

  const totalAnnualExpenses = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.expenses, 0);
  }, [monthlyData]);

  const netAnnualProfit = totalAnnualIncome - totalAnnualExpenses;
  const profitMarginPercent =
    totalAnnualIncome > 0
      ? ((netAnnualProfit / totalAnnualIncome) * 100).toFixed(1)
      : '0.0';

  // Nombre de la sucursal activa para el título
  const activeBranchName = useMemo(() => {
    if (selectedBranchId === 'all') {
      return 'Todas las Sucursales (Consolidado)';
    }
    if (selectedBranchId === 'casa_matriz' || selectedBranchId === 'branch-corporativo') {
      return 'Casa Matriz / Central (Corporativo)';
    }
    const branch = allBranches.find((b) => b.id === selectedBranchId);
    return branch ? `${branch.city} — ${branch.name}` : 'Sucursal Seleccionada';
  }, [selectedBranchId, allBranches]);

  // 1. Exportar datos a Excel (CSV compatible con Excel)
  const handleExportExcel = () => {
    const BOM = '\uFEFF';
    let content = `REPORTE FINANCIERO MENSUAL — NO LIMITS APPAREL OS (MONGODB)\n`;
    content += `Año Fiscal:;${selectedYear}\n`;
    content += `Sucursal / Nodo:;${activeBranchName}\n`;
    content += `Fecha de Generación:;${new Date().toLocaleDateString('es-CL')}\n\n`;
    content += `Mes Fiscal;Ingresos ($ CLP);Gastos ($ CLP);Utilidad Neta ($ CLP);Margen Operativo (%)\n`;

    monthlyData.forEach((d) => {
      const net = d.income - d.expenses;
      const margin = d.income > 0 ? ((net / d.income) * 100).toFixed(1) : '0.0';
      content += `${d.monthName};${d.income};${d.expenses};${net};${margin}%\n`;
    });

    content += `TOTAL ANUAL ${selectedYear};${totalAnnualIncome};${totalAnnualExpenses};${netAnnualProfit};${profitMarginPercent}%\n`;

    const blob = new Blob([BOM + content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Desglose_Financiero_${selectedYear}_${selectedBranchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Exportar a PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const rowsHtml = monthlyData
      .map((d) => {
        const net = d.income - d.expenses;
        const margin = d.income > 0 ? ((net / d.income) * 100).toFixed(1) : '0.0';
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-weight: bold; color: #1e293b;">${d.monthName}</td>
            <td style="padding: 8px 12px; text-align: right; color: #15803d; font-family: monospace; font-weight: bold;">$${d.income.toLocaleString('es-CL')}</td>
            <td style="padding: 8px 12px; text-align: right; color: #b91c1c; font-family: monospace; font-weight: bold;">$${d.expenses.toLocaleString('es-CL')}</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: bold; color: #1e3a8a; font-family: monospace;">${net >= 0 ? '+' : '-'}$${Math.abs(net).toLocaleString('es-CL')}</td>
            <td style="padding: 8px 12px; text-align: center; font-family: monospace; font-weight: bold;">${margin}%</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Informe Financiero No Limits - Año ${selectedYear}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 30px; color: #0f172a; }
            .header { border-bottom: 3px solid #0055ea; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 20px; font-weight: 900; color: #003c74; margin: 0; }
            .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
            .kpis { display: flex; gap: 16px; margin-bottom: 24px; }
            .kpi { flex: 1; border: 1px solid #cbd5e1; padding: 10px; background: #f8fafc; border-radius: 4px; }
            .kpi-title { font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase; }
            .kpi-value { font-size: 18px; font-weight: 900; margin-top: 4px; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
            th { background: #0055ea; color: white; padding: 8px 12px; text-align: left; }
            tfoot tr { background: #e0f2fe; border-top: 2px solid #0055ea; font-weight: bold; }
            .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">NO LIMITS APPAREL — INFORME FINANCIERO OFICIAL</h1>
              <div class="sub">Auditoría ${isBranchAdmin ? 'Administrador de Sucursal' : 'Super Administrador'} // ${activeBranchName} // Año Fiscal ${selectedYear}</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              Fecha de emisión: ${new Date().toLocaleDateString('es-CL')}
            </div>
          </div>

          <div class="kpis">
            <div class="kpi">
              <div class="kpi-title">Ingresos Anuales</div>
              <div class="kpi-value" style="color: #15803d;">$${totalAnnualIncome.toLocaleString('es-CL')}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Gastos Anuales</div>
              <div class="kpi-value" style="color: #b91c1c;">$${totalAnnualExpenses.toLocaleString('es-CL')}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Utilidad Neta</div>
              <div class="kpi-value" style="color: #1e3a8a;">$${netAnnualProfit.toLocaleString('es-CL')}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Margen Operativo</div>
              <div class="kpi-value" style="color: #6b21a8;">${profitMarginPercent}%</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Mes Fiscal</th>
                <th style="text-align: right;">Ingresos ($ CLP)</th>
                <th style="text-align: right;">Gastos ($ CLP)</th>
                <th style="text-align: right;">Utilidad Neta ($ CLP)</th>
                <th style="text-align: center;">Margen (%)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 10px 12px; font-weight: 900;">TOTAL ANUAL ${selectedYear}</td>
                <td style="padding: 10px 12px; text-align: right; color: #15803d; font-family: monospace;">$${totalAnnualIncome.toLocaleString('es-CL')}</td>
                <td style="padding: 10px 12px; text-align: right; color: #b91c1c; font-family: monospace;">$${totalAnnualExpenses.toLocaleString('es-CL')}</td>
                <td style="padding: 10px 12px; text-align: right; color: #1e3a8a; font-family: monospace;">$${netAnnualProfit.toLocaleString('es-CL')}</td>
                <td style="padding: 10px 12px; text-align: center; font-family: monospace;">${profitMarginPercent}%</td>
              </tr>
            </tfoot>
          </table>

          <div class="footer">
            Documento emitido por el Sistema de Finanzas y Control de No Limits Apparel OS (Sincronizado con MongoDB).
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 font-sans text-gray-900 pb-16">
      <WindowFrame
        title={
          isBranchAdmin && activeBranchObj
            ? `BRANCH_ADMIN_FINANCES.SYS - [Ingresos vs. Gastos — Sucursal ${activeBranchObj.city} (${activeBranchObj.name})]`
            : 'SUPER_ROOT_FINANCES.SYS - [Analítica Comparativa de Ingresos vs. Gastos]'
        }
        icon={<PixelIcon name="floppy" size={16} />}
        statusBarText={`AUDITORÍA ${isBranchAdmin ? 'PANEL ADMIN SUCURSAL' : 'SUPER ADMIN'} // MONGODB ACTIVO (${dbOrders.length} ÓRDENES · ${dbExpenses.length} GASTOS) // AÑO: ${selectedYear} // UTILIDAD NETA: $${netAnnualProfit.toLocaleString('es-CL')} CLP`}
      >
        <div className="space-y-4">
          {/* Cabecera y Barra de Control */}
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

                <span
                  style={{ color: '#ffffff' }}
                  className="bg-emerald-700 !text-white text-[10px] font-black px-2 py-0.5 rounded-xs tracking-wider uppercase shadow-xs"
                >
                  <span style={{ color: '#ffffff' }} className="!text-white font-black">
                    {isBranchAdmin && activeBranchObj
                      ? `PANEL ADMIN // ${activeBranchObj.city.toUpperCase()}`
                      : 'BALANCE & CASHFLOW'}
                  </span>
                </span>

                <h2 className="text-sm font-extrabold text-[#003c74] uppercase tracking-wide">
                  {isBranchAdmin && activeBranchObj
                    ? `Ingresos vs. Gastos — Sucursal ${activeBranchObj.city}`
                    : 'Ingresos vs. Gastos (Datos Reales MongoDB)'}
                </h2>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {isBranchAdmin && activeBranchObj
                  ? `Flujo de caja mensual exclusivo de la sucursal ${activeBranchObj.city} (${activeBranchObj.name}) calculado desde MongoDB.`
                  : 'Visualización mensual de flujo de caja en vivo con barras de Ingresos (Órdenes en MongoDB) y Gastos (Egresos en MongoDB) de Enero a Diciembre.'}
              </p>
            </div>

            {/* Acciones y Filtros de la Barra Superior */}
            <div className="flex flex-wrap items-center gap-2">
              {/* SELECTOR DE AÑO */}
              <div className="flex items-center bg-white border border-gray-400 p-0.5 text-xs shadow-inner">
                <Calendar className="w-3.5 h-3.5 text-blue-800 ml-1.5" />
                <span className="font-bold text-gray-700 text-[11px] ml-1">Año:</span>

                <button
                  type="button"
                  disabled={selectedYear <= 2026}
                  onClick={() => setSelectedYear((prev) => Math.max(2026, prev - 1))}
                  className={`px-1.5 py-0.5 text-xs font-bold ${
                    selectedYear <= 2026
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-blue-900 hover:bg-blue-50 cursor-pointer'
                  }`}
                  title={selectedYear <= 2026 ? '2026 es el año inicial del sistema' : 'Año anterior'}
                >
                  ◀
                </button>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="text-xs bg-transparent focus:outline-none cursor-pointer font-bold text-blue-900 px-1 py-0.5"
                  aria-label="Seleccionar Año Fiscal"
                >
                  {dynamicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Año {yr}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setSelectedYear((prev) => prev + 1)}
                  className="px-1.5 py-0.5 text-xs font-bold text-blue-900 hover:bg-blue-50 cursor-pointer"
                  title="Avanzar al siguiente año de forma indefinida"
                >
                  ▶
                </button>
              </div>

              {/* FILTRO DE SUCURSAL */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border border-gray-400 text-xs shadow-inner">
                <Store className="w-3.5 h-3.5 text-blue-800" />
                <span className="font-bold text-gray-700 text-[11px]">
                  {isBranchAdmin ? 'Sucursal Asignada:' : 'Sucursal:'}
                </span>
                {isBranchAdmin && activeBranchObj ? (
                  <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 border border-emerald-300 rounded-xs">
                    🏪 {activeBranchObj.city} ({activeBranchObj.name})
                  </span>
                ) : (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="text-xs bg-transparent focus:outline-none cursor-pointer font-bold text-blue-900"
                    aria-label="Filtrar por Sucursal"
                  >
                    <option value="all">★ Todas las Sucursales (Consolidado)</option>
                    <option value="casa_matriz">🏢 Casa Matriz / Central (Corporativo)</option>
                    {allBranches
                      .filter((b) => b.id !== 'casa_matriz' && b.id !== 'branch-corporativo' && !b.isCorporate)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          🏪 {b.city} ({b.name})
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1.5 font-semibold"
                title="Sincronizar con MongoDB"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Resumen Financiero Anual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Ingresos Totales */}
            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-green-900 flex items-center justify-between">
                <span>INGRESOS ANUALES ({selectedYear})</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-black text-green-700 mt-1 font-mono">
                ${totalAnnualIncome.toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Ventas y órdenes en MongoDB
              </div>
            </div>

            {/* 2. Gastos Totales */}
            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-red-900 flex items-center justify-between">
                <span>GASTOS ANUALES ({selectedYear})</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-black text-red-700 mt-1 font-mono">
                ${totalAnnualExpenses.toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Egresos registrados en MongoDB
              </div>
            </div>

            {/* 3. Utilidad Neta */}
            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                <span>UTILIDAD NETA ({selectedYear})</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div
                className={`text-2xl font-black mt-1 font-mono ${
                  netAnnualProfit >= 0 ? 'text-blue-900' : 'text-red-700'
                }`}
              >
                {netAnnualProfit < 0 ? '-' : ''}${Math.abs(netAnnualProfit).toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {netAnnualProfit >= 0 ? 'Balance positivo consolidado' : 'Déficit operativo acumulado'}
              </div>
            </div>

            {/* 4. Margen Operativo */}
            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-purple-900 flex items-center justify-between">
                <span>MARGEN OPERATIVO</span>
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-900 mt-1 font-mono">
                {profitMarginPercent}%
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Eficiencia financiera del negocio
              </div>
            </div>
          </div>

          {/* COMPONENTE PRINCIPAL: GRÁFICO DE BARRAS DE INGRESOS Y GASTOS */}
          <section>
            <IncomeExpensesBarChart
              data={monthlyData}
              year={selectedYear}
              branchName={activeBranchName}
            />
          </section>

          {/* TABLA DE AUDITORÍA: DESGLOSE MES A MES CON BOTONES PDF Y EXCEL */}
          <div className="bg-white border border-[#7f9db9] p-3 shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-800" />
                <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide">
                  Desglose Mensual Detallado — Año {selectedYear} ({activeBranchName})
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1.5 font-bold shadow-xs hover:bg-red-50"
                  title="Generar e imprimir informe PDF oficial"
                >
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  <span>Exportar a PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1.5 font-bold shadow-xs hover:bg-green-50"
                  title="Descargar archivo compatible con Microsoft Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-700" />
                  <span>Exportar a Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200">
                <thead className="bg-[#e4ebf5] text-blue-950 font-bold border-b border-gray-300 text-[11px]">
                  <tr>
                    <th className="py-1.5 px-3">Mes Fiscal</th>
                    <th className="py-1.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-green-900">
                        <span className="w-2 h-2 rounded-full bg-green-600" />
                        Ingresos ($ CLP)
                      </span>
                    </th>
                    <th className="py-1.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-red-900">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        Gastos ($ CLP)
                      </span>
                    </th>
                    <th className="py-1.5 px-3 text-right">Utilidad Neta</th>
                    <th className="py-1.5 px-3 text-center">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monthlyData.map((item) => {
                    const net = item.income - item.expenses;
                    const isPositive = net >= 0;
                    const margin =
                      item.income > 0 ? ((net / item.income) * 100).toFixed(1) : '0.0';

                    return (
                      <tr key={item.monthName} className="hover:bg-blue-50/50 transition-colors">
                        <td className="py-2 px-3 font-bold text-gray-900 text-xs">
                          {item.monthName}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-green-700 text-xs">
                          ${item.income.toLocaleString('es-CL')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-red-700 text-xs">
                          ${item.expenses.toLocaleString('es-CL')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-xs">
                          <span className={isPositive ? 'text-blue-900 font-extrabold' : 'text-amber-800'}>
                            {isPositive ? '+' : '-'}${Math.abs(net).toLocaleString('es-CL')}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-semibold text-gray-700">
                          {margin}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#eaf2fc] border-t-2 border-blue-900 font-bold text-xs">
                  <tr>
                    <td className="py-2 px-3 text-blue-950 uppercase font-black">
                      Total Anual {selectedYear}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-green-800 text-sm">
                      ${totalAnnualIncome.toLocaleString('es-CL')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-red-800 text-sm">
                      ${totalAnnualExpenses.toLocaleString('es-CL')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-blue-950 text-sm">
                      {netAnnualProfit < 0 ? '-' : ''}${Math.abs(netAnnualProfit).toLocaleString('es-CL')}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-black text-purple-900 text-xs">
                      {profitMarginPercent}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  );
};