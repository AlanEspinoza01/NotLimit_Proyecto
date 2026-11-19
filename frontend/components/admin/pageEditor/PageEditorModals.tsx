import React from 'react';
import {
  Star,
  Ticket,
  Plus,
  Trash2,
  RefreshCw,
  Percent,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  History,
  Upload,
  Award
} from 'lucide-react';
import { Review } from '../../../types';
import { RedeemedUserCoupon } from '../../../services/couponsService';
import { ShippingCourierId } from '../../../services/shippingQuotesEngine';
import {
  SliderItem,
  CouponItem,
  ShippingRatesMatrix,
  ShippingMatrixSnapshot,
  formatCLP,
  getCourierDisplayName,
  getReviewProductInfo,
  getReviewUserEmail
} from './pageEditorTypes';

interface PageEditorModalsProps {
  // 1. Slide Modal
  editingSlide: SliderItem | null;
  setEditingSlide: (slide: SliderItem | null) => void;
  isNewSlide: boolean;
  slideTitle: string;
  setSlideTitle: (title: string) => void;
  slideImageUrl: string;
  slideImageFileName: string;
  slideTag: string;
  setSlideTag: (tag: string) => void;
  handleLocalSlideImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveSlideModal: (e: React.FormEvent) => void;

  // 2. Review Detail Modal
  selectedReviewDetail: Review | null;
  setSelectedReviewDetail: (rev: Review | null) => void;
  handleOpenAddReviewModal: (rev: Review, initialType?: 'preferencial' | 'negra') => void;
  handleRequestDeleteReview: (rev: Review) => void;

  // 3. Add Review Record Modal
  isAddReviewModalOpen: boolean;
  setIsAddReviewModalOpen: (open: boolean) => void;
  targetReviewForRecord: Review | null;
  setTargetReviewForRecord: (rev: Review | null) => void;
  recordListType: 'preferencial' | 'negra';
  setRecordListType: (type: 'preferencial' | 'negra') => void;
  recordReason: string;
  setRecordReason: (reason: string) => void;
  recordBenefit: string;
  setRecordBenefit: (benefit: string) => void;
  recordDebtAmount: string;
  setRecordDebtAmount: (debt: string) => void;
  recordNotes: string;
  setRecordNotes: (notes: string) => void;
  handleCreateReviewRecord: (e: React.FormEvent) => void;

  // 4. Delete Review Confirm Modal
  reviewToDelete: Review | null;
  setReviewToDelete: (rev: Review | null) => void;
  handleConfirmDeleteReview: () => void;

  // 5. Coupon Create/Edit Modal
  couponModalOpen: boolean;
  setCouponModalOpen: (open: boolean) => void;
  editingCouponId: string | null;
  couponName: string;
  setCouponName: (name: string) => void;
  couponBadge: string;
  setCouponBadge: (badge: string) => void;
  couponPointsCost: number | '';
  setCouponPointsCost: (pts: number | '') => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
  couponDiscountType: 'percentage' | 'fixed' | 'free_shipping';
  setCouponDiscountType: (type: 'percentage' | 'fixed' | 'free_shipping') => void;
  couponDiscountValue: number | '';
  setCouponDiscountValue: (val: number | '') => void;
  couponExpirationRule: string;
  setCouponExpirationRule: (rule: string) => void;
  couponMinPurchase: number | '';
  setCouponMinPurchase: (min: number | '') => void;
  couponMaxUses: number | '';
  setCouponMaxUses: (max: number | '') => void;
  generateUniqueCouponCode: () => void;
  handleSuggestPointsByRule: () => void;
  handleSaveCoupon: (e: React.FormEvent) => void;

  // 6. Redeemed Coupons History Modal
  selectedCouponForHistory: CouponItem | 'ALL' | null;
  setSelectedCouponForHistory: (coup: CouponItem | 'ALL' | null) => void;
  redeemedCouponsLog: RedeemedUserCoupon[];

  // 7. Delete Coupon Confirm Modal
  couponToDelete: CouponItem | null;
  setCouponToDelete: (coup: CouponItem | null) => void;
  handleConfirmDeleteCoupon: () => void;

  // 8. Inflation Confirm Modal
  isInflationConfirmOpen: boolean;
  setIsInflationConfirmOpen: (open: boolean) => void;
  inflationRate: number | '';
  inflationScope: 'all' | 'starken' | 'blue_express' | 'paket' | 'region';
  selectedShippingRegion: string;
  selectedCourier: ShippingCourierId;
  currentRegionCities: string[];
  shippingRatesMatrix: ShippingRatesMatrix;
  handleConfirmApplyInflationRate: () => void;

  // 9. Shipping History & Factory Reset Modals
  isShippingHistoryOpen: boolean;
  setIsShippingHistoryOpen: (open: boolean) => void;
  shippingHistory: ShippingMatrixSnapshot[];
  handleRestoreSnapshot: (snap: ShippingMatrixSnapshot) => void;
  isResetFactoryConfirmOpen: boolean;
  setIsResetFactoryConfirmOpen: (open: boolean) => void;
  handleConfirmResetFactoryRates: () => void;
}

export const PageEditorModals: React.FC<PageEditorModalsProps> = ({
  editingSlide,
  setEditingSlide,
  isNewSlide,
  slideTitle,
  setSlideTitle,
  slideImageUrl,
  slideImageFileName,
  slideTag,
  setSlideTag,
  handleLocalSlideImageUpload,
  handleSaveSlideModal,
  selectedReviewDetail,
  setSelectedReviewDetail,
  handleOpenAddReviewModal,
  handleRequestDeleteReview,
  isAddReviewModalOpen,
  setIsAddReviewModalOpen,
  targetReviewForRecord,
  setTargetReviewForRecord,
  recordListType,
  setRecordListType,
  recordReason,
  setRecordReason,
  recordBenefit,
  setRecordBenefit,
  recordDebtAmount,
  setRecordDebtAmount,
  recordNotes,
  setRecordNotes,
  handleCreateReviewRecord,
  reviewToDelete,
  setReviewToDelete,
  handleConfirmDeleteReview,
  couponModalOpen,
  setCouponModalOpen,
  editingCouponId,
  couponName,
  setCouponName,
  couponBadge,
  setCouponBadge,
  couponPointsCost,
  setCouponPointsCost,
  couponCode,
  setCouponCode,
  couponDiscountType,
  setCouponDiscountType,
  couponDiscountValue,
  setCouponDiscountValue,
  couponExpirationRule,
  setCouponExpirationRule,
  couponMinPurchase,
  setCouponMinPurchase,
  couponMaxUses,
  setCouponMaxUses,
  generateUniqueCouponCode,
  handleSuggestPointsByRule,
  handleSaveCoupon,
  selectedCouponForHistory,
  setSelectedCouponForHistory,
  redeemedCouponsLog,
  couponToDelete,
  setCouponToDelete,
  handleConfirmDeleteCoupon,
  isInflationConfirmOpen,
  setIsInflationConfirmOpen,
  inflationRate,
  inflationScope,
  selectedShippingRegion,
  selectedCourier,
  currentRegionCities,
  shippingRatesMatrix,
  handleConfirmApplyInflationRate,
  isShippingHistoryOpen,
  setIsShippingHistoryOpen,
  shippingHistory,
  handleRestoreSnapshot,
  isResetFactoryConfirmOpen,
  setIsResetFactoryConfirmOpen,
  handleConfirmResetFactoryRates
}) => {
  return (
    <>
      {/* ============================================================== */}
      {/* MODAL: EDITAR / CREAR SLIDE DEL SLIDER                        */}
      {/* ============================================================== */}
      {editingSlide && (
        <div className="nl-page-editor-modal-backdrop z-50">
          <div className="nl-page-editor-modal-window max-w-lg bg-white border-4 border-[#003c74] shadow-2xl animate-fadeIn">
            <div className="bg-gradient-to-r from-[#0055ea] to-[#003c74] p-2 px-3 flex items-center justify-between text-white text-xs font-bold sticky top-0 z-10">
              <span>{isNewSlide ? 'AGREGAR NUEVA SLIDE AL SLIDER' : 'EDITAR SLIDE DEL SLIDER'}</span>
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="w-5 h-5 bg-[#c75050] text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlideModal} className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-800 block">Texto Descriptivo (Título del Slide):</label>
                <input
                  type="text"
                  required
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  className="w-full winxp-input text-xs py-1.5 font-bold uppercase"
                  placeholder="Ej: NEW DROP CYBER-GOTHIC 2026 // COLECCIÓN LIMITADA"
                />
              </div>

              {/* Subir imagen local desde el equipo (Sin URL) */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800 block">
                  Subir Imagen desde tu Equipo Local: <span className="text-red-600">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2 bg-[#f8fafc] border border-gray-300">
                  <label className="winxp-button text-xs py-1.5 px-3 font-bold text-blue-900 flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 text-blue-700" />
                    <span>Seleccionar archivo del equipo...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLocalSlideImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-gray-600 font-mono truncate">
                    {slideImageFileName
                      ? `Archivo: ${slideImageFileName}`
                      : slideImageUrl
                      ? 'Imagen cargada lista'
                      : 'Ningún archivo seleccionado'}
                  </span>
                </div>
              </div>

              {/* Preview de la imagen en proporción exacta 1765x705 */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-gray-600 font-semibold">
                  <span>Vista previa del cuadro del Slider:</span>
                  <span className="font-mono font-bold text-[#003c74]">Dimensiones: 1765 × 705 px</span>
                </div>
                <div className="aspect-[1765/705] w-full bg-[#060a12] overflow-hidden border border-gray-400 relative flex items-center justify-center">
                  {slideImageUrl ? (
                    <img
                      src={slideImageUrl}
                      alt="Preview"
                      className="w-full h-full object-fill"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs flex flex-col items-center gap-1 p-2 text-center">
                      <ImageIcon className="w-6 h-6 text-gray-500" />
                      <span>Selecciona una imagen (1765×705) desde tu equipo para previsualizar</span>
                    </div>
                  )}
                  {slideTag && (
                    <span
                      data-force-white="true"
                      className="absolute bottom-2 right-2 z-[2] bg-red-600 text-white text-[10px] px-2 py-0.5 font-black"
                    >
                      {slideTag}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-800 block">Etiqueta Destacada (Opcional):</label>
                <input
                  type="text"
                  value={slideTag}
                  onChange={(e) => setSlideTag(e.target.value)}
                  className="w-full winxp-input text-xs py-1"
                  placeholder="Ej: DROP EXCLUSIVO"
                />
              </div>

              <div className="pt-2 border-t border-gray-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="winxp-button text-xs py-1 px-3 text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="winxp-button winxp-button-primary text-xs py-1 px-4 font-bold text-white bg-blue-700"
                >
                  Guardar Diapositiva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DETALLE COMPLETO DE LA RESEÑA AL HACER CLICK            */}
      {/* ============================================================== */}
      {selectedReviewDetail && (() => {
        const detailProd = getReviewProductInfo(selectedReviewDetail);
        const detailEmail = getReviewUserEmail(selectedReviewDetail);
        return (
          <div
            className="nl-page-editor-modal-backdrop z-50"
            onClick={() => setSelectedReviewDetail(null)}
          >
            <div
              className="nl-page-editor-review-detail-window bg-[#ece9d8] border-4 border-[#003c74] shadow-2xl animate-fadeIn overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra de título Windows XP */}
              <div className="bg-gradient-to-r from-[#0055ea] to-[#003c74] p-2 px-3 flex items-center justify-between text-white text-xs font-bold shrink-0">
                <span className="flex items-center gap-1.5">
                  <Star
                    className="w-4 h-4 fill-amber-300 shrink-0"
                    stroke="#000000"
                    strokeWidth={1.5}
                  />
                  <span>DETALLE DE RESEÑA DE CLIENTE // ID: {selectedReviewDetail.id.toUpperCase()}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedReviewDetail(null)}
                  className="w-5 h-5 bg-[#c75050] text-white flex items-center justify-center font-bold cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs flex-1 overflow-y-auto bg-white m-1.5 border border-gray-400">
                {/* Cabecera Producto + Cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#f8fafc] border border-gray-300 p-3">
                  {/* Datos del Producto */}
                  <div className="flex items-center gap-3 border-b sm:border-b-0 sm:border-r border-gray-200 pb-2 sm:pb-0 sm:pr-3">
                    <img
                      src={detailProd.image}
                      alt={detailProd.title}
                      className="w-16 h-16 object-cover border border-gray-400 shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] font-bold uppercase text-blue-800 block">
                        Producto Reseñado
                      </span>
                      <div className="font-extrabold text-xs text-gray-950 truncate">
                        {detailProd.title}
                      </div>
                      <div className="text-[11px] font-mono text-gray-600">
                        SKU: {detailProd.sku} · {formatCLP(detailProd.price)}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Categoría: {detailProd.category}
                      </div>
                    </div>
                  </div>

                  {/* Datos del Autor de la Reseña */}
                  <div className="space-y-1 pl-0 sm:pl-1">
                    <span className="text-[10px] font-bold uppercase text-blue-800 block">
                      Autor del Comentario
                    </span>
                    <div className="font-black text-sm text-gray-950 flex items-center gap-2 flex-wrap">
                      <span>{selectedReviewDetail.userName}</span>
                      {selectedReviewDetail.verifiedPurchase && (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded-xs">
                          ✓ COMPRA VERIFICADA
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 inline-block">
                      {detailEmail}
                    </div>
                    <div className="text-[11px] text-gray-600 font-mono pt-0.5">
                      Fecha de publicación: <strong>{selectedReviewDetail.date}</strong>
                    </div>
                  </div>
                </div>

                {/* Calificación y Evaluación */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/70 border border-amber-200 p-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-amber-950">Calificación Otorgada:</span>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          stroke="#000000"
                          strokeWidth={1.4}
                          className={`w-4 h-4 ${
                            i < selectedReviewDetail.rating
                              ? 'fill-amber-400'
                              : 'fill-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-black text-amber-900">
                      ({selectedReviewDetail.rating} de 5 Estrellas)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-600">
                    Valoraciones útiles: {selectedReviewDetail.likes || 0}
                  </span>
                </div>

                {/* Contenido detallado del comentario */}
                <div className="space-y-1.5 bg-[#f8fafc] border border-gray-300 p-3">
                  <div className="text-[10px] font-bold uppercase text-gray-500">
                    Título y Comentario Completo de la Reseña:
                  </div>
                  <div className="font-extrabold text-sm text-[#003c74]">
                    "{selectedReviewDetail.title}"
                  </div>
                  <div className="text-gray-900 leading-relaxed bg-white p-3 border border-gray-200 text-xs whitespace-pre-line">
                    {selectedReviewDetail.comment}
                  </div>
                </div>

                {/* Fotografías adjuntas en vista ampliada */}
                {selectedReviewDetail.photos && selectedReviewDetail.photos.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-bold text-gray-800 text-[11px]">
                      Fotografías Adjuntas por el Cliente ({selectedReviewDetail.photos.length}):
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedReviewDetail.photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Evidencia reseña ${idx + 1}`}
                          className="w-36 h-36 object-cover border-2 border-gray-400 shadow-xs"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Historial de Registros Asociados a este Comentario */}
                <div className="space-y-2 border-t border-gray-200 pt-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-xs text-emerald-950 uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        Registros de Lista Preferencial / Lista Negra ({selectedReviewDetail.records?.length || 0})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAddReviewModal(selectedReviewDetail)}
                      className="winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1 text-emerald-950"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Añadir Registro</span>
                    </button>
                  </div>

                  {!selectedReviewDetail.records || selectedReviewDetail.records.length === 0 ? (
                    <div className="p-3 bg-gray-50 border border-gray-200 text-gray-500 text-center text-[11px]">
                      No hay registros de Lista Preferencial ni Lista Negra asociados a este cliente todavía.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedReviewDetail.records.map((rec) => {
                        const isNegra = rec.listType === 'negra';
                        return (
                          <div
                            key={rec.id}
                            className={`border p-2.5 space-y-1 ${
                              isNegra
                                ? 'bg-rose-50/70 border-rose-300'
                                : 'bg-amber-50/70 border-amber-300'
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
                              <span className="font-mono text-[10px] text-gray-600">
                                {rec.date} · {rec.adminName}
                              </span>
                            </div>
                            <p className="text-gray-800">{rec.note}</p>
                            {rec.benefit && (
                              <div className="text-[11px] font-bold text-amber-900">
                                Beneficio Otorgado: {rec.benefit}
                              </div>
                            )}
                            {rec.debtAmount !== undefined && (
                              <div className="text-[11px] font-bold text-rose-800">
                                Deuda Impaga Registrada: {formatCLP(rec.debtAmount)}
                              </div>
                            )}
                            {rec.notes && (
                              <div className="text-[11px] text-gray-600 italic">
                                Observación: {rec.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pie de ventana detallada */}
                <div className="pt-3 border-t border-gray-300 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleRequestDeleteReview(selectedReviewDetail)}
                    className="winxp-button text-xs py-1 px-3 text-red-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Eliminar Reseña</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedReviewDetail(null)}
                    className="winxp-button winxp-button-primary text-xs py-1 px-4 font-bold text-white bg-blue-700"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* MODAL: AÑADIR REGISTRO (LISTA PREFERENCIAL O LISTA NEGRA)      */}
      {/* ============================================================== */}
      {isAddReviewModalOpen && targetReviewForRecord && (
        <div className="nl-page-editor-modal-backdrop z-50">
          <div className="nl-page-editor-modal-window max-w-lg bg-white border-4 border-[#003c74] shadow-2xl animate-fadeIn">
            <div className="bg-gradient-to-r from-[#0055ea] to-[#003c74] p-2 px-3 flex items-center justify-between text-white text-xs font-bold sticky top-0 z-10">
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>AÑADIR REGISTRO DE CLIENTE // {targetReviewForRecord.userName.toUpperCase()}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddReviewModalOpen(false);
                  setTargetReviewForRecord(null);
                }}
                className="w-5 h-5 bg-[#c75050] text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReviewRecord} className="p-4 space-y-3 text-xs">
              {/* Resumen del Cliente de la Reseña */}
              <div className="bg-[#f8fafc] border border-gray-300 p-2.5 space-y-1">
                <div className="font-bold text-gray-900 flex flex-wrap items-center justify-between gap-1">
                  <span>Cliente: {targetReviewForRecord.userName}</span>
                  <span className="font-mono text-[11px] text-blue-900">
                    {getReviewUserEmail(targetReviewForRecord)}
                  </span>
                </div>
                <div className="text-[11px] text-[#003c74] font-semibold">
                  Producto reseñado: {getReviewProductInfo(targetReviewForRecord).title}
                </div>
                <div className="text-[11px] text-gray-600 italic truncate">
                  "{targetReviewForRecord.title}" — {targetReviewForRecord.comment}
                </div>
              </div>

              {/* Selección de Lista: Lista Preferencial o Lista Negra */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-800 block">
                  Seleccionar Tipo de Registro para el Cliente: <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecordListType('preferencial')}
                    className={`p-2.5 border-2 text-left rounded-xs transition-all flex items-center gap-2 cursor-pointer ${
                      recordListType === 'preferencial'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300 shadow-xs'
                        : 'bg-white border-gray-300 hover:bg-amber-50/40 text-gray-600'
                    }`}
                  >
                    <Star
                      stroke="#000000"
                      strokeWidth={1.5}
                      className={`w-4 h-4 shrink-0 ${
                        recordListType === 'preferencial' ? 'fill-amber-400' : 'fill-gray-200'
                      }`}
                    />
                    <div>
                      <div className="font-black text-xs text-amber-950">Lista Preferencial</div>
                      <div className="text-[10px] text-gray-500">Buen comportamiento / VIP</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordListType('negra')}
                    className={`p-2.5 border-2 text-left rounded-xs transition-all flex items-center gap-2 cursor-pointer ${
                      recordListType === 'negra'
                        ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-300 shadow-xs'
                        : 'bg-white border-gray-300 hover:bg-rose-50/40 text-gray-600'
                    }`}
                  >
                    <ShieldAlert
                      className={`w-4 h-4 shrink-0 ${
                        recordListType === 'negra' ? 'text-rose-600' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <div className="font-black text-xs text-rose-950">Lista Negra</div>
                      <div className="text-[10px] text-gray-500">Mal comportamiento / Deuda</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Campos dinámicos según Lista Preferencial o Lista Negra */}
              {recordListType === 'preferencial' ? (
                <div className="space-y-2.5 bg-amber-50/60 p-3 border border-amber-200 rounded-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-amber-950 block">
                      Motivo / Causa del Buen Comportamiento: <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={recordReason}
                      onChange={(e) => setRecordReason(e.target.value)}
                      className="w-full winxp-input text-xs p-2 bg-white border border-[#7f9db9]"
                      placeholder="Ej: Excelente reseña verificada, cliente VIP frecuente y puntual en retiros..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-800 block">
                      Beneficio Otorgado: <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={recordBenefit}
                      onChange={(e) => setRecordBenefit(e.target.value)}
                      className="w-full winxp-input text-xs py-1 bg-white border border-[#7f9db9]"
                      placeholder="Ej: 15% Descuento Permanente, +100 Puntos Club, Regalo exclusivo"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-800 block">
                      Observaciones / Instrucciones: <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={recordNotes}
                      onChange={(e) => setRecordNotes(e.target.value)}
                      className="w-full winxp-input text-xs py-1 bg-white border border-[#7f9db9]"
                      placeholder="Ej: Atención prioritaria en sucursales"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 bg-rose-50/60 p-3 border border-rose-200 rounded-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-rose-950 block">
                      Motivo / Causa del Mal Comportamiento: <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={recordReason}
                      onChange={(e) => setRecordReason(e.target.value)}
                      className="w-full winxp-input text-xs p-2 bg-white border border-[#7f9db9]"
                      placeholder="Ej: Lenguaje ofensivo reiterado, comprobante falso o bloqueo de stock..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-800 block">
                      Deuda Impaga Registrada ($ CLP): <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-gray-500">$</span>
                      <input
                        type="text"
                        value={recordDebtAmount}
                        onChange={(e) => {
                          const num = e.target.value.replace(/[^0-9]/g, '');
                          setRecordDebtAmount(num ? parseInt(num, 10).toLocaleString('es-CL') : '');
                        }}
                        className="w-full winxp-input pl-7 text-xs py-1 font-bold text-rose-800 bg-white border border-[#7f9db9]"
                        placeholder="Ej: 38.990"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-800 block">
                      Instrucción / Observación de Seguridad: <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={recordNotes}
                      onChange={(e) => setRecordNotes(e.target.value)}
                      className="w-full winxp-input text-xs py-1 bg-white border border-[#7f9db9]"
                      placeholder="Ej: No permitir reservas manuales sin pago Webpay confirmado"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-gray-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddReviewModalOpen(false);
                    setTargetReviewForRecord(null);
                  }}
                  className="winxp-button text-xs py-1 px-3 text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`winxp-button winxp-button-primary text-xs py-1.5 px-4 font-black text-white flex items-center gap-1.5 ${
                    recordListType === 'preferencial'
                      ? 'bg-amber-600 hover:bg-amber-700 border-amber-800'
                      : 'bg-rose-700 hover:bg-rose-800 border-rose-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {recordListType === 'preferencial'
                      ? 'Añadir a Lista Preferencial'
                      : 'Añadir a Lista Negra'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE CONFIRMACIÓN "¿ESTÁS SEGURO?" AL ELIMINAR RESEÑA      */}
      {/* ============================================================== */}
      {reviewToDelete && (
        <div
          className="nl-page-editor-modal-backdrop z-[60]"
          onClick={() => setReviewToDelete(null)}
        >
          <div
            className="nl-page-editor-modal-window max-w-md bg-[#ece9d8] border-4 border-[#003c74] shadow-2xl animate-fadeIn overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#c75050] to-[#8b0000] p-2 px-3 flex items-center justify-between text-white text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-yellow-300" />
                <span>CONFIRMAR ELIMINACIÓN // ¿ESTÁS SEGURO?</span>
              </span>
              <button
                type="button"
                onClick={() => setReviewToDelete(null)}
                className="w-5 h-5 bg-[#c75050] border border-white/40 text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs bg-white m-1.5 border border-gray-400">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xs bg-rose-100 border border-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-700" />
                </div>
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-gray-950">
                    ¿Estás seguro de que deseas eliminar esta reseña?
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Se eliminará permanentemente el comentario de{' '}
                    <strong>{reviewToDelete.userName}</strong> ({getReviewUserEmail(reviewToDelete)}) sobre el producto{' '}
                    <strong className="text-[#003c74]">
                      {getReviewProductInfo(reviewToDelete).title}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              <div className="bg-[#f8fafc] border border-gray-300 p-2.5 text-[11px] text-gray-700 italic">
                "{reviewToDelete.title}" — {reviewToDelete.comment}
              </div>

              <div className="pt-2 border-t border-gray-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewToDelete(null)}
                  className="winxp-button text-xs py-1 px-3.5 font-bold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteReview}
                  className="winxp-button text-xs py-1 px-4 font-black text-white bg-red-700 hover:bg-red-800 border-red-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span>Sí, Eliminar Reseña</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREAR / EDITAR CUPÓN EXCLUSIVO                          */}
      {/* ============================================================== */}
      {couponModalOpen && (
        <div className="nl-page-editor-modal-backdrop z-50">
          <div className="nl-page-editor-modal-window max-w-lg bg-white border-4 border-purple-800 shadow-2xl animate-fadeIn">
            <div className="bg-gradient-to-r from-purple-700 to-purple-950 p-2 px-3 flex items-center justify-between text-white text-xs font-bold sticky top-0 z-10">
              <span className="flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-purple-200" />
                <span>
                  {editingCouponId
                    ? 'EDITAR CUPÓN CANJEABLE POR PUNTOS'
                    : 'CREAR NUEVO CUPÓN CANJEABLE POR PUNTOS'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setCouponModalOpen(false)}
                className="w-5 h-5 bg-[#c75050] text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-4 space-y-3 text-xs">
              {/* Nombre del Cupón y Etiqueta Visual */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-gray-800 block">
                    Nombre del Cupón (Visible en Perfil): <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Cupón $5.000 CLP de Descuento"
                    value={couponName}
                    onChange={(e) => setCouponName(e.target.value)}
                    className="w-full winxp-input text-xs py-1.5 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-800 block">Etiqueta Destacada:</label>
                  <select
                    value={couponBadge}
                    onChange={(e) => setCouponBadge(e.target.value)}
                    className="w-full winxp-select text-xs py-1.5 font-bold border border-black"
                  >
                    <option value="POPULAR">POPULAR</option>
                    <option value="MÁS CANJEADO">MÁS CANJEADO</option>
                    <option value="PREMIO MAYOR">PREMIO MAYOR</option>
                    <option value="AHORRO ENVÍO">AHORRO ENVÍO</option>
                    <option value="CLUB Y2K">CLUB Y2K</option>
                    <option value="EXCLUSIVO VIP">EXCLUSIVO VIP</option>
                  </select>
                </div>
              </div>

              {/* Tipo de Descuento: Porcentaje vs Monto Fijo vs Envío Gratis */}
              <div className="p-3 bg-purple-50 border border-purple-200 space-y-2">
                <label className="font-bold text-purple-950 block">Tipo de Beneficio / Descuento:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCouponDiscountType('fixed');
                      if (!couponDiscountValue || Number(couponDiscountValue) <= 100) {
                        setCouponDiscountValue(5000);
                        setCouponPointsCost(500);
                      }
                    }}
                    className={`p-2 border text-center font-bold cursor-pointer ${
                      couponDiscountType === 'fixed'
                        ? 'bg-purple-200 border-purple-600 text-purple-950'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    Monto Fijo ($ CLP)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCouponDiscountType('percentage');
                      if (!couponDiscountValue || Number(couponDiscountValue) > 100) {
                        setCouponDiscountValue(15);
                        setCouponPointsCost(450);
                      }
                    }}
                    className={`p-2 border text-center font-bold cursor-pointer ${
                      couponDiscountType === 'percentage'
                        ? 'bg-purple-200 border-purple-600 text-purple-950'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    Porcentaje (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCouponDiscountType('free_shipping');
                      setCouponDiscountValue(0);
                      setCouponPointsCost(350);
                      setCouponBadge('AHORRO ENVÍO');
                    }}
                    className={`p-2 border text-center font-bold cursor-pointer ${
                      couponDiscountType === 'free_shipping'
                        ? 'bg-purple-200 border-purple-600 text-purple-950'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    Envío Gratis
                  </button>
                </div>

                {couponDiscountType === 'percentage' && (
                  <div className="space-y-1 pt-1">
                    <label className="font-bold text-gray-800 block">
                      Valor del Descuento (%): <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={couponDiscountValue}
                        onChange={(e) =>
                          setCouponDiscountValue(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full winxp-input text-xs py-1.5 font-black text-rose-800 pr-6"
                        placeholder="15"
                      />
                      <span className="absolute right-2 top-1.5 text-xs font-bold text-gray-500">%</span>
                    </div>
                  </div>
                )}

                {couponDiscountType === 'fixed' && (
                  <div className="space-y-1 pt-1">
                    <label className="font-bold text-gray-800 block">
                      Valor del Descuento ($ CLP): <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-gray-500">$</span>
                      <input
                        type="number"
                        min="500"
                        step="500"
                        required
                        value={couponDiscountValue}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setCouponDiscountValue(val);
                          if (typeof val === 'number' && val >= 500) {
                            setCouponPointsCost(Math.round(val / 10));
                          }
                        }}
                        className="w-full winxp-input pl-6 text-xs py-1.5 font-black text-emerald-900"
                        placeholder="5000"
                      />
                    </div>
                  </div>
                )}

                {couponDiscountType === 'free_shipping' && (
                  <div className="p-2 bg-sky-50 border border-sky-200 text-[11px] text-sky-950 font-semibold">
                    ✓ Este cupón descontará el 100% del costo de envío a domicilio en el Carrito / Checkout.
                  </div>
                )}
              </div>

              {/* Costo en Puntos para Canjear (Sincronizado con Puntos Acumulados) */}
              <div className="p-3 bg-amber-50 border border-amber-300 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="font-black text-amber-950 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-700" />
                    <span>Costo de Canje en Puntos: <span className="text-red-600">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestPointsByRule}
                    className="winxp-button text-[10px] py-0.5 px-2 font-bold text-blue-900"
                  >
                    ⚡ Sugerir según regla (1 Pto = $10 CLP)
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      step="10"
                      required
                      value={couponPointsCost}
                      onChange={(e) =>
                        setCouponPointsCost(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full winxp-input text-xs py-1.5 font-mono font-black text-red-700 pr-14"
                      placeholder="500"
                    />
                    <span className="absolute right-2 top-1.5 text-[11px] font-bold text-gray-500">
                      Puntos
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-950 font-semibold bg-white border border-amber-200 p-1.5 text-center">
                    Equivale a{' '}
                    <strong className="font-mono text-emerald-800">
                      {formatCLP((Number(couponPointsCost) || 0) * 10)} CLP
                    </strong>{' '}
                    en puntos de cliente
                  </div>
                </div>
              </div>

              {/* Prefijo Base del Código (Generador de Códigos Únicos de 1 Solo Uso) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800">
                    Prefijo del Código (Generador Único): <span className="text-red-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateUniqueCouponCode}
                    className="winxp-button text-[10px] py-0.5 px-2 text-purple-900 font-bold"
                  >
                    🎲 Generar Prefijo
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full winxp-input text-xs py-1.5 font-mono font-black text-purple-950 uppercase"
                  placeholder="Ej: DROP3K o CYBER5K"
                />
                <div className="text-[10px] text-purple-900 bg-purple-50 border border-purple-200 p-1.5 font-medium">
                  Vista previa de código de cliente al canjear:{' '}
                  <strong className="font-mono bg-white px-1.5 py-0.5 border border-purple-300">
                    {(couponCode || 'NL').toUpperCase().replace(/-XP-\d+$/, '')}-XP-8492
                  </strong>{' '}
                  (Diferente y de 1 solo uso por cada canje).
                </div>
              </div>

              {/* Fecha de Expiración y Límite de Canjes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-gray-800 block">
                    Vigencia después del canjeo:
                  </label>
                  <select
                    value={couponExpirationRule}
                    onChange={(e) => setCouponExpirationRule(e.target.value)}
                    className="w-full winxp-select text-xs py-1.5 font-bold border border-black"
                  >
                    <option value="1 semana de vida tiene después del canjeo">
                      1 semana después del canjeo (7 días)
                    </option>
                    <option value="2 semanas de vida tiene después del canjeo">
                      2 semanas después del canjeo (14 días)
                    </option>
                    <option value="3 semanas de vida tiene después del canjeo">
                      3 semanas después del canjeo (21 días)
                    </option>
                    <option value="4 semanas de vida tiene después del canjeo">
                      4 semanas después del canjeo (28 días)
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-800 block">Mínimo de Compra ($ CLP):</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs font-bold text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={couponMinPurchase}
                      onChange={(e) =>
                        setCouponMinPurchase(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full winxp-input pl-6 text-xs py-1.5 font-bold"
                      placeholder="25000"
                    />
                  </div>
                </div>
              </div>

              {/* Stock / Límite Global de Canjes */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800 block">
                  Cupo / Límite Máximo de Canjes Disponibles:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={couponMaxUses}
                  onChange={(e) =>
                    setCouponMaxUses(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full winxp-input text-xs py-1.5 font-mono font-bold"
                  placeholder="100"
                />
              </div>

              <div className="pt-2 border-t border-gray-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="winxp-button text-xs py-1 px-3 text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="winxp-button winxp-button-primary text-xs py-1 px-4 font-bold text-white bg-purple-700"
                >
                  Guardar Cupón en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: HISTORIAL DE CÓDIGOS ÚNICOS GENERADOS POR CANJE         */}
      {/* ============================================================== */}
      {selectedCouponForHistory && (() => {
        const isAll = selectedCouponForHistory === 'ALL';
        const filteredLogs = isAll
          ? redeemedCouponsLog
          : redeemedCouponsLog.filter(
              (r) =>
                r.templateId === selectedCouponForHistory.id ||
                r.code.startsWith(selectedCouponForHistory.code.split('-')[0])
            );

        return (
          <div
            className="nl-page-editor-modal-backdrop z-50"
            onClick={() => setSelectedCouponForHistory(null)}
          >
            <div
              className="nl-page-editor-modal-window max-w-3xl bg-[#ece9d8] border-4 border-purple-900 shadow-2xl animate-fadeIn overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-purple-700 to-purple-950 p-2 px-3 flex items-center justify-between text-white text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-purple-200" />
                  <span>
                    {isAll
                      ? `REGISTRO GLOBAL DE CÓDIGOS ÚNICOS DE 1 SOLO USO (${filteredLogs.length})`
                      : `CÓDIGOS ÚNICOS GENERADOS PARA: ${selectedCouponForHistory.name.toUpperCase()} (${filteredLogs.length})`}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCouponForHistory(null)}
                  className="w-5 h-5 bg-[#c75050] text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs bg-white m-1.5 border border-gray-400 max-h-[80vh] overflow-y-auto">
                <div className="p-2.5 bg-purple-50 border border-purple-200 text-purple-950 text-[11px]">
                  <strong>Trazabilidad de Códigos Únicos:</strong> Aquí puedes verificar cada código individual generado cuando un usuario canjea sus puntos, su fecha límite de validez y si ya fue <strong>Utilizado</strong> (bloqueado tras 1 uso) o sigue <strong>Disponible</strong>.
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 bg-gray-50 border border-gray-200">
                    Aún no se han generado códigos individuales de usuarios para este cupón.
                  </div>
                ) : (
                  <div className="nl-page-editor-table-scroll border border-gray-300">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300 font-extrabold uppercase text-gray-700">
                          <th className="p-2 border-r border-gray-200">Código Único (1 Uso)</th>
                          <th className="p-2 border-r border-gray-200">Cupón / Beneficio</th>
                          <th className="p-2 border-r border-gray-200">Cliente que Canjeó</th>
                          <th className="p-2 border-r border-gray-200 text-center">Pts Gastados</th>
                          <th className="p-2 border-r border-gray-200">Canjeado / Vence</th>
                          <th className="p-2 text-center">Estado de Uso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="p-2 border-r border-gray-200 font-mono font-black text-purple-950 bg-purple-50/40">
                              {log.code}
                            </td>
                            <td className="p-2 border-r border-gray-200">
                              <div className="font-bold text-gray-900">{log.title}</div>
                              <div className="text-[10px] text-emerald-800 font-bold">
                                Descuento: {log.discount}
                              </div>
                            </td>
                            <td className="p-2 border-r border-gray-200">
                              <div className="font-bold text-gray-900">{log.userName}</div>
                              <div className="font-mono text-[10px] text-blue-900">{log.userEmail}</div>
                            </td>
                            <td className="p-2 border-r border-gray-200 text-center font-mono font-bold text-red-700">
                              -{log.pointsSpent} Pts
                            </td>
                            <td className="p-2 border-r border-gray-200 text-[10px]">
                              <div>Canje: <strong>{log.date}</strong></div>
                              <div className="text-gray-600">Vence: {log.expiresAtLabel}</div>
                            </td>
                            <td className="p-2 text-center">
                              {log.status === 'usado' ? (
                                <div className="space-y-0.5">
                                  <span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-800 border border-gray-400 font-bold rounded-xs text-[10px]">
                                    ✓ UTILIZADO (1/1)
                                  </span>
                                  {log.usedOrderNumber && (
                                    <div className="text-[9px] font-mono text-gray-600">
                                      Orden #{log.usedOrderNumber}
                                    </div>
                                  )}
                                </div>
                              ) : log.status === 'expirado' ? (
                                <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 font-bold rounded-xs text-[10px]">
                                  VENCIDO
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold rounded-xs text-[10px]">
                                  🟢 DISPONIBLE (0/1)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-300 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedCouponForHistory(null)}
                    className="winxp-button winxp-button-primary text-xs py-1 px-4 font-bold text-white bg-purple-700"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE CUPÓN                          */}
      {/* ============================================================== */}
      {couponToDelete && (
        <div
          className="nl-page-editor-modal-backdrop z-50"
          onClick={() => setCouponToDelete(null)}
        >
          <div
            className="nl-page-editor-modal-window max-w-md bg-[#ece9d8] border-4 border-[#003c74] shadow-2xl animate-fadeIn overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#c75050] to-[#8b0000] p-2 px-3 flex items-center justify-between text-white text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-yellow-300" />
                <span>ELIMINAR CUPÓN DEL CATÁLOGO // ¿ESTÁS SEGURO?</span>
              </span>
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                className="w-5 h-5 bg-[#c75050] text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs bg-white m-1.5 border border-gray-400">
              <div className="font-extrabold text-sm text-gray-950">
                ¿Estás seguro de eliminar el cupón "{couponToDelete.name}"?
              </div>
              <p className="text-gray-700 leading-relaxed">
                Este cupón dejará de aparecer en el <strong>Catálogo de Cupones Disponibles para Canje</strong> de los clientes. Los códigos únicos que ya hayan sido canjeados previamente por usuarios seguirán siendo válidos hasta su fecha de vencimiento.
              </p>

              <div className="pt-2 border-t border-gray-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCouponToDelete(null)}
                  className="winxp-button text-xs py-1 px-3 font-bold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCoupon}
                  className="winxp-button text-xs py-1 px-4 font-black text-white bg-red-700 hover:bg-red-800 border-red-900"
                >
                  Sí, Eliminar Cupón
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRMACIÓN Y VISTA PREVIA DE TASA DE INFLACIÓN        */}
      {/* ============================================================== */}
      {isInflationConfirmOpen && (() => {
        const rate = typeof inflationRate === 'number' ? inflationRate : 0;
        const factor = 1 + rate / 100;
        const sampleCities = currentRegionCities.slice(0, 3);
        const previewCourier: ShippingCourierId =
          inflationScope === 'starken' ||
          inflationScope === 'blue_express' ||
          inflationScope === 'paket'
            ? inflationScope
            : selectedCourier;
        const scopeLabel =
          inflationScope === 'all'
            ? 'Todo Chile (Todas las Agencias: Starken, Blue Express y Paket)'
            : inflationScope === 'region'
            ? `Solo ${selectedShippingRegion} en agencia ${getCourierDisplayName(selectedCourier)}`
            : `Solo la Agencia ${getCourierDisplayName(inflationScope)} (Todas las Regiones)`;

        return (
          <div
            className="nl-page-editor-modal-backdrop z-[60]"
            onClick={() => setIsInflationConfirmOpen(false)}
          >
            <div
              className="nl-page-editor-modal-window max-w-xl bg-[#ece9d8] border-4 border-[#003c74] shadow-2xl animate-fadeIn overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#0055ea] to-[#003c74] p-2 px-3 flex items-center justify-between text-white text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-amber-300" />
                  <span>CONFIRMAR REAJUSTE DE TARIFAS // ¿ESTÁS SEGURO?</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsInflationConfirmOpen(false)}
                  className="w-5 h-5 bg-[#c75050] text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs bg-white m-1.5 border border-gray-400">
                <div className="p-3 bg-amber-50 border border-amber-300 space-y-1">
                  <div className="font-black text-amber-950 text-sm">
                    ¿Estás seguro de aplicar un {rate > 0 ? `+${rate}%` : `${rate}%`} de ajuste?
                  </div>
                  <div className="text-gray-800">
                    Alcance seleccionado: <strong className="text-[#003c74]">{scopeLabel}</strong>
                  </div>
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    ✓ Se guardará automáticamente una copia de respaldo de tus precios actuales para que puedas deshacer este cambio con 1 clic si te equivocas.
                  </div>
                </div>

                {/* Tabla de ejemplo Antes vs Después */}
                <div className="space-y-1.5">
                  <div className="font-bold text-gray-800 text-[11px]">
                    Vista Previa de Ejemplo ({selectedShippingRegion} · {getCourierDisplayName(previewCourier)}):
                  </div>
                  <div className="border border-gray-300 nl-page-editor-table-scroll">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                          <th className="p-2 border-r border-gray-200">Ciudad</th>
                          <th className="p-2 border-r border-gray-200 text-center">1-3 KG (Actual)</th>
                          <th className="p-2 border-r border-gray-200 text-center">1-3 KG (Nuevo)</th>
                          <th className="p-2 text-center">3-6 KG (Actual → Nuevo)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sampleCities.map((c) => {
                          const cur13 =
                            shippingRatesMatrix[previewCourier]?.[selectedShippingRegion]?.[c]?.['1KG-3KG'] || 5500;
                          const next13 = Math.max(0, Math.round((cur13 * factor) / 10) * 10);
                          const cur36 =
                            shippingRatesMatrix[previewCourier]?.[selectedShippingRegion]?.[c]?.['3KG-6KG'] || 6800;
                          const next36 = Math.max(0, Math.round((cur36 * factor) / 10) * 10);
                          return (
                            <tr key={c}>
                              <td className="p-2 border-r border-gray-200 font-bold">{c}</td>
                              <td className="p-2 border-r border-gray-200 text-center font-mono text-gray-600">
                                {formatCLP(cur13)}
                              </td>
                              <td className="p-2 border-r border-gray-200 text-center font-mono font-black text-emerald-800 bg-emerald-50/60">
                                {formatCLP(next13)}
                              </td>
                              <td className="p-2 text-center font-mono">
                                {formatCLP(cur36)} → <strong className="text-emerald-800">{formatCLP(next36)}</strong>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-300 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInflationConfirmOpen(false)}
                    className="winxp-button text-xs py-1 px-3.5 font-bold text-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmApplyInflationRate}
                    className="winxp-button winxp-button-primary text-xs py-1 px-4 font-black text-white bg-amber-600 hover:bg-amber-700 border-amber-800"
                  >
                    Sí, Aplicar {rate > 0 ? `+${rate}%` : `${rate}%`} y Guardar Respaldo
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* MODAL: HISTORIAL DE RESPALDOS / PUNTOS DE RESTAURACIÓN         */}
      {/* ============================================================== */}
      {isShippingHistoryOpen && (
        <div
          className="nl-page-editor-modal-backdrop z-[60]"
          onClick={() => setIsShippingHistoryOpen(false)}
        >
          <div
            className="nl-page-editor-modal-window max-w-2xl bg-[#ece9d8] border-4 border-[#003c74] shadow-2xl animate-fadeIn overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#0055ea] to-[#003c74] p-2 px-3 flex items-center justify-between text-white text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-200" />
                <span>HISTORIAL DE RESPALDOS Y RESTAURACIÓN DE TARIFAS DE ENVÍO ({shippingHistory.length} / 100)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsShippingHistoryOpen(false)}
                className="w-5 h-5 bg-[#c75050] text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs bg-white m-1.5 border border-gray-400 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50 border border-blue-200 p-2.5">
                <div className="text-blue-950">
                  <strong>Red de Seguridad Anti-Errores (Capacidad ampliada hasta 100 respaldos):</strong> Cada vez que aplicas un porcentaje o guardas cambios, el sistema guarda una copia exacta de tus precios anteriores para que puedas volver atrás cuando quieras.
                </div>
              </div>

              {shippingHistory.length === 0 ? (
                <div className="p-6 text-center text-gray-500 bg-gray-50 border border-gray-200">
                  Aún no se han registrado puntos de restauración en el historial.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {shippingHistory.map((snap, idx) => {
                    const sampleVina =
                      snap.matrix.starken?.['Región de Valparaíso']?.['Viña del Mar']?.['1KG-3KG'] || 4500;
                    const sampleStgo =
                      snap.matrix.starken?.['Región Metropolitana de Santiago']?.['Santiago Centro']?.['1KG-3KG'] || 5500;
                    return (
                      <div
                        key={snap.id}
                        className="p-2.5 bg-[#f8fafc] border border-gray-300 flex flex-wrap items-center justify-between gap-2 hover:border-blue-400"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-950 flex flex-wrap items-center gap-2">
                            <span className="bg-blue-100 text-blue-900 border border-blue-300 px-1.5 py-0.2 text-[10px] font-mono">
                              Respaldo #{shippingHistory.length - idx}
                            </span>
                            <span>{snap.actionLabel}</span>
                          </div>
                          <div className="text-[11px] font-mono text-gray-500">
                            Fecha: {snap.date} · Ref Starken (1-3KG): Viña {formatCLP(sampleVina)} / Stgo {formatCLP(sampleStgo)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRestoreSnapshot(snap)}
                          className="winxp-button text-xs py-1 px-3 font-bold text-blue-900 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
                          <span>Restaurar esta versión</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-gray-300 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetFactoryConfirmOpen(true)}
                  className="winxp-button text-xs py-1 px-3 text-rose-800 font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-700" />
                  <span>Restablecer Tarifas Oficiales de Fábrica</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShippingHistoryOpen(false)}
                  className="winxp-button winxp-button-primary text-xs py-1 px-4 font-bold text-white bg-blue-700"
                >
                  Cerrar Historial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRMAR RESTABLECER TARIFAS OFICIALES DE FÁBRICA      */}
      {/* ============================================================== */}
      {isResetFactoryConfirmOpen && (
        <div
          className="nl-page-editor-modal-backdrop z-[70]"
          onClick={() => setIsResetFactoryConfirmOpen(false)}
        >
          <div
            className="nl-page-editor-modal-window max-w-md bg-[#ece9d8] border-4 border-[#003c74] shadow-2xl animate-fadeIn overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#c75050] to-[#8b0000] p-2 px-3 flex items-center justify-between text-white text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-yellow-300" />
                <span>RESTABLECER TARIFAS DE FÁBRICA // ¿ESTÁS SEGURO?</span>
              </span>
              <button
                type="button"
                onClick={() => setIsResetFactoryConfirmOpen(false)}
                className="w-5 h-5 bg-[#c75050] text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs bg-white m-1.5 border border-gray-400">
              <div className="font-extrabold text-sm text-gray-950">
                ¿Estás seguro de volver a los precios originales del sistema?
              </div>
              <p className="text-gray-700 leading-relaxed">
                Todas las comunas, regiones y agencias volverán a sus valores originales por defecto. De igual forma, tus valores actuales quedarán guardados en el <strong>Historial de Respaldos</strong> por si deseas recuperarlos después.
              </p>

              <div className="pt-2 border-t border-gray-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetFactoryConfirmOpen(false)}
                  className="winxp-button text-xs py-1 px-3 font-bold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetFactoryRates}
                  className="winxp-button text-xs py-1 px-4 font-black text-white bg-red-700 hover:bg-red-800 border-red-900"
                >
                  Sí, Restablecer Tarifas Originales
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
