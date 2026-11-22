import React, { useState, useMemo, useLayoutEffect, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Lock
} from 'lucide-react';
import { WindowFrame } from '../components/layout/WindowFrame';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS } from '../services/mockData';
import {
  loadAndSyncProductsStock,
  normalizeProductToCurrentTaxonomy,
  type ProductStockDetail
} from './admin/ProductStockSummaryView';
import { productRequiresSizeSelection } from '../components/common/QuickAddSizeModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { PixelIcon, PixelHeart } from '../components/common/PixelIcon';
import { SoldOutDetailBanner } from '../components/common/SoldOutState';
import { ProductReviewsSection } from '../components/product/ProductReviewsSection';
import { Product } from '../types';
import api from '../api/axios';
import { getProductPricing } from '../services/productPresentation';
import { getProductSizesWithStock, getStockForSize, isProductOutOfStock, normalizeStockSize } from '../services/productStock';
import '../components/home/ProductCard/ProductCard.css';

export const ProductDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const forceSoldOut = searchParams.get('agotado') === '1';

  const passedProduct = (location.state as { product?: Product } | null)?.product;

  // Estado sincronizado en tiempo real desde la colección 'products' de MongoDB
  const [mongoProductList, setMongoProductList] = useState<Product[]>([]);
  const [stockLookupState, setStockLookupState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;
    setStockLookupState('loading');
    api
      .get('/products')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && isMounted) {
          const normalizedList: Product[] = res.data.data.map((doc: any, idx: number) =>
            normalizeProductToCurrentTaxonomy({
              ...doc,
              id: String(doc._id || doc.id || `prod_${idx}`),
              title: doc.title || doc.name || 'Prenda NoLimits',
              subCategory: doc.subCategory || doc.subcategory || 'Poleras'
            })
          );
          setMongoProductList(normalizedList);
          setStockLookupState('ready');
          localStorage.setItem('nolimits_products_catalog_v2', JSON.stringify(normalizedList));
        }
      })
      .catch((err) => {
        console.error('Error sincronizando detalle de producto desde MongoDB:', err);
        if (isMounted) setStockLookupState('error');
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const foundProduct = useMemo<Product>(() => {
    const safeId = (id || '').toLowerCase();

    if (mongoProductList.length > 0) {
      const fromMongo = mongoProductList.find(
        (p) => p.id === id || (p.sku && p.sku.toLowerCase() === safeId)
      );
      if (fromMongo) return fromMongo;
    }
    if (
      passedProduct &&
      (passedProduct.id === id || (passedProduct.sku && passedProduct.sku.toLowerCase() === safeId))
    ) {
      return normalizeProductToCurrentTaxonomy(passedProduct);
    }
    const allProducts = loadAndSyncProductsStock();
    const rawFound =
      allProducts.find((p) => p.id === id || (p.sku && p.sku.toLowerCase() === safeId)) ||
      INITIAL_PRODUCTS.find((p) => p.id === id || (p.sku && p.sku.toLowerCase() === safeId)) ||
      mongoProductList[0] ||
      allProducts[0] ||
      INITIAL_PRODUCTS[0];
    return normalizeProductToCurrentTaxonomy(rawFound);
  }, [id, passedProduct, mongoProductList]);

  const safeImages: string[] =
    Array.isArray(foundProduct?.images) && foundProduct.images.length > 0
      ? foundProduct.images
      : ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80'];

  const safeSizes: string[] =
    Array.isArray(foundProduct?.sizes) && foundProduct.sizes.length > 0
      ? foundProduct.sizes
      : Array.isArray((foundProduct as any)?.sizeBreakdown) && (foundProduct as any).sizeBreakdown.length > 0
      ? (foundProduct as any).sizeBreakdown.map((sb: any) => String(sb.size || 'Única'))
      : ['Única'];

  const safeColors =
    Array.isArray(foundProduct?.colors) && foundProduct.colors.length > 0
      ? foundProduct.colors
      : [{ name: 'Void Black', hex: '#000000' }];

  const computedTotalStock =
    typeof foundProduct?.totalStock === 'number'
      ? foundProduct.totalStock
      : Array.isArray((foundProduct as any)?.sizeBreakdown)
      ? (foundProduct as any).sizeBreakdown.reduce(
          (acc: number, sb: any) => acc + (Number(sb.quantity ?? sb.stock ?? 0) || 0),
          0
        )
      : 0;

  const product: Product = {
    ...foundProduct,
    id: String((foundProduct as any)?._id || foundProduct?.id || id || 'prod_default'),
    sku: String(foundProduct?.sku || 'NL-SKU'),
    title: String(foundProduct?.title || (foundProduct as any)?.name || 'Prenda NoLimits'),
    description: String(foundProduct?.description || 'Prenda oficial NoLimits.'),
    category: String(foundProduct?.category || 'General'),
    price: Number(foundProduct?.price) || 0,
    images: safeImages,
    sizes: safeSizes,
    colors: safeColors,
    totalStock: forceSoldOut ? 0 : computedTotalStock,
    stockPerBranch: forceSoldOut
      ? { vina_del_mar: 0, valparaiso: 0, quilpue: 0 }
      : foundProduct?.stockPerBranch || { vina_del_mar: computedTotalStock, valparaiso: 0, quilpue: 0 }
  };

  const { addToCart, items: cartItems } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const isWishlisted = isInWishlist(product.id);

  const [wishlistAlert, setWishlistAlert] = useState<{ message: string; type: 'added' | 'removed' } | null>(null);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);

  const hasSizeOption = productRequiresSizeSelection(product);
  // Solo la respuesta actual de MongoDB permite habilitar compras.
  // Un producto de caché o del estado de navegación NO verifica inventario.
  const isStockVerified = stockLookupState === 'ready' && mongoProductList.some(
    (p) => p.id === product.id || (p.sku && p.sku.toLowerCase() === (id || '').toLowerCase())
  );
  const sizeOptions = getProductSizesWithStock(product);
  const isSoldOut = isStockVerified && isProductOutOfStock(product);
  const pricing = getProductPricing(product);

  // Si S está agotada, el selector empieza en la primera talla con unidades.
  const initialSize = hasSizeOption
    ? sizeOptions.find((opt) => opt.stock > 0)?.size || ''
    : 'Única';

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [selectedColor, setSelectedColor] = useState(
    product.colors?.[0] || { name: 'Void Black', hex: '#000000' }
  );
  const [addedAlert, setAddedAlert] = useState(false);
  const prevProductIdRef = useRef(product.id);

  // Al cambiar de producto restablecer la foto, el color y la primera talla válida.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (prevProductIdRef.current !== product.id) {
      prevProductIdRef.current = product.id;
      setActiveImageIndex(0);
      setSelectedSize(initialSize);
      setSelectedColor(product.colors[0] || { name: 'Void Black', hex: '#000000' });
    }
  }, [product.id, id]);

  // Al recibir stock actualizado, una talla previamente elegida puede estar agotada.
  useEffect(() => {
    if (!isStockVerified || !hasSizeOption) return;
    if (getStockForSize(product, selectedSize) > 0) return;
    setSelectedSize(sizeOptions.find((option) => option.stock > 0)?.size || '');
  }, [isStockVerified, mongoProductList, id, hasSizeOption]);

  const productReviews = useMemo(
    () =>
      INITIAL_REVIEWS.filter(
        (r) => r.productId === product.id || r.productId === 'prod_cyber_hoodie_01'
      ),
    [product.id]
  );

  const handleAddToCart = () => {
    if (!isStockVerified || isSoldOut) return;
    const chosenSize = hasSizeOption ? selectedSize : 'Única';
    const available = getStockForSize(product, chosenSize);
    const inCart = cartItems.filter((item) => item.productId === product.id && normalizeStockSize(item.selectedSize) === normalizeStockSize(chosenSize))
      .reduce((total, item) => total + item.quantity, 0);
    if (!chosenSize || available <= inCart) return;
    addToCart(product, chosenSize, selectedColor, undefined, 1);
    setAddedAlert(true);
    setTimeout(() => setAddedAlert(false), 3000);
  };

  const handleToggleWishlist = () => {
    const result = toggleWishlist(product);
    if (result.requiresAuth) {
      setShowAuthRequiredModal(true);
      return;
    }

    if (result.isAdded) {
      setWishlistAlert({ message: '¡Prenda guardada con éxito en tu Lista de Deseos!', type: 'added' });
    } else {
      setWishlistAlert({ message: 'Prenda removida de tu Lista de Deseos.', type: 'removed' });
    }
    setTimeout(() => {
      setWishlistAlert(null);
    }, 3500);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Ventana de Detalles de Producto estilo Windows XP */}
      <WindowFrame
        title="Detalles de Productos.exe"
        icon={<Info className="w-4 h-4 text-white shrink-0" />}
        statusBarText={`SKU: ${product.sku} // ${product.title.toUpperCase()} // STOCK MONGODB: ${product.totalStock} UNIDADES`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Galería de Imágenes (700x436 con Opción 1: Ambient Blur + object-fit: contain centrado) */}
          <div className="lg:col-span-6 space-y-3 max-w-[700px] mx-auto w-full">
            <div className="relative w-[700px] max-w-full h-[436px] aspect-[700/436] mx-auto border border-gray-400 bg-[#f0f2f5] winxp-bevel-in flex items-center justify-center overflow-hidden shadow-inner">
              {/* Fondo Ambient Blur para rellenar el marco 700x436 sin bordes vacíos */}
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="sync"
                className="product-card-xp-img-blur"
              />

              {/* Imagen principal centrada y completa sin deformarse */}
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                loading="eager"
                decoding="sync"
                className="product-card-xp-img"
              />

              {/* Botón flotante de un corazón pixelado estilo Windows XP para Lista de Deseos sobre la imagen */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`absolute top-2.5 right-2.5 w-8 h-8 winxp-button p-0 z-20 cursor-pointer transition-transform active:scale-95 flex items-center justify-center shadow-md ${
                  isWishlisted
                    ? 'border-red-600 bg-rose-50 shadow-inner'
                    : 'border-[#003c74]'
                }`}
                title={
                  !isAuthenticated
                    ? 'Añadir a Lista de Deseos (Exclusivo para usuarios registrados)'
                    : isWishlisted
                    ? 'Quitar de mi Lista de Deseos'
                    : 'Añadir a mi Lista de Deseos'
                }
                aria-label="Botón de corazón pixelado estilo Windows XP para lista de deseos"
              >
                <PixelHeart filled={isWishlisted} size={20} />
              </button>

              {/* Etiqueta de descuento oficial sobre la imagen */}
              {pricing.hasDiscount && !isSoldOut && (
                <span
                  className="product-card-xp-discount product-detail-discount-badge"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontFamily: 'Tahoma, sans-serif',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '2px',
                    boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.35)',
                    border: '1px solid #166534',
                    zIndex: 10,
                  }}
                >
                  -{pricing.discountPercent}% OFF
                </span>
              )}

              {/* Botones con flechas visibles y claras para cambiar de imagen */}
              {product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1))}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 winxp-button text-xs w-8 h-8 p-0 flex items-center justify-center shadow-md bg-white/95 hover:bg-white text-gray-900 z-10"
                    aria-label="Foto anterior"
                    title="Foto anterior (←)"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-800 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 winxp-button text-xs w-8 h-8 p-0 flex items-center justify-center shadow-md bg-white/95 hover:bg-white text-gray-900 z-10"
                    aria-label="Foto siguiente"
                    title="Foto siguiente (→)"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-800 stroke-[2.5]" />
                  </button>
                </>
              )}
            </div>

            {/* Miniaturas */}
            {product.images.length > 1 && (
              <div className="flex gap-2 justify-center">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 border ${
                      activeImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-400' : 'border-gray-400'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detalles y Configuración de Compra (Col 7-12) */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <div className="text-xs font-bold text-blue-700 uppercase">
                Categoría: {product.category}
              </div>
              <h1 className="text-xl font-bold text-gray-900 mt-1">
                {product.title}
              </h1>
              {/* Precios con descuento al lado derecho del precio original tachado */}
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <span className="text-sm font-bold text-red-700">
                  ${pricing.finalPrice.toLocaleString('es-CL')} CLP
                </span>
                {pricing.hasDiscount && (
                  <span className="text-xs text-gray-500 line-through font-normal">
                    ${product.price.toLocaleString('es-CL')}
                  </span>
                )}
                {pricing.hasDiscount && (
                  <span
                    className="product-detail-discount-badge font-bold text-[11px] px-2 py-0.5 rounded-xs shadow-xs tracking-wider border"
                    style={{
                      backgroundColor: '#15803d',
                      borderColor: '#166534',
                      color: '#ffffff',
                    }}
                  >
                    -{pricing.discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Si el producto está agotado: Renderizar componente específico de Sin Stock y opción de Lista de Deseos */}
            {isSoldOut ? (
              <div className="space-y-3">
                <SoldOutDetailBanner productTitle={product.title} sku={product.sku} />
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`winxp-button text-xs py-2 px-4 w-full font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all ${
                    isWishlisted
                      ? 'bg-rose-50 border-rose-500 text-rose-800 hover:bg-rose-100 winxp-button-active'
                      : 'text-gray-800 hover:bg-gray-100 hover:text-rose-700'
                  }`}
                  title={
                    !isAuthenticated
                      ? 'Añadir a Lista de Deseos (Exclusivo para usuarios registrados)'
                      : isWishlisted
                      ? 'Quitar de mi Lista de Deseos'
                      : 'Añadir a mi Lista de Deseos'
                  }
                >
                  <PixelHeart filled={isWishlisted} size={18} />
                  <span>
                    {isWishlisted
                      ? 'En tu Lista de Deseos (Te avisaremos cuando vuelva a haber stock)'
                      : 'Guardar en Lista de Deseos para Alertas de Reposición'}
                  </span>
                </button>

                {wishlistAlert && (
                  <div
                    className={`p-2 border text-xs flex items-center justify-between gap-2 rounded-xs animate-in fade-in ${
                      wishlistAlert.type === 'added'
                        ? 'bg-rose-50 border-rose-400 text-rose-950'
                        : 'bg-gray-100 border-gray-400 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PixelHeart filled={wishlistAlert.type === 'added'} size={15} />
                      <span className="font-bold">{wishlistAlert.message}</span>
                    </div>
                    {wishlistAlert.type === 'added' && (
                      <Link
                        to="/profile"
                        className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer"
                      >
                        Ver en Mi Perfil →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Selección de Talla con el esquema actual oficial de tallas */}
                {hasSizeOption && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-800 block">
                      Seleccionar Talla Disponible:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {sizeOptions.map(({ size, stock }) => (
                        <button
                          key={size}
                          type="button"
                          disabled={!isStockVerified || stock <= 0}
                          aria-label={`${size}: ${stock <= 0 ? 'Agotada' : `${stock} unidades`}`}
                          title={stock <= 0 ? 'Talla agotada' : `${stock} unidades disponibles`}
                          onClick={() => setSelectedSize(size)}
                          className={`winxp-button text-xs py-1 px-3 ${
                            !isStockVerified || stock <= 0
                              ? 'opacity-50 bg-gray-200 text-gray-500 cursor-not-allowed'
                              : selectedSize === size
                              ? 'winxp-button-primary bg-blue-100 font-bold'
                              : 'cursor-pointer'
                          }`}
                        >
                          {size}{stock <= 0 ? ' — Agotada' : ` (${stock} un.)`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {stockLookupState === 'loading' && (
                  <p className="text-xs text-blue-800">Consultando disponibilidad en inventario...</p>
                )}
                {stockLookupState === 'error' && (
                  <p className="text-xs text-red-700" role="alert">No se pudo consultar el inventario. No es posible agregar productos hasta actualizar la página.</p>
                )}
                {stockLookupState === 'ready' && !isStockVerified && (
                  <p className="text-xs text-red-700" role="alert">Este producto no está disponible en el catálogo vigente.</p>
                )}
                {isStockVerified && hasSizeOption && selectedSize &&
                  cartItems.filter((item) => item.productId === product.id && normalizeStockSize(item.selectedSize) === normalizeStockSize(selectedSize))
                    .reduce((total, item) => total + item.quantity, 0) >= getStockForSize(product, selectedSize) && (
                  <p className="text-xs text-amber-700">Ya tienes todas las unidades disponibles de esta talla en el carrito.</p>
                )}

                {/* Botón de Agregar al Carrito y Botón de un Corazón (Lista de Deseos) */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!isStockVerified || isSoldOut || (hasSizeOption && (!selectedSize || getStockForSize(product, selectedSize) <= 0)) ||
                        cartItems.filter((item) => item.productId === product.id && normalizeStockSize(item.selectedSize) === normalizeStockSize(hasSizeOption ? selectedSize : 'Única'))
                          .reduce((total, item) => total + item.quantity, 0) >= getStockForSize(product, hasSizeOption ? selectedSize : 'Única')}
                      className="winxp-button winxp-button-primary disabled:opacity-45 disabled:cursor-not-allowed text-sm py-2 px-5 flex-1 font-bold text-blue-900 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PixelIcon name="cart" size={16} />
                      <span>AÑADIR AL CARRITO</span>
                    </button>

                    {/* Botón de un corazón para la Lista de Deseos */}
                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      className={`winxp-button text-sm py-2 px-3.5 sm:px-4 font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all ${
                        isWishlisted
                          ? 'bg-rose-50 border-rose-500 text-rose-800 hover:bg-rose-100 winxp-button-active'
                          : 'text-gray-800 hover:bg-gray-100 hover:text-rose-700'
                      }`}
                      title={
                        !isAuthenticated
                          ? 'Añadir a Lista de Deseos (Exclusivo para usuarios registrados)'
                          : isWishlisted
                          ? 'Quitar de mi Lista de Deseos'
                          : 'Añadir a mi Lista de Deseos'
                      }
                      aria-label="Botón de corazón para añadir a la lista de deseos"
                    >
                      <PixelHeart filled={isWishlisted} size={18} />
                      <span className="hidden sm:inline">
                        {isWishlisted ? 'En Lista de Deseos' : 'Lista de Deseos'}
                      </span>
                    </button>
                  </div>

                  {addedAlert && (
                    <div className="mt-2 p-2 bg-green-100 border border-green-500 text-green-900 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                      <span>¡Prenda añadida al carrito con éxito! Ya puedes completar la compra en caja.</span>
                    </div>
                  )}

                  {wishlistAlert && (
                    <div
                      className={`mt-2 p-2 border text-xs flex items-center justify-between gap-2 rounded-xs animate-in fade-in ${
                        wishlistAlert.type === 'added'
                          ? 'bg-rose-50 border-rose-400 text-rose-950'
                          : 'bg-gray-100 border-gray-400 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <PixelHeart filled={wishlistAlert.type === 'added'} size={15} />
                        <span className="font-bold">{wishlistAlert.message}</span>
                      </div>
                      {wishlistAlert.type === 'added' && (
                        <Link
                          to="/profile"
                          className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer"
                        >
                          Ver en Mi Perfil →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Bloque de Descripción Detallada (Ubicado en la parte inferior del botón de añadir al carrito) */}
            <div className="bg-gray-50 border border-gray-300 p-2.5 winxp-bevel-in text-xs text-gray-800 space-y-1">
              <div className="font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-300 pb-1">
                <PixelIcon name="notepad" size={13} />
                <span>Descripción del Producto:</span>
              </div>
              <p className="text-gray-700 leading-relaxed pt-1">
                {product.description}
              </p>
            </div>

            {/* Garantías de Seguridad */}
            <div className="bg-gray-100 border border-gray-300 p-2.5 text-[11px] text-gray-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>Garantía Oficial NoLimits Windows XP</span>
              </div>
              <div>• Cambios presenciales de talla sin costo en cualquiera de nuestras sucursales físicas.</div>
              <div>• Transacción validada automáticamente por Webpay Plus y boleta digital instantánea.</div>
            </div>
          </div>
        </div>

        {/* Sección de Reseñas de Clientes con Filtros y Carga de Fotos Reales */}
        <ProductReviewsSection
          product={product}
          initialReviews={productReviews}
        />
      </WindowFrame>

      {/* =========================================================================
          MODAL ESTILO WINDOWS XP: ACCESO EXCLUSIVO PARA USUARIOS REGISTRADOS
          ========================================================================= */}
      {showAuthRequiredModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-md bg-[#ece9d8] border-2 border-blue-900 shadow-2xl winxp-bevel-out">
            {/* Barra de Título Windows XP */}
            <div className="winxp-titlebar flex items-center justify-between px-2 py-1 select-none text-white">
              <div className="winxp-titlebar-title flex items-center gap-1.5 text-xs text-white font-bold">
                <PixelHeart filled={true} size={14} />
                <span>Lista_de_Deseos.exe - [Usuario No Registrado]</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthRequiredModal(false)}
                className="winxp-btn-ctrl winxp-btn-close w-4 h-4 text-[10px] font-bold text-white flex items-center justify-center cursor-pointer"
                title="Cerrar"
              >
                ×
              </button>
            </div>

            {/* Contenido Windows XP */}
            <div className="p-4 space-y-3.5 bg-white text-xs text-gray-800">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border-2 border-amber-400 rounded-xs winxp-bevel-in">
                <div className="p-2 bg-amber-100 border border-amber-300 rounded-full shrink-0">
                  <Lock className="w-5 h-5 text-amber-700" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-amber-950 uppercase">
                    Función Exclusiva para Clientes Registrados
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Para añadir <strong>"{product.title}"</strong> a tu <strong>Lista de Deseos</strong> y guardar tus prendas favoritas con alertas de stock, debes contar con una cuenta registrada e iniciar sesión.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-950 text-[11px] space-y-1">
                <div className="font-bold text-blue-900">¿Por qué registrarte en NoLimits?</div>
                <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                  <li>Guarda prendas sin límite y consúltalas en tu Perfil de Usuario.</li>
                  <li>Recibe avisos inmediatos cuando repongamos stock en tiendas.</li>
                  <li>Acumula Puntos NoLimits en tus compras y canjea cupones de descuento.</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setShowAuthRequiredModal(false)}
                  className="winxp-button text-xs py-1.5 px-3.5 text-gray-800 font-bold cursor-pointer"
                >
                  Continuar como Invitado
                </button>
                <Link
                  to="/auth"
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-sm text-center"
                >
                  <span>Iniciar Sesión / Registrarme →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
