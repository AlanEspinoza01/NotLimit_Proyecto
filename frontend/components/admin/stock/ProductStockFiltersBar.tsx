import React from 'react';
import {
  Filter,
  RotateCcw,
  Layers,
  Tag,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Search,
  X
} from 'lucide-react';
import {
  SectionTaxonomy,
  TaxonomyCategory,
  SPECIAL_CATEGORIES
} from '../../../views/admin/ProductManagerView';
import {
  ProductStockDetail,
  StockSummaryMetrics,
  TaxonomyCounts
} from './productStockTypes';

interface ProductStockFiltersBarProps {
  products: ProductStockDetail[];
  filteredAndSortedProducts: ProductStockDetail[];
  selectedSection: string;
  setSelectedSection: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedSubCategory: string;
  setSelectedSubCategory: (val: string) => void;
  selectedSpecialCategory: string;
  setSelectedSpecialCategory: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  stockOrder: 'desc' | 'asc';
  setStockOrder: (val: 'desc' | 'asc') => void;
  stockStatusFilter: 'all' | 'in_stock' | 'low_stock' | 'sold_out';
  setStockStatusFilter: (val: 'all' | 'in_stock' | 'low_stock' | 'sold_out') => void;
  lowStockThreshold: number;
  setLowStockThreshold: (val: number) => void;
  isBranchAdmin: boolean;
  viewMode: 'table' | 'cards';
  setViewMode: (val: 'table' | 'cards') => void;
  activeTaxonomy: SectionTaxonomy[];
  availableCategoriesForFilter: TaxonomyCategory[];
  availableSubCategoriesForFilter: string[];
  taxonomyCounts: TaxonomyCounts;
  summaryMetrics: StockSummaryMetrics;
}

export const ProductStockFiltersBar: React.FC<ProductStockFiltersBarProps> = ({
  products,
  filteredAndSortedProducts,
  selectedSection,
  setSelectedSection,
  selectedCategory,
  setSelectedCategory,
  selectedSubCategory,
  setSelectedSubCategory,
  selectedSpecialCategory,
  setSelectedSpecialCategory,
  searchQuery,
  setSearchQuery,
  stockOrder,
  setStockOrder,
  stockStatusFilter,
  setStockStatusFilter,
  lowStockThreshold,
  setLowStockThreshold,
  isBranchAdmin,
  viewMode,
  setViewMode,
  activeTaxonomy,
  availableCategoriesForFilter,
  availableSubCategoriesForFilter,
  taxonomyCounts,
  summaryMetrics
}) => {
  return (
    <div className="p-3 bg-[#ece9d8] border border-gray-400 space-y-2.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 pb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#003c74]">
          <Filter className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span>Esquema de Categorías Sincronizado (Sección › Categoría › Subcategoría + Categoría Especial)</span>
        </div>
        <div className="flex items-center gap-2">
          {(selectedSection !== 'all' ||
            selectedCategory !== 'all' ||
            selectedSubCategory !== 'all' ||
            selectedSpecialCategory !== 'all' ||
            searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setSelectedSection('all');
                setSelectedCategory('all');
                setSelectedSubCategory('all');
                setSelectedSpecialCategory('all');
                setSearchQuery('');
              }}
              className="winxp-button text-[10px] py-0.5 px-2 text-blue-900 font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
          <div className="text-[11px] text-gray-600">
            Mostrando <strong className="text-gray-900">{filteredAndSortedProducts.length}</strong> de {products.length} productos
          </div>
        </div>
      </div>

      {/* Fila 1 de Filtros de Taxonomía Actual */}
      <div className="nl-stock-taxonomy-grid">
        {/* 1. Sección Principal */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            <span>Sección Principal:</span>
          </label>
          <select
            value={selectedSection}
            onChange={(e) => {
              setSelectedSection(e.target.value);
              setSelectedCategory('all');
              setSelectedSubCategory('all');
            }}
            className="w-full winxp-input text-xs py-1 px-2 font-semibold bg-white border border-[#7f9db9]"
          >
            <option value="all">Todas las Secciones ({products.length})</option>
            {activeTaxonomy.map((sec) => (
              <option key={sec.section} value={sec.section}>
                {sec.section} ({taxonomyCounts.bySection[sec.section] || 0})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Filtrar por Categoría (Sincronizado con activeTaxonomy) */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-blue-700" />
            <span>Filtrar por Categoría:</span>
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCategory(val);
              setSelectedSubCategory('all');
            }}
            className="w-full winxp-input text-xs py-1 px-2 font-semibold bg-white border border-[#7f9db9]"
          >
            <option value="all">
              Todas las Categorías ({selectedSection === 'all' ? products.length : taxonomyCounts.bySection[selectedSection] || 0})
            </option>
            {selectedSection === 'all' ? (
              activeTaxonomy.map((sec) => (
                <optgroup key={sec.section} label={`Sección: ${sec.section}`}>
                  {sec.categories.map((cat) => {
                    const key = `${sec.section}:::${cat.name}`;
                    return (
                      <option key={key} value={key}>
                        {cat.name} ({taxonomyCounts.bySectionCategory[key] || 0})
                      </option>
                    );
                  })}
                </optgroup>
              ))
            ) : (
              availableCategoriesForFilter.map((cat) => {
                const key = `${selectedSection}:::${cat.name}`;
                return (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} ({taxonomyCounts.bySectionCategory[key] || 0})
                  </option>
                );
              })
            )}
          </select>
        </div>

        {/* 3. Filtrar por Subcategoría */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-purple-700" />
            <span>Subcategoría / Prenda:</span>
          </label>
          <select
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            className="w-full winxp-input text-xs py-1 px-2 font-medium bg-white border border-[#7f9db9]"
          >
            <option value="all">Todas las Subcategorías</option>
            {(() => {
              if (selectedCategory !== 'all' && selectedCategory.includes(':::')) {
                const [secName, catName] = selectedCategory.split(':::');
                const secObj = activeTaxonomy.find((s) => s.section === secName);
                const catObj = secObj?.categories.find((c) => c.name === catName);
                return (catObj?.subcategories || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub} ({taxonomyCounts.bySubCategory[sub] || 0})
                  </option>
                ));
              }
              return availableSubCategoriesForFilter.map((sub) => (
                <option key={sub} value={sub}>
                  {sub} ({taxonomyCounts.bySubCategory[sub] || 0})
                </option>
              ));
            })()}
          </select>
        </div>

        {/* 4. Filtrar por Categoría Especial */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Categoría Especial:</span>
          </label>
          <select
            value={selectedSpecialCategory}
            onChange={(e) => setSelectedSpecialCategory(e.target.value)}
            className="w-full winxp-input text-xs py-1 px-2 font-medium bg-white border border-[#7f9db9]"
          >
            <option value="all">Todas ({products.length})</option>
            {SPECIAL_CATEGORIES.map((sc) => (
              <option key={sc.value} value={sc.value}>
                {sc.label} ({taxonomyCounts.bySpecial[sc.value] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila 2: Ordenar por Stock y Búsqueda por Nombre */}
      <div className="nl-stock-search-grid pt-1">
        {/* ORDENAR POR STOCK (Requisito Explícito: Mayor a menor y Menor a mayor) */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-700" />
            <span>Ordenar por Stock:</span>
          </label>
          <div className="flex items-center gap-1">
            <select
              value={stockOrder}
              onChange={(e) => setStockOrder(e.target.value as 'desc' | 'asc')}
              className="w-full winxp-input text-xs py-1 px-2 font-bold bg-white border border-[#7f9db9] text-[#003c74]"
            >
              <option value="desc">Mayor a menor (Más stock primero)</option>
              <option value="asc">Menor a mayor (Menos stock primero)</option>
            </select>
          </div>
        </div>

        {/* Búsqueda por Texto (Nombre, Categoría o Subcategoría) */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <Search className="w-3.5 h-3.5 text-gray-700" />
            <span>Buscar por Nombre del Producto o Categoría:</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: Hoodie, Oversize, Cargo, Polera, Ropa Superior..."
              className="w-full winxp-input text-xs py-1 px-2 pr-6 bg-white border border-[#7f9db9]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-barra de chips rápidos de filtro y modo de vista */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-300">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-700 uppercase">Estado rápido:</span>
          <button
            type="button"
            onClick={() => setStockStatusFilter('all')}
            style={stockStatusFilter === 'all' ? { color: '#ffffff' } : {}}
            className={`text-[11px] px-2 py-0.5 border font-semibold ${
              stockStatusFilter === 'all'
                ? 'bg-blue-700 !text-white border-blue-900 shadow-xs'
                : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100'
            }`}
          >
            <span
              style={stockStatusFilter === 'all' ? { color: '#ffffff' } : {}}
              className={stockStatusFilter === 'all' ? '!text-white font-bold' : ''}
            >
              Todos ({products.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter('in_stock')}
            style={stockStatusFilter === 'in_stock' ? { color: '#ffffff' } : {}}
            className={`text-[11px] px-2 py-0.5 border font-semibold ${
              stockStatusFilter === 'in_stock'
                ? 'bg-emerald-700 !text-white border-emerald-900 shadow-xs'
                : 'bg-white text-emerald-800 border-gray-400 hover:bg-emerald-50'
            }`}
          >
            <span
              style={stockStatusFilter === 'in_stock' ? { color: '#ffffff' } : {}}
              className={stockStatusFilter === 'in_stock' ? '!text-white font-bold' : ''}
            >
              Con Stock ({products.filter((p) => p.totalStock > 0).length})
            </span>
          </button>
          <div className="inline-flex items-center border border-gray-400 bg-white">
            <button
              type="button"
              onClick={() => setStockStatusFilter('low_stock')}
              style={stockStatusFilter === 'low_stock' ? { color: '#ffffff' } : {}}
              className={`text-[11px] px-2 py-0.5 font-semibold ${
                stockStatusFilter === 'low_stock'
                  ? 'bg-amber-600 !text-white shadow-xs'
                  : 'bg-white text-amber-800 hover:bg-amber-50'
              }`}
            >
              <span
                style={stockStatusFilter === 'low_stock' ? { color: '#ffffff' } : {}}
                className={stockStatusFilter === 'low_stock' ? '!text-white font-bold' : ''}
              >
                Stock Bajo ≤ {lowStockThreshold} ({summaryMetrics.lowStockCount})
              </span>
            </button>
            {!isBranchAdmin && (
              <div
                className="flex items-center gap-0.5 px-1 bg-amber-50 border-l border-amber-200"
                title="Configurar umbral mínimo de Stock Bajo (Super Admin)"
              >
                <span className="text-[10px] font-bold text-amber-900">≤</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={lowStockThreshold}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setLowStockThreshold(val);
                    localStorage.setItem('nl_low_stock_threshold', String(val));
                  }}
                  className="w-9 h-5 text-center text-xs font-black bg-white border border-amber-400 text-amber-900 focus:outline-blue-500 rounded-2xs"
                  title="Editar mínimo de unidades para alerta de Stock Bajo"
                />
                <span className="text-[9px] text-amber-800 font-semibold">un.</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setStockStatusFilter('sold_out')}
            style={stockStatusFilter === 'sold_out' ? { color: '#ffffff' } : {}}
            className={`text-[11px] px-2 py-0.5 border font-semibold ${
              stockStatusFilter === 'sold_out'
                ? 'bg-red-700 !text-white border-red-900 shadow-xs'
                : 'bg-white text-red-800 border-gray-400 hover:bg-red-50'
            }`}
          >
            <span
              style={stockStatusFilter === 'sold_out' ? { color: '#ffffff' } : {}}
              className={stockStatusFilter === 'sold_out' ? '!text-white font-bold' : ''}
            >
              Agotados 0 un. ({summaryMetrics.soldOutCount})
            </span>
          </button>
        </div>

        {/* Botones de Vista: Tabla XP vs Tarjetas */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-gray-700 uppercase">Vista:</span>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`winxp-button text-[11px] py-0.5 px-2 font-bold ${
              viewMode === 'table' ? 'winxp-button-primary text-blue-950 border-blue-800' : 'text-gray-700'
            }`}
          >
            Tabla Detallada
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`winxp-button text-[11px] py-0.5 px-2 font-bold ${
              viewMode === 'cards' ? 'winxp-button-primary text-blue-950 border-blue-800' : 'text-gray-700'
            }`}
          >
            Tarjetas Visuales
          </button>
        </div>
      </div>
    </div>
  );
};
