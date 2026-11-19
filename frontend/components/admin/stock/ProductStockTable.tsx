import React from 'react';
import {
  Package,
  ArrowUpDown,
  Maximize2,
  Layers,
  Info,
  Lock,
  Edit3
} from 'lucide-react';
import { SPECIAL_CATEGORIES } from '../../../views/admin/ProductManagerView';
import { ProductStockDetail } from './productStockTypes';

interface ProductStockTableProps {
  filteredAndSortedProducts: ProductStockDetail[];
  isBranchAdmin: boolean;
  lowStockThreshold: number;
  setPreviewImage: (img: { url: string; title: string } | null) => void;
  handleInlineTotalStockChange: (productId: string, delta: number) => void;
  openEditModal: (product: ProductStockDetail) => void;
  handleResetFilters: () => void;
}

export const ProductStockTable: React.FC<ProductStockTableProps> = ({
  filteredAndSortedProducts,
  isBranchAdmin,
  lowStockThreshold,
  setPreviewImage,
  handleInlineTotalStockChange,
  openEditModal,
  handleResetFilters
}) => {
  return (
    <div className="nl-stock-table-scroll border border-gray-400 bg-white shadow-xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-[#ece9d8] border-b-2 border-gray-400 text-gray-900 font-bold text-[11px]">
          <tr>
            <th className="p-2.5 border-r border-gray-300 w-16 text-center">IMAGEN</th>
            <th className="p-2.5 border-r border-gray-300">NOMBRE DEL PRODUCTO</th>
            <th className="p-2.5 border-r border-gray-300">CATEGORÍA (ESQUEMA ACTUAL)</th>
            <th className="p-2.5 border-r border-gray-300 text-right">PRECIO</th>
            <th className="p-2.5 border-r border-gray-300 text-center w-36">
              <div className="flex items-center justify-center gap-1">
                <span>STOCK TOTAL</span>
                <ArrowUpDown className="w-3 h-3 text-blue-700" />
              </div>
            </th>
            <th className="p-2.5 border-r border-gray-300 min-w-[280px]">
              DESGLOSE POR TALLAS (SEPARADAS)
            </th>
            <th className="p-2.5 text-center w-40">
              {isBranchAdmin ? 'MODO DE ACCESO' : 'ACCIONES MANUALES'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredAndSortedProducts.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-gray-500">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-sm text-gray-700">
                  No se encontraron productos con los filtros seleccionados.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Prueba cambiando la sección/categoría o limpiando la búsqueda.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="winxp-button text-xs py-1 px-3 mt-3 text-blue-900 font-bold"
                >
                  Restablecer todos los filtros
                </button>
              </td>
            </tr>
          ) : (
            filteredAndSortedProducts.map((p) => {
              const hasSizes = p.sizes && p.sizes.length > 0;
              const isSoldOut = p.totalStock === 0;
              const isLowStock = p.totalStock > 0 && p.totalStock <= lowStockThreshold;
              const specialCatMeta = SPECIAL_CATEGORIES.find(
                (sc) => sc.value === (p.specialCategory || 'Ninguna')
              );

              return (
                <tr key={p.id} className="hover:bg-blue-50/70 transition-colors">
                  {/* 1. Imagen del Producto con preview al hacer click */}
                  <td className="p-2 border-r border-gray-200 text-center align-middle">
                    <div
                      onClick={() => setPreviewImage({ url: p.images[0] || '', title: p.title })}
                      className="relative group cursor-pointer inline-block"
                      title="Click para ampliar imagen"
                    >
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-12 h-12 object-cover border border-gray-300 shadow-2xs group-hover:border-blue-600 transition-all rounded-xs"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xs">
                        <Maximize2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </td>

                  {/* 2. Nombre del Producto y SKU */}
                  <td className="p-2 border-r border-gray-200 align-middle">
                    <div className="font-bold text-gray-900 leading-tight">{p.title}</div>
                    {p.sku && (
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">SKU: {p.sku}</div>
                    )}
                  </td>

                  {/* 3. Categoría sincronizada con el esquema actual */}
                  <td className="p-2 border-r border-gray-200 align-middle">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span
                          className="inline-block bg-[#003c74] !text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xs uppercase"
                          style={{ color: '#ffffff' }}
                        >
                          {p.section || 'Hombre'}
                        </span>
                        <span className="text-gray-400 font-bold">›</span>
                        <span className="inline-block bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-xs">
                          {p.category}
                        </span>
                      </div>
                      {p.subCategory && (
                        <div className="text-[11px] text-gray-700 font-semibold flex items-center gap-1">
                          <span className="text-gray-400">↳</span>
                          <span>{p.subCategory}</span>
                        </div>
                      )}
                      {specialCatMeta && specialCatMeta.value !== 'Ninguna' && (
                        <div>
                          <span
                            className={`inline-block text-[10px] font-bold px-1.5 py-0.2 border rounded-xs ${specialCatMeta.color}`}
                          >
                            {specialCatMeta.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 4. Precio */}
                  <td className="p-2 border-r border-gray-200 text-right align-middle">
                    <div className="font-mono font-bold text-gray-900 text-xs">
                      ${p.price.toLocaleString('es-CL')}
                    </div>
                    {p.salePrice && (
                      <div className="text-[10px] text-red-600 line-through">
                        ${p.price.toLocaleString('es-CL')}
                      </div>
                    )}
                  </td>

                  {/* 5. Cantidad de Unidades (Stock Total) con Ajuste Rápido */}
                  <td className="p-2 border-r border-gray-200 text-center align-middle">
                    <div className="inline-flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        {!hasSizes && !isBranchAdmin && (
                          <button
                            type="button"
                            onClick={() => handleInlineTotalStockChange(p.id, -1)}
                            disabled={p.totalStock <= 0}
                            className="w-5 h-5 bg-gray-200 hover:bg-gray-300 border border-gray-400 font-black flex items-center justify-center text-xs disabled:opacity-40"
                            title="Disminuir 1 unidad de stock total"
                          >
                            -
                          </button>
                        )}

                        <span
                          className={`font-mono font-black text-sm px-2 py-0.5 border ${
                            isSoldOut
                              ? 'bg-red-100 text-red-900 border-red-400'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-900 border-amber-400'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-400'
                          }`}
                        >
                          {p.totalStock} un.
                        </span>

                        {!hasSizes && !isBranchAdmin && (
                          <button
                            type="button"
                            onClick={() => handleInlineTotalStockChange(p.id, 1)}
                            className="w-5 h-5 bg-gray-200 hover:bg-gray-300 border border-gray-400 font-black flex items-center justify-center text-xs"
                            title="Aumentar 1 unidad de stock total"
                          >
                            +
                          </button>
                        )}
                      </div>

                      <span
                        style={{ color: '#ffffff' }}
                        className={`text-[9px] font-black uppercase tracking-wider mt-1 px-1.5 py-0.2 rounded-xs border !text-white ${
                          isSoldOut
                            ? 'bg-red-700 !text-white border-red-900'
                            : isLowStock
                            ? 'bg-amber-600 !text-white border-amber-800'
                            : 'bg-emerald-700 !text-white border-emerald-900'
                        }`}
                      >
                        <span style={{ color: '#ffffff' }} className="!text-white font-black">
                          {isSoldOut ? 'AGOTADO' : isLowStock ? 'STOCK BAJO' : 'EN STOCK'}
                        </span>
                      </span>
                    </div>
                  </td>

                  {/* 6. Desglose de Tallas Separadas (Requisito Explícito) */}
                  <td className="p-2 border-r border-gray-200 align-middle">
                    {hasSizes ? (
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1">
                          <Layers className="w-3 h-3 text-purple-700" />
                          <span>{p.sizes.length} Tallas Diferenciadas:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {p.sizes.map((size) => {
                            const sizeStock = p.stockBySize?.[size] ?? 0;
                            const sizeEmpty = sizeStock === 0;

                            return (
                              <div
                                key={size}
                                className={`inline-flex items-center border rounded-xs px-2 py-0.5 shadow-2xs ${
                                  sizeEmpty
                                    ? 'bg-red-50 border-red-300 text-red-900'
                                    : sizeStock <= 2
                                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                                    : 'bg-white border-gray-300 text-gray-800'
                                }`}
                              >
                                <span className="font-extrabold text-[11px] text-blue-950">
                                  {size}:
                                </span>
                                <span className="font-mono font-bold ml-1 text-[11px]">
                                  {sizeStock} un.
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-xs text-gray-600">
                        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <div>
                          <span className="font-bold text-[11px] text-gray-800">
                            Talla Única / Accesorio Estándar
                          </span>
                          <p className="text-[10px] text-gray-500">
                            Este producto no requiere separación de tallas (Stock unitario general: {p.totalStock} un.)
                          </p>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* 7. Acciones Manuales (Solo Super Admin; Solo Lectura para Admin de Sucursal) */}
                  <td className="p-2 text-center align-middle">
                    {isBranchAdmin ? (
                      <span
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-300 rounded-xs text-[10px] font-bold select-none"
                        title="El Admin de Sucursal solo puede visualizar el stock sin realizar cambios"
                      >
                        <Lock className="w-3 h-3 text-gray-500 shrink-0" />
                        <span>Solo Lectura</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="winxp-button winxp-button-primary text-xs py-1 px-2.5 text-blue-950 font-bold flex items-center justify-center gap-1 mx-auto shadow-xs border-blue-700 bg-blue-50/80 hover:bg-blue-100"
                        title="Abrir panel completo de actualización manual de stock y tallas"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                        <span>Actualizar</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
