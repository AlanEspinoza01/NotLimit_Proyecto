import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Flame,
  Tag,
  Layers,
  RotateCcw,
  ChevronRight,
  Shirt,
  Footprints,
  Wallet,
  Watch,
  Glasses,
  Gem,
  Box,
  Package,
  Gift,
  User,
  Sparkles,
  LayoutGrid,
  Shapes,
  Shield,
  Zap
} from 'lucide-react';
import { WindowFrame } from '../components/layout/WindowFrame';
import {
  CategoriesVisibilityConfig,
  loadCategoriesVisibility,
  getActiveProductTaxonomy,
  isProductTaxonomyActive
} from './admin/ProductManagerView';
import {
  loadAndSyncProductsStock,
  normalizeProductToCurrentTaxonomy,
  ProductStockDetail
} from './admin/ProductStockSummaryView';
import { useCart } from '../context/CartContext';
import { PixelIcon, PixelHeart } from '../components/common/PixelIcon';
import { ProductCard } from '../components/home/ProductCard/ProductCard';
import {
  QuickAddSizeModal,
  ProductWithSizeStock,
  productRequiresSizeSelection
} from '../components/common/QuickAddSizeModal';
import { Product } from '../types';
import api from '../api/axios';
import { getProductPricing } from '../services/productPresentation';
import { getStockForSize, isProductOutOfStock } from '../services/productStock';

const renderSectionIcon = (section: string) => {
  const key = section.toLowerCase().trim();
  if (key === 'all' || key === 'todas') {
    return <LayoutGrid className="w-3.5 h-3.5 text-blue-700 shrink-0" />;
  }
  if (key === 'hombre') {
    return <User className="w-3.5 h-3.5 text-blue-700 shrink-0" />;
  }
  if (key === 'mujer') {
    return <Sparkles className="w-3.5 h-3.5 text-pink-600 shrink-0" />;
  }
  if (key === 'mistery box') {
    return <Gift className="w-3.5 h-3.5 text-purple-700 shrink-0" />;
  }
  if (key === 'otros') {
    return <Package className="w-3.5 h-3.5 text-teal-700 shrink-0" />;
  }
  return <Box className="w-3.5 h-3.5 text-blue-700 shrink-0" />;
};

const renderSaleCategoryIcon = (catId: string, isSelected: boolean) => {
  const key = catId.toLowerCase().trim();
  const colorClass = isSelected ? 'text-white' : 'text-red-600';

  if (key === 'all' || key === 'todas las ofertas') {
    return <Flame className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-yellow-300' : 'text-red-600'}`} />;
  }
  if (key === 'ropa superior') {
    return <Shirt className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />;
  }
  if (key === 'ropa inferior') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-3.5 h-3.5 shrink-0 ${colorClass}`}
      >
        <path d="M6 3h12l1 18h-5l-2-11-2 11H5L6 3z" />
      </svg>
    );
  }
  if (key === 'calzado') {
    return <Footprints className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />;
  }
  if (key === 'accesorios') {
    return <Watch className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />;
  }
  if (key === 'otros') {
    return <Box className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />;
  }
  return <Tag className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />;
};

const renderSubCategoryIcon = (sub: string) => {
  const key = sub.toLowerCase().trim();
  if (key === 'all' || key === 'todas') {
    return <LayoutGrid className="w-3 h-3 text-blue-700 shrink-0" />;
  }
  if (key === 'hoodies doble zip') {
    return <Zap className="w-3 h-3 text-indigo-600 shrink-0" />;
  }
  if (key === 'hoodies') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 text-blue-700 shrink-0"
      >
        <path d="M9 3c-2 0-4 1.5-5 4l-2 5 3 2 1-3v10h12V11l1 3 3-2-2-5c-1-2.5-3-4-5-4a3 3 0 0 1-6 0z" />
      </svg>
    );
  }
  if (key === 'chaquetas') {
    return <Shield className="w-3 h-3 text-slate-700 shrink-0" />;
  }
  if (key === 'camisas') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 text-sky-700 shrink-0"
      >
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        <line x1="12" y1="6" x2="12" y2="22" />
      </svg>
    );
  }
  if (key === 'poleras') {
    return <Shirt className="w-3 h-3 text-teal-700 shrink-0" />;
  }
  if (key === 'pantalones') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 text-indigo-700 shrink-0"
      >
        <path d="M6 3h12l1 18h-5l-2-11-2 11H5L6 3z" />
      </svg>
    );
  }
  if (key === 'shorts') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 text-cyan-700 shrink-0"
      >
        <path d="M5 4h14l1 10h-6l-2-5-2 5H4L5 4z" />
      </svg>
    );
  }
  if (key === 'zapatillas') {
    return <Footprints className="w-3 h-3 text-orange-600 shrink-0" />;
  }
  if (key === 'zapatos con tacón' || key === 'zapatos con tacon') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 text-pink-600 shrink-0"
      >
        <path d="M3 18h4v-5l7 5h7v-2c0-2-2.5-3-5-3.5L9 7 5 9l-2 9z" />
      </svg>
    );
  }
  if (key === 'zapatos planos') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 text-amber-700 shrink-0"
      >
        <path d="M2 17h20v-2c0-2.5-3-4-7-4l-3 2H6c-2.2 0-4 1.8-4 4z" />
      </svg>
    );
  }
  if (key === 'botas y botines') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 text-stone-700 shrink-0"
      >
        <path d="M6 3h7v9l6 2c1.5.5 2 1.8 2 3v3H4v-5l2-12z" />
        <line x1="6" y1="7" x2="13" y2="7" />
      </svg>
    );
  }
  if (key === 'pantuflas') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 text-purple-600 shrink-0"
      >
        <path d="M3 16c0-3.5 3.5-6 8-6h4c3.5 0 6 2 6 5v2H3v-1z" />
        <path d="M11 10c0 2.5-2 4.5-5 4.5" />
      </svg>
    );
  }
  if (key === 'zapatos de fiesta') {
    return <Sparkles className="w-3 h-3 text-fuchsia-600 shrink-0" />;
  }
  if (key === 'sandalias y chalas') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 text-cyan-600 shrink-0"
      >
        <path d="M2 18h20" />
        <path d="M5 18c0-3 2-5 5-5h6c2.5 0 4 2 4 5" />
        <path d="M9 13v5" />
        <path d="M15 13v5" />
      </svg>
    );
  }
  if (key === 'blusas') {
    return <Shirt className="w-3 h-3 text-pink-600 shrink-0" />;
  }
  if (key === 'carteras') {
    return <Wallet className="w-3 h-3 text-rose-600 shrink-0" />;
  }
  if (key === 'otros accesorios') {
    return <Glasses className="w-3 h-3 text-purple-600 shrink-0" />;
  }
  if (key === 'billeteras') {
    return <Wallet className="w-3 h-3 text-amber-700 shrink-0" />;
  }
  if (key === 'jockey') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3 text-emerald-700 shrink-0"
      >
        <path d="M4 15a8 8 0 0 1 16 0H4z" />
        <path d="M2 15h20" />
      </svg>
    );
  }
  if (key === 'varios' || key === 'artículos varios' || key === 'articulos varios') {
    return <Shapes className="w-3 h-3 text-indigo-600 shrink-0" />;
  }
  if (key === 'coleccionables' || key === 'edición limitada' || key === 'edicion limitada') {
    return <Gem className="w-3 h-3 text-amber-600 shrink-0" />;
  }
  if (key === 'regalos' || key.startsWith('mistery box')) {
    return <Gift className="w-3 h-3 text-purple-600 shrink-0" />;
  }
  if (key === 'general') {
    return <Box className="w-3 h-3 text-blue-600 shrink-0" />;
  }
  return <ChevronRight className="w-3 h-3 text-blue-600 shrink-0" />;
};

export const CatalogView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCategoryParam = searchParams.get('category') || 'all';
  const initialSectionParam = searchParams.get('section') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>(initialSectionParam);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryParam);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [saleSubCategory, setSaleSubCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating' | 'discount'>('featured');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Estado para la ventanita de selección de talla al presionar "+ Carro"
  const [quickAddModalProduct, setQuickAddModalProduct] = useState<ProductStockDetail | null>(null);

  const { addToCart } = useCart();

  const [visibilityConfig, setVisibilityConfig] = useState<CategoriesVisibilityConfig>(() =>
    loadCategoriesVisibility()
  );

  useEffect(() => {
    const syncVisibility = () => setVisibilityConfig(loadCategoriesVisibility());
    window.addEventListener('nl_categories_visibility_updated', syncVisibility);
    window.addEventListener('storage', syncVisibility);
    return () => {
      window.removeEventListener('nl_categories_visibility_updated', syncVisibility);
      window.removeEventListener('storage', syncVisibility);
    };
  }, []);

  const activeTaxonomy = useMemo(
    () => getActiveProductTaxonomy(visibilityConfig),
    [visibilityConfig]
  );

  // Estado de productos conectado únicamente a MongoDB (/api/products) sin mocks iniciales
  const [mongoProducts, setMongoProducts] = useState<ProductStockDetail[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPublicCatalog = async () => {
      setIsLoadingCatalog(true);
      try {
        const res = await api.get('/products');
        if (res.data?.success && Array.isArray(res.data.data) && isMounted) {
          const mapped = res.data.data.map((doc: any, idx: number) =>
            normalizeProductToCurrentTaxonomy({
              ...doc,
              id: String(doc._id || doc.id || `prod_${idx}`),
              title: doc.title || doc.name || 'Prenda NoLimits',
              subCategory: doc.subCategory || doc.subcategory || 'Poleras'
            })
          );
          setMongoProducts(mapped);
          localStorage.setItem('nolimits_products_catalog_v2', JSON.stringify(mapped));
        }
      } catch (err) {
        console.error('Error cargando catálogo público desde MongoDB:', err);
      } finally {
        if (isMounted) {
          setIsLoadingCatalog(false);
        }
      }
    };
    fetchPublicCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cargar productos sincronizados desde MongoDB y filtrar categorías desactivadas
  const normalizedProducts = useMemo<ProductStockDetail[]>(() => {
    return mongoProducts.filter((p) =>
      isProductTaxonomyActive(p, visibilityConfig)
    );
  }, [mongoProducts, visibilityConfig]);

  // Categorías disponibles según la Sección seleccionada en activeTaxonomy
  const availableCategories = useMemo(() => {
    if (selectedSection === 'all') return [];
    const secObj = activeTaxonomy.find((s) => s.section === selectedSection);
    return secObj ? secObj.categories : [];
  }, [activeTaxonomy, selectedSection]);

  // Lista de nombres de categorías oficiales de la sección seleccionada ('Ofertas' a la izquierda de 'Todas las Categorías')
  const categoryButtons = useMemo(() => {
    if (selectedSection === 'all') return [];
    const names = availableCategories.map((c) => c.name);
    return ['Ofertas', 'all', ...names];
  }, [availableCategories, selectedSection]);

  // Subcategorías dinámicas: solo aparecen cuando se selecciona una Categoría específica
  const activeSubcategories = useMemo(() => {
    if (selectedSection === 'all' || selectedCategory === 'all' || selectedCategory === 'Ofertas') {
      return [];
    }
    const foundCat = availableCategories.find(
      (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
    );
    return foundCat ? foundCat.subcategories : [];
  }, [availableCategories, selectedCategory, selectedSection]);

  // Sub-categorías para el filtro condicional cuando la categoría activa es 'Ofertas'
  const saleSubCategories = useMemo(() => {
    const targetCategories =
      selectedSection !== 'all'
        ? availableCategories.map((c) => c.name)
        : Array.from(new Set(activeTaxonomy.flatMap((s) => s.categories.map((c) => c.name))));
    return [
      { id: 'all', label: 'Todas las Ofertas' },
      ...targetCategories.map((cat) => ({ id: cat, label: cat }))
    ];
  }, [activeTaxonomy, availableCategories, selectedSection]);

  // Conteos por Sección, Categoría, Subcategoría y Ofertas
  const taxonomyCounts = useMemo(() => {
    const bySection: Record<string, number> = { all: 0 };
    const byCategory: Record<string, number> = { all: 0 };
    const bySubCategory: Record<string, number> = { all: 0 };
    const saleCountsMap: Record<string, number> = { all: 0 };

    saleSubCategories.forEach((sub) => {
      saleCountsMap[sub.id] = 0;
    });

    normalizedProducts.forEach((p) => {
      if (p.isHidden) return;
      const sec = p.section || 'Otros';
      const cat = p.category || 'Otros';
      const sub = p.subCategory || 'General';

      bySection.all += 1;
      bySection[sec] = (bySection[sec] || 0) + 1;

      if (selectedSection === 'all' || sec === selectedSection) {
        byCategory.all += 1;
        byCategory[cat] = (byCategory[cat] || 0) + 1;

        if (selectedCategory === 'all' || cat.toLowerCase() === selectedCategory.toLowerCase()) {
          bySubCategory.all += 1;
          bySubCategory[sub] = (bySubCategory[sub] || 0) + 1;
        }
      }

      const isSale = Boolean(
        getProductPricing(p).hasDiscount
      );
      if (isSale && (selectedSection === 'all' || sec === selectedSection)) {
        saleCountsMap.all = (saleCountsMap.all || 0) + 1;
        saleSubCategories.forEach((s) => {
          if (s.id !== 'all' && cat.toLowerCase() === s.id.toLowerCase()) {
            saleCountsMap[s.id] = (saleCountsMap[s.id] || 0) + 1;
          }
        });
      }
    });

    return { bySection, byCategory, bySubCategory, saleCountsMap };
  }, [normalizedProducts, saleSubCategories, selectedSection, selectedCategory]);

  const filteredProducts = useMemo(() => {
    return normalizedProducts
      .filter((product) => {
        if (product.isHidden) return false;

        // 1. Filtro por Sección Principal (Hombre, Mujer, Mistery box, Otros)
        if (selectedSection !== 'all') {
          if ((product.section || '').toLowerCase() !== selectedSection.toLowerCase()) {
            return false;
          }
        }

        // 2. Filtro por Categoría o 'Ofertas'
        if (selectedCategory === 'Ofertas') {
          const isSale = Boolean(
            getProductPricing(product).hasDiscount
          );
          if (!isSale) return false;

          if (saleSubCategory !== 'all') {
            if (product.category.toLowerCase() !== saleSubCategory.toLowerCase()) {
              return false;
            }
          }
        } else if (selectedCategory !== 'all') {
          const catMatch = product.category.toLowerCase() === selectedCategory.toLowerCase();
          const subMatch = (product.subCategory || '').toLowerCase() === selectedCategory.toLowerCase();
          if (!catMatch && !subMatch) {
            return false;
          }
        }

        // 3. Filtro por Subcategoría
        if (selectedSubCategory !== 'all' && selectedCategory !== 'Ofertas') {
          const prodSub = (product.subCategory || product.subcategory || '').toLowerCase();
          const targetSub = selectedSubCategory.toLowerCase();
          if (prodSub !== targetSub && !prodSub.includes(targetSub)) {
            return false;
          }
        }

        // 4. Filtro por texto de búsqueda
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase().trim();
          const matchesTitle = product.title.toLowerCase().includes(q);
          const matchesDesc = product.description.toLowerCase().includes(q);
          const matchesSection = (product.section || '').toLowerCase().includes(q);
          const matchesCat = product.category.toLowerCase().includes(q);
          const matchesSub = (product.subCategory || product.subcategory || '').toLowerCase().includes(q);
          const matchesTag = (product.tags || []).some((t) => t.toLowerCase().includes(q));
          const matchesSku = (product.sku || '').toLowerCase().includes(q);
          if (
            !matchesTitle &&
            !matchesDesc &&
            !matchesSection &&
            !matchesCat &&
            !matchesSub &&
            !matchesTag &&
            !matchesSku
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = getProductPricing(a).finalPrice;
        const priceB = getProductPricing(b).finalPrice;
        if (sortBy === 'price_asc') return priceA - priceB;
        if (sortBy === 'price_desc') return priceB - priceA;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'discount') return (b.discountPercent ?? 0) - (a.discountPercent ?? 0);
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [
    normalizedProducts,
    selectedSection,
    selectedCategory,
    selectedSubCategory,
    saleSubCategory,
    searchTerm,
    sortBy
  ]);

  // Al presionar "+ Carro": si el producto tiene talla, abrir ventanita para elegir talla (agrega 1 automático)
  const handleQuickAdd = (product: Product) => {
    const detailedProd =
      normalizedProducts.find((p) => p.id === product.id) || (product as ProductStockDetail);

    if (isProductOutOfStock(detailedProd)) return;

    if (productRequiresSizeSelection(detailedProd)) {
      setQuickAddModalProduct(detailedProd);
      return;
    }

    // Si no utiliza talla, agrega 1 al carrito directamente
    addToCart(
      detailedProd,
      'Única',
      detailedProd.colors?.[0] || { name: 'Black', hex: '#000000' },
      undefined,
      1
    );
    setAddedProductId(detailedProd.id);
    setTimeout(() => setAddedProductId(null), 2000);
  };

  const handleConfirmQuickAddSize = (product: ProductWithSizeStock, chosenSize: string) => {
    if (getStockForSize(product, chosenSize) <= 0) return;
    addToCart(
      product,
      chosenSize,
      product.colors?.[0] || { name: 'Black', hex: '#000000' },
      undefined,
      1
    );
    setAddedProductId(product.id);
    setQuickAddModalProduct(null);
    setTimeout(() => setAddedProductId(null), 2000);
  };

  const resetAllFilters = () => {
    setSelectedSection('all');
    setSelectedCategory('all');
    setSelectedSubCategory('all');
    setSaleSubCategory('all');
    setSearchTerm('');
    setSortBy('featured');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Ventana de Búsqueda y Filtros estilo Windows XP Explorer */}
      <WindowFrame
        title="Explorador_Catalogo.exe - [Buscador Avanzado & Esquema de Categorías (MongoDB)]"
        icon={<PixelIcon name="search" size={16} />}
        statusBarText={`ELEMENTOS ENCONTRADOS: ${filteredProducts.length} DE ${normalizedProducts.length} // CATÁLOGO MONGODB ACTIVO`}
      >
        <div className="space-y-3">
          {/* Fila Principal de Búsqueda */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px] flex items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar prenda, sección, categoría, subcategoría, color o SKU..."
                className="w-full winxp-input px-3 pr-8 py-1.5 text-xs text-black placeholder-gray-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1.5 text-xs font-bold text-gray-500 hover:text-black cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Barra Progresiva del Esquema Actual: 1° Sección -> 2° Categorías -> 3° Subcategorías */}
          <div className="bg-[#f4f7fb] border border-[#a0c0e0] p-2.5 rounded-xs space-y-2.5">
            {/* NIVEL 1: SECCIÓN (Primero en la barra, con "Limpiar Filtros" a la derecha de "Otros") + ORDEN */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-700 mr-1">Sección:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSection('all');
                    setSelectedCategory('all');
                    setSelectedSubCategory('all');
                    setSaleSubCategory('all');
                  }}
                  className={`winxp-button text-[11px] py-0.5 px-2.5 flex items-center gap-1 cursor-pointer ${
                    selectedSection === 'all' && selectedCategory !== 'Ofertas'
                      ? 'winxp-button-primary bg-blue-100 font-bold text-blue-950'
                      : 'bg-white text-gray-800 hover:bg-blue-50'
                  }`}
                >
                  {renderSectionIcon('all')}
                  <span>Todas ({taxonomyCounts.bySection.all || 0})</span>
                </button>
                {activeTaxonomy.map((sec) => {
                  const isSecActive = selectedSection === sec.section;
                  return (
                    <button
                      key={sec.section}
                      type="button"
                      onClick={() => {
                        setSelectedSection(sec.section);
                        setSelectedCategory('all');
                        setSelectedSubCategory('all');
                        setSaleSubCategory('all');
                      }}
                      className={`winxp-button text-[11px] py-0.5 px-2.5 flex items-center gap-1 cursor-pointer ${
                        isSecActive
                          ? 'winxp-button-primary bg-blue-100 font-bold text-blue-950'
                          : 'bg-white text-gray-800 hover:bg-blue-50'
                      }`}
                    >
                      {renderSectionIcon(sec.section)}
                      <span>
                        {sec.section} ({taxonomyCounts.bySection[sec.section] || 0})
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="winxp-button text-[11px] py-0.5 px-2.5 text-blue-900 font-bold flex items-center gap-1 cursor-pointer ml-1"
                >
                  <RotateCcw className="w-3 h-3 text-blue-700" />
                  <span>Limpiar Filtros</span>
                </button>
              </div>

              {/* Selector de Orden */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="font-bold text-gray-700">Orden:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="winxp-input py-0.5 px-1.5 text-xs bg-white"
                >
                  <option value="featured">Destacados</option>
                  <option value="price_asc">Menor Precio</option>
                  <option value="price_desc">Mayor Precio</option>
                  <option value="discount">Mayor % Descuento</option>
                  <option value="rating">Mejor Calificación</option>
                </select>
              </div>
            </div>

            {/* NIVEL 2: CATEGORÍAS (Se despliegan al seleccionar una Sección) */}
            {selectedSection !== 'all' && categoryButtons.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-blue-200/80 text-xs animate-fadeIn">
                <span className="font-bold text-gray-700 mr-1 text-[11px]">
                  Categorías de {selectedSection}:
                </span>
                {categoryButtons.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const isOfertas = cat === 'Ofertas';
                  const count = isOfertas
                    ? taxonomyCounts.saleCountsMap.all || 0
                    : cat === 'all'
                    ? taxonomyCounts.byCategory.all || 0
                    : taxonomyCounts.byCategory[cat] || 0;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedSubCategory('all');
                        if (cat !== 'Ofertas') {
                          setSaleSubCategory('all');
                        }
                      }}
                      className={`winxp-button text-[11px] py-0.5 px-2.5 flex items-center gap-1 transition-all cursor-pointer ${
                        isOfertas
                          ? isSelected
                            ? 'bg-red-600 text-white font-bold border-red-800 shadow-sm'
                            : 'bg-red-50 text-red-700 border-red-300 font-bold hover:bg-red-100'
                          : isSelected
                          ? 'winxp-button-primary bg-blue-100 font-bold text-blue-950'
                          : 'bg-white'
                      }`}
                    >
                      {isOfertas ? (
                        <>
                          <Flame
                            className={`w-3.5 h-3.5 ${
                              isSelected ? 'text-yellow-300 animate-pulse' : 'text-red-600'
                            }`}
                          />
                          <span>Ofertas</span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ml-0.5 ${
                              isSelected ? 'bg-red-800 text-yellow-200' : 'bg-red-200 text-red-900'
                            }`}
                          >
                            {count}
                          </span>
                        </>
                      ) : (
                        <>
                          <PixelIcon name="folder" size={13} className="mr-0.5" />
                          <span>{cat === 'all' ? 'Todas las Categorías' : cat}</span>
                          <span className="text-[9.5px] text-gray-500 font-mono ml-0.5">
                            ({count})
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* NIVEL 3: SUBCATEGORÍAS (Se despliegan al seleccionar una Categoría de la Sección) */}
            {selectedSection !== 'all' && selectedCategory !== 'all' && activeSubcategories.length > 0 && (
              <div className="bg-[#f0f4fa] border border-[#a0c0e0] p-2 winxp-bevel-in rounded-sm space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between gap-2 border-b border-blue-200/70 pb-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#003c74] font-bold">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Subcategorías de {selectedSection} › {selectedCategory}:
                    </span>
                  </div>
                  {selectedSubCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedSubCategory('all')}
                      className="text-[10px] text-blue-700 hover:underline cursor-pointer font-bold"
                    >
                      Ver todas las subcategorías
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSubCategory('all')}
                    className={`winxp-button text-[10.5px] py-0.5 px-2 transition-all cursor-pointer flex items-center gap-1 ${
                      selectedSubCategory === 'all'
                        ? 'winxp-button-primary bg-blue-100 font-bold border-blue-700'
                        : 'bg-white text-gray-800'
                    }`}
                  >
                    {renderSubCategoryIcon('Todas')}
                    <span>Todas ({taxonomyCounts.bySubCategory.all || 0})</span>
                  </button>
                  {activeSubcategories.map((sub) => {
                    const isSelected = selectedSubCategory === sub;
                    const subCount = taxonomyCounts.bySubCategory[sub] || 0;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSelectedSubCategory(sub)}
                        className={`winxp-button text-[10.5px] py-0.5 px-2 transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'winxp-button-primary bg-blue-100 font-bold border-blue-700'
                            : 'bg-white text-gray-800 hover:bg-blue-50'
                        }`}
                      >
                        {renderSubCategoryIcon(sub)}
                        <span>{sub}</span>
                        <span className="text-[9px] text-gray-500 font-mono">({subCount})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================
              SUB-FILTRO CONDICIONAL DEDICADO A LA SECCIÓN 'OFERTAS'
              =================================================================== */}
          {selectedCategory === 'Ofertas' && (
            <div className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border border-red-300 p-2.5 winxp-bevel-in rounded-sm space-y-2 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-200/80 pb-1.5">
                <div className="flex items-center gap-1.5 text-xs text-red-900 font-bold">
                  <Tag className="w-3.5 h-3.5 text-red-600" />
                  <span>Sub-filtrar Ofertas por Categoría del Esquema Actual:</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {saleSubCategories.map((sub) => {
                  const count = taxonomyCounts.saleCountsMap[sub.id] ?? 0;
                  const isSelected = saleSubCategory === sub.id;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSaleSubCategory(sub.id);
                      }}
                      className={`winxp-button text-[11px] py-1 px-2.5 flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-600 text-white font-bold border-red-800 shadow-xs'
                          : 'bg-white text-gray-800 hover:bg-red-100/60 border-gray-400'
                      }`}
                    >
                      {renderSaleCategoryIcon(sub.label, isSelected)}
                      <span>{sub.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isSelected ? 'bg-white text-red-700' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </WindowFrame>

      {/* Grilla de Resultados con ProductCard */}
      {isLoadingCatalog ? (
        <div className="bg-white p-8 border border-gray-400 winxp-bevel-in text-center space-y-2">
          <div className="text-xs font-bold text-blue-900 animate-pulse">
            Cargando catálogo oficial desde MongoDB...
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-8 border border-gray-400 winxp-bevel-in text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <PixelIcon name="info" size={24} />
          </div>
          <h3 className="font-bold text-gray-800 text-sm">
            No se encontraron prendas con los filtros seleccionados
          </h3>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            {selectedCategory === 'Ofertas' && saleSubCategory !== 'all'
              ? `No hay ofertas activas en la categoría "${saleSubCategory}". Prueba seleccionando "Todas las Ofertas".`
              : 'Prueba buscando con otros términos o seleccionando otra sección, categoría o subcategoría.'}
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold text-blue-900 cursor-pointer"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currentStock={product.totalStock}
              isRecentlyAdded={addedProductId === product.id}
              onQuickAdd={handleQuickAdd}
              onWishlistToggle={(_prod, res) => {
                if (res.requiresAuth) {
                  setShowAuthModal(true);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Ventanita de Selección de Talla al presionar "+ Carro" en productos con talla */}
      <QuickAddSizeModal
        product={quickAddModalProduct}
        onClose={() => setQuickAddModalProduct(null)}
        onConfirmSize={handleConfirmQuickAddSize}
      />

      {/* Modal de Advertencia de Autenticación para Lista de Deseos */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm winxp-window-active border-2 border-[#0055ea] shadow-2xl animate-in zoom-in-95">
            <div className="winxp-titlebar py-1 px-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-white font-bold">
                <PixelIcon name="warning" size={14} />
                <span>Acceso Exclusivo Requerido</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="winxp-close-button text-xs w-4 h-4 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-[#ece9d8] space-y-3 text-xs text-gray-800 font-sans">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0 shadow-xs">
                  <PixelHeart filled={true} size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-1">
                    Lista de Deseos Exclusiva
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-[11px]">
                    La Lista de Deseos te permite guardar tus prendas favoritas y recibir alertas de reposición de stock. Esta función requiere una cuenta registrada.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="winxp-button text-xs py-1 px-3 cursor-pointer"
                >
                  Cancelar
                </button>
                <Link
                  to="/profile"
                  className="winxp-button winxp-button-primary text-xs py-1 px-4 font-bold text-blue-900 cursor-pointer"
                  onClick={() => setShowAuthModal(false)}
                >
                  Iniciar Sesión / Registrarse
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogView;
