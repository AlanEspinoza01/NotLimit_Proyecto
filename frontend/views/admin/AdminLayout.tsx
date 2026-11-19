import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

export const AdminLayout: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-3 items-start w-full relative">
      
      {/* 1. Tu Barra Lateral Izquierda Original */}
      <AdminSidebar />

      {/* 2. Área Principal de Contenido Dinámico */}
      <div className="flex-1 w-full min-w-0">
        <Outlet />
      </div>
      
    </div>
  );
};