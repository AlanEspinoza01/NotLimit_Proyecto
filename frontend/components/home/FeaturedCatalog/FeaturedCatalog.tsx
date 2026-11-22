
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { WindowFrame } from '../../layout/WindowFrame';
import { Product } from '../../../types';
import { ProductCard } from '../ProductCard/ProductCard';
import { PixelIcon } from '../../common/PixelIcon';
import './FeaturedCatalog.css';

interface FeaturedCatalogProps {
  products: Product[];
  activeBranchId: string;
  addedProductId: string | null;
  onQuickAdd: (product: Product) => void;
}

/**
 * FeaturedCatalog: Escaparate de prendas destacadas dentro de una ventana Windows XP.
 * Fondo blanco limpio, tipografía nítida y delegación de eventos al ProductCard.
 */
export const FeaturedCatalog: React.FC<FeaturedCatalogProps> = ({
  products,
  activeBranchId,
  addedProductId,
  onQuickAdd,
}) => {
  // Asegurar que el escaparate de destacados no muestre más de 8 productos
  const displayedProducts = products.slice(0, 8);

  return (
    <WindowFrame
      title="Productos Destacados"
      subtitle="Selección de productos destacados de la tienda"
      icon={<PixelIcon name="badge-gold" size={16} />}
      statusBarText={`PRODUCTOS DESTACADOS: ${displayedProducts.length}`}
    >
      <div>
        {/* Cabecera del Catálogo */}
        <div className="featured-catalog-xp-header">
          <div>
            <h2 className="featured-catalog-xp-title">
              Productos Destacados
            </h2>
            <p className="text-xs text-gray-600 mt-0.5 font-sans">
              Productos seleccionados por la tienda, sujetos a disponibilidad de stock.
            </p>
          </div>

          <Link to="/catalog">
            <button
              type="button"
              className="winxp-button text-xs py-1 px-3 text-blue-900 font-bold"
            >
              <PixelIcon name="search" size={14} />
              <span>Abrir Catálogo Completo</span>
              <ArrowRight className="w-3 h-3 text-blue-700 ml-1" />
            </button>
          </Link>
        </div>

        {/* Solo se muestran productos con categoría especial «Productos destacados». */}
        {displayedProducts.length === 0 && (
          <p className="p-5 text-center text-xs text-gray-600">
            Por ahora no hay productos destacados. Puedes explorar el catálogo completo.
          </p>
        )}
        <div className="featured-catalog-xp-grid">
          {displayedProducts.map((product) => {
            const currentStock =
              activeBranchId === 'all'
                ? product.totalStock
                : product.stockPerBranch[activeBranchId] ?? 0;

            return (
              <ProductCard
                key={product.id}
                product={product}
                currentStock={currentStock}
                isRecentlyAdded={addedProductId === product.id}
                onQuickAdd={onQuickAdd}
              />
            );
          })}
        </div>
      </div>
    </WindowFrame>
  );
};
