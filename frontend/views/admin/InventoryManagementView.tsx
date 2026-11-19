import React, { useState, useMemo, useEffect } from 'react';
import { PieChart as PieChartIcon, RefreshCw } from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import api from '../../api/axios';

import { INITIAL_BRANCHES } from '../../services/mockData';
import { InventorySummaryWidget } from '../../components/admin/InventorySummaryWidget';
import {
  ProductStatusSummaryWidget,
  ProductOperationalState,
  ProductStatusItem
} from '../../components/admin/ProductStatusSummaryWidget';
import { RetroPieChart, PieChartItem } from '../../components/admin/RetroPieChart';

interface DashboardMetrics {
  products: { total: number; outOfStock: number; categories: number };
  users: { total: number; clients: number; branchAdmins: number; superAdmins: number };
  sales: {
    globalRevenue: number;
    globalTransactions: number;
    byBranch: Array<{ _id: string; revenue: number; orders: number }>;
  };
}

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

// Mapear estado de una orden en MongoDB a los 6 estados operativos de ProductStatusSummaryWidget
const mapOrderToOperationalState = (ord: any): ProductOperationalState | null => {
  const paySt = String(ord.paymentStatus || '').toUpperCase();
  const rawFulfillment = String(ord.fulfillmentStatus || '').trim();
  const rawStatus = String(ord.status || '').trim();

  if (
    paySt === 'REJECTED' ||
    paySt === 'PENDING' ||
    rawStatus === 'Pago Anulado' ||
    rawStatus === 'Pendiente de Pago' ||
    rawStatus === 'Rechazada por Admin'
  ) {
    return null;
  }

  const candidate =
    rawFulfillment && rawFulfillment !== 'Pago Confirmando'
      ? rawFulfillment
      : rawStatus || rawFulfillment;

  const lower = candidate.toLowerCase();
  if (lower.includes('preparac')) return 'En Preparación';
  if (lower.includes('transit') || lower.includes('tránsito')) return 'En transito';
  if (lower.includes('entregado')) return 'Entregado';
  if (lower.includes('listo')) return 'Listo para el retiro de sucursal';
  if (lower.includes('retirado')) return 'Retirado';
  return 'Solicitud recibida';
};

export const InventoryManagementView: React.FC = () => {
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

  const [selectedBranchId, setSelectedBranchId] = useState<string>(assignedBranchId || 'all');
  const [salesMetricMode, setSalesMetricMode] = useState<'units' | 'revenue'>('units');

  // Estados reales sincronizados con MongoDB
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  const fetchInventoryDataFromMongoDB = async () => {
    setIsLoadingMetrics(true);
    try {
      const [dashRes, prodRes, ordRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/products'),
        api.get('/admin/orders')
      ]);

      if (dashRes.data?.success) {
        setMetrics(dashRes.data.data);
      }
      if (prodRes.data?.success && Array.isArray(prodRes.data.data)) {
        setDbProducts(prodRes.data.data);
      }
      if (ordRes.data?.success && Array.isArray(ordRes.data.data)) {
        setDbOrders(ordRes.data.data);
      }
    } catch (err) {
      console.error('Error cargando datos de inventario desde MongoDB:', err);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchInventoryDataFromMongoDB();
  }, []);

  useEffect(() => {
    if (isBranchAdmin && assignedBranchId) {
      setSelectedBranchId(assignedBranchId);
    }
  }, [isBranchAdmin, assignedBranchId]);

  const handleBranchSelect = (branchId: string) => {
    if (isBranchAdmin && assignedBranchId) {
      setSelectedBranchId(assignedBranchId);
      return;
    }
    setSelectedBranchId(branchId);
  };

  // Mapa rápido de productos por ID y por nombre para cruzar imágenes y categorías
  const catalogMap = useMemo(() => {
    const byId = new Map<string, any>();
    const byName = new Map<string, any>();
    dbProducts.forEach((p) => {
      const idStr = String(p._id || p.id || '');
      const titleStr = String(p.title || p.name || '').trim().toLowerCase();
      if (idStr) byId.set(idStr, p);
      if (titleStr) byName.set(titleStr, p);
    });
    return { byId, byName };
  }, [dbProducts]);

  // 1. Categorías reales desde los productos registrados en MongoDB
  const { categoriesCount, categoriesList } = useMemo(() => {
    const map = new Map<string, number>();
    dbProducts.forEach((p) => {
      const cat = p.subCategory || p.subcategory || p.category || 'General';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    const list = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      categoriesCount: list.length,
      categoriesList: list
    };
  }, [dbProducts]);

  // 2. Usuarios reales desde MongoDB
  const { usersCount, usersBreakdown } = useMemo(() => {
    if (metrics) {
      return {
        usersCount: metrics.users.total,
        usersBreakdown: {
          registered: metrics.users.clients,
          branchAdmins: metrics.users.branchAdmins,
          superAdmins: metrics.users.superAdmins
        }
      };
    }
    return {
      usersCount: 0,
      usersBreakdown: { registered: 0, branchAdmins: 0, superAdmins: 0 }
    };
  }, [metrics]);

  // 3. Conteo real de Productos, Unidades en Stock y Agotados desde la colección 'products'
  const { productsCount, totalStockUnits, outOfStockCount } = useMemo(() => {
    let stock = 0;
    let outOfStock = 0;

    dbProducts.forEach((p) => {
      const breakdown = Array.isArray(p.sizeBreakdown) ? p.sizeBreakdown : [];
      const prodStock =
        breakdown.length > 0
          ? breakdown.reduce(
              (acc: number, s: any) => acc + (Number(s.quantity ?? s.stock ?? 0) || 0),
              0
            )
          : Number(p.totalStock ?? p.stock ?? 0) || 0;

      if (isBranchAdmin && assignedBranchId && p.stockPerBranch && assignedBranchId in p.stockPerBranch) {
        const bStock = Number(p.stockPerBranch[assignedBranchId]) || 0;
        stock += bStock;
        if (bStock <= 0) outOfStock++;
      } else {
        stock += prodStock;
        if (prodStock <= 0) outOfStock++;
      }
    });

    return {
      productsCount: dbProducts.length,
      totalStockUnits: stock,
      outOfStockCount: outOfStock
    };
  }, [dbProducts, isBranchAdmin, assignedBranchId]);

  // Órdenes confirmadas para cálculos de ventas y estados operativos
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

  // 4. Ventas por Sucursal calculadas en tiempo real desde las órdenes confirmadas de MongoDB
  const branchSales = useMemo(() => {
    const statsByBranch = new Map<string, { orders: number; revenue: number }>();

    confirmedOrders.forEach((ord) => {
      const rawB = ord.pickupBranchId || ord.branchId || 'casa_matriz';
      const bKey = rawB === 'branch-corporativo' || rawB === 'central' ? 'casa_matriz' : rawB;
      const prev = statsByBranch.get(bKey) || { orders: 0, revenue: 0 };
      prev.orders += 1;
      prev.revenue += Number(ord.total ?? ord.confirmedRevenue ?? 0) || 0;
      statsByBranch.set(bKey, prev);
    });

    const list = allBranches.map((b) => {
      const bStat = statsByBranch.get(b.id) || { orders: 0, revenue: 0 };
      return {
        branchId: b.id,
        branchName: b.name,
        city: b.city,
        salesCount: bStat.orders,
        totalRevenue: bStat.revenue,
        colorTag: b.colorTag
      };
    });

    if (isBranchAdmin && assignedBranchId) {
      return list.filter((b) => b.branchId === assignedBranchId);
    }
    return list;
  }, [allBranches, confirmedOrders, isBranchAdmin, assignedBranchId]);

  // 5. Matriz de Estados Operativos de Productos por Sucursal desde las órdenes reales de MongoDB
  const productStatusData: Record<ProductOperationalState, Record<string, number>> = useMemo(() => {
    const base: Record<ProductOperationalState, Record<string, number>> = {
      'Solicitud recibida': {},
      'En Preparación': {},
      'En transito': {},
      'Entregado': {},
      'Listo para el retiro de sucursal': {},
      'Retirado': {}
    };

    allBranches.forEach((b) => {
      (Object.keys(base) as ProductOperationalState[]).forEach((stateKey) => {
        base[stateKey][b.id] = 0;
      });
    });

    confirmedOrders.forEach((ord) => {
      const opState = mapOrderToOperationalState(ord);
      if (!opState) return;

      const rawB = ord.pickupBranchId || ord.branchId || 'casa_matriz';
      const bKey = rawB === 'branch-corporativo' || rawB === 'central' ? 'casa_matriz' : rawB;
      const items = Array.isArray(ord.items) ? ord.items : [];
      const totalUnitsInOrder =
        items.length > 0
          ? items.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 1), 0)
          : 1;

      if (base[opState][bKey] === undefined) {
        base[opState][bKey] = 0;
      }
      base[opState][bKey] += totalUnitsInOrder;
    });

    return base;
  }, [allBranches, confirmedOrders]);

  // 6. Ítems recientes de órdenes en MongoDB para ProductStatusSummaryWidget
  const recentProductItems: ProductStatusItem[] = useMemo(() => {
    const itemsList: ProductStatusItem[] = [];

    confirmedOrders.forEach((ord, ordIdx) => {
      const opState = mapOrderToOperationalState(ord);
      if (!opState) return;

      const rawB = ord.pickupBranchId || ord.branchId || 'casa_matriz';
      const bKey = rawB === 'branch-corporativo' || rawB === 'central' ? 'casa_matriz' : rawB;
      const branchObj = allBranches.find((b) => b.id === bKey);
      const branchName = branchObj ? branchObj.city : ord.branchName || bKey;

      const isPickup =
        ord.deliveryType === 'retiro' ||
        ord.deliveryType === 'Retiro en Sucursal' ||
        ord.deliveryType === 'Retiro en Tienda';

      const createdDate = ord.createdAt ? new Date(ord.createdAt) : new Date();
      const dateStr = !isNaN(createdDate.getTime())
        ? `${createdDate.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short'
          })}, ${createdDate.toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit'
          })}`
        : 'Reciente';

      const ordItems = Array.isArray(ord.items) ? ord.items : [];
      ordItems.forEach((it: any, itIdx: number) => {
        const rawName = String(it.name || it.title || 'Prenda NoLimits').trim();
        const matchedProd =
          (it.productId && catalogMap.byId.get(String(it.productId))) ||
          catalogMap.byName.get(rawName.toLowerCase());

        const img =
          (Array.isArray(matchedProd?.images) && matchedProd.images[0]) ||
          it.image ||
          DEFAULT_PRODUCT_IMAGE;

        itemsList.push({
          id: `st_${ord._id || ordIdx}_${itIdx}`,
          orderNumber: ord.orderNumber || 'NL-ORD',
          sku: it.sku || matchedProd?.sku || 'NL-SKU',
          productTitle: matchedProd?.title || rawName,
          productImage: img,
          quantity: Number(it.quantity) || 1,
          customerName: ord.customerName || 'Cliente NoLimits',
          branchId: bKey,
          branchName,
          state: opState,
          date: dateStr,
          deliveryType: isPickup ? 'Retiro en Tienda' : 'Despacho a Domicilio'
        });
      });
    });

    return itemsList;
  }, [confirmedOrders, allBranches, catalogMap]);

  // Filtrar órdenes según la sucursal seleccionada para los gráficos de pastel inferiores
  const branchScopedOrders = useMemo(() => {
    return dbOrders.filter((ord) => {
      const paySt = String(ord.paymentStatus || '').toUpperCase();
      const st = String(ord.status || ord.fulfillmentStatus || '').toLowerCase();
      if (
        paySt === 'REJECTED' ||
        st === 'pago anulado' ||
        st === 'anulado' ||
        st === 'cancelado' ||
        st === 'rechazada por admin'
      ) {
        return false;
      }
      if (selectedBranchId === 'all') return true;
      const rawB = ord.pickupBranchId || ord.branchId || 'casa_matriz';
      const bKey = rawB === 'branch-corporativo' || rawB === 'central' ? 'casa_matriz' : rawB;
      return bKey === selectedBranchId || ord.branchId === selectedBranchId;
    });
  }, [dbOrders, selectedBranchId]);

  // 7. TOP 10 PRODUCTOS MÁS PEDIDOS (DESDE MONGODB)
  const top10RequestedProducts: PieChartItem[] = useMemo(() => {
    const map = new Map<
      string,
      { id: string; label: string; sku: string; value: number; subLabel: string; image: string }
    >();

    dbProducts.forEach((p, idx) => {
      const idStr = String(p._id || p.id || `prod_${idx}`);
      map.set(idStr, {
        id: idStr,
        label: p.title || p.name || 'Prenda NoLimits',
        sku: p.sku || `NL-SKU-${idx + 1}`,
        value: 0,
        subLabel: p.subCategory || p.subcategory || p.category || 'Catálogo',
        image: (Array.isArray(p.images) && p.images[0]) || p.image || DEFAULT_PRODUCT_IMAGE
      });
    });

    branchScopedOrders.forEach((ord) => {
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
          existing.value += qty;
        } else {
          map.set(targetKey, {
            id: `req_custom_${idx}_${targetKey}`,
            label: rawName,
            sku: it.sku || 'NL-POS',
            value: qty,
            subLabel: 'Venta Directa / POS',
            image: it.image || DEFAULT_PRODUCT_IMAGE
          });
        }
      });
    });

    const allVals = Array.from(map.values());
    const nonZero = allVals.filter((i) => i.value > 0);
    const source = nonZero.length > 0 ? nonZero : allVals;

    return source
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((item, idx) => ({
        ...item,
        id: `inv_req_${idx}_${item.id}`,
        secondaryText: `${item.value} pedido(s)`,
        color: CHART_COLORS[idx % CHART_COLORS.length]
      }));
  }, [dbProducts, branchScopedOrders, catalogMap]);

  // 8. TOP 10 PRODUCTOS MÁS VENDIDOS (DESDE MONGODB)
  const top10SoldProducts: PieChartItem[] = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        label: string;
        sku: string;
        category: string;
        units: number;
        revenue: number;
        image: string;
      }
    >();

    dbProducts.forEach((p, idx) => {
      const idStr = String(p._id || p.id || `prod_${idx}`);
      map.set(idStr, {
        id: idStr,
        label: p.title || p.name || 'Prenda NoLimits',
        sku: p.sku || `NL-SKU-${idx + 1}`,
        category: p.subCategory || p.subcategory || p.category || 'Catálogo',
        units: 0,
        revenue: 0,
        image: (Array.isArray(p.images) && p.images[0]) || p.image || DEFAULT_PRODUCT_IMAGE
      });
    });

    branchScopedOrders
      .filter((ord) => String(ord.paymentStatus || '').toUpperCase() === 'CONFIRMED')
      .forEach((ord) => {
        const items = Array.isArray(ord.items) ? ord.items : [];
        items.forEach((it: any, idx: number) => {
          const rawName = String(it.name || it.title || 'Prenda NoLimits').trim();
          const nameLower = rawName.toLowerCase();
          const qty = Math.max(1, Number(it.quantity ?? 1) || 1);
          const price = Number(it.price ?? it.unitPrice ?? 0) || 0;
          const rev = qty * price;

          const matchedProd =
            (it.productId && catalogMap.byId.get(String(it.productId))) ||
            catalogMap.byName.get(nameLower);

          const targetKey = matchedProd
            ? String(matchedProd._id || matchedProd.id)
            : `custom_${nameLower}`;

          const existing = map.get(targetKey);
          if (existing) {
            existing.units += qty;
            existing.revenue += rev;
          } else {
            map.set(targetKey, {
              id: `sold_custom_${idx}_${targetKey}`,
              label: rawName,
              sku: it.sku || 'NL-POS',
              category: 'Venta Directa / POS',
              units: qty,
              revenue: rev,
              image: it.image || DEFAULT_PRODUCT_IMAGE
            });
          }
        });
      });

    const allVals = Array.from(map.values());
    const nonZero = allVals.filter((i) => i.units > 0 || i.revenue > 0);
    const source = nonZero.length > 0 ? nonZero : allVals;

    return source
      .sort((a, b) =>
        salesMetricMode === 'units' ? b.units - a.units : b.revenue - a.revenue
      )
      .slice(0, 10)
      .map((item, idx) => ({
        id: `inv_sold_${idx}_${item.id}`,
        label: item.label,
        sku: item.sku,
        subLabel: item.category,
        category: item.category,
        value: salesMetricMode === 'units' ? item.units : item.revenue,
        secondaryText:
          salesMetricMode === 'units'
            ? `$${item.revenue.toLocaleString('es-CL')}`
            : `${item.units} un.`,
        image: item.image,
        color: CHART_COLORS[idx % CHART_COLORS.length]
      }));
  }, [dbProducts, branchScopedOrders, catalogMap, salesMetricMode]);

  const scopedBranches = useMemo(() => {
    if (isBranchAdmin && assignedBranchId) {
      return allBranches.filter((b) => b.id === assignedBranchId);
    }
    return allBranches;
  }, [allBranches, isBranchAdmin, assignedBranchId]);

  return (
    <div className="space-y-4 font-sans text-gray-900 pb-12 relative">
      {isLoadingMetrics && (
        <div className="absolute inset-0 z-50 bg-white/70 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#ece9d8] border-2 border-blue-900 p-4 shadow-xl flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-700 animate-spin" />
            <span className="font-bold text-xs text-blue-950">
              SINCRONIZANDO INVENTARIO Y MÉTRICAS DESDE MONGODB...
            </span>
          </div>
        </div>
      )}

      <WindowFrame
        title={
          isBranchAdmin && activeBranchObj
            ? `BRANCH_ADMIN_INVENTORY.SYS - [Gestión de Inventario — Sucursal ${activeBranchObj.city} (${activeBranchObj.name})]`
            : 'SUPER_ROOT_INVENTORY.SYS - [Gestión Integral de Inventario & Métricas Super Admin (MongoDB)]'
        }
        icon={<PixelIcon name="floppy" size={16} />}
        statusBarText={
          isBranchAdmin && activeBranchObj
            ? `PANEL ADMIN // MONGODB ACTIVO // SUCURSAL: ${activeBranchObj.city.toUpperCase()} // PRODUCTOS: ${productsCount} // STOCK: ${totalStockUnits} UN.`
            : `NODO SUPER ADMIN // MONGODB ACTIVO // SUCURSALES: ${allBranches.length} // PRODUCTOS: ${productsCount} // STOCK CONSOLIDADO: ${totalStockUnits} UN.`
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    color: '#ffffff',
                    backgroundColor: isBranchAdmin ? '#047857' : '#b91c1c'
                  }}
                  className={`${
                    isBranchAdmin ? 'bg-emerald-700' : 'bg-red-700'
                  } !text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs tracking-wider uppercase inline-flex items-center`}
                >
                  <span style={{ color: '#ffffff' }} className="!text-white font-bold">
                    {isBranchAdmin && activeBranchObj
                      ? `PANEL ADMIN // ${activeBranchObj.city.toUpperCase()}`
                      : 'SUPER ADMIN ONLY'}
                  </span>
                </span>
                <h2 className="text-sm font-extrabold text-[#003c74] uppercase tracking-wide">
                  {isBranchAdmin && activeBranchObj
                    ? `Gestión de Inventario — Sucursal ${activeBranchObj.city} (${activeBranchObj.name})`
                    : 'Gestión Central de Inventario (MongoDB)'}
                </h2>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {isBranchAdmin && activeBranchObj
                  ? `Panel exclusivo del Administrador de ${activeBranchObj.city}: control en tiempo real de stock físico, estados de pedidos y ventas en MongoDB.`
                  : 'Panel maestro para el Super Administrador con auditoría en vivo de categorías, usuarios, productos, stock y ventas por sucursal desde MongoDB.'}
              </p>
            </div>

            <button
              type="button"
              onClick={fetchInventoryDataFromMongoDB}
              className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1.5"
              title="Actualizar métricas desde MongoDB"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-blue-700 ${isLoadingMetrics ? 'animate-spin' : ''}`}
              />
              <span>Actualizar Datos</span>
            </button>
          </div>

          <section>
            <InventorySummaryWidget
              categoriesCount={categoriesCount}
              categoriesList={categoriesList}
              usersCount={usersCount}
              usersBreakdown={usersBreakdown}
              productsCount={productsCount}
              totalStockUnits={totalStockUnits}
              outOfStockCount={outOfStockCount}
              branchSales={branchSales}
              selectedBranchId={selectedBranchId}
              onSelectBranch={handleBranchSelect}
              isBranchLocked={isBranchAdmin}
            />
          </section>

          <section>
            <ProductStatusSummaryWidget
              branches={scopedBranches}
              statusData={productStatusData}
              recentItems={recentProductItems}
              selectedBranchId={selectedBranchId}
              onSelectBranch={handleBranchSelect}
              isBranchLocked={isBranchAdmin}
            />
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#d3e5fa] px-3 py-1.5 border border-[#9bb8e5] text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-950">
                <PieChartIcon className="w-4 h-4 text-blue-800" />
                <span>
                  {isBranchAdmin && activeBranchObj
                    ? `ANALÍTICA GRÁFICA DE DEMANDA Y RENDIMIENTO (MONGODB) — SUCURSAL ${activeBranchObj.city.toUpperCase()}`
                    : 'ANALÍTICA GRÁFICA DE DEMANDA Y RENDIMIENTO COMERCIAL (MONGODB)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-700 font-semibold">
                  Visualización de Ventas:
                </span>
                <div className="flex items-center bg-white border border-gray-400 p-0.5 rounded-xs">
                  <button
                    type="button"
                    onClick={() => setSalesMetricMode('units')}
                    style={
                      salesMetricMode === 'units'
                        ? { color: '#ffffff', backgroundColor: '#0055ea' }
                        : { color: '#374151' }
                    }
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors ${
                      salesMetricMode === 'units'
                        ? 'bg-[#0055ea] !text-white shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      style={salesMetricMode === 'units' ? { color: '#ffffff' } : undefined}
                      className={salesMetricMode === 'units' ? '!text-white font-bold' : ''}
                    >
                      Por Unidades
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesMetricMode('revenue')}
                    style={
                      salesMetricMode === 'revenue'
                        ? { color: '#ffffff', backgroundColor: '#0055ea' }
                        : { color: '#374151' }
                    }
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors ${
                      salesMetricMode === 'revenue'
                        ? 'bg-[#0055ea] !text-white shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      style={salesMetricMode === 'revenue' ? { color: '#ffffff' } : undefined}
                      className={salesMetricMode === 'revenue' ? '!text-white font-bold' : ''}
                    >
                      Por Recaudación ($)
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <RetroPieChart
                  title="Top 10 Productos más pedidos por los clientes"
                  subtitle={
                    isBranchAdmin && activeBranchObj
                      ? `Demanda acumulada de clientes en la sucursal ${activeBranchObj.city} (MongoDB)`
                      : 'Demanda acumulada de clientes en órdenes registradas en MongoDB'
                  }
                  data={top10RequestedProducts}
                  valueSuffix=" pedidos"
                />
              </div>
              <div>
                <RetroPieChart
                  title="Top 10 Productos más Vendidos"
                  subtitle={`Rendimiento comercial real en MongoDB ${
                    isBranchAdmin && activeBranchObj ? `en ${activeBranchObj.city} ` : ''
                  }${
                    salesMetricMode === 'units'
                      ? 'en unidades cobradas'
                      : 'en ingresos brutos confirmados'
                  }`}
                  data={top10SoldProducts}
                  valuePrefix={salesMetricMode === 'revenue' ? '$' : ''}
                  valueSuffix={salesMetricMode === 'units' ? ' un.' : ' CLP'}
                />
              </div>
            </div>
          </section>

          <div className="bg-[#f8fafc] border border-gray-300 p-2.5 text-xs flex flex-wrap items-center justify-between gap-2 text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span>
                Base de datos sincronizada:{' '}
                <strong>
                  MongoDB Atlas ({productsCount} productos, {confirmedOrders.length} ventas confirmadas)
                </strong>
              </span>
            </div>
            <div className="font-mono text-[11px] text-gray-500">
              HASH SHA-256 // {isBranchAdmin ? 'BRANCH_ADMIN_SESSION' : 'SUPER_ADMIN_SESSION'}:{' '}
              {currentUser?.email}
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  );
};