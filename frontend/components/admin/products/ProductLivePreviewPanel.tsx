import React from 'react';
import {
  Eye,
  Star,
  Image as ImageIcon,
  CheckCircle2,
  Scale
} from 'lucide-react';
import { PixelHeart } from '../../common/PixelIcon';
import { SoldOutCardOverlay } from '../../common/SoldOutState';
import { SizeItem, formatCLP } from './productManagerTypes';

interface ProductLivePreviewPanelProps {
  title: string;
  description: string;
  section: string;
  category: string;
  subcategory: string;
  specialCategory: string;
  images: string[];
  activePreviewImageIndex: number;
  setActivePreviewImageIndex: (idx: number) => void;
  totalUnits: number;
  discountPercent: number | '';
  normalPriceRaw: number;
  calculatedOfferPrice: number;
  savingsAmount: number;
  weightGrams: number | '';
  categorySupportsSizes: boolean;
  sizesList: SizeItem[];
  tags: string[];
}

export const ProductLivePreviewPanel: React.FC<ProductLivePreviewPanelProps> = ({
  title,
  description,
  section,
  category,
  subcategory,
  specialCategory,
  images,
  activePreviewImageIndex,
  setActivePreviewImageIndex,
  totalUnits,
  discountPercent,
  normalPriceRaw,
  calculatedOfferPrice,
  savingsAmount,
  weightGrams,
  categorySupportsSizes,
  sizesList,
  tags
}) => {
  return (
    <div className="nl-product-manager-col-right lg:col-span-5 space-y-3">
      <div className="nl-product-manager-preview-sticky">
        <div className="bg-[#eef3f8] border-2 border-[#003c74] shadow-md">
          {/* Barra de título de la vista previa estilo Windows XP */}
          <div className="bg-gradient-to-r from-[#0055ea] to-[#003c74] px-3 py-1.5 flex items-center justify-between text-white text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-300" />
              <span style={{ color: '#ffffff' }} className="!text-white font-bold tracking-wide">
                VISTA PREVIA
              </span>
            </span>
            <span
              style={{ color: '#ffffff' }}
              className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-xs font-mono font-bold !text-white"
            >
              LIVE
            </span>
          </div>

          <div className="p-4 bg-white space-y-3">
            {/* Badge de Categoría Especial y Jerarquía */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {specialCategory !== 'Ninguna' && (
                <span className="text-xs font-extrabold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 flex items-center gap-1 shadow-2xs">
                  <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                  <span>{specialCategory}</span>
                </span>
              )}
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                {section} &gt; {category} &gt; {subcategory}
              </span>
            </div>

            {/* Foto Principal de la Vista Previa (Sincronizada con el marco 370x506 y Ambient Blur de los Catálogos) */}
            <div className="product-card-xp-media relative group border-2 border-[#7f9db9] shadow-xs">
              {images.length > 0 ? (
                <>
                  {/* Fondo Ambient Blur idéntico al catálogo para rellenar el marco 370x506 sin bordes vacíos */}
                  <img
                    src={images[activePreviewImageIndex] || images[0]}
                    alt=""
                    aria-hidden="true"
                    className={`product-card-xp-img-blur ${totalUnits <= 0 ? 'grayscale-30 contrast-90' : ''}`}
                  />

                  {/* Imagen principal completa y centrada sin recortarse ni deformarse */}
                  <img
                    src={images[activePreviewImageIndex] || images[0]}
                    alt={title || 'Vista Previa'}
                    className={`product-card-xp-img ${totalUnits <= 0 ? 'grayscale-30 contrast-90' : ''}`}
                  />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center relative z-10">
                  <ImageIcon className="w-12 h-12 mb-2 stroke-1" />
                  <span className="text-xs">Sube una imagen para ver cómo se verá en el catálogo</span>
                </div>
              )}

              {/* Overlay oficial de Agotado si el stock total es 0 */}
              {images.length > 0 && totalUnits <= 0 && <SoldOutCardOverlay />}

              {/* Badge flotante de Descuento idéntico al catálogo */}
              {typeof discountPercent === 'number' && discountPercent > 0 && totalUnits > 0 && (
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

            {/* Miniaturas navegables de la vista previa */}
            {images.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePreviewImageIndex(idx)}
                    className={`shrink-0 w-12 h-12 border-2 ${
                      activePreviewImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-300'
                    }`}
                  >
                    <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Título de la Prenda */}
            <div>
              <h2 className="text-base font-black text-gray-950 uppercase tracking-tight line-clamp-2">
                {title || 'Título de la Prenda en Vista Previa'}
              </h2>
              <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                SKU: NL-PREVIEW // Stock Consolidado: {totalUnits} un.
              </div>
            </div>

            {/* Descripción de la prenda en la vista previa */}
            {description && (
              <p className="text-xs text-gray-600 italic bg-gray-50 p-2 border border-gray-200 line-clamp-3">
                "{description}"
              </p>
            )}

            {/* Bloque de Precios con Descuento Dinámico */}
            <div className="p-3 bg-[#f8fafc] border border-gray-300 space-y-1">
              <div className="flex flex-wrap items-baseline gap-2.5">
                {typeof discountPercent === 'number' && discountPercent > 0 ? (
                  <>
                    <span className="text-xl font-black text-red-700 tracking-tight">
                      {formatCLP(calculatedOfferPrice)} CLP
                    </span>
                    <span className="text-xs text-gray-400 line-through font-semibold">
                      {formatCLP(normalPriceRaw)}
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-black text-gray-900 tracking-tight">
                    {formatCLP(normalPriceRaw)} CLP
                  </span>
                )}
              </div>

              {typeof discountPercent === 'number' && discountPercent > 0 && (
                <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ahorras {formatCLP(savingsAmount)} CLP con esta oferta</span>
                </div>
              )}
            </div>

            {/* Información de Peso */}
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1.5">
              <span className="flex items-center gap-1.5 font-bold">
                <Scale className="w-3.5 h-3.5 text-indigo-700" />
                <span>Peso Estimado de Envío:</span>
              </span>
              <span className="font-mono font-bold text-indigo-900">
                {weightGrams ? `${weightGrams} g (${(Number(weightGrams) / 1000).toFixed(2)} kg)` : 'No especificado'}
              </span>
            </div>

            {/* Tallas disponibles con unidades */}
            {categorySupportsSizes && sizesList.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-800 block">
                  Tallas Disponibles:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sizesList.map((s) => (
                    <div
                      key={s.id}
                      className="px-2 py-1 bg-white border border-gray-400 text-xs font-bold text-gray-900 text-center shadow-2xs hover:border-blue-600"
                    >
                      <div>{s.size}</div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        {s.quantity} un.
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-600 block">Etiquetas:</span>
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 font-mono"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Botón Simulado de Compra con texto blanco puro */}
            <button
              type="button"
              disabled
              style={{ color: '#ffffff' }}
              className="w-full py-2 bg-gradient-to-r from-red-600 to-red-800 !text-white font-extrabold text-xs uppercase tracking-wider border-2 border-red-950 shadow-xs cursor-default"
            >
              <span style={{ color: '#ffffff' }} className="!text-white font-black tracking-wide">
                AGREGAR AL CARRITO (VISTA PREVIA)
              </span>
            </button>
            <p className="text-[10px] text-gray-500 text-center italic">
              Esta vista previa se actualiza automáticamente a medida que modificas los campos del formulario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
