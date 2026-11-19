import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Package,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useBranch } from '../../context/BranchContext';
import { PixelIcon } from '../common/PixelIcon';

export const TopNavBar: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const { totalItems } = useCart();
  const { branches, activeBranchId, setActiveBranchId } = useBranch();
  const navigate = useNavigate();

  const physicalBranches = branches.filter((b) => !b.isCorporate && b.id !== 'casa_matriz');

  // Sincronizar automáticamente el nodo activo cuando el usuario es admin de una sucursal específica
  useEffect(() => {
    if (currentRole === 'branch_admin' && currentUser?.branchId) {
      if (activeBranchId !== currentUser?.branchId) {
        setActiveBranchId(currentUser?.branchId);
      }
    }
  }, [currentRole, currentUser?.branchId, activeBranchId, setActiveBranchId]);

  const currentAdminBranch = physicalBranches.find((b) => b.id === currentUser?.branchId) || physicalBranches[0];

  return (
    <header className="sticky top-0 z-50 bg-[#ece9d8] border-b-2 border-[#707070] shadow-md select-none font-sans">
      {/* 1. Barra de Menú Estándar (Archivo, Edición, etc.) */}
      <div className="winxp-menubar text-[11px] px-3 py-1 flex items-center justify-between border-b border-[#d0ccc0]">
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="winxp-menu-item">Archivo</span>
          <span className="winxp-menu-item">Edición</span>
          <span className="winxp-menu-item">Ver</span>
          <span className="winxp-menu-item">Favoritos</span>
          <span className="winxp-menu-item">Herramientas</span>
          <span className="winxp-menu-item">Ayuda</span>
        </div>

        {/* Accesos directos de Administración según el rol autenticado */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {currentRole === 'branch_admin' && (
            <Link
              to="/admin/orders"
              className="winxp-button text-[10px] py-0.5 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-700 font-bold flex items-center gap-1"
              title={`Abrir PANEL ADMIN de ${currentAdminBranch?.city || 'Sucursal'}`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>PANEL ADMIN </span>
            </Link>
          )}

          {currentRole === 'super_admin' && (
            <Link
              to="/admin/inventory"
              className="winxp-button text-[10px] py-0.5 px-2 bg-blue-100 hover:bg-blue-200 text-blue-950 border border-blue-600 font-bold flex items-center gap-1"
            >
              <Package className="w-3 h-3 text-blue-700" />
              <span>INVENTARIO ROOT</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Barra de Herramientas Estándar con Botones Retro */}
      <div className="px-2 sm:px-3 py-1.5 bg-[#ece9d8] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Botón Atrás */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="winxp-button text-xs py-1 px-2 text-gray-800"
            title="Atrás"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-green-700" />
            <span className="hidden sm:inline">Atrás</span>
          </button>

          {/* Botón Adelante */}
          <button
            type="button"
            onClick={() => navigate(1)}
            className="winxp-button text-xs py-1 px-2 text-gray-800"
            title="Adelante"
          >
            <ArrowRight className="w-3.5 h-3.5 text-green-700" />
          </button>

          {/* Botón Actualizar */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="winxp-button text-xs py-1 px-2 text-gray-800"
            title="Actualizar"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
          </button>

          {/* Separador */}
          <div className="h-5 w-px bg-gray-400 mx-1" />

          {/* Botón Inicio */}
          <Link to="/" className="winxp-button text-xs py-1 px-2.5">
            <Home className="w-3.5 h-3.5 text-blue-700" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>

          {/* Botón Catálogo con Lupa Pixelada */}
          <Link to="/catalog" className="winxp-button text-xs py-1 px-2.5">
            <PixelIcon name="search" size={14} />
            <span>Catálogo</span>
          </Link>

          {/* Botón Carrito con Carrito Pixelado */}
          <Link
            to="/cart"
            className="winxp-button text-xs py-1 px-2.5 bg-[#f5f8ff] border-blue-700 relative font-semibold"
          >
            <PixelIcon name="cart" size={15} />
            <span>Carro ({totalItems})</span>
            {totalItems > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-600 absolute top-1 right-1 animate-ping" />
            )}
          </Link>

          {/* Botón Mi Cuenta */}
          <Link to={currentUser ? "/profile" : "/auth"} className="winxp-button text-xs py-1 px-2 text-gray-800">
            <UserIcon className="w-3.5 h-3.5 text-gray-700" />
            <span className="hidden md:inline">
              {!currentUser ? 'Iniciar Sesión' : currentUser.firstName}
            </span>
          </Link>

          {/* Botón PANEL ADMIN en el navbar del Admin de Sucursal */}
          {currentRole === 'branch_admin' && (
            <Link
              to="/admin/orders"
              className="winxp-button text-xs py-1 px-2.5 bg-[#e6f4ea] hover:bg-[#ceead6] text-emerald-950 border border-emerald-700 font-bold flex items-center gap-1"
              title={`Panel de Administración - Sucursal ${currentAdminBranch?.city || ''}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>PANEL ADMIN </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};