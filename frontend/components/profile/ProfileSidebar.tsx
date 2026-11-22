import React from 'react';
import {
  Package,
  Award,
  MessageSquare,
  Heart,
  MapPin,
  RotateCcw,
  Settings,
  LogOut
} from 'lucide-react';
import { ProfileTabId } from './profileTypes';

interface ProfileSidebarProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    loyaltyPoints: number;
  };
  activeTab: ProfileTabId;
  setActiveTab: (tab: ProfileTabId) => void;
  ordersCount: number | null;
  pendingReviewsCount: number | null;
  wishlistCount: number;
  returnRequestsCount: number;
  onLogout: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  ordersCount,
  pendingReviewsCount,
  wishlistCount,
  returnRequestsCount,
  onLogout
}) => {
  // Pestañas de navegación vertical estilo Windows XP
  // "Historial de pedidos" ahora renombrado a "Historial de Compras"
  // "Direcciones Envío" renombrado a "Gestión de Direcciones"
  // Se eliminó la pestaña "Métodos de Pago" / Guardar Tarjetas por requerimiento
  const tabs: { id: ProfileTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'orders', label: 'Historial de Compras', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'points', label: 'Puntos Acumulados', icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'reviews', label: 'Mis Reseñas', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'wishlist', label: 'Lista de Deseos', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'addresses', label: 'Gestión de Direcciones', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'returns', label: 'Devoluciones', icon: <RotateCcw className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'Configuración', icon: <Settings className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="profile-sidebar-col md:col-span-4 space-y-3">
      <div className="p-3 bg-gray-50 border border-gray-300 text-center space-y-2 winxp-bevel-out">
        <div className="w-20 h-20 mx-auto border-2 border-gray-400 bg-amber-100 flex items-center justify-center text-4xl shadow-sm overflow-hidden relative">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>🦆</span>
          )}
        </div>
        <div className="px-1 overflow-hidden">
          <h3 className="font-bold text-gray-900 text-sm break-words line-clamp-2" title={currentUser.name}>
            {currentUser.name}
          </h3>
          <span className="text-xs text-blue-900 font-mono break-all block">{currentUser.email}</span>
        </div>

        <div className="bg-white border border-gray-300 p-2 flex items-center justify-around text-xs">
          <div>
            <div className="text-[10px] text-gray-500 font-bold">PUNTOS:</div>
            <div className="font-bold text-red-700 text-sm">{currentUser.loyaltyPoints} pts</div>
          </div>
          <div className="h-6 w-px bg-gray-300" />
          <div>
            <div className="text-[10px] text-gray-500 font-bold">VALOR CANJE:</div>
            <div className="font-bold text-green-700 text-xs">
              ${(currentUser.loyaltyPoints * 10).toLocaleString('es-CL')} CLP
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="winxp-button text-xs py-1 px-3 w-full text-red-700 font-semibold cursor-pointer flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5 text-red-700 shrink-0" />
          <span>Cerrar Sesión de Windows</span>
        </button>
      </div>

      {/* Pestañas de navegación vertical estilo Windows XP alineadas al centro */}
      <div className="flex flex-col gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`winxp-button w-full text-xs py-2 px-3 flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'winxp-button-primary bg-blue-100 font-bold text-blue-900 shadow-inner'
                : 'text-gray-800 hover:bg-gray-100'
            }`}
          >
            <span className="text-blue-700 shrink-0">{tab.icon}</span>
            <span className="font-semibold text-center">{tab.label}</span>
            {tab.id === 'orders' && (
              <span
                data-force-white
                style={{ color: '#ffffff' }}
                className="bg-blue-700 !text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 shadow-xs"
              >
                {ordersCount === null ? '…' : ordersCount}
              </span>
            )}
            {tab.id === 'points' && (
              <span
                data-force-white
                style={{ color: '#ffffff' }}
                className="bg-amber-600 !text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 shadow-xs"
              >
                {currentUser.loyaltyPoints}p
              </span>
            )}
            {/* El contador debe verse incluso cuando no hay reseñas pendientes. */}
            {tab.id === 'reviews' && (
              <span
                data-force-white
                style={{ color: '#ffffff' }}
                className="bg-amber-600 !text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 shadow-xs"
              >
                {pendingReviewsCount === null ? '…' : pendingReviewsCount}
              </span>
            )}
            {tab.id === 'wishlist' && wishlistCount > 0 && (
              <span
                data-force-white
                style={{ color: '#ffffff' }}
                className="bg-rose-600 !text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 shadow-xs"
              >
                {wishlistCount}
              </span>
            )}
            {tab.id === 'returns' && (
              <span
                data-force-white
                style={{ color: '#ffffff' }}
                className="bg-purple-700 !text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 shadow-xs"
              >
                {returnRequestsCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
