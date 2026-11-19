import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Award,
  Crown,
  Flame,
  Store
} from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { INITIAL_BRANCHES } from '../../services/mockData';
import { RetroPieChart, PieChartItem } from '../../components/admin/RetroPieChart';
import api from '../../api/axios';

const CHART_COLORS = [
  '#0055ea',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#6366f1',
  '#14b8a6',
  '#ef4444'
];

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80';

const DEFAULT_AVATAR_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
];

export const Top10AnalyticsView: React.FC = () => {
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

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    assignedBranchId || 'all'
  );
  const [categoryMetric, setCategoryMetric] = useState<'units' | 'revenue'>('revenue');
  const [salesMetric, setSalesMetric] = useState<'units' | 'revenue'>('units');
  const [salesRankingOrder, setSalesRankingOrder] = useState<'most' | 'least'>('most');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedTableCustomer, setSelectedTableCustomer] = useState<any | null>(null);

  // Estados reales desde MongoDB
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (isBranchAdmin && assignedBranchId) {
      setSelectedBranchId(assignedBranchId);
    }
  }, [isBranchAdmin, assignedBranchId]);

  const fetchAnalyticsFromMongoDB = async () => {
    setIsRefreshing(true);
    try {
      const [prodRes, ordRes, custRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/orders'),
        api.get('/admin/customers')
      ]);

      if (prodRes.data?.success && Array.isArray(prodRes.data.data)) {
        setDbProducts(prodRes.data.data);
      }
      if (ordRes.data?.success && Array.isArray(ordRes.data.data)) {
        setDbOrders(ordRes.data.data);
      }
      if (custRes.data?.success && Array.isArray(custRes.data.data)) {
        setDbCustomers(custRes.data.data);
      }
    } catch (error) {
      console.error('Error cargando analíticas Top 10 desde MongoDB:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsFromMongoDB();
  }, []);

  const handleRefresh = () => {
    fetchAnalyticsFromMongoDB();
  };

  // Filtrar órdenes según sucursal seleccionada
  const branchFilteredOrders = useMemo(() => {
    return dbOrders.filter((ord) => {
      if (selectedBranchId === 'all') return true;
      const rawBranch = ord.branchId || ord.pickupBranchId || 'casa_matriz';
      const normalizedBranch =
        rawBranch === 'branch-corporativo' || rawBranch === 'central'
          ? 'casa_matriz'
          : rawBranch;
      return normalizedBranch === selectedBranchId || ord.pickupBranchId === selectedBranchId;
    });
  }, [dbOrders, selectedBranchId]);

  // Órdenes válidas no anuladas (para demanda / solicitudes)
  const validRequestedOrders = useMemo(() => {
    return branchFilteredOrders.filter((ord) => {
      const paySt = String(ord.paymentStatus || '').toUpperCase();
      const st = String(ord.status || ord.fulfillmentStatus || '').toLowerCase();
      return (
        paySt !== 'REJECTED' &&
        paySt !== 'REFUNDED' &&
        st !== 'pago anulado' &&
        st !== 'anulado' &&
        st !== 'cancelado' &&
        st !== 'rechazada por admin'
      );
    });
  }, [branchFilteredOrders]);

  // Órdenes con pago confirmado (para ventas reales, categorías y mejores clientes)
  const confirmedOrders = useMemo(() => {
    return validRequestedOrders.filter((ord) => {
      const paySt = String(ord.paymentStatus || '').toUpperCase();
      const st = String(ord.status || ord.fulfillmentStatus || '').toLowerCase();
      return paySt !== 'PENDING' && st !== 'pendiente de pago' && st !== 'pending_payment';
    });
  }, [validRequestedOrders]);

  // Mapa rápido de productos del catálogo de MongoDB por ID y por nombre
  const catalogMap = useMemo(() => {
    const byId = new Map<string, any>();
    const byName = new Map<string, any>();
    dbProducts.forEach((p) => {
      const idStr = p._id?.toString() || p.id;
      const titleStr = String(p.title || p.name || '').trim().toLowerCase();
      if (idStr) byId.set(idStr, p);
      if (titleStr) byName.set(titleStr, p);
    });
    return { byId, byName };
  }, [dbProducts]);

  // 1. TOP 10 PRODUCTOS MÁS PEDIDOS POR LOS CLIENTES (DEMANDA / SOLICITUDES EN MONGODB)
  const top10RequestedProducts: PieChartItem[] = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        label: string;
        sku: string;
        requestsCount: number;
        subLabel: string;
        image: string;
      }
    >();

    // Inicializar con productos del catálogo de MongoDB usando su _id como clave principal
    dbProducts.forEach((p, idx) => {
      const idStr = String(p._id || p.id || `prod_${idx}`);
      const label = p.title || p.name || 'Prenda NoLimits';
      map.set(idStr, {
        id: idStr,
        label,
        sku: p.sku || `NL-SKU-${idx + 1}`,
        requestsCount: 0,
        subLabel: p.subCategory || p.subcategory || p.category || 'Catálogo General',
        image: (Array.isArray(p.images) && p.images[0]) || p.image || DEFAULT_PRODUCT_IMAGE
      });
    });

    // Sumar todas las unidades solicitadas en órdenes de MongoDB vinculando por productId o nombre
    validRequestedOrders.forEach((ord) => {
      const items = Array.isArray(ord.items) ? ord.items : [];
      items.forEach((it: any, idx: number) => {
        const rawName = String(it.name || it.title || 'Prenda NoLimits').trim();
        const nameLower = rawName.toLowerCase();
        const qty = Math.max(1, Number(it.quantity ?? 1) || 1);

        const matchedProd =
          (it.productId && catalogMap.byId.get(String(it.productId))) ||
          catalogMap.byName.get(nameLower);

        const targetKey = matchedProd
          ? String(matchedProd._id || matchedProd.id)
          : `custom_${nameLower}`;

        const existing = map.get(targetKey);
        if (existing) {
          existing.requestsCount += qty;
        } else {
          map.set(targetKey, {
            id: `req_custom_${idx}_${targetKey}`,
            label: rawName,
            sku: it.sku || 'NL-POS',
            requestsCount: qty,
            subLabel: 'Venta Directa / POS',
            image: it.image || DEFAULT_PRODUCT_IMAGE
          });
        }
      });
    });

    const allValues = Array.from(map.values());
    const withRequests = allValues.filter((item) => item.requestsCount > 0);
    const sourceList = withRequests.length > 0 ? withRequests : allValues;

    const sorted = sourceList
      .sort((a, b) => b.requestsCount - a.requestsCount)
      .slice(0, 10);

    return sorted.map((item, idx) => ({
      id: `req_pie_${idx}_${item.id}`,
      label: item.label,
      sku: item.sku,
      value: item.requestsCount,
      subLabel: item.subLabel,
      secondaryText: `${item.requestsCount} pedido(s)`,
      image: item.image,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }));
  }, [dbProducts, validRequestedOrders, catalogMap]);

  // 2. TOP 10 PRODUCTOS MÁS VENDIDOS / MENOS VENDIDOS (DESDE MONGODB)
  const top10SoldProducts: PieChartItem[] = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        label: string;
        sku: string;
        units: number;
        revenue: number;
        subLabel: string;
        image: string;
      }
    >();

    // Sembrar todos los productos existentes en la colección 'products' por su _id único
    dbProducts.forEach((p, idx) => {
      const idStr = String(p._id || p.id || `prod_${idx}`);
      const label = p.title || p.name || 'Prenda NoLimits';
      map.set(idStr, {
        id: idStr,
        label,
        sku: p.sku || `NL-SKU-${idx + 1}`,
        units: 0,
        revenue: 0,
        subLabel: p.subCategory || p.subcategory || p.category || 'Catálogo General',
        image: (Array.isArray(p.images) && p.images[0]) || p.image || DEFAULT_PRODUCT_IMAGE
      });
    });

    // Acumular ventas confirmadas reales desde la colección 'orders'
    confirmedOrders.forEach((ord) => {
      const items = Array.isArray(ord.items) ? ord.items : [];
      items.forEach((it: any, idx: number) => {
        const rawName = String(it.name || it.title || 'Prenda NoLimits').trim();
        const nameLower = rawName.toLowerCase();
        const qty = Math.max(1, Number(it.quantity ?? 1) || 1);
        const unitPrice = Number(it.price ?? it.unitPrice ?? 0) || 0;
        const itemRevenue = qty * unitPrice;

        const matchedProd =
          (it.productId && catalogMap.byId.get(String(it.productId))) ||
          catalogMap.byName.get(nameLower);

        const targetKey = matchedProd
          ? String(matchedProd._id || matchedProd.id)
          : `custom_${nameLower}`;

        const existing = map.get(targetKey);
        if (existing) {
          existing.units += qty;
          existing.revenue += itemRevenue;
        } else {
          map.set(targetKey, {
            id: `sold_custom_${idx}_${targetKey}`,
            label: rawName,
            sku: it.sku || 'NL-POS',
            units: qty,
            revenue: itemRevenue,
            subLabel: 'Venta Directa / POS',
            image: it.image || DEFAULT_PRODUCT_IMAGE
          });
        }
      });
    });

    const allItems = Array.from(map.values());
    const soldOnly = allItems.filter((i) => i.units > 0 || i.revenue > 0);
    const pool =
      salesRankingOrder === 'most' && soldOnly.length > 0 ? soldOnly : allItems;

    const sorted = pool
      .sort((a, b) => {
        const valA = salesMetric === 'units' ? a.units : a.revenue;
        const valB = salesMetric === 'units' ? b.units : b.revenue;
        return salesRankingOrder === 'most' ? valB - valA : valA - valB;
      })
      .slice(0, 10);

    return sorted.map((item, idx) => ({
      id: `sold_pie_${idx}_${item.id}`,
      label: item.label,
      sku: item.sku,
      subLabel: item.subLabel,
      value: salesMetric === 'units' ? item.units : item.revenue,
      secondaryText:
        salesMetric === 'units'
          ? `$${item.revenue.toLocaleString('es-CL')}`
          : `${item.units} un.`,
      image: item.image,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }));
  }, [dbProducts, confirmedOrders, catalogMap, salesMetric, salesRankingOrder]);

  // 3. TOP 10 CATEGORÍAS MÁS VENDIDAS (DESDE MONGODB)
  const top10Categories: PieChartItem[] = useMemo(() => {
    const catMap = new Map<string, { label: string; units: number; revenue: number }>();

    dbProducts.forEach((p) => {
      const catLabel = String(p.subCategory || p.subcategory || p.category || 'General').trim();
      if (!catMap.has(catLabel)) {
        catMap.set(catLabel, { label: catLabel, units: 0, revenue: 0 });
      }
    });

    confirmedOrders.forEach((ord) => {
      const items = Array.isArray(ord.items) ? ord.items : [];
      items.forEach((it: any) => {
        const rawName = String(it.name || it.title || '').trim().toLowerCase();
        const matchedProd =
          (it.productId && catalogMap.byId.get(String(it.productId))) ||
          catalogMap.byName.get(rawName);

        const catLabel = String(
          matchedProd?.subCategory ||
            matchedProd?.subcategory ||
            matchedProd?.category ||
            'Poleras'
        ).trim();

        const qty = Math.max(1, Number(it.quantity ?? 1) || 1);
        const rev = qty * (Number(it.price ?? it.unitPrice ?? 0) || 0);

        const current = catMap.get(catLabel) || { label: catLabel, units: 0, revenue: 0 };
        current.units += qty;
        current.revenue += rev;
        catMap.set(catLabel, current);
      });
    });

    const sorted = Array.from(catMap.values())
      .sort((a, b) =>
        categoryMetric === 'revenue' ? b.revenue - a.revenue : b.units - a.units
      )
      .slice(0, 10);

    return sorted.map((item, idx) => ({
      id: `cat_${idx + 1}_${item.label}`,
      label: item.label,
      value: categoryMetric === 'revenue' ? item.revenue : item.units,
      subLabel:
        categoryMetric === 'revenue'
          ? `${item.units} unidad(es) vendida(s)`
          : `$${item.revenue.toLocaleString('es-CL')} recaudados`,
      secondaryText:
        categoryMetric === 'revenue'
          ? `${item.units} un.`
          : `$${item.revenue.toLocaleString('es-CL')}`,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }));
  }, [dbProducts, confirmedOrders, catalogMap, categoryMetric]);

  // 4. TOP 10 LOS MEJORES CLIENTES (DESDE USERS Y ORDERS DE MONGODB)
  const top10BestCustomers: PieChartItem[] = useMemo(() => {
    const custMap = new Map<
      string,
      {
        id: string;
        label: string;
        email: string;
        rut: string;
        totalSpent: number;
        ordersCount: number;
        loyaltyPoints: number;
        image: string;
      }
    >();

    dbCustomers.forEach((c, idx) => {
      const emailKey = String(c.email || '').trim().toLowerCase();
      if (!emailKey) return;
      const fullName =
        c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Cliente Registrado';

      custMap.set(emailKey, {
        id: String(c._id || c.id || `cust_${idx}`),
        label: fullName,
        email: emailKey,
        rut: c.rut || 'Sin RUT',
        totalSpent: selectedBranchId === 'all' ? Number(c.totalSpentClp ?? 0) || 0 : 0,
        ordersCount: selectedBranchId === 'all' ? Number(c.totalOrdersCount ?? 0) || 0 : 0,
        loyaltyPoints: Number(c.loyaltyPoints ?? 0) || 0,
        image: c.avatar || DEFAULT_AVATAR_IMAGES[idx % DEFAULT_AVATAR_IMAGES.length]
      });
    });

    const orderStatsByEmail = new Map<
      string,
      { spent: number; count: number; name: string; rut: string }
    >();

    confirmedOrders.forEach((ord) => {
      const emailKey = String(ord.customerEmail || ord.guestEmail || ord.email || '')
        .trim()
        .toLowerCase();
      if (!emailKey) return;
      const ordTotal = Number(ord.total ?? ord.totalAmount ?? 0) || 0;
      const prev = orderStatsByEmail.get(emailKey) || {
        spent: 0,
        count: 0,
        name: ord.customerName || 'Cliente NoLimits',
        rut: ord.customerRut || ord.rut || 'Sin RUT'
      };
      prev.spent += ordTotal;
      prev.count += 1;
      orderStatsByEmail.set(emailKey, prev);
    });

    orderStatsByEmail.forEach((stats, emailKey) => {
      const existing = custMap.get(emailKey);
      if (existing) {
        if (selectedBranchId === 'all') {
          existing.totalSpent = Math.max(existing.totalSpent, stats.spent);
          existing.ordersCount = Math.max(existing.ordersCount, stats.count);
        } else {
          existing.totalSpent = stats.spent;
          existing.ordersCount = stats.count;
        }
        if (existing.rut === 'Sin RUT' && stats.rut) {
          existing.rut = stats.rut;
        }
      } else {
        custMap.set(emailKey, {
          id: `ord_cust_${emailKey}`,
          label: stats.name,
          email: emailKey,
          rut: stats.rut,
          totalSpent: stats.spent,
          ordersCount: stats.count,
          loyaltyPoints: Math.max(10, Math.floor(stats.spent / 1000)),
          image: DEFAULT_AVATAR_IMAGES[custMap.size % DEFAULT_AVATAR_IMAGES.length]
        });
      }
    });

    const sorted = Array.from(custMap.values())
      .filter((c) => c.totalSpent > 0 || selectedBranchId === 'all')
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return sorted.map((c, idx) => ({
      id: `cust_pie_${idx}_${c.id}`,
      label: c.label,
      value: c.totalSpent,
      subLabel: `${c.email} • RUT: ${c.rut}`,
      secondaryText: `${c.ordersCount} pedidos (${c.loyaltyPoints} pts)`,
      image: c.image,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }));
  }, [dbCustomers, confirmedOrders, selectedBranchId]);

  // Métricas totales de cabecera calculadas desde MongoDB
  const totalTopOrders = useMemo(
    () => top10RequestedProducts.reduce((a, b) => a + b.value, 0),
    [top10RequestedProducts]
  );

  const topCategoryLeader = top10Categories[0]?.label || 'Sin ventas aún';
  const topCategoryUnits = useMemo(() => {
    if (!top10Categories[0]) return 0;
    return categoryMetric === 'units'
      ? top10Categories[0].value
      : parseInt(top10Categories[0].secondaryText || '0', 10) || 0;
  }, [top10Categories, categoryMetric]);

  const topCategoryRev = useMemo(() => {
    if (!top10Categories[0]) return 0;
    return categoryMetric === 'revenue'
      ? top10Categories[0].value
      : parseInt((top10Categories[0].secondaryText || '0').replace(/\D/g, ''), 10) || 0;
  }, [top10Categories, categoryMetric]);

  const topCustomerLeader = top10BestCustomers[0]?.label || 'Sin clientes aún';
  const topCustomerSpent = top10BestCustomers[0]?.value || 0;
  const topCustomerOrders =
    parseInt(top10BestCustomers[0]?.secondaryText?.split(' ')[0] || '0', 10) || 0;

  return (
    <div className="space-y-4 font-sans text-gray-900 pb-12">
      <WindowFrame
        title={
          isBranchAdmin && activeBranchObj
            ? `BRANCH_ADMIN_TOP10.SYS - [Top 10 Sucursal ${activeBranchObj.city} (${activeBranchObj.name})]`
            : 'SUPER_ROOT_TOP10.SYS - [Analítica Avanzada Top 10 Consolidada (MongoDB)]'
        }
        icon={<PixelIcon name="computer" size={16} />}
        statusBarText={
          isBranchAdmin && activeBranchObj
            ? `PANEL ADMIN // MONGODB ACTIVO // TOP 10 SUCURSAL: ${activeBranchObj.city.toUpperCase()} // PRODUCTOS: ${dbProducts.length} // ÓRDENES: ${confirmedOrders.length}`
            : `AUDITORÍA SUPER ADMIN // MONGODB ACTIVO // PRODUCTOS: ${dbProducts.length} // ÓRDENES CONFIRMADAS: ${confirmedOrders.length} // CLIENTES: ${dbCustomers.length}`
        }
      >
        <div className="space-y-4">
          {/* Barra de Navegación y Control Superior */}
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
                  style={{
                    color: '#ffffff',
                    backgroundColor: isBranchAdmin ? '#047857' : '#7e22ce'
                  }}
                  className={`${
                    isBranchAdmin ? 'bg-emerald-700' : 'bg-purple-700'
                  } !text-white text-[10px] font-black px-2 py-0.5 rounded-xs tracking-wider uppercase flex items-center gap-1 shadow-xs`}
                >
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span style={{ color: '#ffffff' }} className="!text-white font-black">
                    {isBranchAdmin && activeBranchObj
                      ? `PANEL ADMIN // ${activeBranchObj.city.toUpperCase()}`
                      : 'SUPER ADMIN ANALYTICS'}
                  </span>
                </span>

                <h2 className="text-sm font-extrabold text-[#003c74] uppercase tracking-wide">
                  {isBranchAdmin && activeBranchObj
                    ? `Módulo Top 10 — Sucursal ${activeBranchObj.city}`
                    : 'Módulo Top 10 Estratégico (MongoDB)'}
                </h2>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {isBranchAdmin && activeBranchObj
                  ? `Visualización gráfica en tiempo real desde MongoDB para la sucursal ${activeBranchObj.city} (${activeBranchObj.name}).`
                  : 'Visualización gráfica conectada a las colecciones orders, products y users de MongoDB: productos más/menos vendidos, categorías líderes y mejores clientes.'}
              </p>
            </div>

            {/* Acciones de la barra superior */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de Sucursal */}
              <div className="flex items-center gap-1 bg-white px-2 py-1 border border-gray-400 text-xs shadow-inner">
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
                    aria-label="Filtrar por sucursal"
                  >
                    <option value="all">★ Todas las Sucursales</option>
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
                className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1.5"
                title="Sincronizar métricas desde MongoDB"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Resumen KPI Top 10 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                <span>DEMANDA CLIENTES (MONGODB)</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-gray-900 mt-1 font-mono">
                {totalTopOrders} un. pedidas
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Total en el Top 10 de prendas solicitadas
              </div>
            </div>

            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-green-900 flex items-center justify-between">
                <span>CATEGORÍA LÍDER</span>
                <Award className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-black text-green-700 mt-1 truncate">
                {topCategoryLeader}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {topCategoryUnits} unidades (${topCategoryRev.toLocaleString('es-CL')} CLP)
              </div>
            </div>

            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-purple-900 flex items-center justify-between">
                <span>
                  CLIENTE #1 {isBranchAdmin && activeBranchObj ? `(${activeBranchObj.city.toUpperCase()})` : 'DEL AÑO'}
                </span>
                <Crown className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-900 mt-1 truncate">
                {topCustomerLeader}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                ${topCustomerSpent.toLocaleString('es-CL')} CLP ({topCustomerOrders} compras)
              </div>
            </div>
          </div>

          {/* =================================================================
              FILA 1: PRODUCTOS MÁS PEDIDOS Y PRODUCTOS MÁS/MENOS VENDIDOS
              ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {/* 1. TOP 10 PRODUCTOS MÁS PEDIDOS POR LOS CLIENTES */}
            <RetroPieChart
              title="Top 10 Productos más pedidos por los clientes"
              subtitle="Los 10 productos con mayor número de unidades solicitadas en órdenes de MongoDB"
              data={top10RequestedProducts}
              valueSuffix=" pedidos"
            />

            {/* 2. TOP 10 PRODUCTOS MÁS VENDIDOS / MENOS VENDIDOS */}
            <RetroPieChart
              title={
                salesRankingOrder === 'most'
                  ? 'Top 10 Productos más Vendidos'
                  : 'Top 10 Productos menos Vendidos'
              }
              subtitle={`Rendimiento real en MongoDB de los 10 productos ${
                salesRankingOrder === 'most' ? 'con mayores ventas' : 'con menor rotación'
              } (${salesMetric === 'units' ? 'unidades cobradas' : 'ingresos en CLP'})`}
              data={top10SoldProducts}
              valuePrefix={salesMetric === 'revenue' ? '$' : ''}
              valueSuffix={salesMetric === 'units' ? ' un.' : ' CLP'}
              headerAction={
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Selector Más Vendidos vs Menos Vendidos */}
                  <div className="flex items-center bg-white border border-gray-400 p-0.5 rounded-xs text-xs shadow-xs">
                    <button
                      type="button"
                      onClick={() => setSalesRankingOrder('most')}
                      style={
                        salesRankingOrder === 'most'
                          ? { backgroundColor: '#047857', color: '#ffffff' }
                          : { color: '#374151' }
                      }
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors ${
                        salesRankingOrder === 'most'
                          ? 'bg-emerald-700 !text-white shadow-xs'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Más Vendidos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalesRankingOrder('least')}
                      style={
                        salesRankingOrder === 'least'
                          ? { backgroundColor: '#b45309', color: '#ffffff' }
                          : { color: '#374151' }
                      }
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors ${
                        salesRankingOrder === 'least'
                          ? 'bg-amber-700 !text-white shadow-xs'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Menos Vendidos
                    </button>
                  </div>

                  {/* Selector Unidades vs Monto ($) */}
                  <div className="flex items-center bg-white border border-gray-400 p-0.5 rounded-xs text-xs shadow-xs">
                    <span className="text-[10px] text-gray-600 font-bold px-1.5">Métrica:</span>
                    <button
                      type="button"
                      onClick={() => setSalesMetric('units')}
                      style={
                        salesMetric === 'units'
                          ? { backgroundColor: '#0055ea', color: '#ffffff' }
                          : { color: '#374151' }
                      }
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors ${
                        salesMetric === 'units'
                          ? 'bg-[#0055ea] !text-white shadow-xs'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span
                        style={salesMetric === 'units' ? { color: '#ffffff' } : {}}
                        className={salesMetric === 'units' ? '!text-white font-bold' : ''}
                      >
                        Unidades
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalesMetric('revenue')}
                      style={
                        salesMetric === 'revenue'
                          ? { backgroundColor: '#0055ea', color: '#ffffff' }
                          : { color: '#374151' }
                      }
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors ${
                        salesMetric === 'revenue'
                          ? 'bg-[#0055ea] !text-white shadow-xs'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span
                        style={salesMetric === 'revenue' ? { color: '#ffffff' } : {}}
                        className={salesMetric === 'revenue' ? '!text-white font-bold' : ''}
                      >
                        Monto ($)
                      </span>
                    </button>
                  </div>
                </div>
              }
            />
          </div>

          {/* =================================================================
              FILA 2: CATEGORÍAS MÁS VENDIDAS Y LOS MEJORES CLIENTES
              ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {/* 3. TOP 10 CATEGORÍAS MÁS VENDIDAS */}
            <RetroPieChart
              title="Top 10 Categorías más Vendidas"
              subtitle={`Distribución real de las líneas de producto líderes en MongoDB (${
                categoryMetric === 'revenue' ? 'total facturado en CLP' : 'unidades totales despachadas'
              })`}
              data={top10Categories}
              valuePrefix={categoryMetric === 'revenue' ? '$' : ''}
              valueSuffix={categoryMetric === 'revenue' ? ' CLP' : ' un.'}
              headerAction={
                <div className="flex items-center bg-white border border-gray-400 p-0.5 rounded-xs text-xs shadow-xs">
                  <span className="text-[10px] text-gray-600 font-bold px-1.5">Ver por:</span>
                  <button
                    type="button"
                    onClick={() => setCategoryMetric('revenue')}
                    style={
                      categoryMetric === 'revenue'
                        ? { backgroundColor: '#0055ea', color: '#ffffff' }
                        : { color: '#374151' }
                    }
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors ${
                      categoryMetric === 'revenue'
                        ? 'bg-[#0055ea] !text-white shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      style={categoryMetric === 'revenue' ? { color: '#ffffff' } : {}}
                      className={categoryMetric === 'revenue' ? '!text-white font-bold' : ''}
                    >
                      Recaudación ($)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryMetric('units')}
                    style={
                      categoryMetric === 'units'
                        ? { backgroundColor: '#0055ea', color: '#ffffff' }
                        : { color: '#374151' }
                    }
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors ${
                      categoryMetric === 'units'
                        ? 'bg-[#0055ea] !text-white shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      style={categoryMetric === 'units' ? { color: '#ffffff' } : {}}
                      className={categoryMetric === 'units' ? '!text-white font-bold' : ''}
                    >
                      Unidades
                    </span>
                  </button>
                </div>
              }
            />

            {/* 4. TOP 10 LOS MEJORES CLIENTES */}
            <RetroPieChart
              title="Top 10 Los Mejores Clientes"
              subtitle="Los 10 clientes en MongoDB con mayor gasto acumulado en dinero en NoLimits ($ CLP)"
              data={top10BestCustomers}
              valuePrefix="$"
              valueSuffix=" CLP"
              headerAction={
                <span className="text-[10px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-xs whitespace-nowrap shadow-xs">
                  Sincronizado con MongoDB
                </span>
              }
            />
          </div>

          {/* Tabla Desglosada de los 10 Mejores Clientes Registrados */}
          <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200 mb-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide">
                  Detalle del Ranking: Top 10 Clientes por Facturación (MongoDB)
                </h4>
              </div>
              <span className="text-[11px] text-gray-500 font-semibold">
                Datos reales cruzados entre colecciones users y orders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200">
                <thead className="bg-[#e4ebf5] text-blue-950 font-bold border-b border-gray-300 text-[11px]">
                  <tr>
                    <th className="py-1.5 px-2 text-center w-10">Lugar</th>
                    <th className="py-1.5 px-2">Cliente Registrado</th>
                    <th className="py-1.5 px-2">RUT</th>
                    <th className="py-1.5 px-2">Email</th>
                    <th className="py-1.5 px-2 text-center">Compras</th>
                    <th className="py-1.5 px-2 text-center">Puntos Club</th>
                    <th className="py-1.5 px-2 text-right">Total Gastado ($ CLP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {top10BestCustomers.map((cust, idx) => (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedTableCustomer({ ...cust, index: idx })}
                      className="hover:bg-blue-50/60 transition-colors cursor-pointer select-none"
                      title="Haga clic para ver todos los detalles en una mini ventana"
                    >
                      <td className="py-1.5 px-2 text-center">
                        <span
                          className="inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-black !text-white shadow-sm cursor-pointer hover:scale-125 transition-all"
                          style={{
                            backgroundColor: cust.color || '#0055ea',
                            color: '#ffffff',
                            border: '1.5px solid #ffffff',
                            boxShadow: `0 0 8px ${cust.color || '#0055ea'}, 0 0 10px rgba(255, 255, 255, 0.8), inset 0 0 4px #ffffff`,
                            textShadow: '0 0 4px #ffffff, 0 0 8px #ffffff, 0 0 12px rgba(255, 255, 255, 0.95)'
                          }}
                          title={`Lugar #${idx + 1} - Clic para ver detalles completos`}
                        >
                          <span
                            style={{
                              color: '#ffffff',
                              textShadow: '0 0 4px #ffffff, 0 0 8px #ffffff, 0 0 12px rgba(255, 255, 255, 0.95)'
                            }}
                            className="!text-white font-black"
                          >
                            {idx + 1}
                          </span>
                        </span>
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-2">
                          {cust.image ? (
                            <img
                              src={cust.image}
                              alt={cust.label}
                              className="w-6 h-6 rounded-full object-cover border border-gray-300 shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {cust.label.substring(0, 2)}
                            </div>
                          )}
                          <span className="font-bold text-gray-900 text-[11px]">
                            {cust.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 font-mono text-[11px] text-gray-600">
                        {cust.subLabel?.split('• RUT: ')[1] || 'Sin RUT'}
                      </td>
                      <td className="py-1.5 px-2 text-[11px] text-gray-600">
                        {cust.subLabel?.split(' •')[0]}
                      </td>
                      <td className="py-1.5 px-2 text-center font-bold text-gray-800">
                        {cust.secondaryText?.split(' ')[0]} ops
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-amber-700">
                        {cust.secondaryText?.match(/\((.*?) pts\)/)?.[1] || 0} pts
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-black text-blue-900 text-xs">
                        ${cust.value.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </WindowFrame>

      {/* Mini Ventana de Detalles al hacer Clic en una fila o número de la tabla */}
      {selectedTableCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <WindowFrame
              title={`DETALLE_CLIENTE_TOP10.SYS - [Lugar #${selectedTableCustomer.index + 1}: ${selectedTableCustomer.label}]`}
              icon={<PixelIcon name="computer" size={16} />}
              statusBarText={`AUDITORÍA SUPER ADMIN // TOP 10 CLIENTES MONGODB // ID: ${selectedTableCustomer.id}`}
            >
              <div className="space-y-4 text-xs font-sans">
                {/* Cabecera del cliente */}
                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xs">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black !text-white shrink-0 shadow-md"
                    style={{
                      backgroundColor: selectedTableCustomer.color || '#0055ea',
                      color: '#ffffff',
                      textShadow: '0 0 6px #ffffff',
                      boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                      border: '2px solid #ffffff'
                    }}
                  >
                    #{selectedTableCustomer.index + 1}
                  </div>

                  {selectedTableCustomer.image ? (
                    <img
                      src={selectedTableCustomer.image}
                      alt={selectedTableCustomer.label}
                      className="w-12 h-12 rounded-full object-cover border border-gray-400 shrink-0 bg-white shadow-xs"
                    />
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                      Lugar #{selectedTableCustomer.index + 1} en el Ranking de Clientes
                    </span>
                    <h5 className="font-extrabold text-sm text-gray-900 leading-tight">
                      {selectedTableCustomer.label}
                    </h5>
                    <p className="text-[11px] text-gray-600 mt-0.5 font-mono">
                      RUT: {selectedTableCustomer.subLabel?.split('• RUT: ')[1] || 'Sin RUT'}
                    </p>
                  </div>
                </div>

                {/* Métricas destacadas */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#f0f4f9] border border-[#a2b5cc] p-2.5 rounded-xs">
                    <span className="text-[10px] text-gray-600 font-bold block uppercase">
                      Gasto Acumulado Total
                    </span>
                    <span className="text-base font-black text-blue-900 font-mono">
                      ${selectedTableCustomer.value.toLocaleString('es-CL')} CLP
                    </span>
                  </div>

                  <div className="bg-[#f0f4f9] border border-[#a2b5cc] p-2.5 rounded-xs">
                    <span className="text-[10px] text-gray-600 font-bold block uppercase">
                      Puntos Club Fidelizados
                    </span>
                    <span className="text-base font-black text-amber-700 font-mono">
                      {selectedTableCustomer.secondaryText?.match(/\((.*?) pts\)/)?.[1] || 0} pts
                    </span>
                  </div>
                </div>

                {/* Desglose de información adicional */}
                <div className="bg-white border border-gray-300 p-2.5 rounded-xs space-y-1.5 text-[11px]">
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-500 font-bold">Correo Electrónico:</span>
                    <span className="font-mono text-gray-800">
                      {selectedTableCustomer.subLabel?.split(' •')[0]}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-500 font-bold">Total de Compras Realizadas:</span>
                    <span className="font-bold text-blue-900">
                      {selectedTableCustomer.secondaryText?.split(' ')[0]} compras finalizadas
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-500 font-bold">Segmento de Fidelidad:</span>
                    <span className="font-bold text-purple-700">Cliente Verificado MongoDB</span>
                  </div>

                  <div className="flex justify-between pt-0.5">
                    <span className="text-gray-500 font-bold">Estado de Cuenta:</span>
                    <span className="font-bold text-green-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      ACTIVO / VERIFICADO
                    </span>
                  </div>
                </div>

                {/* Botón de cierre */}
                <div className="flex justify-end pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => setSelectedTableCustomer(null)}
                    className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-950"
                  >
                    Aceptar / Cerrar
                  </button>
                </div>
              </div>
            </WindowFrame>
          </div>
        </div>
      )}
    </div>
  );
};