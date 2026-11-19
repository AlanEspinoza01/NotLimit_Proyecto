import React from 'react';
import { Link } from 'react-router-dom';
import { WindowFrame } from '../layout/WindowFrame';
import { PixelIcon } from '../common/PixelIcon';

export const CartEmptyState: React.FC = () => {
  return (
    <div className="nl-cart-view-wrapper max-w-2xl mx-auto py-8 font-sans">
      <WindowFrame
        title="Carro_Vacio.exe - [No hay prendas seleccionadas]"
        icon={<PixelIcon name="cart" size={16} />}
        statusBarText="ELEMENTOS: 0 // TOTAL: $0 CLP"
      >
        <div className="text-center py-8 space-y-3">
          <div className="flex justify-center">
            <PixelIcon name="cart" size={48} />
          </div>
          <h2 className="text-base font-bold text-gray-800">
            El carro de compras está actualmente vacío
          </h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            Aún no has agregado ninguna prenda del catálogo. Explora la colección para asegurar tu talla antes de que se agote el stock físico.
          </p>
          <div className="pt-2">
            <Link to="/catalog">
              <button
                type="button"
                className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold text-blue-900 cursor-pointer"
              >
                <PixelIcon name="search" size={14} />
                <span>Ir al Catálogo de Prendas</span>
              </button>
            </Link>
          </div>
        </div>
      </WindowFrame>
    </div>
  );
};
