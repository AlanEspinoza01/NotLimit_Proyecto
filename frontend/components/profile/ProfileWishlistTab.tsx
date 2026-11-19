import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { PixelHeart } from '../common/PixelIcon';
import { Product } from '../../types';

interface ProfileWishlistTabProps {
  wishlist: Product[];
  removeFromWishlist: (productId: string) => void;
}

export const ProfileWishlistTab: React.FC<ProfileWishlistTabProps> = ({
  wishlist,
  removeFromWishlist
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-300 gap-2">
        <div>
          <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
            <PixelHeart filled={true} size={16} />
            Prendas Guardadas en Lista de Deseos
          </h4>
          <p className="text-[11px] text-gray-500">
            Gestiona tus artículos favoritos guardados con el botón de corazón y accede al detalle de cada prenda.
          </p>
        </div>
        <span className="text-xs bg-rose-50 text-rose-800 font-bold px-2.5 py-1 border border-rose-300 rounded-xs self-start sm:self-auto shadow-xs">
          {wishlist.length} {wishlist.length === 1 ? 'prenda guardada' : 'prendas guardadas'}
        </span>
      </div>

      {wishlist.length === 0 ? (
        <div className="p-8 text-center bg-[#f8fafc] border border-gray-300 rounded-xs space-y-3 winxp-bevel-in">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 shadow-inner">
            <PixelHeart filled={false} size={24} />
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-sm text-gray-900">Tu Lista de Deseos está vacía</h5>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Ingresa a la página de detalle de cualquier producto del catálogo y presiona el botón de corazón para guardarlo en tu cuenta.
            </p>
          </div>
          <Link
            to="/catalog"
            className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold text-blue-900 inline-flex items-center gap-1.5 shadow-sm"
          >
            <span>Explorar Catálogo →</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {wishlist.map((item) => {
            const isSoldOut = item.totalStock <= 0;
            const discountPercent =
              item.discountPercent ||
              (item.salePrice && item.salePrice < item.price
                ? Math.round(((item.price - item.salePrice) / item.price) * 100)
                : null);
            const hasDiscount = Boolean(discountPercent);

            return (
              <div
                key={item.id}
                className="p-3 bg-[#fbfaf5] border border-gray-300 rounded-xs flex flex-col justify-between winxp-bevel-out gap-2.5 hover:border-gray-400 transition-colors"
              >
                <div className="space-y-2">
                  <div className="relative aspect-square w-full overflow-hidden border border-gray-300 bg-white">
                    <img
                      src={item.images[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {hasDiscount && !isSoldOut && (
                      <span
                        className="absolute top-1.5 left-1.5 bg-[#15803d] font-bold text-[10px] px-1.5 py-0.5 rounded-xs border border-[#166534] shadow-xs select-none z-10 !text-white"
                        style={{ color: '#ffffff', backgroundColor: '#15803d' }}
                      >
                        -{discountPercent}% OFF
                      </span>
                    )}
                    {isSoldOut && (
                      <span
                        className="absolute top-1.5 right-1.5 bg-red-800 font-bold text-[10px] px-1.5 py-0.5 rounded-xs border border-red-900 shadow-xs select-none z-10 !text-white"
                        style={{ color: '#ffffff', backgroundColor: '#991b1b' }}
                      >
                        Agotado
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-blue-700 uppercase">{item.category}</div>
                    <h5 className="font-bold text-xs text-gray-900 line-clamp-1" title={item.title}>
                      {item.title}
                    </h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-bold text-xs text-red-700">
                        ${(item.salePrice ?? item.price).toLocaleString('es-CL')} CLP
                      </span>
                      {item.salePrice && (
                        <span className="text-[10px] text-gray-500 line-through">
                          ${item.price.toLocaleString('es-CL')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-gray-200">
                  <Link
                    to={`/product/${item.id}`}
                    className="winxp-button winxp-button-primary text-[11px] py-1.5 px-3 font-bold text-blue-900 text-center flex items-center justify-center gap-1 cursor-pointer w-full shadow-xs"
                  >
                    <span>Ver Detalle de la Prenda →</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.id)}
                    className="winxp-button text-[10px] py-0.5 px-2 w-full text-red-700 hover:text-red-900 flex items-center justify-center gap-1 cursor-pointer"
                    title="Quitar de mi Lista de Deseos"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                    <span>Quitar de la Lista</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
