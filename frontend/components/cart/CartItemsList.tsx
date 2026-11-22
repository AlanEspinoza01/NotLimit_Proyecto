import React from 'react';
import { getProductPricing } from '../../services/productPresentation';
import { Link } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { PixelIcon } from '../common/PixelIcon';
import { CartItem } from '../../types';
import { hasApparelSize } from './cartTypes';
import { getStockForSize, normalizeStockSize } from '../../services/productStock';

export interface CartItemsListProps {
  items: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
}

export const CartItemsList: React.FC<CartItemsListProps> = ({
  items,
  updateQuantity,
  removeFromCart
}) => {
  return (
    <div className="nl-cart-left-col lg:col-span-7 space-y-4">
      <div className="space-y-2">
        {/* Encabezado con PRENDA SELECCIONADA (#) y botón Continuar Explorando Catálogo a su derecha */}
        <div className="flex items-center justify-between pb-1.5 border-b border-gray-300 text-xs font-bold text-gray-700 flex-wrap gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-700" />
              <span>PRENDA SELECCIONADA ({items.length})</span>
            </span>
            <Link to="/catalog">
              <button
                type="button"
                className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1.5 font-semibold cursor-pointer"
                title="Explorar el catálogo"
              >
                <PixelIcon name="search" size={13} />
                <span>Continuar Explorando Catálogo</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Contenedor con desplazamiento para las prendas seleccionadas */}
        <div className="max-h-[460px] md:max-h-[520px] winxp-scroll-container border border-gray-300 bg-white p-2 space-y-2 rounded-xs shadow-inner">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
              className="nl-cart-item-row p-2.5 bg-gray-50 hover:bg-blue-50/40 transition-colors border border-gray-300 flex items-center justify-between gap-3 text-xs"
            >
              {/* Foto miniatura vinculada a la página de detalle */}
              <Link
                to={`/product/${item.product.id}`}
                className="shrink-0 group block cursor-pointer"
                title={`Ver detalles de ${item.product.title}`}
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.title}
                  className="w-14 h-14 object-cover border border-gray-400 bg-white group-hover:border-blue-600 transition-colors"
                />
              </Link>

              {/* Datos del producto */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item.product.id}`}
                  className="font-bold text-gray-900 truncate block hover:text-blue-700 hover:underline cursor-pointer"
                  title={item.product.title}
                >
                  {item.product.title}
                </Link>

                {/* Talla: visible únicamente en prendas/productos que tienen talla */}
                {hasApparelSize(item.product, item.selectedSize) && (
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    <span>
                      Talla seleccionada: <strong className="text-blue-900">{item.selectedSize}</strong>
                    </span>
                  </div>
                )}

                {getStockForSize(item.product, item.selectedSize) <= 0 && (
                  <p className="text-[10px] font-bold text-red-700">Esta talla está agotada; quítala del carrito o elige otra.</p>
                )}

                {/* Precio por unidad y Subtotal a su derecha */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] text-blue-900 font-bold">
                    ${(getProductPricing(item.product).finalPrice).toLocaleString('es-CL')} c/u
                  </span>
                  <span className="text-gray-300 text-[11px]">|</span>
                  <span className="text-[11px] text-gray-700">
                    Subtotal:{' '}
                    <strong className="text-red-700 font-mono font-bold">
                      ${((getProductPricing(item.product).finalPrice) * item.quantity).toLocaleString('es-CL')}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Controles de Cantidad con iconos "-" y "+" claros y definidos junto al botón Quitar */}
              <div className="nl-cart-item-controls flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-white border border-gray-300 px-1.5 py-0.5 rounded shadow-xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.quantity > 1) {
                        updateQuantity(item.id, item.quantity - 1);
                      }
                    }}
                    disabled={item.quantity <= 1}
                    className="winxp-qty-button group disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title={
                      item.quantity <= 1
                        ? "Mínimo 1 prenda (para eliminar usa el botón 'Quitar')"
                        : "Restar prenda (-)"
                    }
                    aria-label="Restar una prenda (-)"
                  >
                    <Minus
                      size={15}
                      strokeWidth={3.5}
                      className={`pointer-events-none transition-colors ${
                        item.quantity <= 1
                          ? 'text-gray-400'
                          : 'text-gray-900 group-hover:text-red-700'
                      }`}
                    />
                  </button>
                  <span className="w-7 text-center font-bold font-mono text-xs text-gray-900 select-none">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={items.filter((other) => other.productId === item.productId &&
                      normalizeStockSize(other.selectedSize) === normalizeStockSize(item.selectedSize))
                      .reduce((units, other) => units + other.quantity, 0) >= getStockForSize(item.product, item.selectedSize)}
                    className="winxp-qty-button group cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Sumar prenda (+)"
                    aria-label="Sumar una prenda (+)"
                  >
                    <Plus size={15} strokeWidth={3.5} className="text-gray-900 group-hover:text-green-700 pointer-events-none transition-colors" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-500 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Quitar prenda del carro"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span className="hidden sm:inline">Quitar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
