import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../admin/AdminSidebar';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

/**
 * AdminLayout: Layout envolvente permanente para el Super Administrador.
 * 
 * Mantiene el Sidebar fijo a la izquierda independientemente de a qué página
 * dentro del Inventario Root o panel de administración ingrese el usuario.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-3.5 items-start w-full min-w-0 max-w-full relative">
      {/* Sidebar persistente a la izquierda con los 8 botones requeridos */}
      <AdminSidebar />

      {/* Contenido dinámico de la página del Administrador a la derecha */}
      <div className="flex-1 w-full min-w-0 max-w-full transition-all">
        {children || <Outlet />}
      </div>
    </div>
  );
};
export default AdminLayout;
