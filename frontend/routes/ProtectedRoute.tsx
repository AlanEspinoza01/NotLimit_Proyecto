import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protege rutas básicas (solo exige que el usuario haya iniciado sesión)
export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    // Si no está autenticado, lo enviamos al login
    return <Navigate to="/login" replace />; 
  }
  
  // Si está autenticado, renderiza el componente hijo
  return <Outlet />; 
};

// Protege rutas administrativas (exige sesión Y un rol específico)
export const AdminRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { isAuthenticated, currentRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!currentRole || !allowedRoles.includes(currentRole)) {
    // Si no tiene el rol necesario, lo enviamos a la página principal
    return <Navigate to="/" replace />; 
  }

  return <Outlet />;
};