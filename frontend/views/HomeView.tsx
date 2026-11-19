import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useBranch } from '../context/BranchContext';
import { Product } from '../types';
import { PixelIcon } from '../components/common/PixelIcon';
import {
  normalizeProductToCurrentTaxonomy,
  type ProductStockDetail
} from './admin/ProductStockSummaryView';
import {
  CategoriesVisibilityConfig,
  loadCategoriesVisibility,
  isProductTaxonomyActive
} from './admin/ProductManagerView';
import {
  QuickAddSizeModal,
  ProductWithSizeStock,
  productRequiresSizeSelection
} from '../components/common/QuickAddSizeModal';
import api from '../api/axios';

/* =========================================================================
   Componentes Windows XP Design System
   ========================================================================= */
import { WindowsMediaPlayerWidget } from '../components/home/WindowsMediaPlayerWidget/WindowsMediaPlayerWidget';
import { AdminImageCarousel } from '../components/home/AdminImageCarousel/AdminImageCarousel';
import { FeaturedCatalog } from '../components/home/FeaturedCatalog/FeaturedCatalog';
import { MasterStatusBar } from '../components/home/MasterStatusBar/MasterStatusBar';
import { ContactoWidget } from '../components/home/ContactoWidget';
import { WindowsSystemDialog } from '../components/home/WindowsSystemDialog/WindowsSystemDialog';

import './HomeView.css';

/**
 * Vista: HomeView (Windows XP Luna Edition)
 *
 * Orquestador principal de la experiencia de compra bajo la dirección
 * artística nostálgica de Windows XP conectada en tiempo real a MongoDB.
 */
export const HomeView: React.FC = () => {
  const { addToCart } = useCart();
  const { activeBranchId } = useBranch();

  const [showContacto, setShowContacto] = useState<boolean>(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState<boolean>(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [quickAddModalProduct, setQuickAddModalProduct] = useState<ProductStockDetail | null>(null);
  const [visibilityConfig, setVisibilityConfig] = useState<CategoriesVisibilityConfig>(() =>
    loadCategoriesVisibility()
  );

  // Estado sincronizado exclusivamente con la colección 'products' de MongoDB
  const [syncedProducts, setSyncedProducts] = useState<ProductStockDetail[]>([]);
  const [isLoadingHomeProducts, setIsLoadingHomeProducts] = useState<boolean>(true);

  useEffect(() => {
    const syncVisibility = () => setVisibilityConfig(loadCategoriesVisibility());
    window.addEventListener('nl_categories_visibility_updated', syncVisibility);
    window.addEventListener('storage', syncVisibility);
    return () => {
      window.removeEventListener('nl_categories_visibility_updated', syncVisibility);
      window.removeEventListener('storage', syncVisibility);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchHomeProducts = async () => {
      setIsLoadingHomeProducts(true);
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
          ) as ProductStockDetail[];

          setSyncedProducts(mapped);
          localStorage.setItem('nolimits_products_catalog_v2', JSON.stringify(mapped));
        }
      } catch (err) {
        console.error('Error cargando productos destacados en HomeView desde MongoDB:', err);
      } finally {
        if (isMounted) {
          setIsLoadingHomeProducts(false);
        }
      }
    };

    fetchHomeProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const featuredProducts = useMemo(() => {
    return syncedProducts
      .filter((product) => !product.isHidden && isProductTaxonomyActive(product, visibilityConfig))
      .slice(0, 8);
  }, [syncedProducts, visibilityConfig]);

  const handleQuickAdd = (product: Product) => {
    const detailedProd =
      syncedProducts.find((p) => p.id === product.id) || (product as ProductStockDetail);

    if (productRequiresSizeSelection(detailedProd)) {
      setQuickAddModalProduct(detailedProd);
      return;
    }

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

  return (
    <div className="home-view-wrapper">
      {/* Diálogo emergente estilo "Mensaje del Sistema Windows XP" (opcional/descartable) */}
      {showWelcomeDialog && (
        <WindowsSystemDialog
          title="Nolimits.exe - Inicialización Completa"
          message="Bienvenido al nuevo sistema operativo de compra NoLimits en Windows XP. Su conexión con el servidor central de Santiago y Valparaíso está activa."
          iconType="info"
          onOk={() => setShowWelcomeDialog(false)}
          onCancel={() => setShowWelcomeDialog(false)}
        />
      )}

      {/* Ventana Maestra de Windows XP Luna */}
      <div className="master-xp-window">
        {/* Barra de Título Luna Azul */}
        <header className="winxp-titlebar">
          <div className="winxp-titlebar-title">
            <PixelIcon name="windows-flag" size={16} />
            <span>Nolimits Apparel OS - [Escritorio Principal Windows XP]</span>
          </div>

          <div className="winxp-controls">
            <button
              type="button"
              className="winxp-btn-ctrl winxp-btn-min"
              title="Minimizar"
            >
              _
            </button>
            <button
              type="button"
              className="winxp-btn-ctrl winxp-btn-max"
              title="Maximizar"
            >
              □
            </button>
            <button
              type="button"
              onClick={() => setShowWelcomeDialog(true)}
              className="winxp-btn-ctrl winxp-btn-close"
              title="Cerrar ventana / Ayuda del sistema"
            >
              ×
            </button>
          </div>
        </header>

        {/* Menú de ventana clásico */}
        <nav className="winxp-menubar">
          <span className="winxp-menu-item">Archivo</span>
          <span className="winxp-menu-item">Edición</span>
          <span className="winxp-menu-item">Ver</span>
          <span className="winxp-menu-item">Herramientas</span>
          <span className="winxp-menu-item" onClick={() => setShowWelcomeDialog(true)}>Ayuda</span>
        </nav>

        {/* Cuerpo Interior de la Ventana */}
        <main className="master-xp-body">
          {/* Ventana de Reproductor Multimedia / Video / GIF */}
          <WindowsMediaPlayerWidget />

          {/* Panel Desplegable de Mesa de Ayuda / Soporte */}
          {showContacto && (
            <div className="bg-white p-3 border border-gray-400 winxp-bevel-in">
              <div className="flex items-center justify-between pb-2 border-b border-gray-300 font-bold text-xs text-blue-900">
                <span className="flex items-center gap-1.5">
                  <PixelIcon name="whatsapp" size={15} />
                  Mesa de Ayuda & Atención al Cliente
                </span>
                <button
                  type="button"
                  onClick={() => setShowContacto(false)}
                  className="text-gray-500 hover:text-red-600 font-bold text-xs"
                >
                  [Cerrar]
                </button>
              </div>
              <ContactoWidget onClose={() => setShowContacto(false)} className="w-full mt-2" />
            </div>
          )}

          {/* Carrusel de Campañas con Movimiento Automático y Gestión de Administrador */}
          <AdminImageCarousel />

          {/* Catálogo de Prendas Destacadas desde MongoDB */}
          {isLoadingHomeProducts ? (
            <div className="bg-white p-6 border border-gray-400 winxp-bevel-in text-center">
              <span className="text-xs font-bold text-blue-900 animate-pulse">
                Sincronizando prendas destacadas desde MongoDB...
              </span>
            </div>
          ) : (
            <FeaturedCatalog
              products={featuredProducts}
              activeBranchId={activeBranchId}
              onQuickAdd={handleQuickAdd}
              addedProductId={addedProductId}
            />
          )}
        </main>

        {/* Barra de Estado Inferior con Ping y Métricas */}
        <MasterStatusBar />
      </div>

      {/* Ventanita de Selección de Talla al presionar "+ Carro" en productos con talla */}
      <QuickAddSizeModal
        product={quickAddModalProduct}
        onClose={() => setQuickAddModalProduct(null)}
        onConfirmSize={handleConfirmQuickAddSize}
      />
    </div>
  );
};


