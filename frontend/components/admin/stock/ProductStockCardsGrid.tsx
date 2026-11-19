import React from 'react';
import { Package, Lock, Edit3, Info } from 'lucide-react';
import { ProductStockDetail } from './productStockTypes';

interface ProductStockCardsGridProps {
  filteredAndSortedProducts: ProductStockDetail[];
  isBranchAdmin: boolean;
  lowStockThreshold: number;
  setPreviewImage: (img: { url: string; title: string } | null) => void;
  openEditModal: (product: ProductStockDetail) => void;
}

export const ProductStockCardsGrid: React.FC<ProductStockCardsGridProps> = ({
  filteredAndSortedProducts,
  isBranchAdmin,
  lowStockThreshold,
  setPreviewImage,
  openEditModal
}) => {
  return (
    <div className="nl-stock-cards-grid">
      {filteredAndSortedProducts.length === 0 ? (
        <div className="col-span-full p-8 text-center bg-white border border-gray-300">
          <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="font-bold text-sm text-gray-700">
            No se encontraron productos coincidentes.
          </p>
        </div>
      ) : (
        filteredAndSortedProducts.map((p) => {
          const hasSizes = p.sizes && p.sizes.length > 0;
          const isSoldOut = p.totalStock === 0;
          const isLowStock = p.totalStock > 0 && p.totalStock <= lowStockThreshold;

          return (
            <div
              key={p.id}
              className="bg-white border-2 border-gray-300 hover:border-blue-600 p-3 shadow-xs flex flex-col justify-between space-y-2 transition-all"
            >
              <div className="space-y-2">
                {/* Cabecera de tarjeta */}
                <div className="flex items-start gap-2.5">
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    onClick={() => setPreviewImage({ url: p.images[0] || '', title: p.title })}
                    className="w-16 h-16 object-cover border border-gray-300 shadow-2xs shrink-0 cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-blue-900 font-bold uppercase tracking-wide">
                        {p.section ? `${p.section} › ` : ''}
                        {p.category}
                        {p.subCategory ? ` › ${p.subCategory}` : ''}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-1 py-0.2 border ${
                          isSoldOut
                            ? 'bg-red-100 text-red-900 border-red-400'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-900 border-amber-400'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-400'
                        }`}
                      >
                        {isSoldOut ? 'AGOTADO' : isLowStock ? 'STOCK BAJO' : 'DISPONIBLE'}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-gray-900 mt-1 line-clamp-2 leading-tight">
                      {p.title}
                    </h4>
                  </div>
                </div>

                {/* Stock Total */}
                <div className="p-2 bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-700">Stock Total:</span>
                  <span className="font-mono font-black text-sm text-[#003c74]">
                    {p.totalStock} unidades
                  </span>
                </div>

                {/* Desglose de Tallas en tarjeta */}
                <div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase mb-1 flex items-center justify-between">
                    <span>Tallas Separadas:</span>
                    {hasSizes && (
                      <span className="text-purple-900 font-semibold">{p.sizes.length} tallas</span>
                    )}
                  </div>

                  {hasSizes ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      {p.sizes.map((s) => {
                        const sizeCount = p.stockBySize?.[s] ?? 0;
                        return (
                          <div
                            key={s}
                            className="p-1 px-1.5 border border-gray-300 bg-white flex items-center justify-between text-xs rounded-xs"
                          >
                            <span className="font-bold text-blue-950">{s}:</span>
                            <span className="font-mono font-bold text-gray-900">
                              {sizeCount} un.
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-100 text-gray-600 text-[10px] text-center border border-gray-300">
                      Talla única / Sin separación requerida
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de Actualizar Manualmente (Solo Super Admin; Solo Lectura para Admin de Sucursal) */}
              {isBranchAdmin ? (
                <div className="w-full text-xs py-1 px-3 bg-gray-100 text-gray-600 border border-gray-300 font-bold flex items-center justify-center gap-1.5 mt-2 select-none">
                  <Lock className="w-3.5 h-3.5 text-gray-500" />
                  <span>Modo Solo Lectura (Sin Edición)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openEditModal(p)}
                  className="w-full winxp-button winxp-button-primary text-xs py-1 px-3 text-blue-950 font-bold flex items-center justify-center gap-1.5 shadow-xs border-blue-700 bg-blue-50/80 hover:bg-blue-100 mt-2"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Actualizar Stock Manualmente</span>
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

interface ProductStockHelpGuideProps {
  isBranchAdmin: boolean;
}

export const ProductStockHelpGuide: React.FC<ProductStockHelpGuideProps> = ({ isBranchAdmin }) => {
  return (
    <div className="p-3 bg-blue-50 border border-blue-300 flex items-start gap-2.5 shadow-xs">
      <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
      <div className="text-[11px] text-blue-950 space-y-1">
        <strong className="block font-bold">
          {isBranchAdmin
            ? 'Modo de Consulta de Stock (Admin de Sucursal):'
            : 'Guía de Operación para el Super Administrador:'}
        </strong>
        <p>
          • <strong>Separación de Tallas:</strong> Cada producto con variantes de vestuario (S, M, L, XL, etc.) desglosa sus unidades individualmente para consulta rápida en tienda.
        </p>
        {isBranchAdmin ? (
          <p>
            • <strong>Permisos de Solo Lectura:</strong> Como Administrador de Sucursal puedes consultar todo el stock disponible y exportar reportes, pero no puedes modificar cantidades ni actualizar existencias manualmente (exclusivo de Super Admin).
          </p>
        ) : (
          <>
            <p>
              • <strong>Actualización Manual:</strong> Puedes usar los botones rápidos{' '}
              <kbd className="px-1 py-0.2 bg-white border border-gray-400 font-mono">+</kbd> y{' '}
              <kbd className="px-1 py-0.2 bg-white border border-gray-400 font-mono">-</kbd> para ajustes al instante, o pulsar <strong>"Actualizar"</strong> para abrir el panel completo con ingreso numérico exacto y distribución por sucursal.
            </p>
            <p>
              • <strong>Persistencia Garantizada:</strong> Cualquier modificación manual se sincroniza de forma inmediata en el almacenamiento local y en los reportes de inventario.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
