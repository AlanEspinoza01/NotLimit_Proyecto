import React from 'react';
import { Eye, Star, Image as ImageIcon, Scale, Trash2 } from 'lucide-react';
import { PixelHeart } from '../../common/PixelIcon';
import { SoldOutCardOverlay } from '../../common/SoldOutState';
import { ProductItemInSale, formatCLP } from './registerSaleTypes';

interface RegisterSalePreviewAndCartProps {
  specialCategory: string;
  section: string;
  category: string;
  subcategory: string;
  images: string[];
  activePreviewImageIndex: number;
  onSelectPreviewImage: (idx: number) => void;
  productTitle: string;
  currentProductTotalUnits: number;
  discountPercent: number | '';
  calculatedOfferPrice: number;
  normalPriceRaw: number;
  weightGrams: number | '';
  categorySupportsSizes: boolean;
  sizesList: Array<{ id: string; size: string; quantity: number }>;
  tags: string[];
  saleProductsList: ProductItemInSale[];
  totalSaleAmount: number;
  onRemoveProductFromSale: (id: string) => void;
}

export const RegisterSalePreviewAndCart: React.FC<RegisterSalePreviewAndCartProps> = ({
  specialCategory,
  section,
  category,
  subcategory,
  images,
  activePreviewImageIndex,
  onSelectPreviewImage,
  productTitle,
  currentProductTotalUnits,
  discountPercent,
  calculatedOfferPrice,
  normalPriceRaw,
  weightGrams,
  categorySupportsSizes,
  sizesList,
  tags,
  saleProductsList,
  totalSaleAmount,
  onRemoveProductFromSale
}) => {
  return (
    <div className="rs-step1-col-right space-y-3">
      <div className="rs-preview-sticky space-y-3">
        {/* Tarjeta de Vista Previa en Vivo */}
        <div className="bg-[#eef3f8] border-2 border-[#003c74] shadow-md">
          <div className="bg-gradient-to-r from-[#0055ea] to-[#003c74] px-3 py-1.5 flex items-center justify-between !text-white text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-300" />
              <span style={{ color: '#ffffff' }} className="!text-white font-bold">
                VISTA PREVIA DE PRENDA (STOREFRONT)
              </span>
            </span>
            <span
              style={{ color: '#ffffff' }}
              className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-xs font-mono !text-white font-bold"
            >
              LIVE PREVIEW
            </span>
          </div>

          <div className="p-4 bg-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1">
              {specialCategory !== 'Ninguna' && (
                <span className="text-xs font-extrabold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                  <span>{specialCategory}</span>
                </span>
              )}
              <span className="text-[11px] font-bold text-gray-500 uppercase">
                {section} // {category} ({subcategory})
              </span>
            </div>

            {/* Foto Principal de la Vista Previa (Sincronizada con el marco 370x506 y Ambient Blur del Catálogo) */}
            <div className="product-card-xp-media relative group border-2 border-[#7f9db9] shadow-xs">
              {images.length > 0 ? (
                <>
                  {/* Fondo Ambient Blur idéntico al catálogo para rellenar el marco 370x506 sin bordes vacíos */}
                  <img
                    src={images[activePreviewImageIndex] || images[0]}
                    alt=""
                    aria-hidden="true"
                    className={`product-card-xp-img-blur ${currentProductTotalUnits <= 0 ? 'grayscale-30 contrast-90' : ''}`}
                  />

                  {/* Imagen principal completa y centrada sin recortarse ni deformarse */}
                  <img
                    src={images[activePreviewImageIndex] || images[0]}
                    alt={productTitle || 'Vista Previa'}
                    className={`product-card-xp-img ${currentProductTotalUnits <= 0 ? 'grayscale-30 contrast-90' : ''}`}
                  />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center relative z-10">
                  <ImageIcon className="w-12 h-12 mb-2 stroke-1" />
                  <span className="text-xs">Sube una imagen para ver cómo se verá en el catálogo</span>
                </div>
              )}

              {/* Overlay oficial de Agotado si el stock total es 0 */}
              {images.length > 0 && currentProductTotalUnits <= 0 && <SoldOutCardOverlay />}

              {/* Badge flotante de Descuento idéntico al catálogo */}
              {typeof discountPercent === 'number' && discountPercent > 0 && currentProductTotalUnits > 0 && (
                <span
                  style={{ color: '#ffffff' }}
                  className="product-card-xp-discount z-10 !text-white"
                >
                  -{discountPercent}% OFF
                </span>
              )}

              {/* Botón simulado de Lista de Deseos como en el catálogo */}
              <div
                className="absolute top-1.5 right-1.5 w-7.5 h-7.5 winxp-button p-0 z-20 flex items-center justify-center shadow-xs border-[#003c74] pointer-events-none"
                aria-hidden="true"
              >
                <PixelHeart filled={false} size={16} />
              </div>

              {/* Contador de fotos con texto blanco puro */}
              {images.length > 1 && (
                <div
                  style={{ color: '#ffffff' }}
                  className="absolute bottom-2 right-2 bg-black/75 !text-white text-[10px] px-2 py-0.5 font-mono font-bold z-20"
                >
                  {activePreviewImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Miniaturas de la vista previa */}
            {images.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectPreviewImage(idx)}
                    className={`w-12 h-12 border-2 shrink-0 ${
                      activePreviewImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-300'
                    }`}
                  >
                    <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Título y Monto */}
            <div>
              <h2 className="text-sm font-black text-gray-950 uppercase line-clamp-2">
                {productTitle || 'Nombre del Producto'}
              </h2>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-black text-emerald-800">
                  {formatCLP(calculatedOfferPrice)} CLP
                </span>
                {typeof discountPercent === 'number' && discountPercent > 0 && (
                  <span className="text-xs line-through text-gray-400 font-bold">
                    {formatCLP(normalPriceRaw)}
                  </span>
                )}
              </div>
            </div>

            {/* Peso */}
            <div className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 border border-gray-200 px-2 py-1">
              <span className="flex items-center gap-1 font-semibold">
                <Scale className="w-3.5 h-3.5 text-indigo-700" />
                <span>Peso:</span>
              </span>
              <span className="font-mono font-bold text-indigo-900">
                {weightGrams ? `${weightGrams} g (${(Number(weightGrams) / 1000).toFixed(2)} kg)` : '0 g'}
              </span>
            </div>

            {/* Tallas y Stock */}
            {categorySupportsSizes && sizesList.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-700 block">Tallas Seleccionadas:</span>
                <div className="flex flex-wrap gap-1">
                  {sizesList.map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-xs font-bold text-gray-900"
                    >
                      {s.size}: <strong>{s.quantity} un.</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Etiquetas */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen de Prendas Acumuladas en esta Venta */}
        {saleProductsList.length > 0 && (
          <div className="bg-white border-2 border-gray-400 p-3 space-y-2 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-1 border-b border-gray-200 pb-1">
              <span className="font-extrabold text-xs text-[#003c74] uppercase">
                Prendas Acumuladas en esta Venta ({saleProductsList.length})
              </span>
              <span className="text-xs font-black text-emerald-800">
                Total: {formatCLP(totalSaleAmount)}
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {saleProductsList.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-2 bg-[#f8fafc] border border-gray-300 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <img src={prod.images[0]} alt="Mini" className="w-8 h-8 object-cover border border-gray-300 shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900 line-clamp-1">{prod.name}</div>
                      <div className="text-[10px] text-gray-500">
                        {prod.totalUnits} un. × {formatCLP(prod.price)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-gray-900">
                      {formatCLP(prod.price * prod.totalUnits)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveProductFromSale(prod.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remover de la venta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
