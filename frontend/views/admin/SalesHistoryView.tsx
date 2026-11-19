import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Store,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Download,
  Trash2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Mail,
  Phone,
  User as UserIcon,
  Clock,
  Ban,
  FileText
} from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { INITIAL_BRANCHES } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import api from '../../api/axios';

export type SaleStatus =
  | 'Pago Confirmando'
  | 'Pago Anulado'
  | 'Solicitud recibida'
  | 'En Preparación'
  | 'En transito'
  | 'Entregado'
  | 'Listo para el retiro de sucursal'
  | 'Retirado'
  | 'Pagado'
  | 'En Tránsito'
  | 'Anulado';

export interface SaleRecord {
  id: string;
  folio?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  saleDate: string; // '2026-11-13 14:30'
  branchId: string;
  branchName: string;
  status: SaleStatus;
  deliveryMethod?: 'shipping' | 'pickup';
  itemsSummary: string;
  paymentMethod?: string;
  cancellationReason?: string;
  cancelledAt?: string;
}

// Normalizar estado desde los códigos internos de Order.model.ts a las etiquetas oficiales de SalesHistoryView
const normalizeOrderStatus = (doc: any): SaleStatus => {
  const payStatus = String(doc.paymentStatus || '').toUpperCase();
  const rawStatus = String(doc.status || doc.fulfillmentStatus || '').trim();
  const lower = rawStatus.toLowerCase();

  if (
    payStatus === 'REJECTED' ||
    payStatus === 'REFUNDED' ||
    lower === 'pago anulado' ||
    lower === 'anulado' ||
    lower === 'cancelado' ||
    lower === 'cancelled'
  ) {
    return 'Pago Anulado';
  }

  if (payStatus === 'PENDING' || lower === 'pending_payment' || lower === 'pendiente de pago') {
    return 'Pendiente de Pago' as any;
  }

  switch (lower) {
    case 'en_preparacion':
    case 'en preparación':
    case 'en preparacion':
      return 'En Preparación';
    case 'en_transito':
    case 'en transito':
    case 'en tránsito':
      return 'En transito';
    case 'entregado':
      return 'Entregado';
    case 'listo_retiro':
    case 'listo para el retiro de sucursal':
      return 'Listo para el retiro de sucursal';
    case 'retirado':
      return 'Retirado';
    case 'solicitud_recibida':
    case 'solicitud recibida':
      return 'Solicitud recibida';
    case 'pagado':
    case 'pago confirmando':
    case 'confirmed':
      return 'Pago Confirmando';
    default:
      return (rawStatus as SaleStatus) || 'Pago Confirmando';
  }
};

// Convertir documento IOrder de MongoDB al formato SaleRecord del frontend
const mapOrderDocToSaleRecord = (doc: any, branchesList: any[]): SaleRecord => {
  const rawBranchId = doc.branchId || doc.pickupBranchId || 'casa_matriz';
  const normalizedBranchId =
    rawBranchId === 'branch-corporativo' || rawBranchId === 'central'
      ? 'casa_matriz'
      : rawBranchId;

  const branchObj = branchesList.find((b) => b.id === normalizedBranchId);
  const branchName =
    doc.branchName ||
    (normalizedBranchId === 'casa_matriz'
      ? 'Casa Matriz / Central (Corporativo)'
      : branchObj?.city || branchObj?.name || normalizedBranchId);

  const itemsSummary =
    doc.itemsSummary ||
    (Array.isArray(doc.items) && doc.items.length > 0
      ? doc.items
          .map(
            (it: any) =>
              `${it.quantity || 1}x ${it.name || 'Prenda'}${
                it.size ? ` (${it.size})` : ''
              }`
          )
          .join(', ')
      : 'Venta directa de catálogo');

  let saleDate = doc.saleDate || '';
  if (!saleDate && doc.createdAt) {
    const d = new Date(doc.createdAt);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      saleDate = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    }
  }
  if (!saleDate) {
    saleDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
  }

  return {
    id: doc._id?.toString() || doc.id || `sale_${Date.now()}`,
    folio: doc.orderNumber || doc.folio,
    customerName: doc.customerName || 'Cliente NoLimits',
    customerEmail: doc.customerEmail || doc.guestEmail || 'sin-correo@nolimits.cl',
    customerPhone: doc.customerPhone || '+56 9 0000 0000',
    totalAmount: Number(doc.total ?? doc.totalAmount ?? 0) || 0,
    saleDate,
    branchId: normalizedBranchId,
    branchName,
    status: normalizeOrderStatus(doc),
    deliveryMethod:
      doc.deliveryType === 'retiro' || doc.deliveryMethod === 'pickup'
        ? 'pickup'
        : 'shipping',
    itemsSummary,
    paymentMethod: doc.paymentMethod || 'Webpay Plus',
    cancellationReason: doc.cancellationReason || undefined,
    cancelledAt: doc.cancelledAt || undefined
  };
};

export const SalesHistoryView: React.FC = () => {
  const { currentUser } = useAuth();
  const { branches } = useBranch();
  const allBranches = useMemo(() => {
    const raw = branches.length > 0 ? branches : INITIAL_BRANCHES;
    const seen = new Set<string>();
    return raw.filter((b) => {
      const k = b.id === 'branch-corporativo' ? 'casa_matriz' : b.id;
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

  // Filtros
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    assignedBranchId || 'all'
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (isBranchAdmin && assignedBranchId) {
      setSelectedBranchId(assignedBranchId);
    }
  }, [isBranchAdmin, assignedBranchId]);

  // Filtro por año con selector con flechitas
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Estado de las ventas conectado a la colección 'orders' de MongoDB
  const [sales, setSales] = useState<SaleRecord[]>([]);

  const fetchSalesFromMongoDB = async () => {
    setIsRefreshing(true);
    try {
      const response = await api.get('/admin/orders');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((doc: any) =>
          mapOrderDocToSaleRecord(doc, allBranches)
        );
        setSales(mapped);
        localStorage.setItem('nolimits_sales_history_records', JSON.stringify(mapped));
      }
    } catch (error) {
      console.error('Error cargando historial de ventas desde MongoDB:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalesFromMongoDB();
  }, []);

  // Rango dinámico de años que inicia en 2026 y queda abierto hacia el futuro
  const startYear = 2026;
  const currentNumYear = selectedYear === 'all' ? 2026 : (parseInt(selectedYear, 10) || 2026);
  const currentMaxYear = Math.max(startYear + 15, currentNumYear + 5);

  const dynamicYears = useMemo(() => {
    let maxYear = currentMaxYear;
    sales.forEach((s) => {
      if (s.saleDate && s.saleDate.length >= 4) {
        const y = parseInt(s.saleDate.substring(0, 4), 10);
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
  }, [currentMaxYear, sales]);

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

  // Modal de Anulación / Eliminación
  const [saleToCancel, setSaleToCancel] = useState<SaleRecord | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState<string>(
    'Cancelación solicitada por cliente antes de despacho'
  );
  const [actionType, setActionType] = useState<'cancel' | 'delete'>('cancel');

  const handleRefresh = () => {
    fetchSalesFromMongoDB();
  };

  // Filtrado estricto de ventas
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // 1. REGLA ESTRICTA: Los "Pendiente de Pago" no se muestran en Historial de Ventas
      if (
        s.status === ('Pendiente de Pago' as any) ||
        (s.status as any) === 'pending_payment'
      ) {
        return false;
      }

      // 2. Filtro de Año
      if (selectedYear !== 'all') {
        const saleYear = s.saleDate ? s.saleDate.substring(0, 4) : '';
        if (saleYear !== selectedYear) return false;
      }

      // 3. Filtro de Sucursal
      if (selectedBranchId !== 'all' && s.branchId !== selectedBranchId) {
        return false;
      }

      // 4. Filtro de Estado
      if (statusFilter !== 'all') {
        if (s.status !== statusFilter) {
          if (
            statusFilter === 'Pago Anulado' &&
            (s.status === 'Anulado' || s.status === 'Pago Anulado')
          ) {
            // match
          } else if (
            statusFilter === 'Pago Confirmando' &&
            (s.status === 'Pagado' || s.status === 'Pago Confirmando')
          ) {
            // match
          } else if (
            statusFilter === 'En transito' &&
            (s.status === 'En Tránsito' || s.status === 'En transito')
          ) {
            // match
          } else {
            return false;
          }
        }
      }

      // 5. Filtro de Búsqueda
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesClient = s.customerName.toLowerCase().includes(q);
        const matchesEmail = s.customerEmail.toLowerCase().includes(q);
        const matchesPhone = s.customerPhone.toLowerCase().includes(q);
        const matchesItems = (s.itemsSummary || '').toLowerCase().includes(q);
        return matchesClient || matchesEmail || matchesPhone || matchesItems;
      }

      return true;
    });
  }, [sales, selectedBranchId, statusFilter, searchTerm, selectedYear]);

  // CÁLCULO DE PROMEDIOS: solo ventas activas (no anuladas)
  const activeSales = useMemo(() => {
    return filteredSales.filter(
      (s) => s.status !== 'Pago Anulado' && s.status !== 'Anulado'
    );
  }, [filteredSales]);

  // Total vendido en la selección activa
  const totalMoneySold = useMemo(() => {
    return activeSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  }, [activeSales]);

  // Total de meses únicos con ventas registradas
  const uniqueMonthsCount = useMemo(() => {
    const monthsSet = new Set<string>();
    activeSales.forEach((s) => {
      if (s.saleDate && s.saleDate.length >= 7) {
        monthsSet.add(s.saleDate.substring(0, 7)); // 'YYYY-MM'
      }
    });
    return Math.max(1, monthsSet.size);
  }, [activeSales]);

  // 1. Promedio Mensual de Ventas
  const monthlySalesAverage = useMemo(() => {
    if (activeSales.length === 0) return 0;
    return Math.round(totalMoneySold / uniqueMonthsCount);
  }, [totalMoneySold, uniqueMonthsCount, activeSales.length]);

  // 2. Promedio Anual de Ventas
  const annualSalesAverage = useMemo(() => {
    return monthlySalesAverage * 12;
  }, [monthlySalesAverage]);

  // Exportar a Excel (CSV compatible con Excel)
  const handleExportExcel = () => {
    const BOM = '\uFEFF';
    const separator = ';';
    const headers = [
      'Nombre del Cliente',
      'Correo Electrónico',
      'Teléfono',
      'Total Vendido (CLP)',
      'Fecha de Venta',
      'Sucursal',
      'Estado',
      'Modalidad Entrega',
      'Método de Pago',
      'Detalle Prendas'
    ].join(separator);

    const rows = filteredSales
      .map((s) =>
        [
          `"${s.customerName.replace(/"/g, '""')}"`,
          `"${s.customerEmail}"`,
          `"${s.customerPhone}"`,
          s.totalAmount,
          `"${s.saleDate}"`,
          `"${s.branchName}"`,
          `"${s.status}"`,
          `"${s.deliveryMethod === 'pickup' ? 'Retiro en Sucursal' : 'Envío a Domicilio'}"`,
          `"${s.paymentMethod || 'General'}"`,
          `"${(s.itemsSummary || '').replace(/"/g, '""')}"`
        ].join(separator)
      )
      .join('\n');

    const csvContent = BOM + headers + '\n' + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const yearLabel = selectedYear === 'all' ? 'Todos_Los_Anos' : `Ano_${selectedYear}`;
    link.setAttribute('download', `NoLimits_Historial_Ventas_${yearLabel}.csv`);
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
    const branchLabel =
      selectedBranchId === 'all'
        ? 'Todas las Sucursales'
        : allBranches.find((b) => b.id === selectedBranchId)?.name || selectedBranchId;
    const totalCLP = totalMoneySold.toLocaleString('es-CL');

    const tableRows = filteredSales
      .map(
        (s) => `
      <tr>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-weight: 600; font-size: 11px;">
          ${s.customerName}
          <div style="font-size: 9px; color: #6b7280; font-weight: normal;">${s.itemsSummary || ''}</div>
        </td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-size: 10px;">${s.customerEmail}</td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-size: 10px; font-family: monospace;">${s.customerPhone}</td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; font-weight: bold; font-family: monospace; font-size: 11px; color: #047857;">
          $${s.totalAmount.toLocaleString('es-CL')} CLP
        </td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-size: 10px; font-family: monospace;">${s.saleDate}</td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-size: 10px;">${s.branchName}</td>
        <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: center; font-size: 10px; font-weight: bold;">
          ${s.status}
        </td>
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
            <title>No Limits - Historial de Ventas (${yearLabel})</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #111827; }
              .header { border-bottom: 2px solid #003c74; padding-bottom: 12px; margin-bottom: 16px; }
              h1 { color: #003c74; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; }
              .subtitle { font-size: 11px; color: #4b5563; margin-top: 4px; }
              .meta-box { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 8px 12px; border-radius: 4px; font-size: 11px; margin-bottom: 16px; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { background-color: #003c74; color: #ffffff; padding: 8px 8px; text-align: left; font-size: 11px; border: 1px solid #002a52; }
              .total-box { margin-top: 18px; text-align: right; font-size: 13px; font-weight: bold; color: #047857; border-top: 2px solid #e5e7eb; padding-top: 10px; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>No Limits Apparel - Libro Oficial de Ventas</h1>
              <div class="subtitle">Auditoría Super Administrador // Sistema Comercial & Facturación (MongoDB)</div>
            </div>
            <div class="meta-box">
              <strong>Filtro Año:</strong> ${yearLabel} &nbsp;|&nbsp;
              <strong>Sucursal:</strong> ${branchLabel} &nbsp;|&nbsp;
              <strong>Ventas válidas:</strong> ${filteredSales.length} &nbsp;|&nbsp;
              <strong>Fecha emisión:</strong> ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Cliente & Ítems</th>
                  <th style="width: 140px;">Correo</th>
                  <th style="width: 100px;">Teléfono</th>
                  <th style="width: 110px; text-align: right;">Total Vendido</th>
                  <th style="width: 100px;">Fecha</th>
                  <th style="width: 130px;">Sucursal</th>
                  <th style="width: 120px; text-align: center;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div class="total-box">
              TOTAL VENDIDO EN PERÍODO: $${totalCLP} CLP
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

  // Confirmar anulación o eliminación en MongoDB
  const handleConfirmCancel = async () => {
    if (!saleToCancel) return;

    try {
      if (actionType === 'delete') {
        const res = await api.delete(`/admin/orders/${saleToCancel.id}`);
        if (res.data?.success) {
          const nextList = sales.filter((s) => s.id !== saleToCancel.id);
          setSales(nextList);
          localStorage.setItem('nolimits_sales_history_records', JSON.stringify(nextList));
        }
      } else {
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
        const res = await api.put(`/admin/orders/${saleToCancel.id}/status`, {
          status: 'Pago Anulado',
          fulfillmentStatus: 'Pago Anulado',
          paymentStatus: 'REJECTED',
          cancellationReason: cancellationReasonInput,
          cancelledAt: nowStr,
          auditNote: cancellationReasonInput
        });

        if (res.data?.success) {
          const nextList = sales.map((s) =>
            s.id === saleToCancel.id
              ? {
                  ...s,
                  status: 'Pago Anulado' as SaleStatus,
                  cancellationReason: cancellationReasonInput,
                  cancelledAt: nowStr
                }
              : s
          );
          setSales(nextList);
          localStorage.setItem('nolimits_sales_history_records', JSON.stringify(nextList));
        }
      }
    } catch (error) {
      console.error('Error procesando anulación/eliminación de orden en MongoDB:', error);
    } finally {
      setSaleToCancel(null);
    }
  };

  // Color de badge según el esquema de estados definitivo
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pago Confirmando':
      case 'Pagado':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold';
      case 'Pago Anulado':
      case 'Anulado':
        return 'bg-red-100 text-red-900 border-red-300 font-bold';
      case 'Solicitud recibida':
        return 'bg-amber-100 text-amber-950 border-amber-300 font-bold';
      case 'En Preparación':
        return 'bg-blue-100 text-blue-950 border-blue-300 font-bold';
      case 'En transito':
      case 'En Tránsito':
        return 'bg-indigo-100 text-indigo-950 border-indigo-300 font-bold';
      case 'Entregado':
        return 'bg-green-100 text-green-950 border-green-400 font-black';
      case 'Listo para el retiro de sucursal':
        return 'bg-purple-100 text-purple-950 border-purple-300 font-bold';
      case 'Retirado':
        return 'bg-teal-100 text-teal-950 border-teal-400 font-black';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const activeBranchName = useMemo(() => {
    if (selectedBranchId === 'all') return 'Todas las Sucursales (Consolidado)';
    if (selectedBranchId === 'casa_matriz') return 'Casa Matriz / Central (Corporativo)';
    const found = allBranches.find((b) => b.id === selectedBranchId);
    return found ? `${found.city} (${found.name})` : selectedBranchId;
  }, [selectedBranchId, allBranches]);

  const cancelledSalesCount = useMemo(() => {
    return sales.filter((s) => {
      if (selectedBranchId !== 'all' && s.branchId !== selectedBranchId) return false;
      return s.status === 'Pago Anulado' || s.status === 'Anulado';
    }).length;
  }, [sales, selectedBranchId]);

  return (
    <div className="space-y-4 font-sans text-gray-900 pb-16">
      <WindowFrame
        title={
          isBranchAdmin && activeBranchObj
            ? `BRANCH_ADMIN_SALES_AUDIT.SYS - [Historial de Ventas — Sucursal ${activeBranchObj.city} (${activeBranchObj.name})]`
            : 'SUPER_ROOT_SALES_AUDIT.SYS - [Historial General de Ventas & Facturación]'
        }
        icon={<PixelIcon name="floppy" size={16} />}
        statusBarText={`AUDITORÍA ${isBranchAdmin ? 'PANEL ADMIN SUCURSAL' : 'SUPER ADMIN'} // MONGODB ACTIVO // SUCURSAL: ${selectedBranchId.toUpperCase()} // REGISTROS: ${filteredSales.length} VENTAS // PROMEDIO MENSUAL: $${monthlySalesAverage.toLocaleString('es-CL')} CLP`}
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
                  className={`${
                    isBranchAdmin ? 'bg-emerald-700' : 'bg-blue-800'
                  } !text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs tracking-wider uppercase shadow-xs select-none inline-block`}
                  style={{ color: '#ffffff' }}
                >
                  {isBranchAdmin && activeBranchObj
                    ? `PANEL ADMIN // ${activeBranchObj.city.toUpperCase()}`
                    : 'LIBRO DE VENTAS & CLIENTES'}
                </span>

                <h2 className="text-sm font-extrabold text-[#003c74] uppercase tracking-wide">
                  {isBranchAdmin && activeBranchObj
                    ? `Historial de Ventas — Sucursal ${activeBranchObj.city}`
                    : 'Historial de Ventas (MongoDB)'}
                </h2>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {isBranchAdmin && activeBranchObj
                  ? `Auditoría de clientes, teléfonos, correos electrónicos, totales vendidos y estados exclusivos de la sucursal ${activeBranchObj.city} (${activeBranchObj.name}).`
                  : 'Auditoría completa en tiempo real desde la colección orders de MongoDB: clientes, totales vendidos, fechas, estados y entrega por sucursal.'}
              </p>
            </div>

            {/* Acciones de la barra superior */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="winxp-button text-xs py-1 px-2.5 text-gray-800 font-bold flex items-center gap-1.5 shadow-xs"
                title="Sincronizar ventas desde MongoDB"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="winxp-button text-xs py-1 px-2.5 text-red-900 font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Exportar reporte de ventas a PDF"
              >
                <FileText className="w-3.5 h-3.5 text-red-700" />
                <span>Exportar a PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="winxp-button text-xs py-1 px-2.5 text-green-900 font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Exportar registros a archivo Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-green-700" />
                <span>Exportar a Excel</span>
              </button>
            </div>
          </div>

          {/* MÉTRICAS KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. PROMEDIO MENSUAL DE VENTAS */}
            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                <span>PROMEDIO MENSUAL VENTAS</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-900 mt-1 font-mono">
                ${monthlySalesAverage.toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                Basado en {uniqueMonthsCount} mes(es) con ventas en MongoDB
              </div>
            </div>

            {/* 2. PROMEDIO ANUAL DE VENTAS */}
            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-purple-900 flex items-center justify-between">
                <span>PROMEDIO ANUAL VENTAS</span>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-900 mt-1 font-mono">
                ${annualSalesAverage.toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                Facturación proyectada anualizada
              </div>
            </div>

            {/* 3. TOTAL VENDIDO SELECCIÓN */}
            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-green-900 flex items-center justify-between">
                <span>VENTAS CONFIRMADAS</span>
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-black text-gray-900 mt-1 font-mono">
                ${totalMoneySold.toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {activeSales.length} transacciones activas en MongoDB
              </div>
            </div>

            {/* 4. VENTAS ANULADAS */}
            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-red-900 flex items-center justify-between">
                <span>PAGOS ANULADOS</span>
                <Ban className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-black text-red-700 mt-1 font-mono">
                {cancelledSalesCount} Anuladas
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Órdenes no pagadas a tiempo o canceladas
              </div>
            </div>
          </div>

          {/* BARRA DE FILTROS: SUCURSAL, ESTADO, AÑO Y BÚSQUEDA */}
          <div className="bg-[#f0f4f8] border border-[#7f9db9] p-2.5 winxp-bevel-out flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* FILTRO POR SUCURSAL */}
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 border border-gray-400 shadow-inner">
                <Store className="w-3.5 h-3.5 text-blue-800" />
                <span className="font-bold text-gray-700 text-[11px]">
                  {isBranchAdmin ? 'Sucursal Asignada:' : 'Sucursal:'}
                </span>
                {isBranchAdmin && activeBranchObj ? (
                  <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 border border-emerald-300 rounded-xs">
                    🏪 {activeBranchObj.city} — {activeBranchObj.name}
                  </span>
                ) : (
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="text-xs bg-transparent focus:outline-none cursor-pointer font-bold text-blue-900"
                    aria-label="Filtrar ventas por sucursal"
                  >
                    <option value="all">★ Todas las Sucursales (Consolidado)</option>
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

              {/* FILTRO POR AÑO CON FLECHITAS ◀ / ▶ */}
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

              {/* Filtro por Estado */}
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 border border-gray-400 shadow-inner">
                <Filter className="w-3.5 h-3.5 text-blue-800" />
                <span className="font-bold text-gray-700 text-[11px]">Estado:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-transparent focus:outline-none cursor-pointer font-semibold text-gray-800"
                  aria-label="Filtrar por estado de la venta"
                >
                  <option value="all">Todos los Estados Válidos</option>
                  <optgroup label="Pagos / Sistema POS">
                    <option value="Pago Confirmando">Pago Confirmando</option>
                    <option value="Pago Anulado">Pago Anulado</option>
                  </optgroup>
                  <optgroup label="Estados Envíos a Domicilio">
                    <option value="Solicitud recibida">Solicitud recibida</option>
                    <option value="En Preparación">En Preparación</option>
                    <option value="En transito">En transito</option>
                    <option value="Entregado">Entregado (Exclusivo Domicilio)</option>
                  </optgroup>
                  <optgroup label="Estados Retiro Presencial">
                    <option value="Solicitud recibida">Solicitud recibida</option>
                    <option value="En Preparación">En Preparación</option>
                    <option value="En transito">En transito</option>
                    <option value="Listo para el retiro de sucursal">Listo para el retiro de sucursal</option>
                    <option value="Retirado">Retirado (Exclusivo Presencial)</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Búsqueda en Vivo */}
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 border border-gray-400 shadow-inner w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, email o fono..."
                className="text-xs bg-transparent focus:outline-none w-full text-gray-900"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* TABLA PRINCIPAL: HISTORIAL DE VENTAS */}
          <div className="bg-white border border-[#7f9db9] p-3 shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-800" />
                <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide">
                  Detalle del Libro de Ventas ({filteredSales.length} transacciones)
                </h4>
              </div>
              <span className="text-[11px] text-gray-500 font-semibold">
                Mostrando datos de: <strong>{activeBranchName}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200">
                <thead className="bg-[#e4ebf5] text-blue-950 font-bold border-b border-gray-300 text-[11px]">
                  <tr>
                    <th className="py-2 px-2.5">Nombre del Cliente</th>
                    <th className="py-2 px-2.5">Correo Electrónico</th>
                    <th className="py-2 px-2.5">Teléfono</th>
                    <th className="py-2 px-2.5 text-right">Total Vendido ($)</th>
                    <th className="py-2 px-2.5">Fecha de Venta</th>
                    <th className="py-2 px-2.5">Sucursal</th>
                    <th className="py-2 px-2.5 text-center">Estado</th>
                    <th className="py-2 px-2.5 text-center w-20">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-500 italic">
                        No se encontraron ventas válidas en MongoDB que coincidan con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const isCancelled =
                        sale.status === 'Pago Anulado' || sale.status === 'Anulado';
                      return (
                        <tr
                          key={sale.id}
                          className={`transition-colors ${
                            isCancelled
                              ? 'bg-red-50/40 text-gray-500'
                              : 'hover:bg-blue-50/60 text-gray-900'
                          }`}
                        >
                          {/* 1. Nombre del Cliente e ítems */}
                          <td className="py-2 px-2.5 font-bold">
                            <div className="flex items-center gap-1.5">
                              <UserIcon className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <span className={isCancelled ? 'line-through text-gray-500' : 'text-gray-900'}>
                                {sale.customerName}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-normal truncate max-w-[220px]" title={sale.itemsSummary}>
                              {sale.itemsSummary}
                            </div>
                          </td>

                          {/* 2. Correo Electrónico */}
                          <td className="py-2 px-2.5 font-mono text-[11px] text-gray-700">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate max-w-[160px]" title={sale.customerEmail}>
                                {sale.customerEmail}
                              </span>
                            </div>
                          </td>

                          {/* 3. Teléfono */}
                          <td className="py-2 px-2.5 font-mono text-[11px] text-gray-700 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                              <span>{sale.customerPhone}</span>
                            </div>
                          </td>

                          {/* 4. Total Vendido */}
                          <td className="py-2 px-2.5 text-right font-mono font-black text-xs whitespace-nowrap">
                            <span className={isCancelled ? 'line-through text-red-500' : 'text-green-800'}>
                              ${sale.totalAmount.toLocaleString('es-CL')} CLP
                            </span>
                          </td>

                          {/* 5. Fecha de Venta */}
                          <td className="py-2 px-2.5 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                              <span>{sale.saleDate}</span>
                            </div>
                          </td>

                          {/* Sucursal */}
                          <td className="py-2 px-2.5 text-[11px] text-gray-700 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <Store className="w-3 h-3 text-blue-700" />
                              {sale.branchName}
                            </span>
                          </td>

                          {/* 6. Estado */}
                          <td className="py-2 px-2.5 text-center">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-xs border ${getStatusBadgeClass(sale.status)}`}
                            >
                              {sale.status}
                            </span>
                            {sale.cancellationReason && (
                              <div
                                className="text-[9px] text-red-600 truncate max-w-[120px] mt-0.5"
                                title={`Motivo: ${sale.cancellationReason} (${sale.cancelledAt})`}
                              >
                                {sale.cancellationReason}
                              </div>
                            )}
                          </td>

                          {/* 7. Anular / Eliminar */}
                          <td className="py-2 px-2.5 text-center">
                            {isCancelled ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSaleToCancel(sale);
                                  setActionType('delete');
                                }}
                                className="winxp-button text-[10px] py-0.5 px-2 text-gray-600 hover:text-red-700 border border-gray-300 hover:border-red-400 flex items-center gap-1 mx-auto cursor-pointer"
                                title="Eliminar registro definitivamente de MongoDB"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                                <span>Eliminar</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSaleToCancel(sale);
                                  setActionType('cancel');
                                  setCancellationReasonInput(
                                    'Cliente no pagó en el plazo fijado o solicitó cancelación'
                                  );
                                }}
                                className="winxp-button text-[10px] py-0.5 px-2 font-bold text-red-900 bg-red-50 hover:bg-red-100 border border-red-400 hover:border-red-600 flex items-center gap-1 mx-auto cursor-pointer"
                                title="Anular esta venta en MongoDB"
                              >
                                <XCircle className="w-3 h-3 text-red-700" />
                                <span>Anular</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </WindowFrame>

      {/* MODAL WINDOWS XP DE ANULACIÓN O ELIMINACIÓN DE VENTA */}
      {saleToCancel && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <WindowFrame
            title={
              actionType === 'delete'
                ? 'SISTEMA CONTABLE - [Eliminar Venta de MongoDB]'
                : 'SISTEMA CONTABLE - [Confirmar Anulación de Venta]'
            }
            icon={<PixelIcon name="warning" size={16} />}
            showControls={true}
            onClose={() => setSaleToCancel(null)}
            statusBarText="ATENCIÓN: OPERACIÓN DE AUDITORÍA EN MONGODB"
            className="max-w-md w-full shadow-2xl"
          >
            <div className="p-4 space-y-3 font-sans">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-blue-900">
                    {actionType === 'delete'
                      ? '¿Eliminar permanentemente este registro de venta de MongoDB?'
                      : '¿Está seguro de anular esta venta en MongoDB?'}
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Cliente: <strong>{saleToCancel.customerName}</strong> ({saleToCancel.customerEmail})
                    <br />
                    Monto: <strong className="font-mono text-green-800">${saleToCancel.totalAmount.toLocaleString('es-CL')} CLP</strong>
                    <br />
                    Sucursal: <strong>{saleToCancel.branchName}</strong>
                  </p>
                </div>
              </div>

              {actionType === 'cancel' && (
                <div className="space-y-1 pt-1">
                  <label htmlFor="cancellation-reason" className="block text-xs font-bold text-blue-900">
                    Motivo de la Anulación:
                  </label>
                  <select
                    id="cancellation-reason"
                    value={cancellationReasonInput}
                    onChange={(e) => setCancellationReasonInput(e.target.value)}
                    className="w-full bg-white border border-[#7f9db9] px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                  >
                    <option value="Cliente no pagó en el plazo fijado; prendas liberadas a stock">
                      Cliente no pagó en el plazo fijado; prendas liberadas a stock
                    </option>
                    <option value="Solicitud de reembolso o cancelación del cliente">
                      Solicitud de reembolso o cancelación del cliente
                    </option>
                    <option value="Comprobante bancario no acreditado tras 24 hrs">
                      Comprobante bancario no acreditado tras 24 hrs
                    </option>
                    <option value="Error de digitación o duplicidad de orden">
                      Error de digitación o duplicidad de orden
                    </option>
                    <option value="Falta de stock físico en sucursal">
                      Falta de stock físico en sucursal
                    </option>
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-gray-300 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSaleToCancel(null)}
                  className="winxp-button text-xs py-1.5 px-4 text-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-red-950 bg-red-100 border border-red-600 hover:bg-red-200 cursor-pointer"
                >
                  {actionType === 'delete' ? 'Eliminar de MongoDB' : 'Confirmar Anulación'}
                </button>
              </div>
            </div>
          </WindowFrame>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryView;