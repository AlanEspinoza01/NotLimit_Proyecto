
import React from 'react';
import {
  Trash2,
  Edit3,
  ArrowUpDown,
  Filter,
  RefreshCw,
  PackageCheck,
  Boxes
} from 'lucide-react';
import { Product } from '../../../types';
import { getProductPricing, normalizeSpecialCategory } from '../../../services/productPresentation';
import { SectionTaxonomy, formatCLP } from './productManagerTypes';

interface ProductCatalogTableProps {
  products: Product[];
  filteredAndSortedProducts: Product[];
  isRefreshing: boolean;
  handleRefreshCatalog: () => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  activeTaxonomy: SectionTaxonomy[];
  sortPriceOrder: 'desc' | 'asc';
  setSortPriceOrder: (val: 'desc' | 'asc') => void;
  editingProductId: string | null;
  handleEditProduct: (prod: Product) => void;
  handleDeleteProduct: (id: string, name: string) => void;
}

export const ProductCatalogTable: React.FC<ProductCatalogTableProps> = ({
  products,
  filteredAndSortedProducts,
  isRefreshing,
  handleRefreshCatalog,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  activeTaxonomy,
  sortPriceOrder,
  setSortPriceOrder,
  editingProductId,
  handleEditProduct,
  handleDeleteProduct
}) => {
  return (
    <div className="mt-8 space-y-3 pt-6 border-t-2 border-gray-400">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#e8eef4] border border-gray-400 p-3">
        <div className="flex items-center gap-2">
          <Boxes className="w-5 h-5 text-[#003c74] shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm text-[#003c74] uppercase">
              Catálogo de Productos Registrados
            </h3>
            <p className="text-xs text-gray-600">
              Total mostrados: <strong>{filteredAndSortedProducts.length}</strong> de {products.length} productos
            </p>
          </div>
        </div>

        {/* BARRA DE FILTROS Y ORDENAMIENTO REQUERIDA */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Botón Actualizar a la izquierda de la barra de búsqueda */}
          <button
            type="button"
            onClick={handleRefreshCatalog}
            className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1.5 shadow-xs cursor-pointer font-bold hover:bg-blue-50 transition-colors"
            title="Actualizar catálogo de productos"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          {/* Búsqueda rápida */}
          <div>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="winxp-input px-2.5 text-xs py-1 w-36 sm:w-44 font-medium"
            />
          </div>

          {/* Filtrar por Categoría */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 px-2 py-0.5">
            <Filter className="w-3.5 h-3.5 text-blue-700" />
            <span className="font-bold text-gray-700">Categoría:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-transparent border-none font-semibold focus:outline-none"
            >
              <option value="all">Todas las Categorías</option>
              {activeTaxonomy.map((sec) => (
                <optgroup key={sec.section} label={`Sección: ${sec.section}`}>
                  {sec.categories.map((c) => (
                    <option key={`${sec.section}-${c.name}`} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Ordenar por Precio: Mayor a Menor vs Menor a Mayor */}
          <div className="flex items-center gap-1 bg-white border border-gray-300 px-2 py-0.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-bold text-gray-700">Precio:</span>
            <select
              value={sortPriceOrder}
              onChange={(e) => setSortPriceOrder(e.target.value as 'desc' | 'asc')}
              className="text-xs bg-transparent border-none font-bold text-emerald-900 focus:outline-none"
            >
              <option value="desc">Mayor precio a Menor precio</option>
              <option value="asc">Menor Precio a Mayor Precio</option>
            </select>
          </div>

          {/* Resetear filtros */}
          {(filterCategory !== 'all' || searchTerm || sortPriceOrder !== 'desc') && (
            <button
              type="button"
              onClick={() => {
                setFilterCategory('all');
                setSearchTerm('');
                setSortPriceOrder('desc');
              }}
              className="winxp-button text-xs py-1 px-2 text-gray-700"
              title="Limpiar filtros"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* TABLA / GRILLA DE PRODUCTOS CON FOTO, NOMBRE, PRECIO NORMAL, DESCUENTO, EDITAR Y ELIMINAR */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="p-8 text-center bg-white border border-gray-300 space-y-2">
          <PackageCheck className="w-10 h-10 text-gray-400 mx-auto" />
          <p className="text-xs font-bold text-gray-700">No se encontraron productos con los filtros seleccionados.</p>
          <button
            type="button"
            onClick={() => {
              setFilterCategory('all');
              setSearchTerm('');
            }}
            className="winxp-button text-xs py-1 px-3 font-bold"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div className="nl-product-manager-table-scroll border-2 border-gray-400 bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#e4ebf2] border-b border-gray-400 text-gray-800 font-extrabold uppercase text-[11px]">
                <th className="p-2.5 border-r border-gray-300 w-16 text-center">Foto</th>
                <th className="p-2.5 border-r border-gray-300">Nombre del Producto</th>
                <th className="p-2.5 border-r border-gray-300">Categoría &amp; Especial</th>
                <th className="p-2.5 border-r border-gray-300 text-right">Precio Normal</th>
                <th className="p-2.5 border-r border-gray-300 text-center">Descuento</th>
                <th className="p-2.5 border-r border-gray-300 text-right">Precio Oferta</th>
                <th className="p-2.5 border-r border-gray-300 text-center">Tallas / Stock</th>
                <th className="p-2.5 text-center w-36">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedProducts.map((prod) => {
                const pricing = getProductPricing(prod);
                const hasDiscount = pricing.hasDiscount;
                const discountVal = pricing.discountPercent;
                const offerPrice = pricing.finalPrice;
                const isCurrentlyEditing = editingProductId === prod.id;

                return (
                  <tr
                    key={prod.id}
                    className={`hover:bg-blue-50/60 transition-colors ${
                      isCurrentlyEditing ? 'bg-amber-50 font-medium' : ''
                    }`}
                  >
                    {/* Foto */}
                    <td className="p-2 border-r border-gray-200 text-center">
                      <div className="w-12 h-12 mx-auto bg-gray-100 border border-gray-300 overflow-hidden">
                        <img
                          src={
                            prod.images?.[0] ||
                            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80'
                          }
                          alt={prod.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Nombre del Producto */}
                    <td className="p-2.5 border-r border-gray-200">
                      <div className="font-extrabold text-gray-950">{prod.title}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>SKU: {prod.sku}</span>
                        {prod.weightGrams && (
                          <span className="text-indigo-800">⚖️ {prod.weightGrams} g</span>
                        )}
                      </div>
                      {prod.tags && prod.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prod.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[9px] px-1 bg-gray-100 text-gray-700 border border-gray-200">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Categoría & Categoría Especial */}
                    <td className="p-2.5 border-r border-gray-200">
                      <div className="font-semibold text-gray-800">
                        {prod.section ? `${prod.section} › ` : ''}{prod.category}{prod.subCategory ? ` › ${prod.subCategory}` : ''}
                      </div>
                      {Boolean(normalizeSpecialCategory(prod.specialCategory)) && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-400">
                          ⭐ {normalizeSpecialCategory(prod.specialCategory)}
                        </span>
                      )}
                    </td>

                    {/* Precio Normal */}
                    <td className="p-2.5 border-r border-gray-200 text-right">
                      <div className={`font-bold ${hasDiscount ? 'text-gray-400 line-through text-[11px]' : 'text-gray-950 font-black'}`}>
                        {formatCLP(prod.price)}
                      </div>
                    </td>

                    {/* Descuento */}
                    <td className="p-2.5 border-r border-gray-200 text-center">
                      {hasDiscount ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-black bg-rose-100 text-rose-800 border border-rose-400 rounded-xs">
                          -{discountVal}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Sin dcto</span>
                      )}
                    </td>

                    {/* Precio Oferta */}
                    <td className="p-2.5 border-r border-gray-200 text-right">
                      {hasDiscount ? (
                        <div className="font-black text-rose-700 text-xs">
                          {formatCLP(offerPrice)}
                        </div>
                      ) : (
                        <div className="font-bold text-gray-900 text-xs">
                          {formatCLP(prod.price)}
                        </div>
                      )}
                    </td>

                    {/* Tallas y Stock */}
                    <td className="p-2.5 border-r border-gray-200 text-center">
                      <div className="font-bold text-gray-900">
                        {prod.totalStock} un.
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {prod.sizes && prod.sizes.length > 0 ? prod.sizes.join(', ') : 'Única'}
                      </div>
                    </td>

                    {/* Acciones: Editar y Eliminar */}
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Botón Editar */}
                        <button
                          type="button"
                          onClick={() => handleEditProduct(prod)}
                          className={`winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1 ${
                            isCurrentlyEditing ? 'bg-amber-200 border-amber-600 text-amber-950' : 'text-blue-900'
                          }`}
                          title="Editar todos los campos de este producto"
                        >
                          <Edit3 className="w-3 h-3 text-blue-700" />
                          <span>{isCurrentlyEditing ? 'Editando' : 'Editar'}</span>
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id, prod.title)}
                          className="winxp-button text-xs py-1 px-2 text-red-700 hover:text-red-900 font-bold flex items-center gap-1"
                          title="Eliminar permanentemente este producto"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
