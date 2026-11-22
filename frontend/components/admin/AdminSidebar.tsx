import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  LogOut,
  BellRing,
  Boxes,
  Building2,
  History,
  BarChart3,
  Receipt,
  PieChart as PieChartIcon,
  Package,
  Shield,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Store,
  Sparkles,
  Layers,
  Users,
  Edit3,
  Bot
} from 'lucide-react';
import { PixelIcon } from '../common/PixelIcon';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  description: string;
  superAdminOnly?: boolean;
}

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { currentUser, currentRole, logout } = useAuth();
  const { branches } = useBranch();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isExtraCollapsed, setIsExtraCollapsed] = useState(false);

  const isBranchAdmin = currentRole === 'branch_admin';
  const physicalBranches = branches.filter((b) => !b.isCorporate && b.id !== 'casa_matriz');
  const assignedBranch =
    physicalBranches.find((b) => b.id === currentUser?.branchId) || physicalBranches[0];

  // Lista completa de módulos con restricción explícita para Admin de Sucursal
  const allMainNavigationButtons: SidebarItem[] = [
    {
      name: 'Órdenes de Compra',
      path: '/admin/orders',
      icon: <ShoppingBag className="w-4 h-4" />,
      description: isBranchAdmin
        ? `Órdenes de compra de ${assignedBranch?.city || 'esta sucursal'}`
        : 'Trazabilidad, estados y productos comprados',
      badge: isBranchAdmin ? assignedBranch?.city : '15 estados',
      badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-400'
    },
    {
      name: 'Notificaciones de Interés',
      path: '/admin/interest-notifications',
      icon: <BellRing className="w-4 h-4" />,
      description: 'Agotados, cobranzas Live y alertas',
      badge: 'Alertas',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-400',
      superAdminOnly: true
    },
    {
      name: isBranchAdmin ? 'Resumen de Stock' : 'Resumen Stock Productos',
      path: '/admin/product-stock',
      icon: <Boxes className="w-4 h-4" />,
      description: isBranchAdmin
        ? 'Visualización de stock por producto y tallas (Solo lectura)'
        : 'Stock por producto y separación de tallas',
      badge: isBranchAdmin ? 'Solo Ver' : 'Stock',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-400'
    },
    {
      name: 'Crear/Editar Proveedor',
      path: '/admin/suppliers',
      icon: <Building2 className="w-4 h-4" />,
      description: 'Directorio de empresas y logística',
      badge: 'Prov',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-400',
      superAdminOnly: true
    },
    {
      name: 'Historial de Ventas',
      path: '/admin/sales-history',
      icon: <History className="w-4 h-4" />,
      description: isBranchAdmin
        ? `Historial de ventas de ${assignedBranch?.city || 'esta sucursal'}`
        : 'Clientes, promedio mensual y anual',
      badge: 'Ventas',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-400'
    },
    {
      name: 'Ingresos / Gastos',
      path: '/admin/income-expenses',
      icon: <BarChart3 className="w-4 h-4" />,
      description: isBranchAdmin
        ? `Balance financiero de ${assignedBranch?.city || 'esta sucursal'}`
        : 'Gráficos comparativos anuales',
      badge: 'Balance',
      badgeColor: 'bg-green-100 text-green-900 border-green-400'
    },
    {
      name: 'Registrar Gasto',
      path: '/admin/register-expense',
      icon: <Receipt className="w-4 h-4" />,
      description: isBranchAdmin
        ? `Registrar gasto en ${assignedBranch?.city || 'esta sucursal'}`
        : 'Registro de egresos por sucursal',
      badge: 'Egresos',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-400'
    },
    {
      name: 'Registrar Venta',
      path: '/admin/register-sale',
      icon: <ShoppingBag className="w-4 h-4" />,
      description: isBranchAdmin
        ? `Registrar venta en ${assignedBranch?.city || 'esta sucursal'}`
        : 'Pago pendiente o confirmado, cliente y despacho',
      badge: 'Venta',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-400'
    },
    {
      name: 'Top 10',
      path: '/admin/top10',
      icon: <PieChartIcon className="w-4 h-4" />,
      description: isBranchAdmin
        ? `Top 10 métricas de ${assignedBranch?.city || 'esta sucursal'}`
        : 'Gráficos de pastel de demanda y clientes',
      badge: 'Métricas',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-400'
    }
  ];

  const mainNavigationButtons = isBranchAdmin
    ? allMainNavigationButtons.filter((b) => !b.superAdminOnly)
    : allMainNavigationButtons;

  // Accesos complementarios al nodo central
  const rootShortcuts: SidebarItem[] = [
    {
      name: isBranchAdmin ? 'Gestión de Inventario' : 'Gestión de Inventario (Root)',
      path: '/admin/inventory',
      icon: <Package className="w-4 h-4" />,
      description: isBranchAdmin
        ? `Gestión de inventario de ${assignedBranch?.name || 'tu sucursal'}`
        : 'Panel maestro de inventario',
      badge: isBranchAdmin ? assignedBranch?.code || 'Local' : 'Root',
      badgeColor: isBranchAdmin
        ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
        : 'bg-red-100 text-red-900 border-red-400'
    }
  ];

  const extraAdminTools: SidebarItem[] = [
    {
      name: 'Administrar Clippy IA',
      path: '/admin/clippy',
      icon: <Bot className="w-4 h-4" />,
      description: 'Preguntas, asesor de vestuario Gemini y protección antiabuso',
      badge: 'IA',
      superAdminOnly: true
    },
    {
      name: 'Administrador de Productos',
      path: '/admin/product-manager',
      icon: <Sparkles className="w-4 h-4" />,
      description: 'Precios, descuentos, tallas, peso y fotos',
      superAdminOnly: true
    },
    {
      name: 'Administrador de Sucursales',
      path: '/admin/branches',
      icon: <Store className="w-4 h-4" />,
      description: 'Apertura de tiendas, jefes de local y credenciales',
      superAdminOnly: true
    },
    {
      name: 'Administrador de Clientes',
      path: '/admin/customers',
      icon: <Users className="w-4 h-4" />,
      description: 'Directorio, Lista Preferencial y Lista Negra',
      superAdminOnly: true
    },
    {
      name: 'Editar Pagina',
      path: '/admin/page-editor',
      icon: <Edit3 className="w-4 h-4" />,
      description: 'Informativas, Slider, Reseñas, Envíos y Cupones',
      superAdminOnly: true
    }
  ];

  // Comprobar si una ruta está activa
  const isPathActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-full lg:w-68 shrink-0 font-sans text-gray-900 self-start sticky top-3 z-30">
      {/* Botón Móvil para Colapsar/Expandir en pantallas pequeñas */}
      <div className="lg:hidden mb-2">
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full winxp-button winxp-button-primary text-xs py-2 px-3 text-blue-950 font-bold flex items-center justify-between shadow-xs border-blue-700 bg-blue-100"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-800" />
            <span>
              {isBranchAdmin
                ? `PANEL ADMIN (${assignedBranch?.city || 'Sucursal'})`
                : 'BARRA LATERAL SUPER ADMIN'}{' '}
              ({isMobileOpen ? 'Ocultar' : 'Mostrar'})
            </span>
          </div>
          {isMobileOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Contenedor Principal del Sidebar Estilo Ventana Windows XP Task Pane */}
      <div
        className={`winxp-window shadow-md border-2 border-[#003c74] overflow-hidden transition-all duration-200 ${
          isMobileOpen ? 'block' : 'hidden lg:block'
        }`}
      >
        {/* Barra de Título Windows XP Luna */}
        <div className="winxp-titlebar py-1 px-2.5 flex items-center justify-between bg-linear-to-r from-[#0058ee] via-[#288eff] to-[#0030a6]">
          <div className="winxp-titlebar-title flex items-center gap-1.5 text-xs text-white font-extrabold truncate">
            <PixelIcon name="computer" size={15} />
            <span className="truncate tracking-wide">
              {isBranchAdmin ? 'PANEL ADMIN ' : 'INVENTARIO ROOT'}
            </span>
          </div>
          <span
            data-force-white="true"
            className={`${
              isBranchAdmin ? 'bg-emerald-700' : 'bg-red-700'
            } text-white text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider`}
          >
            {isBranchAdmin ? assignedBranch?.code || 'LOCAL' : 'ROOT'}
          </span>
        </div>

        {/* Cuerpo del Sidebar */}
        <div className="bg-[#ece9d8] p-2 space-y-2.5 text-xs">
          {/* Identificador de Administrador */}
          <div className="p-2 bg-white border border-[#7f9db9] rounded-xs shadow-2xs">
            <div className="flex items-center justify-between">
              <span
                className={`font-extrabold text-[10px] ${
                  isBranchAdmin ? 'text-emerald-800' : 'text-red-800'
                } tracking-wider uppercase flex items-center gap-1`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBranchAdmin ? 'bg-emerald-600' : 'bg-red-600'
                  } animate-pulse`}
                />
                {isBranchAdmin ? 'ADMIN SUCURSAL ACTIVO' : 'SUPER ADMIN ACTIVO'}
              </span>
              <span className="font-mono text-[9px] text-gray-500">v2.4 XP</span>
            </div>
            <div className="font-bold text-gray-900 text-xs mt-0.5 truncate">
              {currentUser?.name || 'Administrador'}
            </div>
            <div className="text-[10px] text-blue-900 font-medium truncate">
              {isBranchAdmin
                ? `Sucursal: ${assignedBranch?.city || ''} - ${assignedBranch?.name || ''}`
                : 'Control de Red & Inventario'}
            </div>
          </div>

          {/* ACCESOS DIRECTOS DEL NODO CENTRAL (Exclusivo Super Admin) */}
          {!isBranchAdmin && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wide px-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-blue-700" />
                <span>Navegación Base</span>
              </div>
              <div className="space-y-1">
                {rootShortcuts.map((item) => {
                  const active = isPathActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} className="block">
                      <div
                        className={`p-1.5 border rounded-xs transition-all flex items-center justify-between gap-1.5 ${
                          active
                            ? 'bg-[#316ac5] text-white border-[#002266] shadow-xs font-bold'
                            : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50 hover:border-blue-500'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={active ? 'text-white' : 'text-blue-700'}>{item.icon}</span>
                          <span className="truncate text-[11px] leading-tight">{item.name}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1 py-0.2 rounded-xs border shrink-0 ${
                              active
                                ? 'bg-white text-blue-900 border-white'
                                : item.badgeColor || 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              MÓDULOS DE SUCURSAL / INVENTARIO (7 para Branch Admin, 9 para Super Admin)
             ========================================================================= */}
          <div className={`space-y-1.5 ${!isBranchAdmin ? 'pt-1 border-t border-gray-300' : ''}`}>
            <div className="text-[10px] font-extrabold text-[#003c74] uppercase tracking-wider px-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>{isBranchAdmin ? 'Módulos de Sucursal' : 'Módulos de Inventario'}</span>
              </div>
              <span className="text-[9px] text-gray-500 font-mono">
                {isBranchAdmin ? '7 Módulos' : '9 Módulos'}
              </span>
            </div>

            <div className="space-y-1">
              {mainNavigationButtons.map((btn) => {
                const active = isPathActive(btn.path);

                return (
                  <Link
                    key={btn.path}
                    to={btn.path}
                    className="block group"
                    title={btn.description}
                  >
                    <div
                      className={`p-1.5 border rounded-xs transition-all flex items-center justify-between gap-1.5 ${
                        active
                          ? 'bg-linear-to-r from-[#215dc6] to-[#316ac5] text-white border-[#002266] shadow-xs font-black'
                          : 'bg-white text-gray-900 border-gray-300 hover:bg-amber-50/70 hover:border-amber-500 group-hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`shrink-0 p-0.5 rounded-xs ${
                            active ? 'text-white' : 'text-blue-700 group-hover:text-amber-700'
                          }`}
                        >
                          {btn.icon}
                        </span>
                        <div className="min-w-0">
                          <span className="truncate text-xs block leading-tight font-bold">
                            {btn.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {btn.badge && (
                          <span
                            className={`text-[9px] font-bold px-1 py-0.2 rounded-xs border ${
                              active
                                ? 'bg-white text-blue-950 border-white'
                                : btn.badgeColor || 'bg-gray-100 text-gray-800 border-gray-300'
                            }`}
                          >
                            {btn.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3 h-3 transition-transform ${
                            active
                              ? 'text-white translate-x-0.5'
                              : 'text-gray-400 group-hover:text-blue-700 group-hover:translate-x-0.5'
                          }`}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* HERRAMIENTAS ADICIONALES (Exclusivas del Super Admin) */}
          {!isBranchAdmin && (
            <div className="pt-1 border-t border-gray-300 space-y-1">
              <button
                type="button"
                onClick={() => setIsExtraCollapsed(!isExtraCollapsed)}
                className="w-full flex items-center justify-between text-[10px] font-bold text-gray-600 uppercase px-1 hover:text-gray-900"
              >
                <span>Otras Utilidades Admin</span>
                {isExtraCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>

              {!isExtraCollapsed && (
                <div className="space-y-1">
                  {extraAdminTools.map((tool) => {
                    const active = isPathActive(tool.path);
                    return (
                      <Link key={tool.path} to={tool.path} className="block">
                        <div
                          className={`p-1.5 border rounded-xs transition-all flex items-center gap-1.5 text-[11px] ${
                            active
                              ? 'bg-[#316ac5] text-white border-[#002266] font-bold'
                              : 'bg-white/80 text-gray-700 border-gray-300 hover:bg-white hover:text-gray-900'
                          }`}
                        >
                          <span className={active ? 'text-white' : 'text-gray-600'}>{tool.icon}</span>
                          <span className="truncate">{tool.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pie de Estado del Sidebar */}
          <div className="p-1.5 bg-[#d8d4c0] border border-gray-400 text-[10px] text-gray-700 flex items-center justify-between font-mono rounded-xs">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
              CONECTADO
            </span>
            <span className="truncate">
              {isBranchAdmin
                ? `NODO: ${assignedBranch?.city?.toUpperCase() || 'LOCAL'}`
                : `${physicalBranches.length} SUCURSALES`}
            </span>
          </div>

          {/* NUEVO: Botón de Cerrar Sesión */}
          <button
            type="button"
            onClick={logout}
            className="w-full mt-2 winxp-button text-xs py-1.5 font-bold text-red-800 flex items-center justify-center gap-1.5 hover:bg-red-50 border-red-400 shadow-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span>Cerrar Sesión Segura</span>
          </button>
        </div>
      </div>
    </aside>
  );
};    
export default AdminSidebar;
