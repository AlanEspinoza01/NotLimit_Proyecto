import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  DollarSign,
  Bell,
  CheckCircle2,
  UserX,
  Plus,
  RefreshCw
} from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { INITIAL_BRANCHES } from '../../services/mockData';
import { useBranch } from '../../context/BranchContext';
import { BlacklistCustomer } from '../../types';
import api from '../../api/axios';

export const LogisticsAnalyticsView: React.FC = () => {
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

  const [selectedSubTab, setSelectedSubTab] = useState<'financial' | 'blacklist' | 'reminders'>('financial');

  // Estados conectados a MongoDB
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [dbExpenses, setDbExpenses] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);
  const [dbAlerts, setDbAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estado del formulario para bloquear cliente en Lista Negra (MongoDB)
  const [newBlName, setNewBlName] = useState('');
  const [newBlRut, setNewBlRut] = useState('');
  const [newBlReason, setNewBlReason] = useState('');
  const [newBlDebt, setNewBlDebt] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Descargar todas las colecciones necesarias desde MongoDB
  const fetchAllLogisticsData = async (showNotice = false) => {
    setIsLoading(true);
    try {
      const [ordRes, expRes, prodRes, custRes, alertRes] = await Promise.all([
        api.get('/admin/orders'),
        api.get('/admin/expenses'),
        api.get('/admin/products'),
        api.get('/admin/customers'),
        api.get('/admin/alerts')
      ]);

      if (ordRes.data?.success && Array.isArray(ordRes.data.data)) {
        setDbOrders(ordRes.data.data);
      }
      if (expRes.data?.success && Array.isArray(expRes.data.data)) {
        setDbExpenses(expRes.data.data);
      }
      if (prodRes.data?.success && Array.isArray(prodRes.data.data)) {
        setDbProducts(prodRes.data.data);
      }
      if (custRes.data?.success && Array.isArray(custRes.data.data)) {
        setDbCustomers(custRes.data.data);
      }
      if (alertRes.data?.success && Array.isArray(alertRes.data.data)) {
        setDbAlerts(alertRes.data.data);
      }

      if (showNotice) {
        triggerToast('✓ Centro logístico y financiero sincronizado con MongoDB');
      }
    } catch (error) {
      console.error('Error cargando datos en LogisticsAnalyticsView:', error);
      triggerToast('Error al sincronizar datos desde MongoDB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLogisticsData(false);
  }, []);

  // 1. Filtrar órdenes confirmadas reales
  const confirmedOrders = useMemo(() => {
    return dbOrders.filter((ord) => {
      const paySt = String(ord.paymentStatus || '').toUpperCase();
      const st = String(ord.status || ord.fulfillmentStatus || '').toLowerCase();
      return (
        paySt === 'CONFIRMED' &&
        st !== 'pago anulado' &&
        st !== 'anulado' &&
        st !== 'cancelado' &&
        st !== 'rechazada por admin' &&
        st !== 'pendiente de pago'
      );
    });
  }, [dbOrders]);

  // 2. KPIs Financieros Globales desde MongoDB
  const totalGlobalSales = useMemo(
    () =>
      confirmedOrders.reduce(
        (acc, ord) => acc + (Number(ord.total ?? ord.confirmedRevenue ?? 0) || 0),
        0
      ),
    [confirmedOrders]
  );

  const totalGlobalExpenses = useMemo(
    () => dbExpenses.reduce((acc, exp) => acc + (Number(exp.amount ?? 0) || 0), 0),
    [dbExpenses]
  );

  const totalGlobalProfit = totalGlobalSales - totalGlobalExpenses;

  const profitMarginPercent = useMemo(() => {
    if (totalGlobalSales <= 0) return '0.0';
    return ((totalGlobalProfit / totalGlobalSales) * 100).toFixed(1);
  }, [totalGlobalSales, totalGlobalProfit]);

  // 3. Desglose Granular por Sucursal desde MongoDB
  const branchAnalyticsList = useMemo(() => {
    return allBranches.map((branch) => {
      const bId = branch.id;

      const branchOrders = confirmedOrders.filter((ord) => {
        const rawB = ord.pickupBranchId || ord.branchId || 'casa_matriz';
        const normB = rawB === 'branch-corporativo' || rawB === 'central' ? 'casa_matriz' : rawB;
        return normB === bId || ord.branchId === bId;
      });

      const branchExpenses = dbExpenses.filter((exp) => {
        const rawB = exp.branchId || 'casa_matriz';
        const normB = rawB === 'branch-corporativo' || rawB === 'central' ? 'casa_matriz' : rawB;
        return normB === bId;
      });

      const totalSales = branchOrders.reduce(
        (acc, ord) => acc + (Number(ord.total ?? ord.confirmedRevenue ?? 0) || 0),
        0
      );
      const totalExpenses = branchExpenses.reduce(
        (acc, exp) => acc + (Number(exp.amount ?? 0) || 0),
        0
      );
      const netProfit = totalSales - totalExpenses;

      // Producto estrella en la sucursal
      const soldByProduct = new Map<string, { title: string; unitsSold: number }>();
      branchOrders.forEach((ord) => {
        const items = Array.isArray(ord.items) ? ord.items : [];
        items.forEach((it: any) => {
          const title = String(it.name || it.title || 'Prenda NoLimits').trim();
          const key = title.toLowerCase();
          const prev = soldByProduct.get(key) || { title, unitsSold: 0 };
          prev.unitsSold += Number(it.quantity) || 1;
          soldByProduct.set(key, prev);
        });
      });

      const sortedTop = Array.from(soldByProduct.values()).sort(
        (a, b) => b.unitsSold - a.unitsSold
      );
      const topProduct = sortedTop[0] || {
        title: dbProducts[0]?.title || 'Sin ventas aún',
        unitsSold: 0
      };

      // Producto con mayor stock sin rotar (rezagado)
      const laggingCandidate =
        dbProducts.length > 0
          ? [...dbProducts]
              .map((p) => {
                const title = p.title || p.name || 'Prenda';
                const breakdown = Array.isArray(p.sizeBreakdown) ? p.sizeBreakdown : [];
                const stockLeft =
                  breakdown.length > 0
                    ? breakdown.reduce(
                        (acc: number, s: any) => acc + (Number(s.quantity ?? s.stock ?? 0) || 0),
                        0
                      )
                    : Number(p.totalStock ?? p.stock ?? 0) || 0;
                return { title, stockLeft };
              })
              .sort((a, b) => b.stockLeft - a.stockLeft)[0]
          : { title: 'Sin productos', stockLeft: 0 };

      return {
        branchId: bId,
        branchName: `${branch.city} (${branch.name})`,
        ordersProcessed: branchOrders.length,
        totalSales,
        totalExpenses,
        netProfit,
        topProduct,
        laggingProduct: laggingCandidate
      };
    });
  }, [allBranches, confirmedOrders, dbExpenses, dbProducts]);

  // 4. Lista Negra sincronizada con la colección 'users' de MongoDB
  const blacklist = useMemo<BlacklistCustomer[]>(() => {
    return dbCustomers
      .filter((c) => {
        const tags: string[] = Array.isArray(c.tags) ? c.tags : [];
        const reports: any[] = Array.isArray(c.blacklistReports) ? c.blacklistReports : [];
        return tags.includes('Lista Negra') || reports.length > 0;
      })
      .map((c) => {
        const reports: any[] = Array.isArray(c.blacklistReports) ? c.blacklistReports : [];
        const latestReport = reports[0];
        const totalDebt = reports.reduce(
          (acc, r) => acc + (Number(r.debtAmount ?? 0) || 0),
          0
        );

        return {
          id: String(c._id || c.id),
          name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Cliente Bloqueado',
          rut: c.rut || 'Sin RUT',
          email: c.email || 'sin-correo@nolimits.cl',
          phone: c.phone || '+56 9 0000 0000',
          debtAmount: totalDebt,
          reason: latestReport?.reason || 'Incumplimiento registrado en Lista Negra',
          incidentCount: Math.max(1, reports.length),
          status: 'active_blocked',
          dateAdded:
            latestReport?.date ||
            (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '2026-11-14')
        };
      });
  }, [dbCustomers]);

  // Bloquear nuevo cliente en Lista Negra guardándolo en MongoDB ('users')
  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlName.trim() || !newBlRut.trim()) return;

    const cleanName = newBlName.trim();
    const nameParts = cleanName.split(/\s+/);
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || '';
    const cleanRut = newBlRut.trim();
    const debtNum = Number(newBlDebt) || 0;
    const reasonText = newBlReason.trim() || 'Incumplimiento reiterado de pago en Live Stream';
    const nowFormatted = new Date().toLocaleString('es-CL');

    const newReport = {
      id: `bl_rep_${Date.now()}`,
      date: nowFormatted,
      reason: reasonText,
      debtAmount: debtNum,
      recordedBy: 'Super Admin (Centro Logístico)'
    };

    try {
      // Buscar si el cliente ya existe en MongoDB por RUT o nombre
      const existingCustomer = dbCustomers.find(
        (c) =>
          (c.rut && String(c.rut).trim().toLowerCase() === cleanRut.toLowerCase()) ||
          String(c.name || '').trim().toLowerCase() === cleanName.toLowerCase()
      );

      if (existingCustomer) {
        const custId = existingCustomer._id || existingCustomer.id;
        const prevTags: string[] = Array.isArray(existingCustomer.tags)
          ? existingCustomer.tags.filter((t: string) => t !== 'Normal')
          : [];
        const updatedTags = prevTags.includes('Lista Negra')
          ? prevTags
          : [...prevTags, 'Lista Negra'];
        const updatedReports = [
          newReport,
          ...(Array.isArray(existingCustomer.blacklistReports)
            ? existingCustomer.blacklistReports
            : [])
        ];

        const res = await api.put(`/admin/customers/${custId}`, {
          tags: updatedTags,
          blacklistReports: updatedReports
        });

        if (res.data?.success) {
          setDbCustomers((prev) =>
            prev.map((c) => (String(c._id || c.id) === String(custId) ? res.data.data : c))
          );
        }
      } else {
        const generatedEmail = `${cleanName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '.')}.${Date.now().toString().slice(-3)}@nolimits.cl`;

        const createRes = await api.post('/admin/customers', {
          firstName,
          lastName,
          rut: cleanRut,
          email: generatedEmail,
          phone: '+56 9 0000 0000',
          tags: ['Lista Negra'],
          blacklistReports: [newReport]
        });

        if (createRes.data?.success && createRes.data.data) {
          setDbCustomers((prev) => [createRes.data.data, ...prev]);
        }
      }

      setNewBlName('');
      setNewBlRut('');
      setNewBlReason('');
      setNewBlDebt('');
      triggerToast(`✓ Cliente "${cleanName}" bloqueado en Lista Negra en MongoDB`);
    } catch (error) {
      console.error('Error agregando cliente a Lista Negra en MongoDB:', error);
      triggerToast('Error al registrar el bloqueo en MongoDB');
    }
  };

  // Desbloquear cliente de Lista Negra en MongoDB
  const handleUnblockCustomer = async (customerId: string, customerName: string) => {
    try {
      const target = dbCustomers.find((c) => String(c._id || c.id) === customerId);
      const remainingTags = Array.isArray(target?.tags)
        ? target.tags.filter((t: string) => t !== 'Lista Negra')
        : [];
      const finalTags = remainingTags.length > 0 ? remainingTags : ['Normal'];

      const res = await api.put(`/admin/customers/${customerId}`, {
        tags: finalTags,
        blacklistReports: []
      });

      if (res.data?.success) {
        setDbCustomers((prev) =>
          prev.map((c) => (String(c._id || c.id) === customerId ? res.data.data : c))
        );
        triggerToast(`✓ Cliente "${customerName}" desbloqueado en MongoDB`);
      }
    } catch (error) {
      console.error('Error desbloqueando cliente en MongoDB:', error);
      triggerToast('Error al desbloquear cliente en MongoDB');
    }
  };

  // 5. Alertas y Cobranzas conectadas a la colección 'system_alerts' de MongoDB
  const activeAlerts = useMemo(
    () => dbAlerts.filter((a) => a.status !== 'resolved' && a.status !== 'dismissed'),
    [dbAlerts]
  );

  const handleCreateReminder = async () => {
    try {
      const payload = {
        category: 'cobro_pendiente',
        title: `Recordatorio Manual de Cobro (${new Date().toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit'
        })})`,
        description:
          'Recordatorio programado para verificar y cobrar saldo pendiente de reserva Live Stream.',
        severity: 'warning',
        customerName: 'Reserva Live Stream',
        customerRut: 'Sin RUT',
        customerPhone: '+56 9 0000 0000',
        customerEmail: 'pagos@nolimits.cl',
        branchId: 'casa_matriz',
        deliveryType: 'retiro',
        deliveryMethodText: 'Retiro en Sucursal',
        amount: 0,
        dueHours: 2,
        timeLimitText: '2 horas',
        status: 'active',
        isAutomated: false
      };

      const res = await api.post('/admin/alerts', payload);
      if (res.data?.success && res.data.data) {
        setDbAlerts((prev) => [res.data.data, ...prev]);
        triggerToast('✓ Recordatorio de cobro guardado en MongoDB (system_alerts)');
      }
    } catch (error) {
      console.error('Error creando recordatorio en MongoDB:', error);
      triggerToast('Error al crear recordatorio en MongoDB');
    }
  };

  const handleUpdateAlertHours = async (alertId: string, hours: number) => {
    try {
      const res = await api.put(`/admin/alerts/${alertId}`, {
        dueHours: hours,
        timeLimitText: `${hours} ${hours === 1 ? 'hora' : 'horas'}`
      });
      if (res.data?.success) {
        setDbAlerts((prev) =>
          prev.map((a) =>
            String(a._id || a.id) === alertId
              ? { ...a, dueHours: hours, timeLimitText: `${hours} horas` }
              : a
          )
        );
        triggerToast(`✓ Plazo actualizado a ${hours}h en MongoDB`);
      }
    } catch (error) {
      console.error('Error actualizando plazo de alerta:', error);
    }
  };

  const handleResolveAlertCobro = async (alertObj: any) => {
    const alertId = String(alertObj._id || alertObj.id);
    try {
      await api.put(`/admin/alerts/${alertId}`, {
        status: 'resolved',
        resolvedAt: new Date().toLocaleString('es-CL'),
        paymentResolutionStatus: 'confirmed'
      });
      setDbAlerts((prev) => prev.filter((a) => String(a._id || a.id) !== alertId));
      triggerToast(`✓ Cobro ejecutado y alerta resuelta en MongoDB`);
      fetchAllLogisticsData(false);
    } catch (error) {
      console.error('Error ejecutando cobro de alerta:', error);
      triggerToast('Error al resolver el cobro en MongoDB');
    }
  };

  return (
    <div className="space-y-4 font-sans text-gray-900 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#ece9d8] border-2 border-blue-900 p-4 shadow-xl flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-700 animate-spin" />
            <span className="font-bold text-xs text-blue-950">
              SINCRONIZANDO FINANZAS, LISTA NEGRA Y ALERTAS DESDE MONGODB...
            </span>
          </div>
        </div>
      )}

      <WindowFrame
        title="LOGISTICS_AND_FINANCE_OS.EXE - [Dashboard Analítico Central (MongoDB)]"
        icon={<PixelIcon name="computer" size={16} />}
        statusBarText={`PROCESADOR DE AUDITORÍA MONGODB: EN LÍNEA // ÓRDENES CONFIRMADAS: ${confirmedOrders.length} // LISTA NEGRA: ${blacklist.length} // ALERTAS ACTIVAS: ${activeAlerts.length}`}
      >
        <div className="space-y-4">
          {toastMessage && (
            <div className="bg-emerald-50 border border-emerald-400 text-emerald-900 px-3 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs">
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-emerald-800 font-black ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Cabecera y Pestañas Estilo Windows XP */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#003c74] tracking-tight">
                CENTRO LOGÍSTICO, FINANCIERO Y CONTROL DE RIESGO (MONGODB)
              </h2>
              <span className="text-xs text-blue-700 font-semibold">
                // Supervisión Multi-Sucursal en Tiempo Real ({allBranches.length} Nodos Conectados)
              </span>
            </div>

            {/* Pestañas clásicas Windows XP */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedSubTab('financial')}
                className={`winxp-button text-xs py-1 px-3 ${
                  selectedSubTab === 'financial'
                    ? 'winxp-button-primary bg-[#e6f0fa] font-bold text-blue-900'
                    : 'text-gray-700'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-green-700 mr-1 inline" />
                <span>Finanzas & Proyecciones</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSubTab('blacklist')}
                className={`winxp-button text-xs py-1 px-3 ${
                  selectedSubTab === 'blacklist'
                    ? 'winxp-button-primary bg-[#e6f0fa] font-bold text-blue-900'
                    : 'text-gray-700'
                }`}
              >
                <UserX className="w-3.5 h-3.5 text-red-600 mr-1 inline" />
                <span>Lista Negra ({blacklist.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSubTab('reminders')}
                className={`winxp-button text-xs py-1 px-3 ${
                  selectedSubTab === 'reminders'
                    ? 'winxp-button-primary bg-[#e6f0fa] font-bold text-blue-900'
                    : 'text-gray-700'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-amber-600 mr-1 inline" />
                <span>Alertas & Cobranzas ({activeAlerts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => fetchAllLogisticsData(true)}
                className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1"
                title="Sincronizar con MongoDB"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* SubTab 1: Finanzas & Proyecciones */}
          {selectedSubTab === 'financial' && (
            <div className="space-y-4">
              {/* Tarjetas KPI Financieras */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* KPI 1: Ventas */}
                <div className="bg-white border border-[#7f9db9] p-3.5 shadow-xs winxp-bevel-out">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase">
                      Ventas Globales Confirmadas
                    </span>
                    <TrendingUp className="w-4 h-4 text-blue-700" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1 font-sans">
                    ${totalGlobalSales.toLocaleString('es-CL')}
                  </div>
                  <div className="text-[11px] text-green-700 font-semibold mt-1 flex items-center gap-1">
                    <span>✓ {confirmedOrders.length} órdenes confirmadas en MongoDB</span>
                  </div>
                </div>

                {/* KPI 2: Gastos */}
                <div className="bg-white border border-[#7f9db9] p-3.5 shadow-xs winxp-bevel-out">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-900 uppercase">
                      Gastos Operativos & Envíos
                    </span>
                    <DollarSign className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1 font-sans">
                    ${totalGlobalExpenses.toLocaleString('es-CL')}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">
                    {dbExpenses.length} egreso(s) registrado(s) en colección expenses
                  </div>
                </div>

                {/* KPI 3: Ganancia Neta */}
                <div className="bg-white border border-[#0055ea] p-3.5 shadow-xs winxp-bevel-out">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-green-900 uppercase">
                      Ganancia Neta Total
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div
                    className={`text-2xl font-bold mt-1 font-sans ${
                      totalGlobalProfit >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    ${totalGlobalProfit.toLocaleString('es-CL')}
                  </div>
                  <div className="text-[11px] text-blue-900 font-bold mt-1">
                    Margen operativo real: {profitMarginPercent}%
                  </div>
                </div>
              </div>

              {/* Comparativa por Sucursales */}
              <div className="bg-[#f8fafc] border border-gray-400 p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                  <h3 className="text-xs font-bold text-[#003c74] uppercase tracking-wide">
                    Desglose Granular por Sucursal (MongoDB)
                  </h3>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {branchAnalyticsList.length} Nodos Operativos Conectados
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {branchAnalyticsList.map((b) => (
                    <div
                      key={b.branchId}
                      className="bg-white border border-[#7f9db9] p-3 space-y-2 shadow-xs"
                    >
                      <div className="flex justify-between items-center border-b border-gray-200 pb-1.5 gap-1">
                        <span className="font-bold text-blue-900 text-xs truncate">
                          {b.branchName}
                        </span>
                        <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-bold px-1.5 py-0.2 rounded-xs shrink-0">
                          {b.ordersProcessed} pedidos
                        </span>
                      </div>

                      <div className="space-y-1 text-gray-700">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ventas:</span>
                          <span className="font-semibold">
                            ${b.totalSales.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gastos:</span>
                          <span className="text-red-700">
                            -${b.totalExpenses.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div
                          className={`flex justify-between font-bold border-t border-gray-200 pt-1 ${
                            b.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          <span>Ganancia:</span>
                          <span>${b.netProfit.toLocaleString('es-CL')}</span>
                        </div>
                      </div>

                      {/* Producto estrella y stock actual */}
                      <div className="pt-2 border-t border-gray-200 text-[11px] space-y-1">
                        <div className="text-blue-900 font-semibold truncate flex items-center gap-1">
                          <span className="text-amber-500">★</span>
                          <span className="truncate">
                            Top: {b.topProduct.title} ({b.topProduct.unitsSold} un)
                          </span>
                        </div>
                        <div className="text-red-700 truncate flex items-center gap-1">
                          <span>⚠</span>
                          <span className="truncate">
                            Stock Catálogo: {b.laggingProduct.title} ({b.laggingProduct.stockLeft} un)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SubTab 2: Lista Negra (MongoDB users) */}
          {selectedSubTab === 'blacklist' && (
            <div className="space-y-4">
              <div className="bg-[#fff8e1] border border-[#ffe082] p-3 flex items-center gap-2.5 text-xs text-amber-900 shadow-xs">
                <PixelIcon name="warning" size={20} />
                <span>
                  Los clientes incluidos en la <strong>Lista Negra (MongoDB)</strong> quedan
                  etiquetados automáticamente en el <strong>Administrador de Clientes</strong> y no
                  pueden apartar prendas durante las transmisiones en vivo.
                </span>
              </div>

              {/* Formulario de Bloqueo */}
              <form
                onSubmit={handleAddBlacklist}
                className="bg-[#ece9d8] border border-gray-400 p-3 space-y-2 text-xs"
              >
                <div className="font-bold text-xs text-[#003c74] flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-red-600" />
                  <span>BLOQUEAR CLIENTE POR MOROSIDAD EN MONGODB</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nombre y Apellido"
                    value={newBlName}
                    onChange={(e) => setNewBlName(e.target.value)}
                    className="winxp-input text-xs py-1"
                  />
                  <input
                    type="text"
                    required
                    placeholder="RUT (ej: 18.992.334-5)"
                    value={newBlRut}
                    onChange={(e) => setNewBlRut(e.target.value)}
                    className="winxp-input text-xs py-1"
                  />
                  <input
                    type="number"
                    placeholder="Deuda impaga ($ CLP)"
                    value={newBlDebt}
                    onChange={(e) => setNewBlDebt(e.target.value)}
                    className="winxp-input text-xs py-1"
                  />
                  <input
                    type="text"
                    placeholder="Motivo / Causa"
                    value={newBlReason}
                    onChange={(e) => setNewBlReason(e.target.value)}
                    className="winxp-input text-xs py-1"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="winxp-button winxp-button-primary text-xs py-1 px-3 text-red-900 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 text-red-600 inline mr-1" />
                    <span>Agregar a Lista Negra</span>
                  </button>
                </div>
              </form>

              {/* Tabla de Registros */}
              <div className="border border-gray-400 overflow-x-auto bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#ece9d8] border-b border-gray-400 text-gray-800 font-bold text-[11px]">
                    <tr>
                      <th className="p-2 border-r border-gray-300">CLIENTE</th>
                      <th className="p-2 border-r border-gray-300">RUT</th>
                      <th className="p-2 border-r border-gray-300">DEUDA</th>
                      <th className="p-2 border-r border-gray-300">MOTIVO DEL BLOQUEO</th>
                      <th className="p-2 border-r border-gray-300">ESTADO</th>
                      <th className="p-2">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {blacklist.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          No hay clientes bloqueados en Lista Negra en MongoDB actualmente.
                        </td>
                      </tr>
                    ) : (
                      blacklist.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50">
                          <td className="p-2 font-bold text-gray-900">{item.name}</td>
                          <td className="p-2 font-mono text-gray-700">{item.rut}</td>
                          <td className="p-2 font-bold text-red-700">
                            ${item.debtAmount.toLocaleString('es-CL')}
                          </td>
                          <td className="p-2 text-gray-600 max-w-xs">{item.reason}</td>
                          <td className="p-2">
                            <span className="text-[10px] font-bold bg-red-100 text-red-800 border border-red-400 px-1.5 py-0.5 rounded-xs">
                              {item.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={() => handleUnblockCustomer(item.id, item.name)}
                              className="text-blue-700 hover:text-red-700 font-semibold underline cursor-pointer"
                            >
                              Desbloquear
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 3: Alertas & Cobranzas (MongoDB system_alerts) */}
          {selectedSubTab === 'reminders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-300">
                <div>
                  <h3 className="text-xs font-bold text-[#003c74] uppercase">
                    Recordatorios y Alertas Automatizadas (MongoDB)
                  </h3>
                  <span className="text-xs text-gray-600">
                    Notificaciones en vivo desde la colección system_alerts para cobros pendientes y
                    avisos operativos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCreateReminder}
                  className="winxp-button winxp-button-primary text-xs py-1 px-3 text-blue-900 font-bold"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-700 inline mr-1" />
                  <span>Programar Recordatorio</span>
                </button>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="bg-white border border-gray-300 p-6 text-center text-xs text-gray-500">
                  No hay alertas o cobros pendientes activos en MongoDB en este momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeAlerts.map((notif) => {
                    const notifId = String(notif._id || notif.id);
                    const createdDateStr = notif.createdAt
                      ? new Date(notif.createdAt).toLocaleString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Reciente';

                    return (
                      <div
                        key={notifId}
                        className={`p-3 bg-white border border-[#7f9db9] space-y-2 border-l-4 shadow-xs ${
                          notif.severity === 'critical'
                            ? 'border-l-red-600'
                            : notif.severity === 'warning'
                            ? 'border-l-amber-500'
                            : 'border-l-blue-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-900 font-bold flex items-center gap-1.5 truncate">
                            <Bell className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span className="truncate">{notif.title}</span>
                          </span>
                          <span className="text-[11px] text-gray-500 font-mono shrink-0">
                            {createdDateStr}
                          </span>
                        </div>

                        <p className="text-xs text-gray-700">{notif.description}</p>

                        {/* Estimación de Horas */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Clock className="w-3.5 h-3.5 text-blue-700" />
                            <span>Plazo:</span>
                            <select
                              value={notif.dueHours || 2}
                              onChange={(e) =>
                                handleUpdateAlertHours(notifId, Number(e.target.value))
                              }
                              className="winxp-input py-0 px-1 text-xs"
                            >
                              <option value={1}>1 hora</option>
                              <option value={2}>2 horas</option>
                              <option value={4}>4 horas</option>
                              <option value={8}>8 horas</option>
                              <option value={24}>24 horas</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleResolveAlertCobro(notif)}
                            className="winxp-button text-xs py-0.5 px-2.5 text-blue-900 font-bold"
                          >
                            Ejecutar Cobro / Resolver
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </WindowFrame>
    </div>
  );
};