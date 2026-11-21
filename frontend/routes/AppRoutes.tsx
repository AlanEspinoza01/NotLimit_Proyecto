import React, { useLayoutEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Vistas Públicas
import { HomeView } from '../views/HomeView';
import { CatalogView } from '../views/CatalogView';
import { ProductDetailView } from '../views/ProductDetailView';
import { CartView } from '../views/CartView';
import { CheckoutView } from '../views/CheckoutView';
import { WebpayResultView } from '../views/WebpayResultView';
import { AuthView } from '../views/AuthView';
import { ProfileView } from '../views/ProfileView';

// Contexto y Protección de Rutas
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute, AdminRoute } from './ProtectedRoute';

// Vistas de Administración
import { BranchManagementView } from '../views/admin/BranchManagementView';
import { LocalBranchAdminView } from '../views/admin/LocalBranchAdminView';
import { CustomerManagerView } from '../views/admin/CustomerManagerView';
import { ProductManagerView } from '../views/admin/ProductManagerView';
import { PageEditorView } from '../views/admin/PageEditorView';
import { InventoryManagementView } from '../views/admin/InventoryManagementView';
import { Top10AnalyticsView } from '../views/admin/Top10AnalyticsView';
import { RegisterExpenseView } from '../views/admin/RegisterExpenseView';
import { RegisterSaleView } from '../views/admin/RegisterSaleView';
import { IncomeExpensesAnalyticsView } from '../views/admin/IncomeExpensesAnalyticsView';
import { SalesHistoryView } from '../views/admin/SalesHistoryView';
import { SupplierManagementView } from '../views/admin/SupplierManagementView';
import { ProductStockSummaryView } from '../views/admin/ProductStockSummaryView';
import { InterestNotificationsView } from '../views/admin/InterestNotificationsView';
import { PurchaseOrdersManagementView } from '../views/admin/PurchaseOrdersManagementView';
import { AdminLayout } from '../views/admin/AdminLayout';

// Guard para redirigir a los administradores de sucursal lejos de las vistas de super admin
const SuperAdminOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentRole } = useAuth();
  if (currentRole === 'branch_admin') {
    return <Navigate to="/admin/orders" replace />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return (
    <Routes>
      {/* 1. RUTAS PÚBLICAS Y DE INVITADOS */}
      <Route path="/" element={<HomeView />} />
      <Route path="/catalog" element={<CatalogView />} />
      <Route path="/product/:id" element={<ProductDetailView />} />
      <Route path="/cart" element={<CartView />} />
      <Route path="/checkout" element={<CheckoutView />} />
      <Route path="/payment-result" element={<WebpayResultView />} />
      <Route path="/auth" element={<AuthView />} />
      <Route path="/register" element={<AuthView />} />
      <Route path="/login" element={<AuthView />} />

      {/* 2. RUTAS PROTEGIDAS GENERALES (Cualquier usuario logueado) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfileView />} />
      </Route>

      {/* 3. RUTAS DE ADMINISTRACIÓN (Solo branch_admin y super_admin) */}
      <Route element={<AdminRoute allowedRoles={['branch_admin', 'super_admin']} />}>
        <Route element={<AdminLayout />}>
          {/* Módulos habilitados tanto para Admin de Sucursal como Super Admin */}
          <Route
            path="/admin"
            element={
              <SuperAdminOnlyGuard>
                <InventoryManagementView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <SuperAdminOnlyGuard>
                <InventoryManagementView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route path="/admin/orders" element={<PurchaseOrdersManagementView />} />
          <Route path="/admin/purchase-orders" element={<PurchaseOrdersManagementView />} />
          <Route path="/admin/ordenes" element={<PurchaseOrdersManagementView />} />
          <Route path="/admin/sales-history" element={<SalesHistoryView />} />
          <Route path="/admin/sales" element={<SalesHistoryView />} />
          <Route path="/admin/income-expenses" element={<IncomeExpensesAnalyticsView />} />
          <Route path="/admin/register-sale" element={<RegisterSaleView />} />
          <Route path="/admin/registrar-venta" element={<RegisterSaleView />} />
          <Route path="/admin/sales/new" element={<RegisterSaleView />} />
          <Route path="/admin/register-expense" element={<RegisterExpenseView />} />
          <Route path="/admin/expenses" element={<RegisterExpenseView />} />
          <Route path="/admin/product-stock" element={<ProductStockSummaryView />} />
          <Route path="/admin/resumen-stock" element={<ProductStockSummaryView />} />
          <Route path="/admin/stock" element={<ProductStockSummaryView />} />
          <Route path="/admin/top10" element={<Top10AnalyticsView />} />

          {/* Módulos exclusivos de Super Admin (restringidos para Admin de Sucursal) */}
          <Route
            path="/admin/interest-notifications"
            element={
              <SuperAdminOnlyGuard>
                <InterestNotificationsView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/notificaciones-interes"
            element={
              <SuperAdminOnlyGuard>
                <InterestNotificationsView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/alerts"
            element={
              <SuperAdminOnlyGuard>
                <InterestNotificationsView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/suppliers"
            element={
              <SuperAdminOnlyGuard>
                <SupplierManagementView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/proveedores"
            element={
              <SuperAdminOnlyGuard>
                <SupplierManagementView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/branches"
            element={
              <SuperAdminOnlyGuard>
                <BranchManagementView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/branch/:branchId"
            element={
              <SuperAdminOnlyGuard>
                <LocalBranchAdminView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <SuperAdminOnlyGuard>
                <CustomerManagerView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/clientes"
            element={
              <SuperAdminOnlyGuard>
                <CustomerManagerView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/administrador-clientes"
            element={
              <SuperAdminOnlyGuard>
                <CustomerManagerView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/logistics"
            element={
              <SuperAdminOnlyGuard>
                <CustomerManagerView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/product-manager"
            element={
              <SuperAdminOnlyGuard>
                <ProductManagerView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/administrador-productos"
            element={
              <SuperAdminOnlyGuard>
                <ProductManagerView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/express-upload"
            element={
              <SuperAdminOnlyGuard>
                <ProductManagerView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/page-editor"
            element={
              <SuperAdminOnlyGuard>
                <PageEditorView />
              </SuperAdminOnlyGuard>
            }
          />
          <Route
            path="/admin/editar-pagina"
            element={
              <SuperAdminOnlyGuard>
                <PageEditorView />
              </SuperAdminOnlyGuard>
            }
          />
        </Route>
      </Route>

      {/* 4. CATCH-ALL: Redirigir a Home cualquier ruta no encontrada */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
