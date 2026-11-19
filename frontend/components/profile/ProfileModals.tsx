import React from 'react';
import {
  Camera,
  Sparkles,
  Star,
  Upload,
  Award,
  RotateCcw,
  Package,
  Check,
  X,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Truck,
  Store,
  Clock,
  MapPin,
  Phone
} from 'lucide-react';
import { getBranchScheduleBlocks } from '../../context/BranchContext';
import { ShippingCourierId } from '../../services/shippingQuotesEngine';
import {
  getCouponDiscountDescription,
  getCouponMinPurchaseLabel
} from '../../services/couponsService';
import {
  BranchScheduleInfo,
  CouponItem,
  OWNER_RETURN_REASONS,
  PurchaseOrder,
  ReturnRequest
} from './profileTypes';

export interface ReturnShippingCalculationResult {
  totalWeightGrams: number;
  weightKgDisplay: string;
  tierLabel: string;
  itemBreakdowns: { title: string; quantity: number; weightGrams: number }[];
  paketReferenceCarrierCost: number;
  starkenCustomerCost: number;
  blueCustomerCost: number;
  selectedCostForCustomer: number;
  selectedCourierLabel: string;
  isPaidByStore: boolean;
}

export interface ClientShippingOriginResult {
  region: string;
  commune: string;
  alias: string;
  recipientName: string;
  fullStreetAddress: string;
}

export interface ProfileModalsProps {
  currentUser: any;
  orders: PurchaseOrder[];
  returnRequests: ReturnRequest[];
  liveBranchSchedules: BranchScheduleInfo[];

  // 1. Modal de Reseña con Fotos
  reviewModalProduct: {
    productId: string;
    title: string;
    image: string;
    orderNumber: string;
  } | null;
  setReviewModalProduct: (
    val: {
      productId: string;
      title: string;
      image: string;
      orderNumber: string;
    } | null
  ) => void;
  reviewSuccessMessage: string | null;
  reviewRating: number;
  setReviewRating: (val: number) => void;
  reviewTitle: string;
  handleReviewTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reviewComment: string;
  handleReviewCommentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  reviewPhotos: string[];
  setReviewPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  handlePhotoFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reviewSubmitting: boolean;
  handleSubmitReview: (e: React.FormEvent) => void;

  // 2. Modal para Iniciar Nueva Solicitud de Devolución
  isNewReturnModalOpen: boolean;
  setIsNewReturnModalOpen: (val: boolean) => void;
  returnModalStep: 'select_product' | 'confirm' | 'form';
  setReturnModalStep: (val: 'select_product' | 'confirm' | 'form') => void;
  selectedReturnOrder: string;
  selectedReturnItem: string;
  setSelectedReturnItem: (val: string) => void;
  selectedReturnItems: string[];
  setSelectedReturnItems: React.Dispatch<React.SetStateAction<string[]>>;
  setReturnTargetItem: (
    val: {
      productId: string;
      title: string;
      size: string;
      color: string;
      image: string;
      price: number;
    } | null
  ) => void;
  returnTargetOrder: PurchaseOrder | null;
  selectedReturnReason: string;
  setSelectedReturnReason: (val: string) => void;
  selectedReturnMethod: 'branch' | 'shipping';
  setSelectedReturnMethod: (val: 'branch' | 'shipping') => void;
  selectedReturnBranch: string;
  setSelectedReturnBranch: (val: string) => void;
  selectedReturnCourier: ShippingCourierId;
  setSelectedReturnCourier: (val: ShippingCourierId) => void;
  returnShippingRegion: string;
  returnShippingCommune: string;
  selectedReturnNotes: string;
  setSelectedReturnNotes: (val: string) => void;
  returnPhotos: string[];
  setReturnPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  handleReturnPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveReturnPhoto: (index: number) => void;
  handleCreateReturnSubmit: (e: React.FormEvent) => void;
  getReturnShippingCalculation: () => ReturnShippingCalculationResult;
  getRegisteredClientShippingOrigin: (order?: PurchaseOrder | null) => ClientShippingOriginResult;

  // 3. Ventanita Modal con Motivo del Rechazo de Devolución
  rejectionModalReturn: ReturnRequest | null;
  setRejectionModalReturn: (val: ReturnRequest | null) => void;

  // 4. Ventanita Modal: ¿Estás seguro? (Confirmación de Canje de Cupón)
  redeemConfirmCoupon: CouponItem | null;
  setRedeemConfirmCoupon: (val: CouponItem | null) => void;
  handleConfirmRedeem: () => void;

  // 5. Ventanita Modal: Horarios de Retiro de Sucursales Disponibles
  isPickupScheduleModalOpen: boolean;
  setIsPickupScheduleModalOpen: (val: boolean) => void;
}

export const ProfileModals: React.FC<ProfileModalsProps> = ({
  currentUser,
  orders,
  returnRequests,
  liveBranchSchedules,
  reviewModalProduct,
  setReviewModalProduct,
  reviewSuccessMessage,
  reviewRating,
  setReviewRating,
  reviewTitle,
  handleReviewTitleChange,
  reviewComment,
  handleReviewCommentChange,
  reviewPhotos,
  setReviewPhotos,
  handlePhotoFileUpload,
  reviewSubmitting,
  handleSubmitReview,
  isNewReturnModalOpen,
  setIsNewReturnModalOpen,
  returnModalStep,
  setReturnModalStep,
  selectedReturnOrder,
  selectedReturnItem,
  setSelectedReturnItem,
  selectedReturnItems,
  setSelectedReturnItems,
  setReturnTargetItem,
  returnTargetOrder,
  selectedReturnReason,
  setSelectedReturnReason,
  selectedReturnMethod,
  setSelectedReturnMethod,
  selectedReturnBranch,
  setSelectedReturnBranch,
  selectedReturnCourier,
  setSelectedReturnCourier,
  returnShippingRegion,
  returnShippingCommune,
  selectedReturnNotes,
  setSelectedReturnNotes,
  returnPhotos,
  setReturnPhotos,
  handleReturnPhotoUpload,
  handleRemoveReturnPhoto,
  handleCreateReturnSubmit,
  getReturnShippingCalculation,
  getRegisteredClientShippingOrigin,
  rejectionModalReturn,
  setRejectionModalReturn,
  redeemConfirmCoupon,
  setRedeemConfirmCoupon,
  handleConfirmRedeem,
  isPickupScheduleModalOpen,
  setIsPickupScheduleModalOpen
}) => {
  return (
    <>
      {/* =========================================================================
          MODAL DE RESEÑA CON FOTOS (+100 PUNTOS GARANTIZADOS)
          ========================================================================= */}
      {reviewModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-in fade-in">
          <div className="nl-profile-modal-window w-full max-w-lg bg-[#ece9d8] border-2 border-blue-900 shadow-2xl winxp-bevel-out">
            {/* Barra de Título Windows XP */}
            <div className="winxp-titlebar flex items-center justify-between px-2 py-1 select-none">
              <div className="winxp-titlebar-title flex items-center gap-1.5 text-xs text-white font-bold">
                <Camera className="w-3.5 h-3.5 text-yellow-300" />
                <span>Resena_Drop_Verificada.exe - [Ganar +100 Puntos Rewards]</span>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalProduct(null)}
                className="winxp-btn-ctrl winxp-btn-close w-4 h-4 text-[10px] font-bold text-white flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-4 space-y-3.5 bg-white text-xs text-gray-800">
              {reviewSuccessMessage ? (
                <div className="p-4 bg-green-50 border-2 border-green-600 text-green-900 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-700">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm">¡Puntos Acreditados con Éxito!</h4>
                  <p className="text-xs">{reviewSuccessMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  {/* Prenda Seleccionada */}
                  <div className="flex items-center gap-3 p-2 bg-blue-50 border border-blue-200">
                    <img
                      src={reviewModalProduct.image}
                      alt={reviewModalProduct.title}
                      className="w-14 h-14 object-cover border border-blue-400 shrink-0"
                    />
                    <div>
                      <div className="text-[10px] text-blue-700 font-bold uppercase">
                        Compra Verificada (Orden #{reviewModalProduct.orderNumber})
                      </div>
                      <h4 className="font-bold text-xs text-gray-900">{reviewModalProduct.title}</h4>
                      <div className="text-[10px] text-gray-500">
                        Comparte fotos de tu prenda puesta o de los detalles para acreditar puntos.
                      </div>
                    </div>
                  </div>

                  {/* Calificación por Estrellas */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Calificación General:
                    </label>
                    <div className="flex items-center gap-1 text-lg">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="cursor-pointer focus:outline-none"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= reviewRating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-gray-600 ml-2">
                        {reviewRating === 5 ? '¡Excelente prenda!' : `${reviewRating} de 5 estrellas`}
                      </span>
                    </div>
                  </div>

                  {/* Título de la Reseña (Máximo 100 caracteres, sin saltos de línea) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-700">
                        Título de la Reseña: <span className="text-red-600">*</span>
                      </label>
                      <span className={`text-[10px] font-mono ${reviewTitle.length >= 100 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {reviewTitle.length}/100 caracteres
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={reviewTitle}
                      onChange={handleReviewTitleChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                      placeholder="Ej. Excelente confección y detalles Y2K nítidos (máx. 100 caracteres)"
                      className="winxp-input w-full text-xs py-1"
                    />
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Máximo 100 caracteres continuos sin saltos de línea.
                    </div>
                  </div>

                  {/* Comentario (Máximo 600 caracteres, sin saltos de línea) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-700">
                        Comentario sobre el Calce y Experiencia: <span className="text-red-600">*</span>
                      </label>
                      <span className={`text-[10px] font-mono ${reviewComment.length >= 600 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {reviewComment.length}/600 caracteres
                      </span>
                    </div>
                    <textarea
                      required
                      rows={3}
                      maxLength={600}
                      value={reviewComment}
                      onChange={handleReviewCommentChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                      placeholder="Cuéntanos cómo te queda la talla, cómo se siente la tela y cómo combina con tu estilo (máximo 600 caracteres continuos, sin saltos de línea)..."
                      className="winxp-input w-full text-xs py-1.5 resize-none leading-relaxed"
                    />
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Máximo 600 caracteres (no se permiten saltos de línea).
                    </div>
                  </div>

                  {/* Subida de Fotos Reales (Límite máximo de 10 Fotos) */}
                  <div className="p-2.5 bg-[#f8fafc] border border-gray-300 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-700" />
                        <span>Subir Fotos Reales (Límite: 10 fotos máximo):</span>
                      </label>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 border rounded-xs ${
                          reviewPhotos.length > 0
                            ? 'bg-green-100 text-green-900 border-green-600'
                            : 'bg-yellow-100 text-yellow-900 border-yellow-500'
                        }`}
                      >
                        {reviewPhotos.length > 0
                          ? `✓ Bono +100 Pts Activado (${reviewPhotos.length}/10 fotos)`
                          : '⚠️ Sin fotos = solo +20 pts (0/10 fotos)'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className={`winxp-button text-xs py-1 px-3 flex items-center gap-1.5 font-bold text-gray-800 ${
                          reviewPhotos.length >= 10
                            ? 'opacity-50 cursor-not-allowed bg-gray-200'
                            : 'cursor-pointer hover:bg-gray-100'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-700" />
                        <span>
                          {reviewPhotos.length >= 10
                            ? 'Límite alcanzado (10 fotos)'
                            : 'Seleccionar Foto Local'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={reviewPhotos.length >= 10}
                          onChange={handlePhotoFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {reviewPhotos.length >= 10
                          ? 'Has alcanzado el límite máximo de 10 imágenes.'
                          : `Límite: ${reviewPhotos.length}/10 fotos (puedes subir ${10 - reviewPhotos.length} más).`}
                      </span>
                    </div>

                    {/* Previsualización de Fotos Adjuntadas */}
                    {reviewPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {reviewPhotos.map((photo, idx) => (
                          <div key={idx} className="relative group w-14 h-14 border border-gray-400 bg-white shadow-xs">
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setReviewPhotos(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                              title="Eliminar foto"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botones de Acción */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-300">
                    <button
                      type="button"
                      onClick={() => setReviewModalProduct(null)}
                      className="winxp-button text-xs py-1.5 px-3 text-gray-700 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {reviewSubmitting
                          ? 'Publicando y acreditando puntos...'
                          : reviewPhotos.length > 0
                          ? 'Publicar Reseña y Acreditar +100 Puntos'
                          : 'Publicar Reseña (+20 Pts)'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL PARA INICIAR NUEVA SOLICITUD DE DEVOLUCIÓN
          ========================================================================= */}
      {isNewReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in">
          <div className="nl-profile-modal-window w-full max-w-lg bg-[#ece9d8] border-2 border-blue-900 shadow-2xl winxp-bevel-out flex flex-col h-[580px] max-h-[88vh] overflow-hidden">
            {/* Barra de Título Windows XP */}
            <div className="winxp-titlebar flex items-center justify-between px-2 py-1 select-none shrink-0">
              <div className="winxp-titlebar-title flex items-center gap-1.5 text-xs text-white font-bold">
                <RotateCcw className="w-3.5 h-3.5 text-yellow-300" />
                <span>
                  {returnModalStep === 'select_product'
                    ? 'Solicitud_de_Devolucion.exe - [Paso 1: Seleccionar Prenda]'
                    : returnModalStep === 'confirm'
                    ? 'Solicitud_de_Devolucion.exe - [¿Está seguro?]'
                    : 'Solicitud_de_Devolucion.exe - [Formulario de Solicitud]'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewReturnModalOpen(false)}
                className="winxp-btn-ctrl winxp-btn-close w-4 h-4 text-[10px] font-bold text-white flex items-center justify-center cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* PASO 1 (CUANDO LA ORDEN TIENE MÁS DE 1 PRODUCTO): SELECCIONAR PRENDAS */}
            {returnModalStep === 'select_product' && (
              <div className="flex flex-col flex-1 min-h-0 bg-white">
                <div className="p-4 space-y-3.5 text-xs text-gray-800 flex-1 overflow-y-auto min-h-0">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border-2 border-blue-400 rounded-xs winxp-bevel-in">
                    <div className="p-2 bg-blue-100 border border-blue-300 rounded-full shrink-0">
                      <Package className="w-6 h-6 text-blue-700" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-blue-950">
                        Paso 1: Selecciona las prendas que deseas devolver o cambiar
                      </h4>
                      <p className="text-xs text-blue-900 leading-relaxed">
                        Esta orden contiene <strong>{orders.find(o => o.orderNumber === selectedReturnOrder)?.items.length || 0} productos</strong>. Puedes seleccionar uno, dos o todos los productos marcando las casillas:
                      </p>
                    </div>
                  </div>

                  {/* Barra de Controles Rápidos: Seleccionar Todo / Deseleccionar Todo */}
                  {(() => {
                    const currentOrder = orders.find(o => o.orderNumber === selectedReturnOrder);
                    const eligibleProds = (currentOrder?.items || []).filter(it => {
                      const ret = returnRequests.find(r => r.orderNumber === currentOrder?.orderNumber && r.productId === it.productId);
                      return !ret;
                    });

                    return (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs border-b border-gray-200 pb-1.5">
                        <span className="font-bold text-gray-700">
                          {selectedReturnItems.length} de {eligibleProds.length} prendas disponibles seleccionadas
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const allIds = eligibleProds.map(it => it.productId);
                              setSelectedReturnItems(allIds);
                              if (allIds.length > 0) setSelectedReturnItem(allIds[0]);
                            }}
                            className="winxp-button text-[11px] py-1 px-2.5 font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border-blue-500 shadow-xs cursor-pointer transition-colors"
                            title="Marcar todas las prendas disponibles de esta orden"
                          >
                            Seleccionar todo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReturnItems([]);
                            }}
                            disabled={selectedReturnItems.length === 0}
                            className="winxp-button text-[11px] py-1 px-2.5 font-bold text-gray-700 hover:bg-gray-100 border-gray-400 shadow-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Desmarcar todas las prendas"
                          >
                            Deseleccionar todo
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Lista de Prendas para Seleccionar (Casillas Múltiples) */}
                  <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
                    {(() => {
                      const currentOrder = orders.find(o => o.orderNumber === selectedReturnOrder);
                      return (currentOrder?.items || []).map((it, idx) => {
                        const isSelected = selectedReturnItems.includes(it.productId);
                        const existingItemReturn = returnRequests.find(
                          r => r.orderNumber === currentOrder?.orderNumber && r.productId === it.productId
                        );
                        const isApproved = existingItemReturn?.currentStatus === 'Aprobada';
                        const isRejected = existingItemReturn?.currentStatus === 'Rechazada' || !!existingItemReturn?.rejectionReason;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (!isApproved && !isRejected) {
                                setSelectedReturnItems(prev => {
                                  const exists = prev.includes(it.productId);
                                  const updated = exists
                                    ? prev.filter(id => id !== it.productId)
                                    : [...prev, it.productId];
                                  if (updated.length > 0) setSelectedReturnItem(updated[0]);
                                  return updated;
                                });
                              }
                            }}
                            className={`p-3 border rounded-xs transition-all flex items-center justify-between gap-3 ${
                              isApproved || isRejected
                                ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-300'
                                : isSelected
                                ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-400 shadow-sm cursor-pointer'
                                : 'bg-[#fafbfc] border-gray-300 hover:bg-gray-50 hover:border-gray-400 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Checkbox visual estilo Windows XP */}
                              <div
                                className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'border-blue-700 bg-blue-600 text-white shadow-xs'
                                    : 'border-gray-400 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                              </div>

                              <img
                                src={it.image}
                                alt={it.title}
                                className="w-13 h-13 object-cover border border-gray-400 shrink-0 bg-white"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs text-gray-900 truncate">
                                  {it.title}
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  Talla: <strong className="text-gray-700">{it.size}</strong> · Cant.:{' '}
                                  <strong className="text-gray-700">{it.quantity}</strong>
                                </div>
                                <div className="text-[11px] font-bold text-red-700 mt-0.5">
                                  ${it.price.toLocaleString('es-CL')} CLP
                                </div>
                              </div>
                            </div>

                            {/* Tag de Estado o Acción */}
                            <div className="shrink-0 text-right">
                              {isApproved ? (
                                <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-400 rounded-xs">
                                  Ya Devuelto (Aprobada)
                                </span>
                              ) : isRejected ? (
                                <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 border border-red-400 rounded-xs">
                                  Rechazada previa
                                </span>
                              ) : isSelected ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-blue-600 text-white border border-blue-800 rounded-xs shadow-xs">
                                  <Check className="w-3 h-3 text-white stroke-[3]" />
                                  Prenda Seleccionada
                                </span>
                              ) : (
                                <span className="text-[10px] text-blue-700 font-semibold underline">
                                  Marcar para devolver
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Botones de Navegación del Selector */}
                <div className="p-2.5 px-4 bg-[#ece9d8] border-t border-gray-300 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsNewReturnModalOpen(false)}
                    className="winxp-button text-xs py-1.5 px-4 text-gray-800 font-bold flex items-center gap-1.5 cursor-pointer hover:bg-gray-200"
                  >
                    <X className="w-3.5 h-3.5 text-gray-600" />
                    <span>Cancelar</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedReturnItems.length === 0}
                    onClick={() => {
                      const currentOrder = orders.find(o => o.orderNumber === selectedReturnOrder);
                      const chosen = currentOrder?.items.find(i => selectedReturnItems.includes(i.productId));
                      if (chosen) setReturnTargetItem(chosen);
                      setReturnModalStep('confirm');
                    }}
                    className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>
                      {selectedReturnItems.length > 1
                        ? `Continuar con ${selectedReturnItems.length} prendas seleccionadas →`
                        : 'Continuar a Confirmación →'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-blue-700" />
                  </button>
                </div>
              </div>
            )}

            {/* PASO "¿ESTÁ SEGURO?" (ADVERTENCIA CON TODAS LAS PRENDAS SELECCIONADAS) */}
            {returnModalStep === 'confirm' && (
              <div className="flex flex-col flex-1 min-h-0 bg-white">
                <div className="p-4 space-y-4 text-xs text-gray-800 flex-1 overflow-y-auto min-h-0">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border-2 border-amber-400 rounded-xs winxp-bevel-in">
                    <div className="p-2 bg-amber-100 border border-amber-300 rounded-full shrink-0">
                      <HelpCircle className="w-6 h-6 text-amber-700" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-amber-950">
                        ¿Está seguro que desea solicitar una devolución o cambio?
                      </h4>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        Estás a punto de iniciar una solicitud oficial de devolución o cambio para tu compra. Por favor verifica las prendas seleccionadas y las condiciones de garantía antes de continuar:
                      </p>
                    </div>
                  </div>

                  {/* Previsualización de la(s) Prenda(s) Seleccionada(s) */}
                  {(() => {
                    const targetOrder = orders.find(o => o.orderNumber === selectedReturnOrder) || orders[0];
                    const chosenItems = (targetOrder?.items || []).filter(i =>
                      selectedReturnItems.length > 0 ? selectedReturnItems.includes(i.productId) : i.productId === selectedReturnItem
                    );

                    return (
                      <div className="border border-gray-300 p-3 bg-[#fbfaf5] rounded-xs space-y-2 winxp-bevel-out">
                        <div className="text-[11px] font-bold text-gray-700 flex flex-wrap items-center justify-between gap-1 border-b border-gray-200 pb-1">
                          <span>
                            Prendas sujetas a devolución ({chosenItems.length} {chosenItems.length === 1 ? 'prenda' : 'prendas'}):
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-blue-900 font-bold">Orden #{targetOrder?.orderNumber}</span>
                            {targetOrder && targetOrder.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setReturnModalStep('select_product')}
                                className="text-[10px] text-blue-700 underline font-semibold hover:text-blue-900 cursor-pointer"
                              >
                                (Modificar prendas)
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                          {chosenItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-xs">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-14 h-14 object-cover border border-gray-400 bg-white p-0.5 rounded-xs shrink-0"
                              />
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <h5 className="font-bold text-gray-900 text-xs truncate">{item.title}</h5>
                                <div className="text-[11px] text-gray-600 flex flex-wrap gap-2">
                                  <span>Talla: <strong>{item.size}</strong></span>
                                  <span>Cantidad: <strong>{item.quantity}</strong></span>
                                  <span>Precio: <strong>${item.price.toLocaleString('es-CL')} CLP</strong></span>
                                </div>
                                <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  Garantía válida de 7 días activa
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Requisitos para que tu solicitud sea aprobada */}
                  <div className="p-3 bg-blue-50 border-2 border-blue-300 text-blue-950 text-[11px] space-y-2.5 rounded-xs winxp-bevel-in">
                    <div className="font-bold flex items-center gap-1.5 text-blue-950 text-xs border-b border-blue-200 pb-1.5">
                      <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>Requisitos para que tu solicitud sea aprobada:</span>
                    </div>

                    {/* Sección 1: Cambios por gusto personal y elección de talla */}
                    <div className="space-y-1.5 bg-white p-2.5 border border-blue-200 rounded-xs">
                      <div className="font-bold text-red-900 text-[11px]">
                        Cambios por gusto personal y elección de talla
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        En Nolimits te recomendamos revisar cuidadosamente las fotografías, descripciones, medidas, materiales y características de cada producto antes de realizar tu compra.
                      </p>
                      <div className="font-bold text-gray-900 pt-0.5">
                        No realizamos cambios voluntarios por los siguientes motivos:
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-gray-800 font-medium">
                        <li>El producto no fue del gusto o preferencia del cliente.</li>
                        <li>La talla seleccionada no fue la adecuada.</li>
                        <li>El cliente eligió una medida, color o modelo distinto del que necesitaba.</li>
                        <li>El cliente cambió de opinión después de concretar la compra.</li>
                      </ul>
                      <p className="text-gray-600 text-[10px] pt-0.5">
                        Las medidas y características de los productos estarán disponibles en sus respectivas publicaciones para ayudarte a elegir de manera informada. Esta política se refiere exclusivamente a cambios voluntarios por preferencia personal.
                      </p>
                    </div>

                    {/* Sección 2: Productos con fallas */}
                    <div className="space-y-1 bg-emerald-50/80 p-2.5 border border-emerald-300 rounded-xs">
                      <div className="font-bold text-emerald-950 text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Productos con fallas</span>
                      </div>
                      <p className="text-emerald-950 leading-relaxed">
                        Si recibes un producto con <strong>defectos de fabricación o fallas que no fueron informadas antes de la compra</strong>, puedes contactarnos e ingresar esta solicitud para evaluar el caso.
                      </p>
                      <p className="text-gray-700 text-[10px]">
                        • Las prendas deben encontrarse sin uso, sin lavar y con sus etiquetas originales. Podrás adjuntar hasta 10 fotografías del defecto o falla.
                      </p>
                    </div>

                    {/* Sección 3: Condiciones de Envío (Paket vs Starken y Blue Express) */}
                    <div className="space-y-1 bg-amber-50 p-2.5 border border-amber-300 rounded-xs">
                      <div className="font-bold text-amber-950 text-[11px] flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Política de Envío en Devoluciones:</span>
                      </div>
                      <p className="text-amber-950 leading-relaxed text-[10px]">
                        • <strong>Paket Express:</strong> Nolimits <strong>SÍ paga la devolución por Paket ($0 CLP para el cliente)</strong>.<br />
                        • <strong>Starken y Blue Express:</strong> Nolimits <strong>NO realiza devoluciones pagadas por Starken ni Blue Express</strong> (el valor del envío se calcula automáticamente en el siguiente paso con los datos de tu cuenta).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones de Confirmación "¿Está seguro?" */}
                <div className="p-2.5 px-4 bg-[#ece9d8] border-t border-gray-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  {(() => {
                    const targetOrder = orders.find(o => o.orderNumber === selectedReturnOrder);
                    if (targetOrder && targetOrder.items.length > 1) {
                      return (
                        <button
                          type="button"
                          onClick={() => setReturnModalStep('select_product')}
                          className="winxp-button text-xs py-1.5 px-3 text-gray-700 font-medium flex items-center gap-1 cursor-pointer hover:bg-gray-200"
                        >
                          <span>← Volver a Selección de Prendas</span>
                        </button>
                      );
                    }
                    return <div />;
                  })()}

                  <div className="flex items-center gap-2.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsNewReturnModalOpen(false)}
                      className="winxp-button text-xs py-1.5 px-4 text-gray-800 font-bold flex items-center gap-1.5 cursor-pointer hover:bg-gray-200"
                    >
                      <X className="w-3.5 h-3.5 text-red-600" />
                      <span>Rechazar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReturnModalStep('form')}
                      className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-700" />
                      <span>Aceptar y Continuar →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PASO: FORMULARIO CON CAMPOS REQUERIDOS */}
            {returnModalStep === 'form' && (
              <form onSubmit={handleCreateReturnSubmit} className="flex flex-col flex-1 min-h-0 bg-white">
                <div className="p-4 space-y-3.5 text-xs text-gray-800 flex-1 overflow-y-auto min-h-0">
                  {/* Cabecera / Pestaña indicadora */}
                  <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-gray-300 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-900 text-white font-bold text-[10px] px-2 py-0.5 rounded-full font-mono">
                        {(() => {
                          const targetOrder = orders.find(o => o.orderNumber === selectedReturnOrder);
                          return targetOrder && targetOrder.items.length > 1 ? 'Paso 3 de 3' : 'Paso 2 de 2';
                        })()}
                      </span>
                      <span className="font-bold text-xs text-blue-950">
                        Rellena los campos de la Solicitud:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReturnModalStep('confirm')}
                      className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      ← Volver a "¿Está seguro?"
                    </button>
                  </div>

                  {/* Prendas seleccionadas para devolver */}
                  {selectedReturnOrder && (
                    <div className="p-2.5 bg-blue-50 border border-blue-300 text-xs text-blue-950 space-y-1.5 winxp-bevel-in shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                          <span>Prendas a Devolver ({selectedReturnItems.length > 0 ? selectedReturnItems.length : 1}):</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-blue-700 text-white px-2 py-0.5 rounded-full shrink-0">
                          Orden #{selectedReturnOrder}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-28 overflow-y-auto pr-0.5">
                        {(selectedReturnItems.length > 0 ? selectedReturnItems : [selectedReturnItem]).map((prodId) => {
                          const it = orders.find(o => o.orderNumber === selectedReturnOrder)?.items.find(i => i.productId === prodId);
                          if (!it) return null;
                          return (
                            <div key={prodId} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-blue-200 rounded-xs text-[11px] shadow-xs">
                              <img src={it.image} alt="" className="w-5 h-5 object-cover rounded-xs border border-gray-300" />
                              <span className="font-bold text-gray-900 truncate max-w-[200px]">{it.title}</span>
                              <span className="text-gray-500 font-medium">({it.size})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 1. Motivo de la Solicitud */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800">
                      Motivo de la Solicitud: <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={selectedReturnReason}
                      onChange={(e) => setSelectedReturnReason(e.target.value)}
                      className="winxp-input w-full text-xs py-1.5 bg-white font-medium"
                      required
                    >
                      {OWNER_RETURN_REASONS.map((reasonOption) => (
                        <option key={reasonOption} value={reasonOption}>
                          {reasonOption}
                        </option>
                      ))}
                    </select>
                    <div className="p-2 bg-amber-50 border border-amber-300 rounded-xs text-[10px] text-amber-950 leading-snug">
                      <strong>Importante:</strong> Solo se aprueban solicitudes por <strong>defectos de fabricación o fallas no informadas antes de la compra</strong>. No se realizan cambios voluntarios por gusto personal, elección de talla, medida, color/modelo o cambio de opinión.
                    </div>
                  </div>

                  {/* 2. Modalidad de Entrega o Envío con Cálculo Automático */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-800">
                      Modalidad para Entrega o Devolución: <span className="text-red-600">*</span>
                    </label>
                    <div className="text-[11px] text-gray-500 mb-1">
                      Elige si entregarás la prenda presencialmente en una sucursal física o mediante envío por courier:
                    </div>

                    {/* Selector de Modalidad: Sucursal Física vs Envío */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReturnMethod('branch')}
                        className={`p-2 border rounded-xs text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selectedReturnMethod === 'branch'
                            ? 'winxp-button-primary bg-blue-100 border-blue-700 text-blue-950 font-bold shadow-xs'
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5 text-blue-700" />
                        <span>Sucursal Física (Presencial)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedReturnMethod('shipping')}
                        className={`p-2 border rounded-xs text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selectedReturnMethod === 'shipping'
                            ? 'winxp-button-primary bg-blue-100 border-blue-700 text-blue-950 font-bold shadow-xs'
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5 text-blue-700" />
                        <span>Devolución por Envío</span>
                      </button>
                    </div>

                    {/* Desplegable de Sucursales Físicas si se eligió Sucursal */}
                    {selectedReturnMethod === 'branch' ? (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-300 rounded-xs space-y-1.5 mt-2">
                        <label className="block text-[11px] font-bold text-blue-950">
                          Selecciona la Sucursal Física para Evaluación:
                        </label>
                        <select
                          value={selectedReturnBranch}
                          onChange={(e) => setSelectedReturnBranch(e.target.value)}
                          className="winxp-input w-full text-xs py-1.5 bg-white font-medium"
                        >
                          {liveBranchSchedules.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} — ({b.city}: {b.address}) · {b.pickupSummary || b.scheduleWeekdays}
                            </option>
                          ))}
                        </select>
                        <div className="text-[10px] text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500 shrink-0" />
                          <span>Podrás acudir directamente una vez aprobada tu solicitud en los horarios informados ($0 CLP).</span>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const calc = getReturnShippingCalculation();
                        const clientOrigin = getRegisteredClientShippingOrigin(returnTargetOrder);

                        return (
                          <div className="p-3 bg-[#f8fafc] border-2 border-blue-300 rounded-xs space-y-2.5 mt-2 winxp-bevel-in">
                            <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
                              <div className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-blue-700 shrink-0" />
                                <span>Cálculo Automático de Envío de Devolución</span>
                              </div>
                            </div>

                            {/* Campos de Región de Origen del Envío y Comuna llenados automáticamente */}
                            <div className="bg-white p-2 border border-gray-300 rounded-xs space-y-1.5">
                              <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-blue-900 font-semibold border-b border-gray-200 pb-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-blue-700 shrink-0" />
                                  <span>Datos del cliente registrado ({clientOrigin.alias}):</span>
                                </span>
                                <span className="text-[9px] bg-emerald-100 text-emerald-900 border border-emerald-400 px-1.5 py-0.2 rounded-xs font-bold">
                                  ✓ Auto-completado
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                    Región de Origen del Envío:
                                  </label>
                                  <input
                                    type="text"
                                    readOnly
                                    value={returnShippingRegion}
                                    className="winxp-input w-full text-[11px] py-1 bg-gray-100 text-gray-900 font-semibold cursor-default select-none"
                                    title="Completado automáticamente con la región registrada del cliente"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                    Comuna:
                                  </label>
                                  <input
                                    type="text"
                                    readOnly
                                    value={returnShippingCommune}
                                    className="winxp-input w-full text-[11px] py-1 bg-gray-100 text-gray-900 font-semibold cursor-default select-none"
                                    title="Completado automáticamente con la comuna registrada del cliente"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Tarjetas de Selección de Courier */}
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold text-gray-800">
                                Selecciona el Courier para tu Devolución:
                              </div>

                              {/* 1. PAKET EXPRESS - PAGADO POR NOLIMITS */}
                              <div
                                onClick={() => setSelectedReturnCourier('paket')}
                                className={`p-2.5 border rounded-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                  selectedReturnCourier === 'paket'
                                    ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-400 shadow-xs'
                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-xs text-gray-900">Paket Express</span>
                                    <span
                                      data-force-white
                                      style={{ color: '#ffffff', backgroundColor: '#15803d' }}
                                      className="!text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                                    >
                                      ✓ Devolución Pagada por Nolimits
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-emerald-900 font-medium">
                                    Nolimits cubre el 100% del envío de devolución por Paket ({returnShippingCommune}).
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[10px] text-gray-400 line-through font-mono">
                                    ${calc.paketReferenceCarrierCost.toLocaleString('es-CL')} CLP
                                  </div>
                                  <div className="text-xs font-black text-emerald-700 font-mono">
                                    $0 CLP
                                  </div>
                                </div>
                              </div>

                              {/* 2. STARKEN - NO PAGADO POR NOLIMITS */}
                              <div
                                onClick={() => setSelectedReturnCourier('starken')}
                                className={`p-2.5 border rounded-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                  selectedReturnCourier === 'starken'
                                    ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-400 shadow-xs'
                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-xs text-gray-900">Starken</span>
                                    <span className="bg-red-100 text-red-800 border border-red-300 text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase">
                                      No pagado por Nolimits
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-600">
                                    Envío calculado automáticamente según comuna ({returnShippingCommune}). Costo a cargo del cliente.
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-black text-red-700 font-mono">
                                    ${calc.starkenCustomerCost.toLocaleString('es-CL')} CLP
                                  </div>
                                  <div className="text-[9px] text-gray-500 font-semibold">
                                    Paga el cliente
                                  </div>
                                </div>
                              </div>

                              {/* 3. BLUE EXPRESS - NO PAGADO POR NOLIMITS */}
                              <div
                                onClick={() => setSelectedReturnCourier('blue_express')}
                                className={`p-2.5 border rounded-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                  selectedReturnCourier === 'blue_express'
                                    ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-400 shadow-xs'
                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-xs text-gray-900">Blue Express</span>
                                    <span className="bg-red-100 text-red-800 border border-red-300 text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase">
                                      No pagado por Nolimits
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-600">
                                    Envío calculado automáticamente según comuna ({returnShippingCommune}). Costo a cargo del cliente.
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-black text-red-700 font-mono">
                                    ${calc.blueCustomerCost.toLocaleString('es-CL')} CLP
                                  </div>
                                  <div className="text-[9px] text-gray-500 font-semibold">
                                    Paga el cliente
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Resumen Final del Cálculo Automático */}
                            <div
                              className={`p-2.5 border rounded-xs flex items-center justify-between gap-2 ${
                                calc.isPaidByStore
                                  ? 'bg-emerald-100/80 border-emerald-500 text-emerald-950'
                                  : 'bg-amber-100/80 border-amber-500 text-amber-950'
                              }`}
                            >
                              <div className="text-[11px]">
                                <span className="font-bold">Total Envío ({calc.selectedCourierLabel}): </span>
                                <span>
                                  {calc.isPaidByStore
                                    ? 'Cubierto 100% por Nolimits (Devolución pagada por la tienda)'
                                    : 'No cubierto por Nolimits (Valor calculado a pagar por el cliente)'}
                                </span>
                              </div>
                              <div className="font-mono font-black text-xs shrink-0">
                                {calc.isPaidByStore
                                  ? '$0 CLP'
                                  : `$${calc.selectedCostForCustomer.toLocaleString('es-CL')} CLP`}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* 3. Observaciones adicionales */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-800">
                        . Observaciones adicionales:
                      </label>
                      <span className={`text-[10px] font-mono ${
                        selectedReturnNotes.length >= 600 ? 'text-red-600 font-bold' : 'text-gray-500'
                      }`}>
                        {selectedReturnNotes.length} / 600 caracteres
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={600}
                      value={selectedReturnNotes}
                      onChange={(e) => {
                        const singleLine = e.target.value.replace(/[\r\n]+/g, ' ').slice(0, 600);
                        setSelectedReturnNotes(singleLine);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Describe detalladamente el defecto de fabricación o la falla que no fue informada antes de la compra..."
                      className="winxp-input w-full text-xs p-2 resize-none font-sans"
                    />
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Describe el defecto de fabricación o falla no informada para agilizar la evaluación del equipo NoLimits (máx. 600 caracteres, sin saltos de línea).
                    </div>
                  </div>

                  {/* 4. Fotos de Respaldo (Máximo 10 Fotos) */}
                  <div className="space-y-2 pt-1 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-700" />
                        <span>Subir Fotos de Respaldo (Máximo 10 fotos):</span>
                      </label>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                        returnPhotos.length >= 10 ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {returnPhotos.length} / 10 fotos máximo
                      </span>
                    </div>

                    {/* Botones de Carga */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className={`winxp-button text-xs py-1 px-3 flex items-center gap-1.5 ${
                        returnPhotos.length >= 10 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'
                      }`}>
                        <Upload className="w-3.5 h-3.5 text-blue-700" />
                        <span>Examinar equipo...</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={returnPhotos.length >= 10}
                          onChange={handleReturnPhotoUpload}
                          className="hidden"
                        />
                      </label>

                      {returnPhotos.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setReturnPhotos([])}
                          className="text-[11px] text-red-600 hover:underline font-semibold ml-auto cursor-pointer"
                        >
                          Limpiar fotos
                        </button>
                      )}
                    </div>

                    {/* Grid de Fotos Subidas (Hasta 10) */}
                    {returnPhotos.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                        {returnPhotos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square border-2 border-gray-400 bg-black/5 overflow-hidden rounded-xs group winxp-bevel-out"
                          >
                            <img
                              src={photo}
                              alt={`Foto devolución ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveReturnPhoto(idx)}
                              className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs cursor-pointer"
                              title="Eliminar foto"
                            >
                              ×
                            </button>
                            <span className="absolute bottom-0.5 left-0.5 bg-black/70 text-white text-[9px] font-mono px-1 rounded-xs">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 italic">
                      Puedes adjuntar fotos de la prenda completa, etiquetas y cualquier detalle o defecto (máx 10 fotos).
                    </p>
                  </div>
                </div>

                {/* Botones de Acción del Formulario */}
                <div className="p-2.5 px-4 bg-[#ece9d8] border-t border-gray-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setReturnModalStep('confirm')}
                    className="winxp-button text-xs py-1.5 px-3.5 text-gray-800 font-bold flex items-center gap-1.5 cursor-pointer hover:bg-gray-200"
                  >
                    <X className="w-3.5 h-3.5 text-red-600" />
                    <span>Rechazar / Volver</span>
                  </button>

                  <button
                    type="submit"
                    className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 text-blue-700" />
                    <span>Ingresar Solicitud de Devolución</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VENTANITA MODAL CON EL MOTIVO DEL RECHAZO DE LA DEVOLUCIÓN
          ========================================================================= */}
      {rejectionModalReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-in fade-in">
          <div className="nl-profile-modal-window w-full max-w-md bg-[#ece9d8] border-2 border-red-900 shadow-2xl winxp-bevel-out">
            {/* Barra de Título Windows XP en tono de Advertencia/Error */}
            <div
              style={{
                background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 45%, #991b1b 50%, #7f1d1d 100%)'
              }}
              className="winxp-titlebar flex items-center justify-between px-2 py-1 select-none text-white"
            >
              <div className="winxp-titlebar-title flex items-center gap-1.5 text-xs text-white font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-300" />
                <span>Motivo_Rechazo_Devolucion.exe - [Ticket #{rejectionModalReturn.ticketNumber}]</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectionModalReturn(null)}
                className="winxp-btn-ctrl winxp-btn-close w-4 h-4 text-[10px] font-bold text-white flex items-center justify-center cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Contenido de la Ventanita con Motivo Oficial */}
            <div className="p-4 space-y-3.5 bg-white text-xs text-gray-800">
              {/* Alerta Destacada */}
              <div className="p-3 bg-red-50 border-2 border-red-400 rounded-xs flex items-start gap-3 winxp-bevel-in">
                <div className="p-1.5 bg-red-100 border border-red-300 rounded-full shrink-0">
                  <X className="w-5 h-5 text-red-600 stroke-[3]" />
                </div>
                <div>
                  <div className="font-bold text-red-950 text-xs uppercase tracking-wide">
                    Dictamen Oficial: Devolución Rechazada
                  </div>
                  <div className="text-[11px] text-red-900 mt-0.5">
                    Ticket: <strong>#{rejectionModalReturn.ticketNumber}</strong> · Orden #{rejectionModalReturn.orderNumber}
                  </div>
                  {rejectionModalReturn.rejectionDate && (
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Fecha de dictamen: {rejectionModalReturn.rejectionDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Prenda Involucrada */}
              <div className="flex items-center gap-3 p-2 bg-[#f8fafc] border border-gray-300 rounded-xs winxp-bevel-out">
                <img
                  src={rejectionModalReturn.productImage}
                  alt={rejectionModalReturn.productTitle}
                  className="w-12 h-12 object-cover border border-gray-400 rounded-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-xs text-gray-900 truncate">
                    {rejectionModalReturn.productTitle}
                  </h5>
                  <div className="text-[11px] text-gray-600">
                    Talla: <strong>{rejectionModalReturn.productSize}</strong> · Motivo indicado:{' '}
                    <strong>{rejectionModalReturn.reason}</strong>
                  </div>
                </div>
              </div>

              {/* Motivo del Rechazo escrito por el Administrador */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-red-950 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>Motivo y Justificación del Rechazo:</span>
                </label>
                <div className="p-3 bg-red-50/70 border border-red-300 rounded-xs text-gray-800 text-xs leading-relaxed italic winxp-bevel-in shadow-inner">
                  "{rejectionModalReturn.rejectionReason ||
                    'La pieza presenta manipulación forzada y signos evidentes de uso posterior a la entrega. El sello de autenticidad del drop fue removido. De acuerdo con las políticas de devolución de Nolimits, solo se aprueban solicitudes por defectos de fabricación o fallas no informadas previas al uso.'}"
                </div>
                {rejectionModalReturn.adminInspector && (
                  <div className="text-[10px] text-gray-500 font-mono text-right">
                    Inspeccionado por: <strong>{rejectionModalReturn.adminInspector}</strong>
                  </div>
                )}
              </div>

              {/* Protocolo de Evaluación */}
              <div className="p-2.5 bg-gray-50 border border-gray-300 rounded-xs text-[11px] text-gray-600 space-y-1">
                <div className="font-bold text-gray-800">Política Oficial de Devoluciones Nolimits:</div>
                <p>
                  Las devoluciones aplican exclusivamente para productos con defectos de fabricación o fallas no informadas antes de la compra, sin uso y con sus etiquetas originales intactas. No se realizan cambios voluntarios por gusto personal o elección de talla.
                </p>
              </div>

              {/* Botón de Cierre */}
              <div className="pt-2 flex items-center justify-end border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setRejectionModalReturn(null)}
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 cursor-pointer shadow-sm"
                >
                  Entendido / Cerrar Ventana
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VENTANITA MODAL: ¿ESTÁS SEGURO? (CONFIRMACIÓN DE CANJE DE CUPÓN)
          ========================================================================= */}
      {redeemConfirmCoupon && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-in fade-in">
          <div className="nl-profile-modal-window w-full max-w-md bg-[#ece9d8] border-2 border-blue-900 shadow-2xl winxp-bevel-out">
            {/* Barra de Título Windows XP Luna */}
            <div
              style={{
                background: 'linear-gradient(180deg, #0058ee 0%, #288eff 25%, #0055ea 75%, #003db3 100%)'
              }}
              className="winxp-titlebar flex items-center justify-between px-2 py-1 select-none text-white"
            >
              <div className="winxp-titlebar-title flex items-center gap-1.5 text-xs text-white font-bold">
                <HelpCircle className="w-3.5 h-3.5 text-yellow-300" />
                <span>Confirmar_Canje_Cupon.exe - [NoLimits Rewards OS]</span>
              </div>
              <button
                type="button"
                onClick={() => setRedeemConfirmCoupon(null)}
                className="winxp-btn-ctrl winxp-btn-close w-4 h-4 text-[10px] font-bold text-white flex items-center justify-center cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Contenido de la Ventanita: ¿Estás seguro? */}
            <div className="p-4 space-y-3.5 bg-white text-xs text-gray-800">
              <div className="p-3 bg-blue-50 border-2 border-blue-400 rounded-xs flex items-start gap-3 winxp-bevel-in">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                    border: '2px solid #1e40af'
                  }}
                >
                  <HelpCircle className="w-6 h-6 text-yellow-300 stroke-[2.5]" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-black text-blue-950 text-base tracking-tight">
                    ¿Estás seguro?
                  </div>
                  <p className="text-xs text-gray-700 leading-snug">
                    ¿Deseas canjear tus puntos acumulados por este cupón de descuento oficial?
                  </p>
                </div>
              </div>

              {/* Detalle del Cupón Seleccionado */}
              <div className="p-3 bg-[#fafbfc] border border-gray-300 rounded-xs space-y-2 winxp-bevel-in">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 border rounded-xs shadow-xs"
                    style={{
                      background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                      borderColor: '#075985',
                      color: '#ffffff'
                    }}
                  >
                    {redeemConfirmCoupon.badge || 'EXCLUSIVO'}
                  </span>
                  <span className="text-xs font-black text-red-700 font-mono">
                    -{redeemConfirmCoupon.pointsCost} Puntos
                  </span>
                </div>
                <div>
                  <h5 className="font-bold text-sm text-gray-900">{redeemConfirmCoupon.name}</h5>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {getCouponDiscountDescription(redeemConfirmCoupon)}
                  </p>
                  <div className="text-[10px] text-gray-500 font-mono mt-1 space-y-0.5">
                    <div>Condición: {getCouponMinPurchaseLabel(redeemConfirmCoupon.minPurchase)}</div>
                    <div className="text-purple-900 font-bold">
                      Se generará un código único de 1 solo uso ({redeemConfirmCoupon.code}-XP-XXXX) válido por {redeemConfirmCoupon.expirationDays} días.
                    </div>
                  </div>
                </div>
              </div>

              {/* Desglose de Puntos */}
              <div className="p-2.5 bg-yellow-50/80 border border-yellow-300 rounded-xs space-y-1 text-[11px]">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Tu saldo actual de puntos:</span>
                  <strong className="text-gray-900 font-mono">{currentUser.loyaltyPoints || 0} pts</strong>
                </div>
                <div className="flex justify-between items-center text-red-700 font-semibold">
                  <span>Puntos que se descontarán:</span>
                  <strong className="font-mono">-{redeemConfirmCoupon.pointsCost} pts</strong>
                </div>
                <div className="border-t border-yellow-200 pt-1 flex justify-between items-center text-blue-950 font-bold">
                  <span>Saldo restante tras el canje:</span>
                  <strong className="font-mono text-emerald-800">
                    {Math.max(0, (currentUser.loyaltyPoints || 0) - redeemConfirmCoupon.pointsCost)} pts
                  </strong>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setRedeemConfirmCoupon(null)}
                  className="winxp-button text-xs py-1.5 px-4 text-gray-700 cursor-pointer hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRedeem}
                  style={{
                    background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                    borderColor: '#14532d',
                    color: '#ffffff'
                  }}
                  className="winxp-button text-xs py-1.5 px-4 font-bold cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#ffffff' }} />
                  <span style={{ color: '#ffffff' }}>Sí, Canjear Cupón</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VENTANITA MODAL: HORARIOS DE RETIRO DE SUCURSALES DISPONIBLES
          ========================================================================= */}
      {isPickupScheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setIsPickupScheduleModalOpen(false)}
        >
          <div
            className="nl-profile-modal-window w-full max-w-3xl bg-[#ece9d8] border-2 border-blue-900 shadow-2xl winxp-bevel-out max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra de Título Windows XP */}
            <div
              style={{
                background: 'linear-gradient(180deg, #0058ee 0%, #288eff 25%, #0055ea 75%, #003db3 100%)'
              }}
              className="winxp-titlebar flex items-center justify-between px-2.5 py-1.5 select-none text-white shrink-0"
            >
              <div className="winxp-titlebar-title flex items-center gap-1.5 text-xs text-white font-bold">
                <Clock className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                <span>Horarios_Retiro_Sucursales.exe - [Sucursales Disponibles]</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPickupScheduleModalOpen(false)}
                className="winxp-btn-ctrl winxp-btn-close w-4 h-4 text-[10px] font-bold text-white flex items-center justify-center cursor-pointer"
                title="Cerrar ventana"
              >
                ×
              </button>
            </div>

            {/* Contenido de la Ventanita */}
            <div className="p-4 space-y-3.5 bg-white text-xs text-gray-800 overflow-y-auto">
              {/* Banner Informativo */}
              <div className="p-3 bg-blue-50 border border-blue-300 rounded-xs flex items-start gap-2.5 winxp-bevel-in">
                <div className="p-1.5 bg-blue-100 border border-blue-400 text-blue-800 rounded-xs shrink-0 mt-0.5">
                  <Store className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-blue-950 text-xs">
                    Horarios Oficiales de Retiro en Sucursales Físicas NoLimits
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Presenta tu cédula de identidad y el número de orden o ticket de devolución en cualquiera de nuestras sucursales habilitadas en la V Región.
                  </p>
                </div>
              </div>

              {/* Grilla con las Sucursales Disponibles Sincronizadas */}
              <div className="nl-profile-branches-grid grid grid-cols-1 md:grid-cols-3 gap-3">
                {liveBranchSchedules.map((branch) => (
                  <div
                    key={branch.id}
                    className="p-3 bg-[#fafbfc] border-2 border-gray-300 rounded-xs space-y-2.5 winxp-bevel-out flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      {/* Insignia y Ciudad */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-900 px-2 py-0.5 border border-blue-400">
                          {branch.badge}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-gray-600">
                          {branch.city}
                        </span>
                      </div>

                      <h6 className="font-bold text-xs text-gray-900 leading-snug">
                        {branch.name}
                      </h6>

                      <div className="text-[11px] text-gray-600 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                        <span>{branch.address}</span>
                      </div>

                      {/* Tabla de Horarios de Retiro */}
                      <div className="p-2 bg-white border border-gray-300 text-[11px] space-y-1 winxp-bevel-in">
                        <div className="font-bold text-blue-950 flex items-center gap-1 border-b border-gray-200 pb-1">
                          <Clock className="w-3 h-3 text-blue-700 shrink-0" />
                          <span>Horario de Retiro:</span>
                        </div>
                        {(branch.scheduleBlocks && branch.scheduleBlocks.length > 0
                          ? branch.scheduleBlocks
                          : getBranchScheduleBlocks(branch)
                        ).map((blk) => {
                          const isClosedRow = blk.isClosed || /cerrado/i.test(blk.hoursText);
                          return (
                            <div
                              key={blk.id}
                              className={`flex justify-between gap-1 ${
                                isClosedRow ? 'text-gray-500' : 'text-gray-700'
                              }`}
                            >
                              <span>{blk.dayLabel.replace(/:$/, '')}:</span>
                              {isClosedRow ? (
                                <span className="italic text-right">{blk.hoursText || 'Cerrado'}</span>
                              ) : (
                                <strong className="text-gray-900 text-right">{blk.hoursText}</strong>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Contacto */}
                      <div className="text-[11px] text-gray-600 space-y-0.5 pt-0.5">
                        <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
                          <Phone className="w-3 h-3 text-blue-700 shrink-0" />
                          <span>WhatsApp: {branch.whatsapp}</span>
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Encargado: {branch.leadContact}
                        </div>
                      </div>
                    </div>

                    {/* Protocolo de retiro */}
                    <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-600 bg-gray-50 p-1.5 border border-gray-200">
                      <strong className="text-gray-800">Importante:</strong> {branch.returnInstructions}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pie de la Ventanita */}
              <div className="pt-2 flex items-center justify-end border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setIsPickupScheduleModalOpen(false)}
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 cursor-pointer shadow-sm"
                >
                  Cerrar Ventana
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
