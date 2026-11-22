import React from 'react';
import {
  MessageSquare,
  Sparkles,
  Clock,
  CheckCircle2,
  Camera,
  Check
} from 'lucide-react';
import { UserPublishedReview } from './profileTypes';

export interface PendingReviewItem {
  productId: string;
  title: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string;
  orderNumber: string;
  orderDate: string;
  deliveryMethod: 'pickup' | 'shipping';
  branchName?: string;
}

interface ProfileReviewsTabProps {
  reviewsSubTab: 'pending' | 'completed';
  setReviewsSubTab: (tab: 'pending' | 'completed') => void;
  pendingReviewItems: PendingReviewItem[];
  hasPurchases: boolean;
  myPublishedReviews: UserPublishedReview[];
  pendingLoading: boolean;
  completedLoading: boolean;
  pendingError: string;
  completedError: string;
  onRetry: () => void;
  handleOpenReviewModal: (
    item: { productId: string; title: string; image: string },
    orderNumber: string
  ) => void;
}

export const ProfileReviewsTab: React.FC<ProfileReviewsTabProps> = ({
  reviewsSubTab,
  setReviewsSubTab,
  pendingReviewItems,
  hasPurchases,
  myPublishedReviews,
  pendingLoading,
  completedLoading,
  pendingError,
  completedError,
  onRetry,
  handleOpenReviewModal
}) => {
  return (
    <div className="space-y-4">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-300 gap-2">
        <div>
          <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-blue-700" />
            Mis Reseñas de la Comunidad
          </h4>
          <p className="text-[11px] text-gray-500">
            Comparte fotos de tus prendas compradas y gana +100 puntos canjeables por cupones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-green-900 font-bold bg-green-100 px-2.5 py-1 border border-green-600 rounded-xs flex items-center gap-1 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-green-700" />
            <span>Bono: +100 Pts con fotos reales</span>
          </span>
        </div>
      </div>

      {/* Barra de Pestañas (Sub-Tabs) Estilo Carpeta Windows XP */}
      <div className="flex flex-wrap border-b border-gray-300 gap-1 select-none pt-1">
        <button
          type="button"
          onClick={() => setReviewsSubTab('pending')}
          className={`px-3.5 py-1.5 text-xs font-bold border-t-2 border-x-2 rounded-t-xs transition-colors flex items-center gap-2 cursor-pointer ${
            reviewsSubTab === 'pending'
              ? 'bg-white border-blue-900 text-blue-900 -mb-px z-10 shadow-xs'
              : 'bg-[#e4e2d5] border-gray-400 text-gray-700 hover:bg-[#eae8dc]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Tab 1: Pendientes</span>
          <span
            data-force-white
            style={{ color: '#ffffff' }}
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold !text-white ${
              pendingReviewItems.length > 0 ? 'bg-amber-600' : 'bg-gray-500'
            }`}
          >
            {pendingLoading || pendingError ? '…' : pendingReviewItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setReviewsSubTab('completed')}
          className={`px-3.5 py-1.5 text-xs font-bold border-t-2 border-x-2 rounded-t-xs transition-colors flex items-center gap-2 cursor-pointer ${
            reviewsSubTab === 'completed'
              ? 'bg-white border-blue-900 text-blue-900 -mb-px z-10 shadow-xs'
              : 'bg-[#e4e2d5] border-gray-400 text-gray-700 hover:bg-[#eae8dc]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
          <span>Tab 2: Realizadas</span>
          <span
            data-force-white
            style={{ color: '#ffffff' }}
            className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-green-700 !text-white"
          >
            {completedLoading || completedError ? '…' : myPublishedReviews.length}
          </span>
        </button>
      </div>

      {/* CONTENIDO TAB 1: PENDIENTES (Compras realizadas sin reseñar) */}
      {reviewsSubTab === 'pending' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="p-3 bg-amber-50 border border-amber-300 text-xs flex items-start gap-2.5 winxp-bevel-in">
            <div className="p-1 bg-amber-100 border border-amber-400 text-amber-800 rounded-xs shrink-0 mt-0.5">
              <Camera className="w-4 h-4 text-amber-700" />
            </div>
            <div className="space-y-0.5 text-gray-800">
              <div className="font-bold text-amber-950 text-[11px]">
                Compras Realizadas Disponibles para Calificar
              </div>
              <div className="text-[11px] text-gray-700 leading-relaxed">
                Aquí se muestran las prendas de tus compras ya <strong>Entregadas</strong> o <strong>Retiradas</strong> que aún no has calificado. Deja tu reseña con fotos reales para acreditar <strong>+100 Puntos Rewards</strong> instantáneos.
              </div>
            </div>
          </div>

          {pendingLoading ? (
            <div className="p-8 text-center text-xs text-gray-600">Comprobando compras y reseñas en MongoDB…</div>
          ) : pendingError ? (
            <div role="alert" className="p-5 text-center text-xs text-red-800 border border-red-300 bg-red-50 space-y-2">
              <p>{pendingError}</p>
              <button type="button" onClick={onRetry} className="winxp-button px-3 py-1">Reintentar</button>
            </div>
          ) : pendingReviewItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-300 space-y-2 winxp-bevel-in">
              <div className="w-10 h-10 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-700 border border-green-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-gray-800">
                {hasPurchases ? 'No tienes compras pendientes por calificar' : 'Aún no tienes compras para reseñar'}
              </div>
              <p className="text-gray-500 max-w-md mx-auto">
                {hasPurchases
                  ? 'Cuando alguna de tus compras esté entregada o retirada, podrás calificar sus prendas aquí.'
                  : 'Cuando completes tu primera compra y recibas tus prendas, aparecerán aquí para que puedas dejar una reseña.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviewItems.map((item, idx) => (
                <div
                  key={`${item.productId}_${item.orderNumber}_${idx}`}
                  className="p-3 bg-white border border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 winxp-bevel-out shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 object-cover border border-gray-400 bg-gray-100 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-900 border border-green-500 uppercase">
                          ✓ Compra Recibida (Orden #{item.orderNumber})
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {item.orderDate}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-gray-900 leading-snug">
                        {item.title}
                      </h5>
                      <div className="text-[11px] text-gray-600 flex items-center gap-2">
                        <span>
                          Talla: <strong className="text-gray-800">{item.size}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 border border-amber-400 self-start sm:self-auto">
                      +100 Pts con fotos (+20 pts sin fotos)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenReviewModal(
                          { productId: item.productId, title: item.title, image: item.image },
                          item.orderNumber
                        )
                      }
                      className="winxp-button winxp-button-primary text-xs py-1.5 px-3.5 font-bold text-blue-900 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs w-full sm:w-auto"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-700" />
                      <span>Dejar Reseña con Fotos</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO TAB 2: REALIZADAS (Compras que ya tienen calificación) */}
      {reviewsSubTab === 'completed' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="p-3 bg-blue-50 border border-blue-300 text-xs flex items-start gap-2.5 winxp-bevel-in">
            <div className="p-1 bg-blue-100 border border-blue-400 text-blue-800 rounded-xs shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
            </div>
            <div className="space-y-0.5 text-gray-800">
              <div className="font-bold text-blue-950 text-[11px]">
                Tus Reseñas Publicadas en NoLimits OS
              </div>
              <div className="text-[11px] text-gray-700 leading-relaxed">
                Estas son las calificaciones que has compartido con la comunidad. Cada reseña con fotos te otorgó <strong>+100 Puntos</strong> directos a tu saldo para canjear por cupones.
              </div>
            </div>
          </div>

          {completedLoading ? (
            <div className="p-8 text-center text-xs text-gray-600">Cargando tus reseñas publicadas…</div>
          ) : completedError ? (
            <div role="alert" className="p-5 text-center text-xs text-red-800 border border-red-300 bg-red-50 space-y-2">
              <p>{completedError}</p>
              <button type="button" onClick={onRetry} className="winxp-button px-3 py-1">Reintentar</button>
            </div>
          ) : myPublishedReviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-300 space-y-2 winxp-bevel-in">
              <MessageSquare className="w-8 h-8 mx-auto text-gray-400" />
              <div className="font-bold text-sm text-gray-800">No has publicado reseñas aún</div>
              <p className="text-gray-500 max-w-md mx-auto">
                Dirígete al <strong>Tab 1: Pendientes</strong> para calificar tus prendas entregadas y sumar puntos rewards.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPublishedReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 bg-white border border-gray-300 space-y-2.5 winxp-bevel-out shadow-xs text-xs"
                >
                  {/* Cabecera de la reseña */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.productImage}
                        alt={rev.productTitle}
                        className="w-12 h-12 object-cover border border-gray-400 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-blue-950">
                            {rev.productTitle}
                          </span>
                          {rev.orderNumber && <span className="text-[10px] text-gray-500 font-mono">
                            (Orden #{rev.orderNumber})
                          </span>}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Publicado el {rev.date} · Compra Verificada
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="flex text-amber-500 text-sm">
                        {'★'.repeat(rev.rating)}
                        {'☆'.repeat(5 - rev.rating)}
                      </div>
                      <span className="text-[10px] font-bold text-green-900 bg-green-100 px-2 py-0.5 border border-green-500 rounded-xs flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-700" />
                        <span>+{rev.pointsEarned} Pts Acreditados</span>
                      </span>
                    </div>
                  </div>

                  {/* Título y comentario */}
                  <div className="space-y-1">
                    <div className="font-bold text-gray-900 text-xs">
                      &quot;{rev.title}&quot;
                    </div>
                    <p className="text-gray-700 leading-relaxed italic bg-[#fbfbfb] p-2 border border-gray-200">
                      &quot;{rev.comment}&quot;
                    </p>
                  </div>

                  {/* Fotos adjuntas por el usuario */}
                  {rev.photos && rev.photos.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-blue-700" />
                        <span>Fotos de la prenda ({rev.photos.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rev.photos.map((photo, pIdx) => (
                          <div key={pIdx} className="relative w-16 h-16 border border-gray-400 bg-black/5 overflow-hidden">
                            <img
                              src={photo}
                              alt={`Foto ${pIdx + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
