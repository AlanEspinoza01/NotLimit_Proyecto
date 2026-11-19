import React, { useState, useMemo, useRef, useEffect } from 'react';
import { INITIAL_PRODUCTS } from '../../services/mockData';
import { Product } from '../../types';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import api from '../../api/axios'; // <--- AÑADE ESTA LÍNEA AQUÍ

import '../../components/admin/products/ProductManagerView.css';
import {
  STORAGE_CATALOG_KEY,
  SIZES_ZAPATILLAS,
  SIZES_VESTUARIO_HOMBRE,
  SIZES_VESTUARIO_MUJER,
  SIZES_PANTALON_HOMBRE,
  SIZES_PANTALON_MUJER,
  TaxonomyCategory,
  SectionTaxonomy,
  PRODUCT_TAXONOMY,
  STORAGE_CATEGORIES_VISIBILITY_KEY,
  CategoriesVisibilityConfig,
  loadCategoriesVisibility,
  saveCategoriesVisibility,
  isSectionActive,
  isCategoryActive,
  isSubcategoryActive,
  isProductTaxonomyActive,
  getActiveProductTaxonomy,
  SPECIAL_CATEGORIES,
  SHIPPING_TIERS,
  ShippingTierItem,
  formatCLP,
  parseCLPInput,
  SizeItem
} from '../../components/admin/products/productManagerTypes';
import { ProductManagerHeader } from '../../components/admin/products/ProductManagerHeader';
import { ProductFormPanel } from '../../components/admin/products/ProductFormPanel';
import { ProductLivePreviewPanel } from '../../components/admin/products/ProductLivePreviewPanel';
import { ProductCatalogTable } from '../../components/admin/products/ProductCatalogTable';

export {
  STORAGE_CATALOG_KEY,
  SIZES_ZAPATILLAS,
  SIZES_VESTUARIO_HOMBRE,
  SIZES_VESTUARIO_MUJER,
  SIZES_PANTALON_HOMBRE,
  SIZES_PANTALON_MUJER,
  PRODUCT_TAXONOMY,
  STORAGE_CATEGORIES_VISIBILITY_KEY,
  loadCategoriesVisibility,
  saveCategoriesVisibility,
  isSectionActive,
  isCategoryActive,
  isSubcategoryActive,
  isProductTaxonomyActive,
  getActiveProductTaxonomy,
  SPECIAL_CATEGORIES,
  SHIPPING_TIERS,
  formatCLP,
  parseCLPInput
};

export type {
  TaxonomyCategory,
  SectionTaxonomy,
  CategoriesVisibilityConfig,
  ShippingTierItem,
  SizeItem
};

export const ProductManagerView: React.FC = () => {
  const formRef = useRef<HTMLDivElement>(null);

// --- Estado del Catálogo de Productos (Conectado a MongoDB) ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchProducts = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoadingProducts(true);

    try {
      const response = await api.get('/admin/products');
      if (response.data.success) {
        // Normalizamos el _id de MongoDB al id del Frontend
        const backendProducts = response.data.data.map((dbProduct: any) => ({
          ...dbProduct,
          id: dbProduct._id?.toString() || dbProduct.id,
        }));
        setProducts(backendProducts);
      }
    } catch (error) {
      console.error('Error cargando inventario desde MongoDB:', error);
      setFeedback({ type: 'error', message: 'Error al conectar con la base de datos' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsLoadingProducts(false);
      if (isManualRefresh) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleRefreshCatalog = () => {
    fetchProducts(true);
  };

  // --- Modo Edición ---
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // --- Campos del Formulario ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [normalPriceRaw, setNormalPriceRaw] = useState<number>(45990);
  const [normalPriceInput, setNormalPriceInput] = useState<string>('45.990');
  const [discountPercent, setDiscountPercent] = useState<number | ''>(15);
  const [weightGrams, setWeightGrams] = useState<number | ''>(850);

  // Taxonomía: Sección, Categoría, Subcategoría y Categoría Especial
  const [section, setSection] = useState<string>('Hombre');
  const [category, setCategory] = useState<string>('Ropa Superior');
  const [subcategory, setSubcategory] = useState<string>('Poleras');
  const [specialCategory, setSpecialCategory] = useState<string>('Productos destacados');

  // Etiquetas dinámicas
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Y2K Cyber', 'Live Drop', 'Oversize']);

  // Tallas dinámicas con unidades según el esquema oficial
  const [sizesList, setSizesList] = useState<SizeItem[]>([
    { id: '1', size: 'S (Chile/EUR) - 34-36 (USA)', quantity: 4 },
    { id: '2', size: 'M (Chile/EUR) - 38-40 (USA)', quantity: 8 },
    { id: '3', size: 'L (Chile/EUR) - 42-44 (USA)', quantity: 5 },
    { id: '4', size: 'XL (Chile/EUR) - 46-48 (USA)', quantity: 2 }
  ]);

// Imágenes (límite estricto de 10)
  const [images, setImages] = useState<string[]>([]);

  const [activePreviewImageIndex, setActivePreviewImageIndex] = useState(0);
  // NUEVO ESTADO: Archivos físicos para Cloudinary
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // --- Mini Calculadora de Peso (kg ⇄ g) ---
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcKg, setCalcKg] = useState<string>('1.00');
  const [calcGrams, setCalcGrams] = useState<string>('1000');

  // --- Filtros y Ordenamiento del Catálogo ---
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortPriceOrder, setSortPriceOrder] = useState<'desc' | 'asc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Mensajes de Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // Opciones de categorías según la sección seleccionada
  const availableCategoriesForSection = useMemo(() => {
    const secData = activeTaxonomy.find((s) => s.section === section) || PRODUCT_TAXONOMY.find((s) => s.section === section);
    return secData ? secData.categories : [];
  }, [activeTaxonomy, section]);

  // Opciones de subcategorías según la categoría seleccionada
  const availableSubcategoriesForCategory = useMemo(() => {
    const catData = availableCategoriesForSection.find((c) => c.name === category);
    return catData ? catData.subcategories : [];
  }, [availableCategoriesForSection, category]);

  // Determinar si la categoría actual soporta tallas
  const categorySupportsSizes = useMemo(() => {
    if (category === 'Otros') return false;
    return ['Ropa Superior', 'Ropa Inferior', 'Calzado'].includes(category);
  }, [category]);

  // Opciones de tallas oficiales según la sección, categoría y subcategoría
  const availableSizesOptions = useMemo(() => {
    if (category === 'Calzado' || subcategory === 'Zapatillas') {
      return SIZES_ZAPATILLAS;
    }
    if (category === 'Ropa Inferior' || subcategory === 'Pantalones' || subcategory === 'Shorts') {
      return section === 'Mujer' ? SIZES_PANTALON_MUJER : SIZES_PANTALON_HOMBRE;
    }
    if (category === 'Ropa Superior') {
      return section === 'Mujer' ? SIZES_VESTUARIO_MUJER : SIZES_VESTUARIO_HOMBRE;
    }
    return section === 'Mujer' ? SIZES_VESTUARIO_MUJER : SIZES_VESTUARIO_HOMBRE;
  }, [section, category, subcategory]);

  const refreshSizesForSelection = (sec: string, cat: string, sub: string) => {
    const isSizeCat = ['Ropa Superior', 'Ropa Inferior', 'Calzado'].includes(cat) && cat !== 'Otros';
    if (!isSizeCat) return;
    let targetOptions = SIZES_VESTUARIO_HOMBRE;
    if (cat === 'Calzado' || sub === 'Zapatillas') {
      targetOptions = SIZES_ZAPATILLAS;
    } else if (cat === 'Ropa Inferior' || sub === 'Pantalones' || sub === 'Shorts') {
      targetOptions = sec === 'Mujer' ? SIZES_PANTALON_MUJER : SIZES_PANTALON_HOMBRE;
    } else if (cat === 'Ropa Superior') {
      targetOptions = sec === 'Mujer' ? SIZES_VESTUARIO_MUJER : SIZES_VESTUARIO_HOMBRE;
    }
    setSizesList((prev) => {
      const hasAny = prev.some((item) => targetOptions.includes(item.size));
      if (!hasAny) {
        return [
          { id: '1', size: targetOptions[1] || targetOptions[0], quantity: 4 },
          { id: '2', size: targetOptions[2] || targetOptions[0], quantity: 8 },
          { id: '3', size: targetOptions[3] || targetOptions[0], quantity: 5 }
        ];
      }
      return prev;
    });
  };

  // Manejo de cambio en Sección
  const handleSectionChange = (newSec: string) => {
    setSection(newSec);
    const secData = PRODUCT_TAXONOMY.find((s) => s.section === newSec);
    if (secData && secData.categories.length > 0) {
      const firstCat = secData.categories[0];
      setCategory(firstCat.name);
      const firstSub = firstCat.subcategories[0] || '';
      setSubcategory(firstSub);
      const isSizeCat = ['Ropa Superior', 'Ropa Inferior', 'Calzado'].includes(firstCat.name) && firstCat.name !== 'Otros';
      if (!isSizeCat) {
        setSizesList((prev) => (prev.length > 0 && prev[0].size === 'Única' ? prev : [{ id: 'single', size: 'Única', quantity: 1 }]));
      } else {
        refreshSizesForSelection(newSec, firstCat.name, firstSub);
      }
    }
  };

  // Manejo de cambio en Categoría
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const catData = availableCategoriesForSection.find((c) => c.name === newCat);
    const firstSub = catData && catData.subcategories.length > 0 ? catData.subcategories[0] : '';
    if (firstSub) {
      setSubcategory(firstSub);
    }
    const isSizeCat = ['Ropa Superior', 'Ropa Inferior', 'Calzado'].includes(newCat) && newCat !== 'Otros';
    if (!isSizeCat) {
      setSizesList((prev) => (prev.length > 0 && prev[0].size === 'Única' ? prev : [{ id: 'single', size: 'Única', quantity: 1 }]));
    } else {
      refreshSizesForSelection(section, newCat, firstSub);
    }
  };

  // Tramo de flete activo según peso
  const currentShippingTier = useMemo(() => {
    const g = typeof weightGrams === 'number' && weightGrams > 0 ? weightGrams : 0;
    if (g <= 1000) return SHIPPING_TIERS[0];
    if (g <= 3000) return SHIPPING_TIERS[1];
    if (g <= 6000) return SHIPPING_TIERS[2];
    if (g <= 12000) return SHIPPING_TIERS[3];
    return SHIPPING_TIERS[4];
  }, [weightGrams]);

  // Cálculo en tiempo real del Precio Oferta
  const calculatedOfferPrice = useMemo(() => {
    if (!normalPriceRaw || normalPriceRaw <= 0) return 0;
    const discount = typeof discountPercent === 'number' ? discountPercent : 0;
    if (discount <= 0) return normalPriceRaw;
    const discounted = normalPriceRaw * (1 - discount / 100);
    return Math.max(0, Math.round(discounted));
  }, [normalPriceRaw, discountPercent]);

  // Cálculo del ahorro en dinero
  const savingsAmount = useMemo(() => {
    if (!normalPriceRaw || normalPriceRaw <= 0) return 0;
    return Math.max(0, normalPriceRaw - calculatedOfferPrice);
  }, [normalPriceRaw, calculatedOfferPrice]);

  // Total de unidades sumadas de las tallas
  const totalUnits = useMemo(() => {
    return sizesList.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  }, [sizesList]);

  // Manejo de cambio en Precio Normal con separadores de miles chilenos
  const handleNormalPriceChange = (val: string) => {
    const numeric = parseCLPInput(val);
    setNormalPriceRaw(numeric);
    setNormalPriceInput(numeric > 0 ? numeric.toLocaleString('es-CL') : '');
  };

  // Manejo de Etiquetas
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (!tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Manejo de Tallas dinámicas
  const handleAddSizeRow = () => {
    const unusedSize = availableSizesOptions.find((s) => !sizesList.some((item) => item.size === s)) || availableSizesOptions[0];
    const newItem: SizeItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      size: unusedSize,
      quantity: 1
    };
    setSizesList([...sizesList, newItem]);
  };

  const handleUpdateSizeRow = (id: string, field: 'size' | 'quantity', value: any) => {
    setSizesList(
      sizesList.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === 'quantity' ? Math.max(0, parseInt(value, 10) || 0) : value
          };
        }
        return item;
      })
    );
  };

  const handleRemoveSizeRow = (id: string) => {
    if (sizesList.length <= 1) {
      setFeedback({
        type: 'error',
        message: 'Debe haber al menos 1 talla configurada para esta categoría.'
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setSizesList(sizesList.filter((item) => item.id !== id));
  };

// Manejo de Imágenes con Límite de 10
  const handleAddImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= 10) {
      setFeedback({
        type: 'error',
        message: 'Límite alcanzado: Máximo 10 imágenes permitidas por producto.'
      });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    const availableSlots = 10 - images.length;
    const filesToLoad = Array.from(files).slice(0, availableSlots);

    // 1. Guardamos los archivos físicos para enviarlos a Cloudinary
    setImageFiles((prev) => [...prev, ...filesToLoad]);

    // 2. Mantenemos FileReader SOLO para la vista previa en vivo en tu pantalla
    filesToLoad.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => (prev.length < 10 ? [...prev, reader.result as string] : prev));
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const imgToRemove = images[indexToRemove];
    
    // Si la imagen eliminada era un archivo local recién cargado (DataURL base64), la quitamos también de imageFiles
    if (imgToRemove && imgToRemove.startsWith('data:')) {
      const dataUrlIndices = images
        .map((img, idx) => (img.startsWith('data:') ? idx : -1))
        .filter((idx) => idx !== -1);
      const fileIndexToRemove = dataUrlIndices.indexOf(indexToRemove);
      if (fileIndexToRemove !== -1) {
        setImageFiles((prev) => prev.filter((_, idx) => idx !== fileIndexToRemove));
      }
    }

    setImages(images.filter((_, idx) => idx !== indexToRemove));
    if (activePreviewImageIndex >= images.length - 1) {
      setActivePreviewImageIndex(Math.max(0, images.length - 2));
    }
  };

  // Mini Calculadora de Peso
  const handleCalcGramsChange = (gVal: string) => {
    setCalcGrams(gVal);
    const numG = parseFloat(gVal);
    if (!isNaN(numG)) {
      setCalcKg((numG / 1000).toFixed(3).replace(/\.?0+$/, ''));
    } else {
      setCalcKg('');
    }
  };

  const handleCalcKgChange = (kgVal: string) => {
    setCalcKg(kgVal);
    const numKg = parseFloat(kgVal);
    if (!isNaN(numKg)) {
      setCalcGrams(Math.round(numKg * 1000).toString());
    } else {
      setCalcGrams('');
    }
  };

  const handleApplyCalcWeight = () => {
    const g = parseInt(calcGrams, 10);
    if (!isNaN(g) && g > 0) {
      setWeightGrams(g);
      setFeedback({
        type: 'success',
        message: `✓ Peso de ${g} gramos aplicado al producto.`
      });
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  // Resetear Formulario
  const handleResetForm = () => {
    setEditingProductId(null);
    setTitle('');
    setDescription('');
    setNormalPriceRaw(39990);
    setNormalPriceInput('39.990');
    setDiscountPercent(0);
    setWeightGrams(500);
    setSection('Hombre');
    setCategory('Ropa Superior');
    setSubcategory('Poleras');
    setSpecialCategory('Productos destacados');
    setTags(['Y2K Cyber', 'NoLimits']);
    setSizesList([
      { id: '1', size: 'M (Chile/EUR) - 38-40 (USA)', quantity: 5 },
      { id: '2', size: 'L (Chile/EUR) - 42-44 (USA)', quantity: 5 }
    ]);
    setImages([]);
    setActivePreviewImageIndex(0);
    setImageFiles([]); // <--- Limpiamos los archivos físicos
  };

// Guardar / Actualizar Producto
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'El Nombre del Producto es obligatorio.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (!normalPriceRaw || normalPriceRaw <= 0) {
      setFeedback({ type: 'error', message: 'El Precio Normal debe ser mayor a 0 CLP.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (images.length === 0 && imageFiles.length === 0) {
      setFeedback({ type: 'error', message: 'Debe subir al menos 1 imagen del producto.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const effectiveDiscount = typeof discountPercent === 'number' && discountPercent > 0 ? discountPercent : undefined;
    const effectiveSalePrice = effectiveDiscount ? calculatedOfferPrice : undefined;

    const formattedSizes = categorySupportsSizes ? sizesList.map((s) => s.size) : ['Única'];
    const formattedSizeBreakdown = categorySupportsSizes
      ? sizesList.map((s) => ({ size: s.size, quantity: s.quantity }))
      : [{ size: 'Única', quantity: totalUnits || 1 }];

    // --- INSTANCIAR FORMDATA PARA ENVIAR ARCHIVOS A CLOUDINARY ---
    const formData = new FormData();
    
    formData.append('title', title.trim());
    formData.append('description', description.trim() || `Prenda No Limits Y2K Cyberpunk con alta calidad. Sección: ${section}, Categoría: ${category}.`);
    formData.append('price', normalPriceRaw.toString());
    if (effectiveSalePrice) formData.append('salePrice', effectiveSalePrice.toString());
    if (effectiveDiscount) formData.append('discountPercent', effectiveDiscount.toString());
    formData.append('section', section);
    formData.append('category', category);
    formData.append('subCategory', subcategory);
    formData.append('totalStock', (totalUnits || 1).toString());
    if (typeof weightGrams === 'number') formData.append('weightGrams', weightGrams.toString());
    if (specialCategory !== 'Ninguna') formData.append('specialCategory', specialCategory);
    formData.append('isFeatured', String(specialCategory === 'Productos destacados'));
    formData.append('isExclusive', String(specialCategory === 'Live Drop'));
    formData.append('isHidden', 'false');

    // Arrays convertidos a JSON string para viajar por FormData
    formData.append('tags', JSON.stringify(tags));
    formData.append('sizes', JSON.stringify(formattedSizes));
    formData.append('sizeBreakdown', JSON.stringify(formattedSizeBreakdown));

    if (!editingProductId) {
      formData.append('sku', `NL-${Math.floor(100 + Math.random() * 900)}`);
    }

    // Adjuntar los archivos físicos bajo el nombre 'images'
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    // conservar URLs web (ej. fotos de Cloudinary ya existentes al editar)
    const existingUrls = images.filter((img) => img.startsWith('http'));
    formData.append('existingImages', JSON.stringify(existingUrls));

    try {
      if (editingProductId) {
        // Actualizar producto existente (Conectado a MongoDB y Cloudinary)
        const response = await api.put(`/admin/products/${editingProductId}`, formData);

        if (response.data.success) {
          await fetchProducts();
          setFeedback({
            type: 'success',
            message: `✓ ¡Producto "${title}" actualizado con éxito en MongoDB!`
          });
          handleResetForm();
        }
      } else {
        // Crear nuevo producto (Conectado a MongoDB y Cloudinary)
        const response = await api.post('/admin/products', formData);

        if (response.data.success) {
          await fetchProducts();
          setFeedback({
            type: 'success',
            message: `✓ ¡Nuevo producto "${title}" guardado con imagen en Cloudinary exitosamente!`
          });
          handleResetForm();
        }
      }
    } catch (error) {
      console.error("Error guardando producto en BD:", error);
      setFeedback({ type: 'error', message: 'Error de conexión: No se pudo guardar el producto.' });
    }

    setTimeout(() => setFeedback(null), 4000);
  };

  // Cargar producto para Editar
  const handleEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setTitle(prod.title);
    setDescription(prod.description || '');
    setNormalPriceRaw(prod.price);
    setNormalPriceInput(prod.price.toLocaleString('es-CL'));
    setDiscountPercent(prod.discountPercent || (prod.salePrice ? Math.round(((prod.price - prod.salePrice) / prod.price) * 100) : 0));
    setWeightGrams(prod.weightGrams || 500);

    // Deducir sección, categoría y subcategoría
    let matchedSection = 'Hombre';
    let matchedCategory = 'Ropa Superior';
    let matchedSubcategory = 'Poleras';

    for (const sec of PRODUCT_TAXONOMY) {
      for (const cat of sec.categories) {
        if (cat.name.toLowerCase() === prod.category?.toLowerCase() || prod.category?.toLowerCase().includes(cat.name.toLowerCase())) {
          matchedSection = sec.section;
          matchedCategory = cat.name;
          if (prod.subCategory && cat.subcategories.some((s) => s.toLowerCase() === prod.subCategory?.toLowerCase())) {
            matchedSubcategory = prod.subCategory;
          } else {
            matchedSubcategory = cat.subcategories[0] || '';
          }
          break;
        }
      }
    }

    if (prod.section && PRODUCT_TAXONOMY.some((s) => s.section === prod.section)) {
      matchedSection = prod.section;
    }

    setSection(matchedSection);
    setCategory(matchedCategory);
    setSubcategory(matchedSubcategory);

    setSpecialCategory(
      prod.specialCategory ||
      (prod.isFeatured ? 'Productos destacados' : prod.isExclusive ? 'Live Drop' : 'Ninguna')
    );
    setTags(prod.tags && prod.tags.length > 0 ? prod.tags : ['Y2K']);

    // Tallas
    if (prod.sizeBreakdown && prod.sizeBreakdown.length > 0) {
      setSizesList(
        prod.sizeBreakdown.map((sb, idx) => ({
          id: `${idx}_${sb.size}`,
          size: sb.size,
          quantity: sb.quantity
        }))
      );
    } else if (prod.sizes && prod.sizes.length > 0) {
      const perSize = Math.max(1, Math.floor(prod.totalStock / prod.sizes.length));
      setSizesList(
        prod.sizes.map((s, idx) => ({
          id: `${idx}_${s}`,
          size: s,
          quantity: perSize
        }))
      );
    } else {
      setSizesList([{ id: '1', size: 'M', quantity: prod.totalStock || 1 }]);
    }

    // Imágenes
    if (prod.images && prod.images.length > 0) {
      setImages(prod.images.slice(0, 10));
    }
    setActivePreviewImageIndex(0);
    setImageFiles([]); // <--- Añade esta línea aquí    

    // Scroll suave hacia el formulario
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    setFeedback({
      type: 'success',
      message: `Modo Edición: Modificando datos de "${prod.title}". Guarda los cambios al terminar.`
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Eliminar Producto
  // Eliminar Producto
  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el producto "${name}"?`)) {
      try {
        const response = await api.delete(`/admin/products/${id}`);
        
        if (response.data.success) {
          setProducts(products.filter((p) => p.id !== id));
          if (editingProductId === id) {
            handleResetForm();
          }
          setFeedback({
            type: 'success',
            message: `✓ Producto "${name}" eliminado permanentemente de la base de datos.`
          });
          setTimeout(() => setFeedback(null), 3000);
        }
      } catch (error) {
        console.error('Error eliminando producto en BD:', error);
        setFeedback({ type: 'error', message: 'Error de conexión: No se pudo eliminar el producto de MongoDB.' });
        setTimeout(() => setFeedback(null), 3500);
      }
    }
  };

  // Filtrado y Ordenamiento de la Lista de Productos
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // 1. Filtro por categoría
    if (filterCategory !== 'all') {
      result = result.filter((p) => p.category.toLowerCase().includes(filterCategory.toLowerCase()));
    }

    // 2. Filtro por término de búsqueda
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // 3. Ordenamiento por Precio (Mayor a Menor vs Menor a Mayor)
    result.sort((a, b) => {
      const priceA = a.salePrice || a.price;
      const priceB = b.salePrice || b.price;
      if (sortPriceOrder === 'desc') {
        return priceB - priceA; // Mayor precio a Menor precio
      } else {
        return priceA - priceB; // Menor Precio a Mayor Precio
      }
    });

    return result;
  }, [products, filterCategory, sortPriceOrder, searchTerm]);

  return (
    <div className="nl-product-manager-root space-y-4 font-sans text-gray-900 pb-12 relative">
      
      {/* Pantalla de carga superpuesta estilo Windows XP */}
      {isLoadingProducts && (
        <div className="absolute inset-0 z-50 bg-white/70 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#ece9d8] border-2 border-blue-900 p-4 shadow-xl flex items-center gap-3">
            <span className="font-bold text-xs text-blue-950">DESCARGANDO INVENTARIO DESDE EL SERVIDOR...</span>
          </div>
        </div>
      )}

      {/* Ventana Maestro Windows XP */}
      <WindowFrame
        title="PRODUCT_ADMIN_MANAGER.EXE - [Administrador de Productos - Super Admin]"
        icon={<PixelIcon name="floppy" size={16} />}
        statusBarText={`NODO SUPER ADMIN // TOTAL PRODUCTOS: ${products.length} // MONEDA: CLP ($) // LÍMITE IMÁGENES: 10 // VISTA PREVIA ACTIVA`}
      >
        <div className="space-y-5">
          {/* Header Superior y Notificaciones */}
          <ProductManagerHeader feedback={feedback} />

          {/* ========================================================== */}
          {/* SECCIÓN 1: FORMULARIO DE ALTA/EDICIÓN + VISTA PREVIA EN VIVO */}
          {/* ========================================================== */}
          <div ref={formRef} className="nl-product-manager-main-grid grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* COLUMNA IZQUIERDA (7 cols en desktop): FORMULARIO COMPLETO */}
            <ProductFormPanel
              editingProductId={editingProductId}
              handleResetForm={handleResetForm}
              handleSubmitProduct={handleSubmitProduct}
              title={title}
              setTitle={setTitle}
              normalPriceInput={normalPriceInput}
              handleNormalPriceChange={handleNormalPriceChange}
              normalPriceRaw={normalPriceRaw}
              discountPercent={discountPercent}
              setDiscountPercent={setDiscountPercent}
              calculatedOfferPrice={calculatedOfferPrice}
              savingsAmount={savingsAmount} 
              weightGrams={weightGrams}
              setWeightGrams={setWeightGrams}
              showCalculator={showCalculator}
              setShowCalculator={setShowCalculator}
              currentShippingTier={currentShippingTier}
              calcKg={calcKg}
              handleCalcKgChange={handleCalcKgChange}
              calcGrams={calcGrams}
              handleCalcGramsChange={handleCalcGramsChange}
              handleApplyCalcWeight={handleApplyCalcWeight}
              tagInput={tagInput}
              setTagInput={setTagInput}
              handleAddTag={handleAddTag}
              tags={tags}
              setTags={setTags}
              handleRemoveTag={handleRemoveTag}
              section={section}
              handleSectionChange={handleSectionChange}
              activeTaxonomy={activeTaxonomy}
              category={category}
              handleCategoryChange={handleCategoryChange}
              availableCategoriesForSection={availableCategoriesForSection}
              subcategory={subcategory}
              setSubcategory={setSubcategory}
              availableSubcategoriesForCategory={availableSubcategoriesForCategory}
              specialCategory={specialCategory}
              setSpecialCategory={setSpecialCategory}
              categorySupportsSizes={categorySupportsSizes}
              totalUnits={totalUnits}
              sizesList={sizesList}
              setSizesList={setSizesList}
              availableSizesOptions={availableSizesOptions}
              handleUpdateSizeRow={handleUpdateSizeRow}
              handleRemoveSizeRow={handleRemoveSizeRow}
              handleAddSizeRow={handleAddSizeRow}
              description={description}
              setDescription={setDescription}
              images={images}
              handleAddImageFile={handleAddImageFile}
              activePreviewImageIndex={activePreviewImageIndex}
              setActivePreviewImageIndex={setActivePreviewImageIndex}
              handleRemoveImage={handleRemoveImage}
            />

            {/* COLUMNA DERECHA (5 cols en desktop): VISTA PREVIA EN VIVO */}
            <ProductLivePreviewPanel
              title={title}
              description={description}
              section={section}
              category={category}
              subcategory={subcategory}
              specialCategory={specialCategory}
              images={images}
              activePreviewImageIndex={activePreviewImageIndex}
              setActivePreviewImageIndex={setActivePreviewImageIndex}
              totalUnits={totalUnits}
              discountPercent={discountPercent}
              normalPriceRaw={normalPriceRaw}
              calculatedOfferPrice={calculatedOfferPrice}
              savingsAmount={savingsAmount}
              weightGrams={weightGrams}
              categorySupportsSizes={categorySupportsSizes}
              sizesList={sizesList}
              tags={tags}
            />
          </div>

          {/* ========================================================== */}
          {/* SECCIÓN 2: TABLA Y GESTIÓN DEL CATÁLOGO DE PRODUCTOS */}
          {/* ========================================================== */}
          <ProductCatalogTable
            products={products}
            filteredAndSortedProducts={filteredAndSortedProducts}
            isRefreshing={isRefreshing}
            handleRefreshCatalog={handleRefreshCatalog}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            activeTaxonomy={activeTaxonomy}
            sortPriceOrder={sortPriceOrder}
            setSortPriceOrder={setSortPriceOrder}
            editingProductId={editingProductId}
            handleEditProduct={handleEditProduct}
            handleDeleteProduct={handleDeleteProduct}
          />
        </div>
      </WindowFrame>
    </div>
  );
};
