import React, { useState, useEffect } from 'react';
import { Check, Info, Sparkles, Tag } from 'lucide-react';
import { Product } from '../../types';
import { PixelIcon } from './PixelIcon';
import { getProductPricing } from '../../services/productPresentation';
import { getProductSizesWithStock, getStockForSize, isProductOutOfStock } from '../../services/productStock';

export interface ProductWithSizeStock extends Product {
  stockBySize?: Record<string, number>;
}

/**
 * Determina si una categoría o subcategoría del esquema actual utiliza tallas
 */
export function isCategoryWithSizes(categoryName?: string, subCategoryName?: string): boolean {
  const c = (categoryName || '').toLowerCase().trim();
  const s = (subCategoryName || '').toLowerCase().trim();

  // Categorías del esquema actual que NO usan talla
  if (
    c === 'accesorios' ||
    c === 'carteras y accesorios' ||
    c === 'mistery box' ||
    c === 'otros' ||
    c === 'bolsos' ||
    c === 'billeteras' ||
    c === 'jockey'
  ) {
    return false;
  }

  // Categorías principales del esquema actual que SÍ usan talla
  if (
    c === 'ropa superior' ||
    c === 'ropa inferior' ||
    c === 'calzado'
  ) {
    return true;
  }

  // Subcategorías o nombres heredados de vestuario y calzado
  const combined = `${c} ${s}`;
  return (
    combined.includes('polera') ||
    combined.includes('blusa') ||
    combined.includes('camisa') ||
    combined.includes('chaqueta') ||
    combined.includes('hoodie') ||
    combined.includes('hoddie') ||
    combined.includes('poleron') ||
    combined.includes('pantalon') ||
    combined.includes('pantalón') ||
    combined.includes('short') ||
    combined.includes('zapatilla') ||
    combined.includes('zapato') ||
    combined.includes('bota') ||
    combined.includes('pantufla') ||
    combined.includes('sandalia') ||
    combined.includes('calzado')
  );
}

/**
 * Determina si el producto requiere que el usuario seleccione una talla al presionar "+ Carro"
 */
export function productRequiresSizeSelection(product: Product): boolean {
  const realSizes = (product.sizes || []).filter((sz) => {
    const clean = sz.toLowerCase().trim();
    return clean !== '' && clean !== 'única' && clean !== 'unica' && clean !== 'sin talla' && clean !== 'talla única';
  });

  if (realSizes.length > 0) {
    return true;
  }

  return isCategoryWithSizes(product.category, product.subCategory || product.subcategory);
}

/**
 * Obtiene la lista de tallas seleccionables de un producto junto con su stock disponible
 */
export function getSelectableSizesForProduct(
  product: ProductWithSizeStock
): Array<{ size: string; displayLabel: string; stock: number }> {
  // Nunca mostramos una talla como disponible si no hay cantidades verificables.
  return getProductSizesWithStock(product).map(({ size, stock }) => ({
    size, displayLabel: size, stock
  }));
}

interface QuickAddSizeModalProps {
  product: ProductWithSizeStock | null;
  onClose: () => void;
  onConfirmSize: (product: ProductWithSizeStock, selectedSize: string) => void;
}

export const QuickAddSizeModal: React.FC<QuickAddSizeModalProps> = ({
  product,
  onClose,
  onConfirmSize
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      const options = getSelectableSizesForProduct(product);
      const firstAvailable = options.find((opt) => opt.stock > 0);
      setSelectedSize(firstAvailable?.size || '');
      setErrorMsg(null);
    }
  }, [product]);

  if (!product) return null;

  const sizeOptions = getSelectableSizesForProduct(product);
  // El precio final se calcula desde el precio normal y el porcentaje persistido.
  // salePrice: 0 indica ausencia de oferta; no debe convertirse en un precio $0.
  const pricing = getProductPricing(product);

  const handleConfirm = () => {
    if (!selectedSize || isProductOutOfStock(product) || getStockForSize(product, selectedSize) <= 0) {
      setErrorMsg('Selecciona una talla disponible. Las tallas agotadas no se pueden comprar.');
      return;
    }
    onConfirmSize(product, selectedSize);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#ece9d8] border-2 border-[#0055ea] shadow-2xl winxp-bevel-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de título Windows XP */}
        <div className="winxp-titlebar py-1.5 px-2.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5 text-xs text-white font-bold truncate">
            <PixelIcon name="cart" size={14} />
            <span className="truncate">Seleccionar_Talla.exe - [Elegir Talla del Producto]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="winxp-btn-ctrl winxp-btn-close w-4 h-4 text-[10px] font-bold text-white flex items-center justify-center cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo de la ventana */}
        <div className="p-4 space-y-3.5 text-xs text-gray-800">
          {/* Resumen del Producto */}
          <div className="flex items-start gap-3 bg-white p-2.5 border border-[#7f9db9] winxp-bevel-in">
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-16 h-16 object-cover border border-gray-300 shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-[10px] font-bold text-[#0055ea] uppercase truncate flex items-center gap-1">
                <Tag className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {product.section ? `${product.section} › ` : ''}
                  {product.category}
                  {product.subCategory ? ` › ${product.subCategory}` : ''}
                </span>
              </div>
              <h4 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2">
                {product.title}
              </h4>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="font-extrabold text-red-700 text-sm">
                  ${pricing.finalPrice.toLocaleString('es-CL')} CLP
                </span>
                {pricing.hasDiscount && (
                  <span className="text-[11px] text-gray-400 line-through">
                    ${pricing.basePrice.toLocaleString('es-CL')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Aviso de Selección de Talla y Cantidad Automática = 1 */}
          <div className="bg-blue-50 border border-blue-300 p-2.5 rounded-xs flex items-start gap-2 text-[11px] text-blue-950">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-[#003c74]">
                Selecciona la talla que deseas llevar:
              </span>
              <span className="text-gray-700">
                Al confirmar, se agregará <strong>1 unidad automáticamente</strong> a tu carrito de compras.
              </span>
            </div>
          </div>

          {/* Selector de Tallas Disponibles */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-800 text-xs">
                Tallas disponibles del producto:
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-white border border-gray-300 winxp-bevel-in">
              {sizeOptions.map((opt) => {
                const isSelected = selectedSize === opt.size;
                const isOutOfStock = opt.stock <= 0;

                return (
                  <button
                    key={opt.size}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      setSelectedSize(opt.size);
                      setErrorMsg(null);
                    }}
                    className={`winxp-button py-1.5 px-2.5 text-xs flex items-center justify-center text-center transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'opacity-45 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-300'
                        : isSelected
                        ? 'winxp-button-primary bg-blue-100 font-bold text-blue-950 border-blue-700 ring-1 ring-blue-500'
                        : 'bg-white text-gray-800 hover:bg-blue-50'
                    }`}
                  >
                    <span className="font-bold leading-tight">{opt.displayLabel}{isOutOfStock ? " · Agotada" : ` · ${opt.stock} un.`}</span>
                  </button>
                );
              })}
            </div>

            {errorMsg && (
              <p className="text-[11px] text-red-600 font-bold">{errorMsg}</p>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="winxp-button text-xs py-1.5 px-3.5 text-gray-800 font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedSize || getStockForSize(product, selectedSize) <= 0}
              className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-green-700 stroke-[2.5]" />
              <span>Agregar al Carrito</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
