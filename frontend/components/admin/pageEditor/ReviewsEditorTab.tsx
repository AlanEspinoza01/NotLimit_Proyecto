import React from 'react';
import {
  Star,
  Plus,
  Trash2,
  FileText,
  ShieldAlert,
  ShoppingBag,
  Eye,
  EyeOff
} from 'lucide-react';
import { Review } from '../../../types';
import {
  formatCLP,
  getReviewProductInfo,
  getReviewUserEmail
} from './pageEditorTypes';

interface ReviewsEditorTabProps {
  reviewsSearch: string;
  setReviewsSearch: (val: string) => void;
  filteredReviews: Review[];
  setSelectedReviewDetail: (rev: Review | null) => void;
  handleOpenAddReviewModal: (rev: Review, initialType?: 'preferencial' | 'negra') => void;
  handleToggleReviewVisibility?: (rev: Review) => void;
  handleRequestDeleteReview: (rev: Review) => void;
}

export const ReviewsEditorTab: React.FC<ReviewsEditorTabProps> = ({
  reviewsSearch,
  setReviewsSearch,
  filteredReviews,
  setSelectedReviewDetail,
  handleOpenAddReviewModal,
  handleToggleReviewVisibility,
  handleRequestDeleteReview
}) => {
  return (
    <div className="bg-white border-2 border-gray-400 p-4 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <Star
            className="w-4 h-4 fill-amber-400 shrink-0"
            stroke="#000000"
            strokeWidth={1.5}
          />
          <span className="font-extrabold text-xs text-[#003c74] uppercase">
            Moderación y Edición de Reseñas de Clientes (MongoDB)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por cliente, correo o producto..."
            value={reviewsSearch}
            onChange={(e) => setReviewsSearch(e.target.value)}
            className="winxp-input px-2.5 text-xs py-1 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Lista de Reseñas */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 border border-gray-200 text-xs">
            No se encontraron reseñas registradas en MongoDB con el criterio de búsqueda.
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const fallbackProdInfo = getReviewProductInfo(rev);
            const productTitle = (rev as any).productTitle || fallbackProdInfo.title;
            const productImage = (rev as any).productImage || fallbackProdInfo.image;
            const reviewerEmail = (rev as any).userEmail || getReviewUserEmail(rev);
            const isHidden = Boolean((rev as any).isHidden);
            const hasPreferencial = rev.records?.some((r) => r.listType === 'preferencial');
            const hasNegra = rev.records?.some((r) => r.listType === 'negra');

            return (
              <div
                key={rev.id}
                onClick={() => setSelectedReviewDetail(rev)}
                title="Haz clic para ver el detalle completo de esta reseña"
                className={`border p-3.5 space-y-2.5 text-xs shadow-2xs transition-colors cursor-pointer ${
                  isHidden
                    ? 'bg-gray-100/90 border-amber-400 opacity-85 hover:opacity-100'
                    : 'bg-[#f8fafc] border-gray-300 hover:border-blue-500 hover:bg-blue-50/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  {/* Imagen del producto reseñado + Producto + Nombre + Correo + Calificación */}
                  <div className="flex items-center gap-3">
                    <img
                      src={productImage}
                      alt={productTitle}
                      className="w-12 h-12 object-cover border border-gray-400 shrink-0"
                    />
                    <div className="space-y-0.5">
                      <div className="font-black text-xs text-gray-950 flex flex-wrap items-center gap-2">
                        <span>{rev.userName}</span>
                        <span className="text-[11px] font-mono font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.2">
                          {reviewerEmail}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded-xs">
                            ✓ COMPRA VERIFICADA
                          </span>
                        )}
                        {isHidden && (
                          <span className="bg-amber-200 text-amber-950 border border-amber-500 text-[9px] font-black px-1.5 py-0.2 rounded-xs inline-flex items-center gap-1">
                            <EyeOff className="w-2.5 h-2.5 text-amber-900" />
                            <span>OCULTA EN CATÁLOGO</span>
                          </span>
                        )}
                        {hasPreferencial && (
                          <span className="bg-amber-100 text-amber-950 border border-amber-400 text-[9px] font-black px-1.5 py-0.2 rounded-xs inline-flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-amber-400" stroke="#000000" strokeWidth={1.5} />
                            <span>LISTA PREFERENCIAL</span>
                          </span>
                        )}
                        {hasNegra && (
                          <span className="bg-rose-100 text-rose-950 border border-rose-400 text-[9px] font-black px-1.5 py-0.2 rounded-xs inline-flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5 text-rose-700" />
                            <span>LISTA NEGRA</span>
                          </span>
                        )}
                      </div>

                      {/* Producto reseñado */}
                      <div className="text-[11px] text-gray-800 font-bold flex items-center gap-1.5">
                        <ShoppingBag className="w-3 h-3 text-blue-700 shrink-0" />
                        <span>
                          Producto reseñado:{' '}
                          <strong className="text-[#003c74]">{productTitle}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              stroke="#000000"
                              strokeWidth={1.4}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-amber-400' : 'fill-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-500 font-mono">
                          Fecha: {rev.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botones por comentario: Ocultar/Mostrar + Añadir Registro + Eliminar Reseña */}
                  <div
                    className="flex flex-wrap items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {handleToggleReviewVisibility && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleReviewVisibility(rev);
                        }}
                        className={`winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1 ${
                          isHidden ? 'text-blue-900' : 'text-amber-900'
                        }`}
                      >
                        {isHidden ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-blue-700" />
                            <span>Mostrar</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                            <span>Ocultar</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddReviewModal(rev);
                      }}
                      className="winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1 text-emerald-950"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Añadir Registro</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestDeleteReview(rev);
                      }}
                      className="winxp-button text-xs py-1 px-2.5 text-red-700 hover:text-red-900 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Eliminar Reseña</span>
                    </button>
                  </div>
                </div>

                {/* Título de la Opinión */}
                <div className="font-extrabold text-sm text-[#003c74]">
                  "{rev.title}"
                </div>

                {/* Comentario / Experiencia con la prenda */}
                <div className="text-gray-800 leading-relaxed bg-white p-2.5 border border-gray-200">
                  {rev.comment}
                </div>

                {/* Fotos de la reseña */}
                {rev.photos && rev.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {rev.photos.map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        alt="Foto reseña"
                        className="w-14 h-14 object-cover border border-gray-300 hover:scale-105 transition-transform"
                      />
                    ))}
                  </div>
                )}

                {/* Registros de Lista Preferencial / Lista Negra añadidos a este cliente */}
                {rev.records && rev.records.length > 0 && (
                  <div className="bg-gray-50 border border-gray-300 p-2.5 space-y-1.5 mt-1">
                    <div className="font-bold text-[11px] text-gray-900 uppercase flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      <span>Registros de Cliente ({rev.records.length}):</span>
                    </div>
                    <div className="space-y-1">
                      {rev.records.map((rec) => {
                        const isNegra = rec.listType === 'negra';
                        return (
                          <div
                            key={rec.id}
                            className={`border p-2 text-[11px] flex flex-col gap-0.5 ${
                              isNegra
                                ? 'bg-rose-50/80 border-rose-300'
                                : 'bg-amber-50/80 border-amber-300'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1 font-bold">
                              <span
                                className={`inline-flex items-center gap-1 ${
                                  isNegra ? 'text-rose-950' : 'text-amber-950'
                                }`}
                              >
                                {isNegra ? (
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                                ) : (
                                  <Star
                                    className="w-3.5 h-3.5 fill-amber-400"
                                    stroke="#000000"
                                    strokeWidth={1.4}
                                  />
                                )}
                                <span>{rec.title}</span>
                              </span>
                              <span className="font-mono text-[10px] text-gray-500">
                                {rec.date} · {rec.adminName}
                              </span>
                            </div>
                            <p className="text-gray-800">{rec.note}</p>
                            {rec.benefit && (
                              <div className="text-[10px] font-bold text-amber-900">
                                Beneficio: {rec.benefit}
                              </div>
                            )}
                            {rec.debtAmount !== undefined && (
                              <div className="text-[10px] font-bold text-rose-800">
                                Deuda registrada: {formatCLP(rec.debtAmount)}
                              </div>
                            )}
                            {rec.notes && (
                              <div className="text-[10px] text-gray-600 italic">
                                Obs: {rec.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};