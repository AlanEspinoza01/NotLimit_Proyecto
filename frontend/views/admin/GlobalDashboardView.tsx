import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  Users,
  Store,
  Package,
  Bell,
  ArrowRight,
  Boxes,
  ShoppingBag,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { INITIAL_BRANCHES } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import api from '../../api/axios';

export const GlobalDashboardView: React.FC = () => {
  const { currentUser } = useAuth();
  const { branches } = useBranch();

  const [dbBranches, setDbBranches] = useState<any[]>([]);
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [brRes, ordRes, custRes, prodRes] = await Promise.all([
        api.get('/admin/branches'),
        api.get('/admin/orders'),
        api.get('/admin/customers'),
        api.get('/admin/products')
      ]);

      if (brRes.data?.success && Array.isArray(brRes.data.data)) {
        setDbBranches(brRes.data.data);
      }
      if (ordRes.data?.success && Array.isArray(ordRes.data.data)) {
        setDbOrders(ordRes.data.data);
      }
      if (custRes.data?.success && Array.isArray(custRes.data.data)) {
        setDbCustomers(custRes.data.data);
      }
      if (prodRes.data?.success && Array.isArray(prodRes.data.data)) {
        setDbProducts(prodRes.data.data);
      }
    } catch (error) {
      console.error('Error cargando GlobalDashboardView desde MongoDB:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Sucursales activas desde MongoDB
  const activeBranches = useMemo(() => {
    const source = dbBranches.length > 0 ? dbBranches : branches.length > 0 ? branches : INITIAL_BRANCHES;
    const seen = new Set<string>();
    return source.filter((b: any) => {
      const id = String(b._id || b.id || '');
      const key = id === 'branch-corporativo' ? 'casa_matriz' : id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dbBranches, branches]);

  const branchCitiesSummary = useMemo(() => {
    const cities = activeBranches
      .map((b: any) => b.city || b.name)
      .filter(Boolean);
    return cities.length > 0 ? cities.join(', ') : 'Viña, Valparaíso, Quilpué';
  }, [activeBranches]);

  // Ventas históricas confirmadas desde la colección 'orders'
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

  const totalHistoricalRevenue = useMemo(
    () =>
      confirmedOrders.reduce(
        (acc, ord) => acc + (Number(ord.total ?? ord.confirmedRevenue ?? 0) || 0),
        0
      ),
    [confirmedOrders]
  );

  // Pedidos activos (no anulados ni entregados/retirados aún)
  const activeOrdersCount = useMemo(() => {
    return dbOrders.filter((ord) => {
      const paySt = String(ord.paymentStatus || '').toUpperCase();
      const st = String(ord.status || ord.fulfillmentStatus || '').toLowerCase();
      return (
        paySt !== 'REJECTED' &&
        st !== 'pago anulado' &&
        st !== 'anulado' &&
        st !== 'cancelado' &&
        st !== 'entregado' &&
        st !== 'retirado'
      );
    }).length;
  }, [dbOrders]);

  // Clientes bloqueados en Lista Negra desde la colección 'users'
  const blacklistedCount = useMemo(() => {
    return dbCustomers.filter((c) => {
      const tags: string[] = Array.isArray(c.tags) ? c.tags : [];
      const reports: any[] = Array.isArray(c.blacklistReports) ? c.blacklistReports : [];
      return tags.includes('Lista Negra') || reports.length > 0;
    }).length;
  }, [dbCustomers]);

  return (
    <div className="space-y-4 font-sans text-gray-900 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#ece9d8] border-2 border-blue-900 p-4 shadow-xl flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-700 animate-spin" />
            <span className="font-bold text-xs text-blue-950">
              CARGANDO DASHBOARD GLOBAL DESDE MONGODB...
            </span>
          </div>
        </div>
      )}

      <WindowFrame
        title="SUPER_ROOT_CONTROL.SYS - [Dashboard Global Consolidado (MongoDB)]"
        icon={<PixelIcon name="computer" size={16} />}
        statusBarText={`NODOS ACTIVOS: ${activeBranches.length} // PRODUCTOS: ${dbProducts.length} // ÓRDENES: ${dbOrders.length} // CLIENTES: ${dbCustomers.length} // MONGODB EN LÍNEA`}
      >
        <div className="space-y-4">
          {/* Cabecera del Panel */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#003c74]">
                PANEL DE CONTROL CENTRAL - NO LIMITS (MONGODB)
              </h2>
              <span className="text-xs text-blue-700 font-semibold">
                // Bienvenido {currentUser?.name || 'Super Admin'} (Super Administrador Global)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/admin/inventory">
                <button
                  type="button"
                  className="winxp-button winxp-button-primary text-xs py-1 px-3 text-blue-900 font-bold"
                >
                  <Package className="w-3.5 h-3.5 text-blue-700 inline mr-1" />
                  <span>Gestión de Inventario</span>
                </button>
              </Link>
              <Link to="/admin/product-stock">
                <button
                  type="button"
                  className="winxp-button text-xs py-1 px-3 text-emerald-950 font-bold border-emerald-700 bg-emerald-50/70 hover:bg-emerald-100"
                >
                  <Boxes className="w-3.5 h-3.5 text-emerald-700 inline mr-1" />
                  <span>Resumen Stock Productos</span>
                </button>
              </Link>
              <Link to="/admin/orders">
                <button
                  type="button"
                  className="winxp-button text-xs py-1 px-3 text-cyan-950 font-bold border-cyan-700 bg-cyan-50/70 hover:bg-cyan-100"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-cyan-700 inline mr-1" />
                  <span>Órdenes de Compra</span>
                </button>
              </Link>
              <Link to="/admin/interest-notifications">
                <button
                  type="button"
                  className="winxp-button text-xs py-1 px-3 text-amber-950 font-bold border-amber-700 bg-amber-50/70 hover:bg-amber-100"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-700 inline mr-1" />
                  <span>Notificaciones de Interés</span>
                </button>
              </Link>
              <Link to="/admin/express-upload">
                <button
                  type="button"
                  className="winxp-button text-xs py-1 px-3 text-gray-800"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600 inline mr-1" />
                  <span>Carga Express Live</span>
                </button>
              </Link>
              <Link to="/admin/logistics">
                <button
                  type="button"
                  className="winxp-button text-xs py-1 px-3 text-gray-800"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-blue-700 inline mr-1" />
                  <span>Logística & Deudores</span>
                </button>
              </Link>
              <button
                type="button"
                onClick={fetchDashboardData}
                className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1"
                title="Sincronizar con MongoDB"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Métricas Globales Reales desde MongoDB */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-blue-900 uppercase">Sucursales Vinculadas</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {activeBranches.length} Nodos
              </div>
              <div className="text-[11px] text-gray-600 mt-0.5 truncate" title={branchCitiesSummary}>
                {branchCitiesSummary}
              </div>
            </div>

            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-green-900 uppercase">Ventas Confirmadas</div>
              <div className="text-2xl font-bold text-green-700 mt-1">
                ${totalHistoricalRevenue.toLocaleString('es-CL')}
              </div>
              <div className="text-[11px] text-gray-600 mt-0.5">
                {confirmedOrders.length} transaccion(es) en MongoDB
              </div>
            </div>

            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-amber-900 uppercase">Pedidos en Curso</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {activeOrdersCount} Activos
              </div>
              <div className="text-[11px] text-gray-600 mt-0.5">
                Sincronizados en colección orders
              </div>
            </div>

            <div className="bg-white border border-[#7f9db9] p-3 shadow-xs">
              <div className="text-xs font-bold text-red-900 uppercase">Clientes Bloqueados</div>
              <div className="text-2xl font-bold text-red-700 mt-1">
                {blacklistedCount} en Lista Negra
              </div>
              <div className="text-[11px] text-gray-600 mt-0.5">
                De {dbCustomers.length} cliente(s) en MongoDB
              </div>
            </div>
          </div>

          {/* Accesos Directos a los Módulos de Administración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <Link to="/admin/inventory" className="block group">
              <div className="p-4 bg-white border border-[#7f9db9] hover:border-blue-600 hover:shadow-md transition-all space-y-2 h-full">
                <div className="flex items-center justify-between">
                  <Package className="w-5 h-5 text-blue-700" />
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-700 transition-colors" />
                </div>
                <h3 className="font-bold text-xs text-blue-900 group-hover:underline">
                  GESTIÓN DE INVENTARIO
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Resumen de categorías, usuarios, productos ({dbProducts.length}), ventas por
                  sucursal y gráficos Top 10 en MongoDB.
                </p>
              </div>
            </Link>

            <Link to="/admin/branches" className="block group">
              <div className="p-4 bg-white border border-[#7f9db9] hover:border-blue-600 hover:shadow-md transition-all space-y-2 h-full">
                <div className="flex items-center justify-between">
                  <Store className="w-5 h-5 text-blue-700" />
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-700 transition-colors" />
                </div>
                <h3 className="font-bold text-xs text-blue-900 group-hover:underline">
                  ADMINISTRADOR DE SUCURSALES
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Aperturas de tiendas físicas ({activeBranches.length} activas), habilitación de
                  stock regional y configuración de jefes de local.
                </p>
              </div>
            </Link>

            <Link to="/admin/customers" className="block group">
              <div className="p-4 bg-white border border-[#7f9db9] hover:border-blue-600 hover:shadow-md transition-all space-y-2 h-full">
                <div className="flex items-center justify-between">
                  <Users className="w-5 h-5 text-indigo-700" />
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-700 transition-colors" />
                </div>
                <h3 className="font-bold text-xs text-blue-900 group-hover:underline">
                  ADMINISTRADOR DE CLIENTES
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Directorio de clientes registrados ({dbCustomers.length}), Puntos Club, Lista
                  Preferencial y Lista Negra en MongoDB.
                </p>
              </div>
            </Link>

            <Link to="/admin/product-manager" className="block group">
              <div className="p-4 bg-white border border-[#7f9db9] hover:border-blue-600 hover:shadow-md transition-all space-y-2 h-full">
                <div className="flex items-center justify-between">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-700 transition-colors" />
                </div>
                <h3 className="font-bold text-xs text-blue-900 group-hover:underline">
                  ADMINISTRADOR DE PRODUCTOS
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Gestión integral de catálogo en MongoDB y Cloudinary, precios en CLP, descuentos,
                  tallas y fotos.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </WindowFrame>
    </div>
  );
};