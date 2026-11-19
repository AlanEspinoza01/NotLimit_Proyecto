import React from 'react';
import { Layers, Boxes, CheckCircle2, Save } from 'lucide-react';
import { WindowFrame } from '../../layout/WindowFrame';
import { PixelIcon } from '../../common/PixelIcon';
import { ProductStockDetail } from './productStockTypes';

interface ProductStockModalsProps {
  editingProduct: ProductStockDetail | null;
  isBranchAdmin: boolean;
  closeEditModal: () => void;
  editFormStockBySize: Record<string, number>;
  setEditFormStockBySize: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  editFormTotalStock: number;
  setEditFormTotalStock: React.Dispatch<React.SetStateAction<number>>;
  handleSaveEditModal: () => void;
  previewImage: { url: string; title: string } | null;
  setPreviewImage: (img: { url: string; title: string } | null) => void;
}

export const ProductStockModals: React.FC<ProductStockModalsProps> = ({
  editingProduct,
  isBranchAdmin,
  closeEditModal,
  editFormStockBySize,
  setEditFormStockBySize,
  editFormTotalStock,
  setEditFormTotalStock,
  handleSaveEditModal,
  previewImage,
  setPreviewImage
}) => {
  return (
    <>
      {/* MODAL WINDOWS XP: ACTUALIZAR PRODUCTO & STOCK MANUALMENTE (Exclusivo Super Admin) */}
      {editingProduct && !isBranchAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-4xl nl-stock-modal-window animate-in zoom-in-95 duration-150">
            <WindowFrame
              title={`MODIFICACIÓN MANUAL DE STOCK // ${editingProduct.title}`}
              icon={<PixelIcon name="floppy" size={16} />}
              onClose={closeEditModal}
              statusBarText="EDICIÓN DIRECTA // SUPER ADMIN PRIVILEGES // REGISTRO AUDITABLE"
            >
              <div className="space-y-3.5 text-xs p-1">
                {/* Cabecera del Producto en Edición */}
                <div className="flex items-center gap-3 p-2.5 bg-gray-100 border border-gray-300">
                  <img
                    src={editingProduct.images[0]}
                    alt={editingProduct.title}
                    className="w-14 h-14 object-cover border border-gray-400 shadow-2xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-gray-600 font-semibold flex flex-wrap items-center gap-1.5">
                      <span>Categoría (Esquema Actual):</span>
                      <strong className="text-blue-900">
                        {editingProduct.section ? `${editingProduct.section} › ` : ''}
                        {editingProduct.category}
                        {editingProduct.subCategory ? ` › ${editingProduct.subCategory}` : ''}
                      </strong>
                      {editingProduct.specialCategory && editingProduct.specialCategory !== 'Ninguna' && (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-400 text-[10px] font-bold rounded-xs">
                          ⭐ {editingProduct.specialCategory}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 mt-0.5 leading-snug">
                      {editingProduct.title}
                    </h3>
                  </div>
                </div>

                {/* SECCIÓN 1: DESGLOSE DE TALLAS INDIVIDUALES (SEPARADAS) */}
                {editingProduct.sizes && editingProduct.sizes.length > 0 ? (
                  <div className="p-3 bg-white border border-gray-300 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1 border-b border-gray-200 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-purple-700" />
                        <h4 className="font-bold text-xs text-[#003c74] uppercase">
                          Desglose y Ajuste Manual por Talla (Separadas)
                        </h4>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        La suma total se recalcula automáticamente
                      </span>
                    </div>

                    <div className="nl-stock-modal-sizes-grid">
                      {editingProduct.sizes.map((size) => {
                        const currentVal = editFormStockBySize[size] ?? 0;
                        return (
                          <div
                            key={size}
                            className="p-2 border border-gray-300 bg-gray-50/80 rounded-xs flex flex-col justify-between"
                          >
                            <div className="mb-1.5">
                              <span className="font-bold text-xs text-blue-950">Talla {size}:</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditFormStockBySize((prev) => ({
                                    ...prev,
                                    [size]: Math.max(0, (prev[size] ?? 0) - 1)
                                  }))
                                }
                                className="w-6 h-6 bg-gray-200 hover:bg-gray-300 border border-gray-400 font-black flex items-center justify-center text-xs"
                              >
                                -
                              </button>

                              <input
                                type="number"
                                min={0}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setEditFormStockBySize((prev) => ({
                                    ...prev,
                                    [size]: val
                                  }));
                                }}
                                className="w-full winxp-input text-center font-mono font-bold text-xs py-0.5 px-1 bg-white border border-[#7f9db9]"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setEditFormStockBySize((prev) => ({
                                    ...prev,
                                    [size]: (prev[size] ?? 0) + 1
                                  }))
                                }
                                className="w-6 h-6 bg-gray-200 hover:bg-gray-300 border border-gray-400 font-black flex items-center justify-center text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* PRODUCTO SIN TALLAS (TALLA ÚNICA) */
                  <div className="p-3 bg-white border border-gray-300 space-y-2">
                    <div className="flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                      <Boxes className="w-4 h-4 text-emerald-700" />
                      <h4 className="font-bold text-xs text-[#003c74] uppercase">
                        Ajuste Manual de Stock Total (Talla Única / Accesorio)
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <label className="font-bold text-xs text-gray-800">
                        Cantidad de Unidades Disponibles:
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditFormTotalStock((prev) => Math.max(0, prev - 1))}
                          className="w-7 h-7 bg-gray-200 hover:bg-gray-300 border border-gray-400 font-black flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={editFormTotalStock}
                          onChange={(e) =>
                            setEditFormTotalStock(Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-24 winxp-input text-center font-mono font-bold text-sm py-1 bg-white border border-[#7f9db9]"
                        />
                        <button
                          type="button"
                          onClick={() => setEditFormTotalStock((prev) => prev + 1)}
                          className="w-7 h-7 bg-gray-200 hover:bg-gray-300 border border-gray-400 font-black flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">unidades en inventario</span>
                    </div>
                  </div>
                )}

                {/* Resumen Final de Stock Calculado */}
                <div className="p-2.5 bg-emerald-50 border-2 border-emerald-600 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-emerald-950">
                      Stock Total resultante a guardar:
                    </span>
                  </div>
                  <span className="font-mono font-black text-base text-emerald-900">
                    {editingProduct.sizes && editingProduct.sizes.length > 0
                      ? Object.values(editFormStockBySize).reduce((a, b) => a + (Number(b) || 0), 0)
                      : editFormTotalStock}{' '}
                    unidades
                  </span>
                </div>

                {/* Botones de Acción del Modal */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="winxp-button text-xs py-1 px-3 text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditModal}
                    className="winxp-button winxp-button-primary text-xs py-1 px-4 text-blue-950 font-bold flex items-center gap-1.5 shadow-xs border-blue-800 bg-blue-100"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-800" />
                    <span>Guardar Cambios de Stock</span>
                  </button>
                </div>
              </div>
            </WindowFrame>
          </div>
        </div>
      )}

      {/* MODAL DE PREVIEW DE IMAGEN */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-[#ece9d8] border-2 border-white shadow-2xl p-2 rounded-xs animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-gray-400 pb-1 mb-2">
              <span className="font-bold text-xs text-blue-900 truncate pr-2">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-5 h-5 bg-red-600 text-white font-bold flex items-center justify-center text-xs hover:bg-red-700"
              >
                ✕
              </button>
            </div>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="w-full h-80 object-cover border border-gray-400"
            />
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="winxp-button text-xs py-1 px-4 font-bold"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
