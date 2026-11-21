import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  Clock,
  Radio,
  Layers,
  ShoppingBag,
  Package,
  Shield,
  Zap,
  Store,
  Folder,
  Music,
  Power,
  LogOut,
  Settings,
  Bell,
  Users,
  HelpCircle,
  CreditCard,
  BarChart3,
  History,
  Building2,
  FileText,
  ShieldCheck,
  Truck,
  RotateCcw,
  Instagram,
  ChevronUp,
  ChevronDown,
  Phone,
  ExternalLink,
  Info,
  Boxes,
  Sparkles,
  Edit3,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useBranch, formatBranchPickupSummary } from '../../context/BranchContext';
import { useAdminNotifications } from '../../context/AdminNotificationContext';
import { PixelIcon } from '../common/PixelIcon';
import { WindowFrame } from './WindowFrame';
import { LegalDocument } from '../legal/LegalDocument';
import api from '../../api/axios';
import { ContactoWidget } from '../home/ContactoWidget';
import { CustomProductWidget } from '../home/CustomProductWidget';
import {
  STORAGE_INFORMATIVE_KEY,
  DEFAULT_INFORMATIVE_CONFIG,
  InformativeConfig
} from '../../views/admin/PageEditorView';

interface ModalInfo {
  title: string;
  category: string;
  content: React.ReactNode;
  isLegal?: boolean; // Ancho y desplazamiento especial para documentos extensos.
}

const getStoredInformativeConfig = (): InformativeConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_INFORMATIVE_KEY);
    if (saved) {
      return { ...DEFAULT_INFORMATIVE_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return DEFAULT_INFORMATIVE_CONFIG;
};

export const OSDesktopTaskbar: React.FC = () => {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const location = useLocation();
  const { currentRole, currentUser, logout } = useAuth();
  const { totalItems } = useCart();
  const { branches } = useBranch();
  const { notifications, unreadCount } = useAdminNotifications();
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  // Configuración informativa sincronizada en tiempo real con "Editar Página"
  const [infoConfig, setInfoConfig] = useState<InformativeConfig>(() => getStoredInformativeConfig());

  // Estado para la expansión del footer corporativo (controlado por clic del usuario y cierre automático al hacer clic fuera)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const expandedPanelRef = useRef<HTMLDivElement | null>(null);
  const expandBtnRef = useRef<HTMLButtonElement | null>(null);
  // Modal para la Mesa de Ayuda / Contacto WhatsApp
  const [showContacto, setShowContacto] = useState<boolean>(false);
  // Modal para Pedir Producto Personalizado
  const [showCustomProduct, setShowCustomProduct] = useState<boolean>(false);
  // Modal informativo para los botones del footer
  const [activeModal, setActiveModal] = useState<ModalInfo | null>(null);

  // Sincroniza textos PUBLICADOS en MongoDB para cualquier visitante.
  // Antes de este cambio, otros usuarios podían ver versiones antiguas guardadas solo en localStorage.
  useEffect(() => {
    let mounted = true;
    const fetchPublicDocuments = async () => {
      try {
        const result = await api.get('/store-settings');
        const saved = result.data?.data?.infoTexts;
        if (mounted && saved && Object.keys(saved).length > 0) {
          const merged = { ...DEFAULT_INFORMATIVE_CONFIG, ...saved } as InformativeConfig;
          setInfoConfig(merged);
          localStorage.setItem(STORAGE_INFORMATIVE_KEY, JSON.stringify(merged));
        }
      } catch (error) {
        // Si el backend está desconectado, conservar la copia local como respaldo.
        console.warn('No fue posible actualizar los documentos informativos:', error);
      }
    };
    void fetchPublicDocuments();
    return () => { mounted = false; };
  }, []);

  // Escape permite cerrar el documento desde teclado sin alterar otros modales.
  useEffect(() => {
    if (!activeModal) return;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', closeWithEscape);
    return () => window.removeEventListener('keydown', closeWithEscape);
  }, [activeModal]);

  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (expandedPanelRef.current && expandedPanelRef.current.contains(target)) {
        return;
      }
      if (expandBtnRef.current && expandBtnRef.current.contains(target)) {
        return;
      }
      setIsExpanded(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  useEffect(() => {
    const syncInformative = () => {
      setInfoConfig(getStoredInformativeConfig());
    };
    window.addEventListener('nl_informative_config_updated', syncInformative);
    window.addEventListener('storage', syncInformative);
    return () => {
      window.removeEventListener('nl_informative_config_updated', syncInformative);
      window.removeEventListener('storage', syncInformative);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenInfo = (key: string) => {
    const cfg = infoConfig;

    switch (key) {
      case 'quienes_somos':
        setActiveModal({
          title: 'Quienes_Somos.txt - Bloc de Notas',
          category: 'NOSOTROS // HISTORIA Y VISIÓN',
          content: (
            <div className="space-y-3 text-xs leading-relaxed text-gray-800">
              <div className="p-2.5 bg-blue-50 border border-blue-300 winxp-bevel-in font-bold text-blue-900">
                {cfg.quienesSomosBanner}
              </div>
              <div className="whitespace-pre-line">{cfg.quienesSomos}</div>
              <div className="border-t border-gray-300 pt-2 text-[11px] text-gray-600 whitespace-pre-line">
                {cfg.quienesSomosFooter}
              </div>
            </div>
          )
        });
        break;

      case 'contacto':
        setShowContacto(true);
        break;

      case 'como_comprar':
        setActiveModal({
          title: 'Guia_de_Compra.chm - Ayuda de Windows',
          category: 'NOSOTROS // PASO A PASO',
          content: (
            <div className="space-y-2.5 text-xs text-gray-800">
              <div className="font-bold text-blue-900 pb-1 border-b border-gray-300">
                {cfg.comoPagarTitle}
              </div>
              <div className="whitespace-pre-line leading-relaxed">{cfg.comoPagar}</div>
            </div>
          )
        });
        break;

      case 'medios_de_pago':
        setActiveModal({
          title: 'Medios_de_Pago.cpl - Transbank Webpay',
          category: 'NOSOTROS // PAGOS DIGITALES',
          content: (
            <div className="space-y-2.5 text-xs text-gray-800">
              <div className="p-2 bg-green-50 border border-green-300 winxp-bevel-in flex items-center gap-2 text-green-900 font-bold">
                <CreditCard className="w-4 h-4 text-green-700 shrink-0" />
                <span>{cfg.mediosDePagoBanner}</span>
              </div>
              <p>{cfg.mediosDePagoIntro}</p>
              <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                {cfg.mediosDePago}
              </div>
              <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-200">
                {cfg.mediosDePagoFooter}
              </div>
            </div>
          )
        });
        break;

      case 'privacidad':
        setActiveModal({
          title: 'Politicas_Privacidad.doc - Documento Oficial',
          category: 'SERVICIO AL CLIENTE // PRIVACIDAD',
          isLegal: true,
          content: (
            <LegalDocument
              title={cfg.politicasPrivacidadTitle}
              content={cfg.politicasPrivacidad}
              footer={cfg.politicasPrivacidadFooter}
              kind="privacy"
            />
          )
        });
        break;

      case 'terminos':
        setActiveModal({
          title: 'Terminos_y_Condiciones.txt - Términos del Servicio',
          category: 'SERVICIO AL CLIENTE // CONDICIONES',
          isLegal: true,
          content: (
            <LegalDocument
              title={cfg.terminosCondicionesTitle}
              content={cfg.terminosCondiciones}
              kind="terms"
            />
          )
        });
        break;

      case 'metodos_envio':
        setActiveModal({
          title: 'Metodos_de_Envio.exe - Logística Nacional',
          category: 'SERVICIO AL CLIENTE // DESPACHOS',
          content: (
            <div className="space-y-2.5 text-xs text-gray-800">
              <div className="font-bold text-blue-900 pb-1 border-b border-gray-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-700" />
                <span>{cfg.metodosEnvioTitle}</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-gray-50 border border-gray-300 whitespace-pre-line">
                  {cfg.metodosEnvioStarken}
                </div>
                <div className="p-2 bg-gray-50 border border-gray-300 whitespace-pre-line">
                  {cfg.metodosEnvioBlue}
                </div>
                <div className="p-2 bg-gray-50 border border-gray-300 whitespace-pre-line">
                  {cfg.metodosEnvioPaket}
                </div>
              </div>
              <div className="text-[11px] text-gray-600">
                {cfg.metodosEnvioFooter}
              </div>
            </div>
          )
        });
        break;

      case 'retiro_sucursal': {
        const physicalPickupBranches = branches.filter(
          (b) => !b.isCorporate && b.id !== 'casa_matriz' && b.isPhysicalStore !== false && b.allowPickup !== false && b.isActive !== false
        );
        setActiveModal({
          title: 'Retiro_en_Sucursal.cpl - Puntos Físicos',
          category: 'SERVICIO AL CLIENTE // TIENDAS FÍSICAS',
          content: (
            <div className="space-y-2 text-xs text-gray-800">
              <div className="font-bold text-blue-900 pb-1 border-b border-gray-300 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-blue-700" />
                <span>{cfg.retiroSucursalTitle}</span>
              </div>
              <div className="space-y-1.5">
                {physicalPickupBranches.length > 0 ? (
                  physicalPickupBranches.map((branch) => (
                    <div key={branch.id} className="p-2 bg-gray-50 border border-gray-300 space-y-0.5">
                      <div className="font-bold text-gray-900">📍 {branch.name}</div>
                      <div className="text-gray-700">{branch.address}, {branch.city}</div>
                      <div className="text-blue-900 font-semibold flex items-center gap-1 pt-0.5">
                        <Clock className="w-3 h-3 text-blue-700 shrink-0" />
                        <span>Horario de Retiro: {formatBranchPickupSummary(branch)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-2 bg-gray-50 border border-gray-300 whitespace-pre-line">
                      {cfg.retiroSucursalVina}
                    </div>
                    <div className="p-2 bg-gray-50 border border-gray-300 whitespace-pre-line">
                      {cfg.retiroSucursalValpo}
                    </div>
                    <div className="p-2 bg-gray-50 border border-gray-300 whitespace-pre-line">
                      {cfg.retiroSucursalQuilpue}
                    </div>
                  </>
                )}
              </div>
              <div className="text-[11px] text-green-700 font-semibold">
                {cfg.retiroSucursalFooter}
              </div>
            </div>
          )
        });
        break;
      }

      case 'cambios_devoluciones':
        setActiveModal({
          title: 'Cambios_y_Devoluciones.doc - Políticas de Post-Venta',
          category: 'SERVICIO AL CLIENTE // GARANTÍA',
          content: (
            <div className="space-y-2 text-xs text-gray-800">
              <div className="font-bold text-blue-900 pb-1 border-b border-gray-300 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-700" />
                <span>{cfg.cambiosDevolucionesTitle}</span>
              </div>
              <div className="whitespace-pre-line leading-relaxed text-gray-800">
                {cfg.cambiosDevoluciones}
              </div>
            </div>
          )
        });
        break;

      default:
        break;
    }
  };

  return (
    <>
      {/* ===================================================================
          MENÚ INICIO ESTILO WINDOWS XP LUNA (2 Columnas)
          =================================================================== */}
      {startMenuOpen && (
        <div
          className="fixed bottom-8 left-0 z-50 w-96 max-w-[95vw] bg-white border-2 border-[#0055ea] rounded-t-lg shadow-2xl overflow-hidden font-sans select-none animate-in fade-in slide-in-from-bottom-2 duration-150"
          onClick={() => setStartMenuOpen(false)}
        >
          {/* Cabecera Azul de Usuario Windows XP */}
          <div className="bg-gradient-to-r from-[#0055ea] via-[#288eff] to-[#0045d6] p-3 flex items-center justify-between text-white border-b-2 border-[#f7941d]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm border-2 border-white bg-amber-100 flex items-center justify-center shadow-md overflow-hidden">
                <span className="text-xl">🦆</span>
              </div>
              <div>
                <div className="font-bold text-sm leading-tight text-white drop-shadow-sm">
                  {currentUser?.name ?? 'Invitado'}
                </div>
                <div className="text-[11px] text-blue-100">
                  Nolimits Apparel OS ({currentRole})
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-xs italic opacity-80">Windows XP</span>
            </div>
          </div>

          {/* Cuerpo en dos columnas */}
          <div className="flex min-h-[300px]">
            {/* Columna Izquierda: Accesos Directos a la Tienda */}
            <div className="flex-1 bg-white p-2 space-y-1 text-xs">
              <Link
                to="/"
                className="flex items-center gap-2.5 p-2 hover:bg-[#316ac5] hover:text-white rounded-xs text-gray-900 group"
              >
                <PixelIcon name="windows-flag" size={24} />
                <div>
                  <div className="font-bold">Tienda Virtual Nolimits</div>
                  <div className="text-[10px] text-gray-500 group-hover:text-blue-100">Página principal y catálogo</div>
                </div>
              </Link>

              <Link
                to="/catalog"
                className="flex items-center gap-2.5 p-2 hover:bg-[#316ac5] hover:text-white rounded-xs text-gray-900 group"
              >
                <PixelIcon name="search" size={24} />
                <div>
                  <div className="font-bold">Buscador de Prendas</div>
                  <div className="text-[10px] text-gray-500 group-hover:text-blue-100">Filtros por stock y tallas</div>
                </div>
              </Link>

              <Link
                to="/cart"
                className="flex items-center gap-2.5 p-2 hover:bg-[#316ac5] hover:text-white rounded-xs text-gray-900 group"
              >
                <PixelIcon name="cart" size={24} />
                <div>
                  <div className="font-bold">Carro de Compras</div>
                  <div className="text-[10px] text-gray-500 group-hover:text-blue-100">
                    {totalItems} prenda(s) en orden
                  </div>
                </div>
              </Link>

              <div className="border-t border-gray-200 my-1 pt-1" />

              <div className="px-2 py-1 text-[11px] font-bold text-gray-600">Sistema:</div>
              <Link
                to="/auth"
                className="flex items-center gap-2 px-2 py-1 hover:bg-[#316ac5] hover:text-white rounded-xs text-gray-700"
              >
                <PixelIcon name="computer" size={16} />
                <span>Mi Cuenta / Perfil</span>
              </Link>
            </div>

            {/* Columna Derecha: Administración */}
            <div className="w-44 bg-[#d3e5fa] border-l border-[#9bb8e5] p-2 space-y-1.5 text-xs text-[#001f5c]">
              <div className="font-bold text-[11px] text-blue-900 pb-1 border-b border-blue-200">
                {currentRole === 'branch_admin' ? 'PANEL ADMIN' : 'ADMINISTRACIÓN'}
              </div>

              {(currentRole === 'branch_admin' || currentRole === 'super_admin') ? (
                <>
                  {currentRole === 'super_admin' && (
                    <Link
                      to="/admin/inventory"
                      className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                    >
                      <Package className="w-4 h-4 text-blue-800" />
                      <span className="font-semibold text-blue-900 hover:text-white">
                        Inventario (Super Admin)
                      </span>
                    </Link>
                  )}

                  <Link
                    to="/admin/top10"
                    className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                  >
                    <Layers className="w-4 h-4 text-purple-700" />
                    <span className="font-semibold text-purple-950 hover:text-white">Top 10</span>
                  </Link>

                  <Link
                    to="/admin/register-expense"
                    className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                  >
                    <CreditCard className="w-4 h-4 text-red-700" />
                    <span className="font-semibold text-red-950 hover:text-white">Registrar Gasto</span>
                  </Link>

                  <Link
                    to="/admin/register-sale"
                    className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    <span className="font-semibold text-emerald-950 hover:text-white">Registrar Venta</span>
                  </Link>

                  <Link
                    to="/admin/income-expenses"
                    className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                  >
                    <BarChart3 className="w-4 h-4 text-green-700" />
                    <span className="font-semibold text-green-950 hover:text-white">Ingresos / Gastos</span>
                  </Link>

                  <Link
                    to="/admin/sales-history"
                    className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                  >
                    <History className="w-4 h-4 text-blue-700" />
                    <span className="font-semibold text-blue-950 hover:text-white">Historial de Ventas</span>
                  </Link>

                  <Link
                    to="/admin/orders"
                    className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                  >
                    <ShoppingBag className="w-4 h-4 text-cyan-700" />
                    <span className="font-semibold text-cyan-950 hover:text-white">Órdenes de Compra</span>
                  </Link>

                  <Link
                    to="/admin/product-stock"
                    className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                  >
                    <Boxes className="w-4 h-4 text-emerald-700" />
                    <span className="font-semibold text-emerald-950 hover:text-white">
                      {currentRole === 'branch_admin' ? 'Resumen de Stock' : 'Resumen Stock Productos'}
                    </span>
                  </Link>

                  {currentRole === 'super_admin' && (
                    <>
                      <Link
                        to="/admin/suppliers"
                        className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                      >
                        <Building2 className="w-4 h-4 text-indigo-700" />
                        <span className="font-semibold text-indigo-950 hover:text-white">Proveedores</span>
                      </Link>

                      <Link
                        to="/admin/interest-notifications"
                        className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                      >
                        <Bell className="w-4 h-4 text-amber-700" />
                        <span className="font-semibold text-amber-950 hover:text-white">Notificaciones de Interés</span>
                      </Link>

                      <Link
                        to="/admin/customers"
                        className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                      >
                        <Users className="w-4 h-4 text-indigo-700" />
                        <span className="font-semibold text-blue-950 hover:text-white">Administrador de Clientes</span>
                      </Link>

                      <Link
                        to="/admin/page-editor"
                        className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                      >
                        <Edit3 className="w-4 h-4 text-cyan-700" />
                        <span className="font-semibold text-blue-950 hover:text-white">Editar Página</span>
                      </Link>

                      <Link
                        to="/admin/product-manager"
                        className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                      >
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-blue-950 hover:text-white">Administrador de Productos</span>
                      </Link>

                      <Link
                        to="/admin/branches"
                        className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
                      >
                        <Store className="w-4 h-4 text-blue-800" />
                        <span className="font-semibold text-blue-950 hover:text-white">Administrador de Sucursales</span>
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <div className="text-[11px] text-gray-600 p-1">
                  Acceso estándar cliente. Inicie sesión como Administrador para ver las herramientas del sistema.
                </div>
              )}

              <div className="border-t border-blue-200 my-1 pt-1" />

              <Link
                to="/auth"
                className="flex items-center gap-2 p-1.5 hover:bg-[#316ac5] hover:text-white rounded-xs"
              >
                <Settings className="w-4 h-4 text-gray-700" />
                <span>Cuentas de Usuario</span>
              </Link>
            </div>
          </div>

          {/* Pie del Menú Inicio */}
          <div className="bg-gradient-to-r from-[#0055ea] to-[#0030a6] p-2 flex items-center justify-end gap-3 text-white text-xs border-t border-[#3380e6]">
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 hover:bg-white/20 px-2 py-1 rounded-sm text-yellow-200 font-medium"
            >
              <LogOut className="w-3.5 h-3.5 text-yellow-300" />
              <span>Cerrar sesión</span>
            </button>
            <button
              type="button"
              onClick={() => setStartMenuOpen(false)}
              className="flex items-center gap-1.5 hover:bg-white/20 px-2 py-1 rounded-sm text-red-200 font-medium"
            >
              <Power className="w-3.5 h-3.5 text-red-400" />
              <span>Cerrar menú</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          BARRA DE TAREAS INFERIOR WINDOWS XP LUNA BLUE (<footer className="fixed bottom-0 left-0 right-0 z-40 winxp-taskbar">)
          CON PANEL EXPANDIBLE HACIA ABAJO/ARRIBA AL LLEGAR AL FINAL DEL FOOTER
          =================================================================== */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 winxp-taskbar select-none">
        {/* PANEL EXPANDIBLE: Contiene los bloques NOSOTROS, SERVICIO AL CLIENTE y SÍGUENOS */}
        {isExpanded && (
          <div
            ref={expandedPanelRef}
            className="absolute bottom-[32px] left-0 right-0 bg-[#ece9d8] border-t-2 border-b border-[#0055ea] shadow-2xl animate-in slide-in-from-bottom duration-200 font-sans max-h-[85vh] overflow-y-auto"
          >
            {/* Cabecera superior del contenedor expandido */}
            <div className="bg-gradient-to-r from-[#0055ea] via-[#288eff] to-[#0045d6] px-3 py-1.5 text-white flex items-center justify-between border-b border-[#003cb3]">
              <div className="flex items-center gap-2">
                <PixelIcon name="windows-flag" size={16} />
                <span className="font-bold text-xs tracking-wide drop-shadow-sm">
                  NOLIMITS APPAREL // CORPORATIVO & SERVICIO AL CLIENTE
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Contraer panel"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Minimizar</span>
              </button>
            </div>

            {/* Contenido en 3 Columnas: NOSOTROS, SERVICIO AL CLIENTE, SÍGUENOS */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-300 winxp-bevel-in max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. NOSOTROS */}
                <div className="space-y-2 bg-[#f8fafc] p-3 border border-gray-300 winxp-bevel-out">
                  <div className="font-bold text-xs text-blue-900 pb-1.5 border-b border-gray-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Users className="w-4 h-4 text-blue-700" />
                    <span>NOSOTROS</span>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenInfo('quienes_somos')}
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-medium text-gray-800 hover:text-blue-900 hover:bg-blue-50/80 cursor-pointer w-full text-left"
                    >
                      <PixelIcon name="info" size={14} />
                      <span>Quienes Somos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowContacto(true)}
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-medium text-gray-800 hover:text-blue-900 hover:bg-blue-50/80 cursor-pointer w-full text-left"
                    >
                      <Send className="w-3.5 h-3.5 text-blue-700" />
                      <span>Atencion al Cliente</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenInfo('como_comprar')}
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-medium text-gray-800 hover:text-blue-900 hover:bg-blue-50/80 cursor-pointer w-full text-left"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-700" />
                      <span>Cómo Comprar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenInfo('medios_de_pago')}
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-medium text-gray-800 hover:text-blue-900 hover:bg-blue-50/80 cursor-pointer w-full text-left"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Medios de Pago</span>
                    </button>
                  </div>
                </div>

                {/* 2. SERVICIO AL CLIENTE */}
                <div className="space-y-2 bg-[#f8fafc] p-3 border border-gray-300 winxp-bevel-out">
                  <div className="font-bold text-xs text-blue-900 pb-1.5 border-b border-gray-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <HelpCircle className="w-4 h-4 text-blue-700" />
                    <span>SERVICIO AL CLIENTE</span>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenInfo('privacidad')}
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-medium text-gray-800 hover:text-blue-900 hover:bg-blue-50/80 cursor-pointer w-full text-left"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                      <span>Políticas de Privacidad</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenInfo('terminos')}
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-medium text-gray-800 hover:text-blue-900 hover:bg-blue-50/80 cursor-pointer w-full text-left"
                    >
                      <FileText className="w-3.5 h-3.5 text-gray-600" />
                      <span>Términos y Condiciones</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenInfo('metodos_envio')}
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-medium text-gray-800 hover:text-blue-900 hover:bg-blue-50/80 cursor-pointer w-full text-left"
                    >
                      <Truck className="w-3.5 h-3.5 text-amber-700" />
                      <span>Métodos de Envío</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenInfo('retiro_sucursal')}
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-medium text-gray-800 hover:text-blue-900 hover:bg-blue-50/80 cursor-pointer w-full text-left"
                    >
                      <Store className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Retiro en Sucursal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenInfo('cambios_devoluciones')}
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-medium text-gray-800 hover:text-blue-900 hover:bg-blue-50/80 cursor-pointer w-full text-left"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                      <span>Cambios y Devoluciones</span>
                    </button>
                  </div>
                </div>

                {/* 3. SÍGUENOS (Sincronizado con TikTok Oficial, Instagram Oficial y WhatsApp Oficial) */}
                <div className="space-y-2 bg-[#f8fafc] p-3 border border-gray-300 winxp-bevel-out">
                  <div className="font-bold text-xs text-blue-900 pb-1.5 border-b border-gray-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <ExternalLink className="w-4 h-4 text-blue-700" />
                    <span>SÍGUENOS</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">
                    Conéctate a nuestras redes oficiales para enterarte de los nuevos drops y eventos en tiendas físicas.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    {/* Botón con Ícono de TikTok sincronizado */}
                    <a
                      href={infoConfig.tiktokUrl?.trim() || DEFAULT_INFORMATIVE_CONFIG.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-bold text-gray-900 hover:text-black hover:bg-gray-100 cursor-pointer w-full flex items-center gap-2.5 border border-gray-400 shadow-xs"
                    >
                      <div className="w-5 h-5 rounded-[4px] bg-[#010101] flex items-center justify-center shrink-0 shadow-sm border border-gray-700">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M16.6 5.82s.51.5 1.45.75c.95.26 1.83.17 1.83.17V3.5s-.82.02-1.84-.33c-1.02-.35-1.78-1.07-1.78-1.07V13.8a2.9 2.9 0 0 1-2.9 2.9 2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.9-2.9c.35 0 .69.06 1 .17V7.5a6.45 6.45 0 0 0-1-.08A6.4 6.4 0 0 0 6.96 13.8a6.4 6.4 0 0 0 6.4 6.4 6.4 6.4 0 0 0 6.4-6.4V8.42a8.55 8.55 0 0 0 3.24 1.15V6.13c-.93-.16-1.8-.57-2.52-1.18a5.53 5.53 0 0 1-1.48-1.55l-2.4 2.42z"
                            fill="#25F4EE"
                          />
                          <path
                            d="M16.1 5.32s.51.5 1.45.75c.95.26 1.83.17 1.83.17V3s-.82.02-1.84-.33c-1.02-.35-1.78-1.07-1.78-1.07V13.3a2.9 2.9 0 0 1-2.9 2.9 2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.9-2.9c.35 0 .69.06 1 .17V7a6.45 6.45 0 0 0-1-.08A6.4 6.4 0 0 0 6.46 13.3a6.4 6.4 0 0 0 6.4 6.4 6.4 6.4 0 0 0 6.4-6.4V7.92a8.55 8.55 0 0 0 3.24 1.15V5.63c-.93-.16-1.8-.57-2.52-1.18a5.53 5.53 0 0 1-1.48-1.55l-2.4 2.42z"
                            fill="#FE2C55"
                          />
                          <path
                            d="M16.35 5.57s.51.5 1.45.75c.95.26 1.83.17 1.83.17V3.25s-.82.02-1.84-.33c-1.02-.35-1.78-1.07-1.78-1.07V13.55a2.9 2.9 0 0 1-2.9 2.9 2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.9-2.9c.35 0 .69.06 1 .17V7.25a6.45 6.45 0 0 0-1-.08 6.4 6.4 0 0 0-6.4 6.38 6.4 6.4 0 0 0 6.4 6.4 6.4 6.4 0 0 0 6.4-6.4V8.17a8.55 8.55 0 0 0 3.24 1.15V5.88c-.93-.16-1.8-.57-2.52-1.18a5.53 5.53 0 0 1-1.48-1.55l-2.4 2.42z"
                            fill="#FFFFFF"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] leading-tight">TikTok Oficial</div>
                      </div>
                    </a>

                    {/* Botón con Ícono de Instagram sincronizado */}
                    <a
                      href={infoConfig.instagramUrl?.trim() || DEFAULT_INFORMATIVE_CONFIG.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-bold text-gray-900 hover:text-pink-900 hover:bg-pink-50/50 cursor-pointer w-full flex items-center gap-2.5 border border-pink-300 shadow-xs"
                    >
                      <div className="w-5 h-5 rounded-sm bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Instagram className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] leading-tight">Instagram Oficial</div>
                      </div>
                    </a>

                    {/* Botón de WhatsApp Oficial sincronizado */}
                    <a
                      href={`https://wa.me/${
                        (infoConfig.whatsappNumber || DEFAULT_INFORMATIVE_CONFIG.whatsappNumber).replace(/\D/g, '') ||
                        '56984519283'
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="winxp-button text-xs py-1.5 px-3 justify-start font-bold text-green-950 hover:text-green-900 hover:bg-green-50/70 cursor-pointer w-full flex items-center gap-2.5 border border-emerald-400 shadow-xs"
                    >
                      <div className="w-5 h-5 rounded-sm bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Phone className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] leading-tight">WhatsApp Oficial</div>
                        <div className="text-[10px] text-emerald-800 font-mono truncate">
                          {infoConfig.whatsappNumber || DEFAULT_INFORMATIVE_CONFIG.whatsappNumber}
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Pie de página con copyright y notas del sistema */}
              <div className="mt-3 pt-2.5 border-t border-gray-300 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
                <div>
                  © 2026 NoLimits Apparel Core. Todos los derechos reservados. Windows XP Luna Edition.
                </div>
                <div className="font-mono text-[10px] text-gray-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  <span>Conexión Segura Transbank Webpay Plus OK</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón de Inicio Verde */}
        <div className="flex items-center h-full">
          <button
            type="button"
            onClick={() => setStartMenuOpen(!startMenuOpen)}
            className="winxp-start-btn"
            title="Haga clic aquí para comenzar"
          >
            <PixelIcon name="windows-flag" size={18} />
            <span>inicio</span>
          </button>

          {/* Pestañas de Ventanas Abiertas en la Barra */}
          <div className="hidden sm:flex items-center gap-1 px-2">
            <div className="h-6 px-3 bg-[#1e50c4] border border-[#0d348a] rounded-sm text-white text-xs flex items-center gap-1.5 shadow-inner">
              <PixelIcon name="internet" size={14} />
              <span className="font-semibold truncate max-w-[160px]">
                {location.pathname === '/' ? 'NoLimits - Home' : location.pathname.replace('/', '')}
              </span>
            </div>
          </div>

          {/* Botón para expandir / contraer los contenidos corporativos con ciclo cromático arcoíris */}
          <div className="flex items-center gap-1.5 pl-1 sm:pl-2">
            <button
              ref={expandBtnRef}
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="winxp-button winxp-rainbow-cycle-btn text-[11px] h-6 py-0 px-2.5 flex items-center gap-1 font-bold cursor-pointer"
              title={isExpanded ? 'Minimizar información del footer' : 'Expandir información del footer'}
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">Minimizar</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">Nosotros & Servicio al Cliente</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowCustomProduct(true)}
              className="winxp-button winxp-rainbow-cycle-btn text-[11px] h-6 py-0 px-2.5 flex items-center gap-1 font-bold cursor-pointer"
              title="Pedir Producto Personalizado"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Pedir Producto Personalizado</span>
            </button>
          </div>
        </div>

        {/* Área de Notificación (System Tray Azul Obscuro) */}
        <div className="winxp-tray">
          {/* Campanita de Alertas */}
          <button
            type="button"
            onClick={() => setNotifDrawerOpen(!notifDrawerOpen)}
            className="flex items-center gap-1 text-white hover:text-yellow-300"
            title="Centro de Notificaciones y Seguridad"
          >
            <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'text-yellow-300 animate-bounce' : 'text-blue-200'}`} />
            {unreadCount > 0 && <span className="font-bold text-[10px]">{unreadCount}</span>}
          </button>

          {/* Icono de Sonido Pixel */}
          <PixelIcon name="sound" size={14} />

          {/* Icono de Red en Línea */}
          <div className="flex items-center gap-1 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" />
            <span className="hidden lg:inline text-blue-100">En línea</span>
          </div>

          {/* Reloj Digital */}
          <div className="font-mono text-[11px] font-bold tracking-tight text-white pl-1">
            {timeStr || '17:00'}
          </div>
        </div>
      </footer>

      {/* Modal público acotado: documentos legales a 700px, resto de ventanas a 448px. */}
      {activeModal &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-3 sm:p-5 font-sans overflow-y-auto">
            {/* La anchura inline impide que el estilo global .winxp-window expanda el modal. */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label={activeModal.title}
              style={{
                width: '100%',
                maxWidth: activeModal.isLegal ? 700 : 448,
                minWidth: 0,
                margin: 'auto'
              }}
            >
              <WindowFrame
                title={activeModal.title}
                icon={<PixelIcon name="info" size={16} />}
                showControls={true}
                onClose={() => setActiveModal(null)}
                statusBarText={activeModal.category}
                className="w-full shadow-2xl"
              >
                <div className="flex flex-col" style={{ maxHeight: 'min(84dvh, 760px)' }}>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                    {activeModal.content}
                  </div>
                  {/* Cerrar un documento NO constituye consentimiento legal. */}
                  <div className="shrink-0 border-t border-gray-300 bg-[#ece9d8] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-700">
                      {activeModal.isLegal ? 'Lectura informativa; cerrar no registra aceptación.' : 'Información de NoLimits'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </WindowFrame>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Contacto / WhatsApp cuando se abre desde el footer (Renderizado en Portal al tope de toda la app) */}
      {showContacto &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-150 overflow-y-auto">
            <ContactoWidget onClose={() => setShowContacto(false)} className="w-full max-w-md shadow-2xl my-auto" />
          </div>,
          document.body
        )}

      {/* Modal de Pedir Producto Personalizado (Renderizado en Portal al tope de toda la app) */}
      {showCustomProduct &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-150 overflow-y-auto">
            <CustomProductWidget onClose={() => setShowCustomProduct(false)} className="w-full max-w-lg shadow-2xl my-auto" />
          </div>,
          document.body
        )}
    </>
  );
};


