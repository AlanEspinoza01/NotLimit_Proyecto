import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, RefreshCw, ShoppingBag } from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { INITIAL_BRANCHES } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { useBranch, formatBranchPickupSummary } from '../../context/BranchContext';
import api from '../../api/axios';

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80';

export const LocalBranchAdminView: React.FC = () => {
  const { currentUser } = useAuth();
  const { branchId: paramBranchId } = useParams<{ branchId: string }>();
  const effectiveBranchId = paramBranchId || currentUser?.branchId || 'vina_del_mar';

  const { branches } = useBranch();
  const branch =
    branches.find((b) => b.id === effectiveBranchId) ||
    INITIAL_BRANCHES.find((b) => b.id === effectiveBranchId) ||
    INITIAL_BRANCHES[0];

  const [products, setProducts] = useState<any[]>([]);
  const [branchOrders, setBranchOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchBranchDataFromMongoDB = async (showNotice = false) => {
    setIsLoading(true);
    try {
      const [prodRes, ordRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/orders')
      ]);

      if (prodRes.data?.success && Array.isArray(prodRes.data.data)) {
        setProducts(prodRes.data.data);
      }

      if (ordRes.data?.success && Array.isArray(ordRes.data.data)) {
        const filteredOrders = ordRes.data.data.filter((ord: any) => {
          const bId = ord.pickupBranchId || ord.branchId || '';
          return bId === branch.id || ord.branchId === branch.id;
        });
        setBranchOrders(filteredOrders);
      }

      if (showNotice) {
        triggerToast(`✓ Stock y pedidos de ${branch.city} sincronizados desde MongoDB`);
      }
    } catch (error) {
      console.error('Error cargando LocalBranchAdminView desde MongoDB:', error);
      triggerToast('Error al sincronizar datos de la sucursal con MongoDB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchDataFromMongoDB(false);
  }, [branch.id]);

  // Calcular stock de un producto en esta sucursal o su stock total en catálogo
  const getProductStockForBranch = (p: any): number => {
    if (p.stockPerBranch && typeof p.stockPerBranch === 'object' && branch.id in p.stockPerBranch) {
      return Math.max(0, Number(p.stockPerBranch[branch.id]) || 0);
    }
    const breakdown = Array.isArray(p.sizeBreakdown) ? p.sizeBreakdown : [];
    if (breakdown.length > 0) {
      return breakdown.reduce(
        (acc: number, s: any) => acc + (Number(s.quantity ?? s.stock ?? 0) || 0),
        0
      );
    }
    return Math.max(0, Number(p.totalStock ?? p.stock ?? 0) || 0);
  };

  // Ajustar stock en vivo y persistirlo en MongoDB
  const handleUpdateStock = async (prod: any, delta: number) => {
    const prodId = String(prod._id || prod.id);
    const currentStock = getProductStockForBranch(prod);
    const newStock = Math.max(0, currentStock + delta);

    const rawBreakdown = Array.isArray(prod.sizeBreakdown) ? prod.sizeBreakdown : [];
    let updatedBreakdown =
      rawBreakdown.length > 0
        ? rawBreakdown.map((s: any, idx: number) => {
            if (idx === 0) {
              const nextQty = Math.max(0, (Number(s.quantity ?? s.stock ?? 0) || 0) + delta);
              return { ...s, quantity: nextQty, stock: nextQty };
            }
            return s;
          })
        : [{ id: '1', size: 'Única', quantity: newStock, stock: newStock }];

    const updatedPerBranch = {
      ...(prod.stockPerBranch || {}),
      [branch.id]: newStock
    };

    try {
      const res = await api.put(`/admin/products/${prodId}`, {
        title: prod.title || prod.name,
        name: prod.title || prod.name,
        price: prod.price,
        normalPrice: prod.normalPrice || prod.price,
        section: prod.section,
        category: prod.category,
        subCategory: prod.subCategory || prod.subcategory,
        specialCategory: prod.specialCategory,
        sizeBreakdown: updatedBreakdown,
        stockPerBranch: updatedPerBranch,
        totalStock: newStock,
        stock: newStock
      });

      if (res.data?.success && res.data.data) {
        setProducts((prev) =>
          prev.map((p) => (String(p._id || p.id) === prodId ? res.data.data : p))
        );
        triggerToast(
          `✓ Stock de "${prod.title || prod.name}" actualizado en MongoDB (${
            delta > 0 ? '+' : ''
          }${delta})`
        );
      }
    } catch (error) {
      console.error('Error actualizando stock en MongoDB:', error);
      triggerToast('Error al guardar el ajuste de stock en MongoDB');
    }
  };

  const totalBranchRevenue = useMemo(() => {
    return branchOrders
      .filter((o) => String(o.paymentStatus || '').toUpperCase() === 'CONFIRMED')
      .reduce((acc, o) => acc + (Number(o.total ?? 0) || 0), 0);
  }, [branchOrders]);

  return (
    <div className="space-y-4 font-sans text-gray-900 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#ece9d8] border-2 border-blue-900 p-4 shadow-xl flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-700 animate-spin" />
            <span className="font-bold text-xs text-blue-950">
              CARGANDO DATOS DE SUCURSAL DESDE MONGODB...
            </span>
          </div>
        </div>
      )}

      <WindowFrame
        title={`BRANCH_NODE.SYS - [${branch.name} (MongoDB)]`}
        icon={<PixelIcon name="computer" size={16} />}
        statusBarText={`JEFE DE TIENDA: ${branch.managerName} // MONGODB ACTIVO // PEDIDOS SUCURSAL: ${branchOrders.length} // VENTAS: $${totalBranchRevenue.toLocaleString('es-CL')}`}
      >
        <div className="space-y-4 text-xs">
          {toastMessage && (
            <div className="bg-emerald-50 border border-emerald-400 text-emerald-900 px-3 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs">
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-emerald-800 font-black ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-[#003c74]">
                <MapPin className="w-4 h-4 text-blue-700" />
                <span>ADMINISTRACIÓN LOCAL DE SUCURSAL: {branch.city.toUpperCase()}</span>
              </div>
              <span className="text-gray-600 text-xs block">
                {branch.address} • Teléfono: {branch.phone}
              </span>
              {!branch.isCorporate && branch.id !== 'casa_matriz' && (
                <span className="text-blue-900 font-semibold text-[11px] flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>Horario de Retiro Sincronizado: {formatBranchPickupSummary(branch)}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-800 border border-green-500 font-bold px-2.5 py-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                SUCURSAL CONECTADA A MONGODB ({branchOrders.length} PEDIDOS)
              </span>

              <button
                type="button"
                onClick={() => fetchBranchDataFromMongoDB(true)}
                className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {/* Tabla de Inventario de la Sucursal desde MongoDB */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-[#003c74] uppercase">
              Inventario Físico Sincronizado en MongoDB ({products.length} Producto(s))
            </h3>
            <div className="border border-gray-400 overflow-x-auto bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#ece9d8] border-b border-gray-400 text-gray-800 font-bold text-[11px]">
                  <tr>
                    <th className="p-2 border-r border-gray-300">PRENDA</th>
                    <th className="p-2 border-r border-gray-300">SKU</th>
                    <th className="p-2 border-r border-gray-300">PRECIO</th>
                    <th className="p-2 border-r border-gray-300">STOCK EN TIENDA</th>
                    <th className="p-2 border-r border-gray-300">ESTADO</th>
                    <th className="p-2">AJUSTAR EN VIVO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No hay productos registrados en MongoDB actualmente.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const prodId = String(p._id || p.id);
                      const localStock = getProductStockForBranch(p);
                      const imgUrl =
                        (Array.isArray(p.images) && p.images[0]) ||
                        p.image ||
                        DEFAULT_PRODUCT_IMAGE;
                      const priceNum = Number(p.price ?? p.normalPrice ?? 0) || 0;

                      return (
                        <tr key={prodId} className="hover:bg-blue-50">
                          <td className="p-2 font-bold text-gray-900 flex items-center gap-2">
                            <img
                              src={imgUrl}
                              alt=""
                              className="w-8 h-8 object-cover border border-gray-300"
                            />
                            <span className="truncate max-w-[220px]">
                              {p.title || p.name || 'Prenda NoLimits'}
                            </span>
                          </td>
                          <td className="p-2 font-mono text-gray-600">{p.sku || 'NL-SKU'}</td>
                          <td className="p-2 font-bold text-gray-900">
                            ${priceNum.toLocaleString('es-CL')}
                          </td>
                          <td className="p-2 font-mono font-bold text-blue-900 text-sm">
                            {localStock} un.
                          </td>
                          <td className="p-2">
                            {localStock > 0 ? (
                              <span className="text-green-800 font-bold text-[10px] bg-green-100 border border-green-400 px-1.5 py-0.5 rounded-xs">
                                DISPONIBLE
                              </span>
                            ) : (
                              <span className="text-red-800 font-bold text-[10px] bg-red-100 border border-red-400 px-1.5 py-0.5 rounded-xs">
                                AGOTADO
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateStock(p, -1)}
                                className="winxp-button text-xs w-6 h-6 p-0 font-bold"
                                title="Restar unidad en MongoDB"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStock(p, 1)}
                                className="winxp-button text-xs w-6 h-6 p-0 font-bold"
                                title="Sumar unidad en MongoDB"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen de Órdenes Asignadas a esta Sucursal en MongoDB */}
          <div className="space-y-2 pt-2">
            <h3 className="font-bold text-xs text-[#003c74] uppercase flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-700" />
              <span>Órdenes Asignadas a {branch.city} en MongoDB ({branchOrders.length})</span>
            </h3>
            <div className="border border-gray-400 overflow-x-auto bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#ece9d8] border-b border-gray-400 text-gray-800 font-bold text-[11px]">
                  <tr>
                    <th className="p-2 border-r border-gray-300">ORDEN</th>
                    <th className="p-2 border-r border-gray-300">CLIENTE</th>
                    <th className="p-2 border-r border-gray-300">PRENDAS</th>
                    <th className="p-2 border-r border-gray-300">TOTAL</th>
                    <th className="p-2">ESTADO ACTUAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {branchOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        No hay órdenes registradas para esta sucursal en MongoDB aún.
                      </td>
                    </tr>
                  ) : (
                    branchOrders.map((ord) => (
                      <tr key={String(ord._id || ord.id)} className="hover:bg-blue-50">
                        <td className="p-2 font-mono font-bold text-blue-900">
                          {ord.orderNumber}
                        </td>
                        <td className="p-2 font-bold text-gray-900">{ord.customerName}</td>
                        <td className="p-2 text-gray-700">{ord.itemsSummary || '1x Prenda'}</td>
                        <td className="p-2 font-mono font-bold text-green-800">
                          ${Number(ord.total ?? 0).toLocaleString('es-CL')}
                        </td>
                        <td className="p-2 font-bold text-blue-800">
                          {ord.fulfillmentStatus || ord.status || 'Solicitud recibida'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  );
};