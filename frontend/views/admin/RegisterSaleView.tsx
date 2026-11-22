import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PackageSearch } from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { INITIAL_BRANCHES } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import api from '../../api/axios';
import '../../components/home/ProductCard/ProductCard.css';
import '../../components/admin/registerSale/RegisterSaleView.css';
import {
  PRODUCT_TAXONOMY,
  SHIPPING_TIERS,
  SIZES_ZAPATILLAS,
  SIZES_VESTUARIO_HOMBRE,
  SIZES_VESTUARIO_MUJER,
  SIZES_PANTALON_HOMBRE,
  SIZES_PANTALON_MUJER
} from './ProductManagerView';
import {
  getRegionsList,
  getCommunesByRegion
} from '../../services/shippingQuotesEngine';
import {
  STORAGE_ORDERS_KEY,
  STORAGE_SUPER_ADMIN_ORDERS_KEY,
  STORAGE_ALERTS_KEY,
  STORAGE_REMINDERS_KEY,
  STORAGE_SALES_HISTORY_KEY,
  STORAGE_GLOBAL_SALES_HISTORY_KEY,
  SHIPPING_COURIERS,
  formatCLP,
  parseCLPInput,
  ProductItemInSale,
  CompletedSaleModalData
} from '../../components/admin/registerSale/registerSaleTypes';
import { RegisterSaleHeader } from '../../components/admin/registerSale/RegisterSaleHeader';
import { RegisterSaleProductForm } from '../../components/admin/registerSale/RegisterSaleProductForm';
import { RegisterSalePreviewAndCart } from '../../components/admin/registerSale/RegisterSalePreviewAndCart';
import { RegisterSaleCustomerSection } from '../../components/admin/registerSale/RegisterSaleCustomerSection';
import { RegisterSalePaymentSection } from '../../components/admin/registerSale/RegisterSalePaymentSection';
import { RegisterSaleCompletedModal } from '../../components/admin/registerSale/RegisterSaleCompletedModal';

export { formatCLP, parseCLPInput };

export const RegisterSaleView: React.FC = () => {
  const formTopRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const { branches } = useBranch();
  const allBranches = useMemo(() => {
    const raw = branches.length > 0 ? branches : INITIAL_BRANCHES;
    const seen = new Set<string>();
    return raw.filter((b) => {
      const k = b.id === 'branch-corporativo' ? 'casa_matriz' : b.id;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [branches]);

  const physicalBranches = useMemo(
    () =>
      allBranches.filter(
        (b) => b.allowPickup !== false && b.id !== 'casa_matriz' && b.id !== 'branch-corporativo' && !b.isCorporate
      ),
    [allBranches]
  );

  const isBranchAdmin = currentUser?.role === 'branch_admin';
  const assignedAdminBranchId = isBranchAdmin ? (currentUser?.branchId || 'vina_del_mar') : null;
  const activeAdminBranchObj = assignedAdminBranchId
    ? allBranches.find((b) => b.id === assignedAdminBranchId) || physicalBranches[0]
    : null;

  // Catálogo real de productos en MongoDB para autocompletar y vincular stock
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [selectedCatalogProductId, setSelectedCatalogProductId] = useState<string>('');

  useEffect(() => {
    const fetchCatalogProducts = async () => {
      try {
        const res = await api.get('/admin/products');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setCatalogProducts(res.data.data);
        }
      } catch (err) {
        console.warn('No se pudo cargar el catálogo de productos desde MongoDB:', err);
      }
    };
    fetchCatalogProducts();
  }, []);

  // ==============================================================
  // 1. INFORMACIÓN DEL PRODUCTO A VENDER
  // ==============================================================
  const [productTitle, setProductTitle] = useState('Hoodie Gothic Cyber Y2K Zip-Up');
  const [productDescription, setProductDescription] = useState('Polerón oversized con doble cierre y gráficos cibernéticos bordados.');
  const [normalPriceRaw, setNormalPriceRaw] = useState<number>(42990);
  const [normalPriceInput, setNormalPriceInput] = useState<string>('42.990');
  const [discountPercent, setDiscountPercent] = useState<number | ''>(0);
  const [weightGrams, setWeightGrams] = useState<number | ''>(850);

  // Taxonomía
  const [section, setSection] = useState<string>('Hombre');
  const [category, setCategory] = useState<string>('Ropa Superior');
  const [subcategory, setSubcategory] = useState<string>('Hoodies doble zip');
  const [specialCategory, setSpecialCategory] = useState<string>('⚡ Live Drop');

  // Mini Calculadora de Peso
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcGrams, setCalcGrams] = useState('850');
  const [calcKg, setCalcKg] = useState('0.85');

  // Etiquetas
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['LiveDrop', 'Y2K Cyber', 'Oversized']);

  // Tallas dinámicas
  const [sizesList, setSizesList] = useState<Array<{ id: string; size: string; quantity: number }>>([
    { id: '1', size: 'M (Chile/EUR) - 38-40 (USA)', quantity: 2 },
    { id: '2', size: 'L (Chile/EUR) - 42-44 (USA)', quantity: 1 }
  ]);

  // Imágenes (máximo 10)
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80'
  ]);
  const [activePreviewImageIndex, setActivePreviewImageIndex] = useState(0);

  // Autocompletar campos cuando se elige un producto existente en MongoDB
  const handleSelectCatalogProduct = (prodId: string) => {
    setSelectedCatalogProductId(prodId);
    if (!prodId) return;

    const found = catalogProducts.find((p) => (p._id?.toString() || p.id) === prodId);
    if (!found) return;

    const prodTitle = found.title || found.name || '';
    const priceNum = Number(found.normalPrice ?? found.price ?? 39990) || 39990;

    setProductTitle(prodTitle);
    setProductDescription(found.description || '');
    setNormalPriceRaw(priceNum);
    setNormalPriceInput(priceNum.toLocaleString('es-CL'));
    setDiscountPercent(Number(found.discountPercent) || 0);
    setWeightGrams(Number(found.weightGrams) || 500);
    if (found.section) setSection(found.section);
    if (found.category) setCategory(found.category);
    if (found.subCategory || found.subcategory) {
      setSubcategory(found.subCategory || found.subcategory);
    }
    if (found.specialCategory) {
      setSpecialCategory(found.specialCategory);
    }
    if (Array.isArray(found.tags) && found.tags.length > 0) setTags(found.tags);
    if (Array.isArray(found.images) && found.images.length > 0) {
      setImages(found.images);
      setActivePreviewImageIndex(0);
    }

    // Leer primero sizeBreakdown (objetos { size, quantity }) desde MongoDB
    const rawSizes =
      Array.isArray(found.sizeBreakdown) && found.sizeBreakdown.length > 0
        ? found.sizeBreakdown
        : Array.isArray(found.sizeStock) && found.sizeStock.length > 0
        ? found.sizeStock
        : Array.isArray(found.sizes) && found.sizes.length > 0 && typeof found.sizes[0] === 'object'
        ? found.sizes
        : [];

    if (rawSizes.length > 0) {
      setSizesList(
        rawSizes.map((s: any, idx: number) => ({
          id: `${Date.now()}_${idx}`,
          size: s.size || 'Única',
          quantity: Math.max(1, Number(s.quantity ?? s.stock ?? 1))
        }))
      );
    }
  };

  // Lista de productos acumulados en la orden de venta
  const [saleProductsList, setSaleProductsList] = useState<ProductItemInSale[]>([]);

  // ==============================================================
  // 2. INFORMACIÓN DEL CLIENTE Y MODALIDAD DE ENTREGA
  // ==============================================================
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientRut, setClientRut] = useState('');
  const [clientPhoneDigits, setClientPhoneDigits] = useState('');
  const formattedClientPhoneDigits =
    clientPhoneDigits.length > 4
      ? `${clientPhoneDigits.slice(0, 4)} ${clientPhoneDigits.slice(4)}`
      : clientPhoneDigits;
  const clientPhone =
    clientPhoneDigits.length > 0 ? `+56 9 ${formattedClientPhoneDigits}` : '+56 9 ';
  const [clientEmail, setClientEmail] = useState('');

  // Centro / Sucursal que registra la venta
  const [saleOriginBranch, setSaleOriginBranch] = useState(
    assignedAdminBranchId || 'casa_matriz'
  );

  // Modalidad: Retiro vs Envío
  const [deliveryType, setDeliveryType] = useState<'retiro' | 'envio'>('retiro');
  const [selectedBranch, setSelectedBranch] = useState(
    assignedAdminBranchId || 'vina_del_mar'
  );

  useEffect(() => {
    if (isBranchAdmin && assignedAdminBranchId) {
      setSaleOriginBranch(assignedAdminBranchId);
      setSelectedBranch(assignedAdminBranchId);
    }
  }, [isBranchAdmin, assignedAdminBranchId]);

  // Dirección de Despacho
  const allRegions = useMemo(() => getRegionsList(), []);
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    const list = getRegionsList();
    return list.includes('Región de Valparaíso') ? 'Región de Valparaíso' : list[0] || '';
  });
  const currentRegionComunas = useMemo(() => getCommunesByRegion(selectedRegion), [selectedRegion]);
  const [selectedComuna, setSelectedComuna] = useState<string>(() => {
    const comunas = getCommunesByRegion('Región de Valparaíso');
    return comunas[0] || '';
  });

  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingNumber, setShippingNumber] = useState('');
  const [shippingApartment, setShippingApartment] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingInstructions, setShippingInstructions] = useState('');
  const [shippingCourier, setShippingCourier] = useState<'Starken' | 'bluexpress' | 'Paket'>('Starken');

  // ==============================================================
  // 3. ESTADO DE LA TRANSACCIÓN: TIPO DE PAGO
  // ==============================================================
  const [paymentStatus, setPaymentStatus] = useState<'pendiente' | 'confirmado'>('pendiente');

  // Recordatorio para Pago Pendiente
  const [showReminderModal, setShowReminderModal] = useState<boolean>(true);
  const [reminderTitle, setReminderTitle] = useState('Cobro Pendiente Reserva Live Stream');
  const [reminderDeadlineHours, setReminderDeadlineHours] = useState<number>(4);
  const [reminderInstruction, setReminderInstruction] = useState(
    'Cliente mantiene reserva tras Live Stream. Si no efectúa la transferencia en el plazo fijado, liberar stock al inventario general.'
  );

  // Feedback y Modal de Éxito
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [completedSaleModal, setCompletedSaleModal] = useState<CompletedSaleModalData | null>(null);

  // ==============================================================
  // CÁLCULOS DINÁMICOS DEL PRODUCTO
  // ==============================================================
  const calculatedOfferPrice = useMemo(() => {
    if (!normalPriceRaw || normalPriceRaw <= 0) return 0;
    if (typeof discountPercent !== 'number' || discountPercent <= 0) return normalPriceRaw;
    const discountFactor = (100 - discountPercent) / 100;
    return Math.round(normalPriceRaw * discountFactor);
  }, [normalPriceRaw, discountPercent]);

  const savingsAmount = useMemo(() => {
    if (!normalPriceRaw || !discountPercent || discountPercent <= 0) return 0;
    return normalPriceRaw - calculatedOfferPrice;
  }, [normalPriceRaw, discountPercent, calculatedOfferPrice]);

  const currentShippingTier = useMemo(() => {
    const g = typeof weightGrams === 'number' && weightGrams > 0 ? weightGrams : 500;
    for (const t of SHIPPING_TIERS) {
      if (g <= t.maxGrams) return t;
    }
    return SHIPPING_TIERS[SHIPPING_TIERS.length - 1];
  }, [weightGrams]);

  const currentSectionData = useMemo(() => {
    return PRODUCT_TAXONOMY.find((s) => s.section === section) || PRODUCT_TAXONOMY[0];
  }, [section]);

  const availableCategoriesForSection = useMemo(() => {
    return currentSectionData.categories;
  }, [currentSectionData]);

  const availableSubcategoriesForCategory = useMemo(() => {
    const catData = availableCategoriesForSection.find((c) => c.name === category);
    return catData ? catData.subcategories : [];
  }, [availableCategoriesForSection, category]);

  const categorySupportsSizes = useMemo(() => {
    const catLower = category.toLowerCase();
    const secLower = section.toLowerCase();
    if (
      catLower === 'otros' ||
      secLower === 'otros' ||
      catLower.includes('accesorio') ||
      catLower.includes('cartera') ||
      catLower.includes('jockey') ||
      catLower.includes('billetera')
    ) {
      return false;
    }
    return true;
  }, [category, section]);

  const availableSizesOptions = useMemo(() => {
    const catLower = category.toLowerCase();
    const secLower = section.toLowerCase();

    if (catLower === 'calzado') {
      return SIZES_ZAPATILLAS;
    }
    if (catLower === 'pantalones' || catLower === 'ropa inferior') {
      if (secLower.includes('mujer')) return SIZES_PANTALON_MUJER;
      return SIZES_PANTALON_HOMBRE;
    }
    if (secLower.includes('mujer')) {
      return SIZES_VESTUARIO_MUJER;
    }
    return SIZES_VESTUARIO_HOMBRE;
  }, [category, section]);

  const currentProductTotalUnits = useMemo(() => {
    if (!categorySupportsSizes) {
      return sizesList[0]?.quantity || 1;
    }
    return sizesList.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  }, [categorySupportsSizes, sizesList]);

  const totalSaleAmount = useMemo(() => {
    if (saleProductsList.length > 0) {
      return saleProductsList.reduce((acc, p) => acc + p.price * p.totalUnits, 0);
    }
    return (calculatedOfferPrice || 0) * (currentProductTotalUnits || 1);
  }, [saleProductsList, calculatedOfferPrice, currentProductTotalUnits]);

  const shippingCost = useMemo(() => {
    if (deliveryType === 'retiro') return 0;
    const courier = SHIPPING_COURIERS.find((c) => c.id === shippingCourier);
    return courier ? courier.cost : 3990;
  }, [deliveryType, shippingCourier]);

  const grandTotal = totalSaleAmount + shippingCost;

  // ==============================================================
  // HANDLERS DEL PRODUCTO
  // ==============================================================
  const handleNormalPriceChange = (val: string) => {
    const numeric = parseCLPInput(val);
    setNormalPriceRaw(numeric);
    setNormalPriceInput(numeric > 0 ? numeric.toLocaleString('es-CL') : '');
  };

  const handleSectionChange = (newSec: string) => {
    setSection(newSec);
    const secData = PRODUCT_TAXONOMY.find((s) => s.section === newSec) || PRODUCT_TAXONOMY[0];
    const firstCat = secData.categories[0]?.name || 'Ropa Superior';
    setCategory(firstCat);
    const firstSub = secData.categories[0]?.subcategories[0] || 'General';
    setSubcategory(firstSub);

    const catLower = firstCat.toLowerCase();
    const secLower = newSec.toLowerCase();
    if (catLower === 'calzado') {
      setSizesList([
        { id: '1', size: SIZES_ZAPATILLAS[7] || '38 (Chile/EUR) - 8 (USA)', quantity: 1 }
      ]);
    } else if (catLower === 'pantalones' || catLower === 'ropa inferior') {
      setSizesList([
        { id: '1', size: secLower.includes('mujer') ? SIZES_PANTALON_MUJER[2] : SIZES_PANTALON_HOMBRE[2], quantity: 1 }
      ]);
    } else if (catLower === 'otros' || catLower.includes('accesorio') || catLower.includes('cartera')) {
      setSizesList([{ id: 'single', size: 'Única', quantity: 1 }]);
    } else {
      setSizesList([
        { id: '1', size: secLower.includes('mujer') ? SIZES_VESTUARIO_MUJER[2] : SIZES_VESTUARIO_HOMBRE[2], quantity: 1 }
      ]);
    }
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const catData = availableCategoriesForSection.find((c) => c.name === newCat);
    if (catData && catData.subcategories.length > 0) {
      setSubcategory(catData.subcategories[0]);
    }

    const catLower = newCat.toLowerCase();
    const secLower = section.toLowerCase();
    if (catLower === 'calzado') {
      setSizesList([
        { id: '1', size: SIZES_ZAPATILLAS[7] || '38 (Chile/EUR) - 8 (USA)', quantity: 1 }
      ]);
    } else if (catLower === 'pantalones' || catLower === 'ropa inferior') {
      setSizesList([
        { id: '1', size: secLower.includes('mujer') ? SIZES_PANTALON_MUJER[2] : SIZES_PANTALON_HOMBRE[2], quantity: 1 }
      ]);
    } else if (catLower === 'otros' || catLower.includes('accesorio') || catLower.includes('cartera')) {
      setSizesList([{ id: 'single', size: 'Única', quantity: 1 }]);
    } else {
      setSizesList([
        { id: '1', size: secLower.includes('mujer') ? SIZES_VESTUARIO_MUJER[2] : SIZES_VESTUARIO_HOMBRE[2], quantity: 1 }
      ]);
    }
  };

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
      setFeedback({ type: 'success', message: `✓ Peso de ${g} gramos aplicado al producto.` });
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSizeRow = () => {
    const unusedSize = availableSizesOptions.find((s) => !sizesList.some((item) => item.size === s)) || availableSizesOptions[0];
    const newItem = {
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
      setFeedback({ type: 'error', message: 'Debe haber al menos 1 talla configurada.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setSizesList(sizesList.filter((item) => item.id !== id));
  };

  const handleAddImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= 10) {
      setFeedback({ type: 'error', message: 'Límite alcanzado: Máximo 10 imágenes permitidas.' });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    const availableSlots = 10 - images.length;
    const filesToLoad = Array.from(files).slice(0, availableSlots);

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
    setImages(images.filter((_, idx) => idx !== indexToRemove));
    if (activePreviewImageIndex >= images.length - 1) {
      setActivePreviewImageIndex(Math.max(0, images.length - 2));
    }
  };

  const handleAddProductToSale = () => {
    if (!productTitle.trim()) {
      setFeedback({ type: 'error', message: 'El Nombre del Producto es obligatorio.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (!normalPriceRaw || normalPriceRaw <= 0) {
      setFeedback({ type: 'error', message: 'Indica un Precio Normal mayor a 0 CLP.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (images.length === 0) {
      setFeedback({ type: 'error', message: 'Debe haber al menos 1 imagen para el producto.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const effectivePrice = calculatedOfferPrice > 0 ? calculatedOfferPrice : normalPriceRaw;
    const newProductItem: ProductItemInSale = {
      id: selectedCatalogProductId || `prod_sale_${Date.now()}`,
      name: productTitle.trim(),
      description: productDescription.trim(),
      price: effectivePrice,
      normalPrice: normalPriceRaw,
      discountPercent: typeof discountPercent === 'number' && discountPercent > 0 ? discountPercent : undefined,
      weightGrams: typeof weightGrams === 'number' ? weightGrams : 500,
      section,
      category,
      subCategory: subcategory,
      specialCategory,
      tags: [...tags],
      sizes: categorySupportsSizes
        ? sizesList.map((s) => ({ size: s.size, quantity: s.quantity }))
        : [{ size: 'Única', quantity: sizesList[0]?.quantity || 1 }],
      totalUnits: currentProductTotalUnits,
      images: [...images]
    };

    setSaleProductsList([...saleProductsList, newProductItem]);
    setFeedback({
      type: 'success',
      message: `✓ Prenda "${productTitle}" agregada a la venta. Puedes registrar otro producto o avanzar a los datos del cliente.`
    });
    setTimeout(() => setFeedback(null), 3500);

    setSelectedCatalogProductId('');
    setProductTitle('');
    setProductDescription('');
    setNormalPriceRaw(39990);
    setNormalPriceInput('39.990');
    setDiscountPercent(0);
    setWeightGrams(500);
    setTags(['Y2K Cyber']);
    setImages(['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80']);
  };

  const handleRemoveProductFromSale = (id: string) => {
    setSaleProductsList(saleProductsList.filter((p) => p.id !== id));
  };

  // ==============================================================
  // HANDLERS DE CLIENTE Y DESPACHO
  // ==============================================================
  const handleClientPhoneChange = (val: string) => {
    let rawAfterPrefix = '';

    if (val === '') {
      rawAfterPrefix = '';
    } else if (val.startsWith('+56 9')) {
      rawAfterPrefix = val.slice(5);
    } else if (val.startsWith('+')) {
      rawAfterPrefix = val.replace(/^\+?5?6?\s*9?\s*/, '');
    } else {
      rawAfterPrefix = val.replace(/^56\s*9\s*/, '');
    }

    let digitsOnly = rawAfterPrefix.replace(/\D/g, '').slice(0, 8);

    if (
      val.length < clientPhone.length &&
      digitsOnly.length === clientPhoneDigits.length &&
      digitsOnly.length > 0 &&
      val.startsWith('+56 9 ')
    ) {
      digitsOnly = digitsOnly.slice(0, -1);
    }

    setClientPhoneDigits(digitsOnly);
  };

  const handleShippingNumberChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '');
    setShippingNumber(digits);
  };

  const handlePostalCodeChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '').slice(0, 7);
    setShippingPostalCode(digits);
  };

  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    const comunas = getCommunesByRegion(newRegion);
    setSelectedComuna(comunas[0] || '');
  };

  // ==============================================================
  // FINALIZAR VENTA (CONECTADO A MONGODB + LOCALSTORAGE)
  // ==============================================================
  const handleFinalizeSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientFirstName.trim() || !clientLastName.trim()) {
      setFeedback({ type: 'error', message: 'Debes ingresar los Nombres y Apellidos del cliente.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (!clientRut.trim()) {
      setFeedback({ type: 'error', message: 'Debes ingresar el RUT del cliente.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (clientPhoneDigits.length < 8 || !clientEmail.trim()) {
      setFeedback({ type: 'error', message: 'El Teléfono (+56 9 con sus 8 dígitos) y Correo Electrónico del cliente son obligatorios.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (deliveryType === 'envio' && (!shippingStreet.trim() || !selectedComuna)) {
      setFeedback({ type: 'error', message: 'Para envío a domicilio, la Calle y Comuna son obligatorias.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    let finalProducts = [...saleProductsList];
    if (finalProducts.length === 0) {
      if (productTitle.trim() && normalPriceRaw > 0) {
        finalProducts = [
          {
            id: selectedCatalogProductId || `p_sale_${Date.now()}`,
            name: productTitle.trim(),
            description: productDescription.trim(),
            price: calculatedOfferPrice > 0 ? calculatedOfferPrice : normalPriceRaw,
            normalPrice: normalPriceRaw,
            discountPercent: typeof discountPercent === 'number' && discountPercent > 0 ? discountPercent : undefined,
            weightGrams: typeof weightGrams === 'number' ? weightGrams : 500,
            section,
            category,
            subCategory: subcategory,
            specialCategory,
            tags: [...tags],
            sizes: categorySupportsSizes
              ? sizesList.map((s) => ({ size: s.size, quantity: s.quantity }))
              : [{ size: 'Única', quantity: sizesList[0]?.quantity || 1 }],
            totalUnits: currentProductTotalUnits,
            images: [...images]
          }
        ];
      } else {
        setFeedback({ type: 'error', message: 'Debes configurar o agregar al menos un producto para registrar la venta.' });
        setTimeout(() => setFeedback(null), 3000);
        return;
      }
    }

    const orderNumber = `NL-${Math.floor(9200 + Math.random() * 800)}`;
    const nowISO = new Date().toISOString();
    const customerFullName = `${clientFirstName.trim()} ${clientLastName.trim()}`;
    const calculatedTotalAmount = finalProducts.reduce((acc, p) => acc + p.price * p.totalUnits, 0);

    const fullAddress =
      deliveryType === 'envio'
        ? `${shippingStreet.trim()} ${shippingNumber.trim() ? `#${shippingNumber.trim()}` : ''} ${
            shippingApartment.trim() ? `Depto ${shippingApartment.trim()}` : ''
          }, ${selectedComuna}, ${selectedRegion} (${shippingCourier})`
        : `Retiro Presencial en Sucursal ${allBranches.find((b) => b.id === selectedBranch)?.name || 'Viña del Mar'}`;

    const effectiveOriginBranchId = isBranchAdmin && assignedAdminBranchId ? assignedAdminBranchId : saleOriginBranch;
    const assignedBranchId = isBranchAdmin && assignedAdminBranchId
      ? assignedAdminBranchId
      : (deliveryType === 'retiro' ? selectedBranch : effectiveOriginBranchId);
    const assignedBranchObj = allBranches.find((b) => b.id === assignedBranchId);
    const assignedBranchName = assignedBranchObj
      ? `${assignedBranchObj.city} — ${assignedBranchObj.name}`
      : 'Casa Matriz / Central (Corporativo)';
    const registeringAdminLabel = isBranchAdmin && activeAdminBranchObj
      ? `${currentUser?.name || 'Admin'} — Sucursal ${activeAdminBranchObj.city} (${activeAdminBranchObj.name})`
      : `${currentUser?.name || 'Super Admin'} (${assignedBranchName})`;

    const selectedCourierObj = SHIPPING_COURIERS.find((c) => c.id === shippingCourier);
    const courierCostClp = deliveryType === 'envio' ? (selectedCourierObj?.cost || 3990) : 0;
    const isConfirmed = paymentStatus === 'confirmado';

    // 1. GUARDAR EN MONGODB (POST /api/admin/orders)
    try {
      await api.post('/admin/orders', {
        orderNumber,
        customerName: customerFullName,
        customerEmail: clientEmail.trim(),
        customerRut: clientRut.trim(),
        customerPhone: clientPhone,
        branchId: assignedBranchId,
        branchName: assignedBranchObj ? assignedBranchObj.city : assignedBranchName,
        subtotal: calculatedTotalAmount,
        shippingCost: courierCostClp,
        total: isConfirmed ? grandTotal : calculatedTotalAmount,
        confirmedRevenue: isConfirmed ? grandTotal : 0,
        paymentStatus: isConfirmed ? 'CONFIRMED' : 'PENDING',
        paymentMethod: isConfirmed
          ? 'Webpay Plus / Confirmado POS'
          : 'Pendiente de Pago (Reserva Live)',
        deliveryType,
        pickupBranchId: deliveryType === 'retiro' ? selectedBranch : null,
        shippingDetails:
          deliveryType === 'envio'
            ? {
                courier: shippingCourier,
                trackingNumber: '',
                address: {
                  region: selectedRegion,
                  comuna: selectedComuna,
                  street: shippingStreet.trim(),
                  number: shippingNumber.trim(),
                  apartment: shippingApartment.trim(),
                  postalCode: shippingPostalCode.trim()
                }
              }
            : null,
        status: isConfirmed ? 'Pago Confirmando' : 'Pendiente de Pago',
        registeredByAdmin: registeringAdminLabel,
        deadlineHours: reminderDeadlineHours,
        timeLimitText: reminderDeadlineHours === 1 ? '1 hora' : `${reminderDeadlineHours} horas`,
        itemsSummary: finalProducts.map((p) => `${p.totalUnits}x ${p.name}`).join(', '),
        items: finalProducts.map((p, idx) => ({
          productId: p.id && p.id.length === 24 ? p.id : null,
          sku: `NL-POS-${idx + 1}`,
          name: p.name,
          description: p.description || '',
          category: [p.category, p.subCategory].filter(Boolean).join(' / '),
          image: p.images?.[0] || '',
          images: p.images || [],
          size: p.sizes.map((s) => `${s.size} (${s.quantity})`).join(', '),
          sizeBreakdown: p.sizes,
          price: p.price,
          quantity: p.totalUnits
        }))
      });
    } catch (dbErr: any) {
      console.error('Error guardando venta en MongoDB:', dbErr);
      setFeedback({
        type: 'error',
        message:
          dbErr.response?.data?.message ||
          'No se pudo registrar la orden en MongoDB. Verifique los datos e intente nuevamente.'
      });
      return;
    }

    // 2. ACTUALIZAR LOCALSTORAGE Y MOSTRAR MODAL DE COMPROBANTE
    if (paymentStatus === 'pendiente') {
      const mappedCourierId =
        deliveryType === 'envio'
          ? shippingCourier.toLowerCase().includes('blue')
            ? 'blue_express'
            : shippingCourier.toLowerCase().includes('paket')
            ? 'paket'
            : 'starken'
          : undefined;
      const courierDisplayLabel =
        mappedCourierId === 'blue_express'
          ? 'Blue Express'
          : mappedCourierId === 'paket'
          ? 'Paket Express'
          : 'Starken';

      const newAlert = {
        id: `alt_pend_${Date.now()}`,
        category: 'cobro_pendiente',
        title: `COBRO PENDIENTE: ${customerFullName} (${formatCLP(calculatedTotalAmount)})`,
        description: `Cliente ${customerFullName} mantiene orden ${orderNumber} con pago pendiente tras reserva (Registrada por: ${registeringAdminLabel}). Tiempo límite de pago: ${reminderDeadlineHours} horas. ${reminderInstruction}`,
        severity: 'critical',
        customerName: customerFullName,
        deliveryType,
        deliveryMethodText:
          deliveryType === 'envio'
            ? `Envío a Domicilio — ${courierDisplayLabel}`
            : `Retiro en Tienda (Sucursal ${assignedBranchObj?.city || 'Viña del Mar'})`,
        shippingCourier: mappedCourierId,
        shippingCostClp: deliveryType === 'envio' ? courierCostClp : 0,
        shippingAddress:
          deliveryType === 'envio'
            ? {
                region: selectedRegion,
                comuna: selectedComuna,
                street: shippingStreet.trim(),
                number: shippingNumber.trim() || undefined,
                apartment: shippingApartment.trim() || undefined,
                postalCode: shippingPostalCode.trim() || undefined,
                notes: shippingInstructions.trim() || undefined
              }
            : undefined,
        customerPhone: clientPhone,
        customerEmail: clientEmail,
        orderNumber,
        amount: calculatedTotalAmount,
        timeLimitText: `${reminderDeadlineHours} horas`,
        dueHours: reminderDeadlineHours,
        createdAt: nowISO,
        status: 'active',
        isAutomated: true,
        registeredByAdmin: currentUser?.name || 'Super Admin',
        branchId: assignedBranchId,
        products: finalProducts.map((p) => ({
          name: p.name,
          quantity: p.totalUnits || 1,
          price: p.price || p.normalPrice,
          size: p.sizes?.map((s) => `${s.size}: ${s.quantity}`).join(', ') || 'Talla Única',
          image: p.images[0] || ''
        }))
      };

      try {
        const existingAlerts = JSON.parse(localStorage.getItem(STORAGE_ALERTS_KEY) || '[]');
        localStorage.setItem(STORAGE_ALERTS_KEY, JSON.stringify([newAlert, ...existingAlerts]));
      } catch (e) {
        console.warn('Error saving alert:', e);
      }

      const newReminder = {
        id: `rem_pend_${Date.now()}`,
        title: reminderTitle || `Cobro Pendiente Orden ${orderNumber}`,
        category: 'Cobro Pendiente',
        description: reminderInstruction,
        targetCustomer: customerFullName,
        targetAmount: calculatedTotalAmount,
        deadlineHours: reminderDeadlineHours,
        createdAt: nowISO,
        dueAt: new Date(Date.now() + reminderDeadlineHours * 3600 * 1000).toISOString(),
        status: 'active',
        notes: `Generado automáticamente desde Registro de Ventas por ${registeringAdminLabel} para ${clientEmail}`
      };

      try {
        const existingReminders = JSON.parse(localStorage.getItem(STORAGE_REMINDERS_KEY) || '[]');
        localStorage.setItem(STORAGE_REMINDERS_KEY, JSON.stringify([newReminder, ...existingReminders]));
      } catch (e) {
        console.warn('Error saving reminder:', e);
      }

      setCompletedSaleModal({
        orderNumber,
        status: 'Pendiente de Pago',
        customerName: customerFullName,
        email: clientEmail,
        phone: clientPhone,
        total: calculatedTotalAmount,
        deadlineHours: reminderDeadlineHours,
        products: finalProducts,
        deliveryType,
        fullAddress,
        courier: shippingCourier,
        instruction: reminderInstruction,
        registeredByAdmin: registeringAdminLabel
      });
    } else {
      const newSaleRecord = {
        id: `sale_${Date.now()}`,
        orderNumber,
        customerName: customerFullName,
        customerEmail: clientEmail,
        customerPhone: clientPhone,
        total: grandTotal,
        totalAmount: grandTotal,
        date: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
        saleDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        rawDate: nowISO,
        status: 'Pago Confirmando',
        branchId: assignedBranchId,
        branchName: assignedBranchObj ? assignedBranchObj.city : assignedBranchName,
        deliveryMethod: deliveryType === 'retiro' ? 'pickup' : 'shipping',
        itemsSummary: finalProducts.map((p) => `${p.totalUnits}x ${p.name}`).join(', '),
        paymentMethod: 'Webpay Plus / POS',
        itemsCount: finalProducts.reduce((acc, p) => acc + p.totalUnits, 0)
      };

      try {
        const existingSales = JSON.parse(localStorage.getItem(STORAGE_SALES_HISTORY_KEY) || '[]');
        localStorage.setItem(STORAGE_SALES_HISTORY_KEY, JSON.stringify([newSaleRecord, ...existingSales]));
      } catch (e) {
        console.warn('Error saving sale history:', e);
      }

      setCompletedSaleModal({
        orderNumber,
        status: 'Pago Confirmado',
        customerName: customerFullName,
        email: clientEmail,
        phone: clientPhone,
        total: grandTotal,
        products: finalProducts,
        deliveryType,
        fullAddress,
        courier: shippingCourier,
        registeredByAdmin: registeringAdminLabel
      });
    }
  };

  const handleResetAll = () => {
    setCompletedSaleModal(null);
    setSaleProductsList([]);
    setSelectedCatalogProductId('');
    setClientFirstName('');
    setClientLastName('');
    setClientRut('');
    setClientPhoneDigits('');
    setClientEmail('');
    setDeliveryType('retiro');
    if (isBranchAdmin && assignedAdminBranchId) {
      setSaleOriginBranch(assignedAdminBranchId);
      setSelectedBranch(assignedAdminBranchId);
    }
    setShippingStreet('');
    setShippingNumber('');
    setShippingApartment('');
    setShippingPostalCode('');
    setShippingInstructions('');
    setPaymentStatus('pendiente');
    formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={formTopRef} className="rs-view-root space-y-4 font-sans text-gray-900 pb-16">
      <WindowFrame
        title={
          isBranchAdmin && activeAdminBranchObj
            ? `BRANCH_SALE_TERMINAL.EXE - [Registrar Venta — Sucursal ${activeAdminBranchObj.city} (${activeAdminBranchObj.name})]`
            : 'REGISTER_SALE_TERMINAL.EXE - [Registrar Venta // Super Administrador]'
        }
        icon={<PixelIcon name="floppy" size={16} />}
        statusBarText={
          isBranchAdmin && activeAdminBranchObj
            ? `PANEL ADMIN // MONGODB POS ACTIVO // SUCURSAL: ${activeAdminBranchObj.city.toUpperCase()} // MODO PAGO: ${paymentStatus === 'pendiente' ? 'PAGO PENDIENTE ($0 INGRESO)' : 'PAGO CONFIRMADO (INGRESO CONTABLE)'}`
            : `NODO SUPER ADMIN // MONGODB POS ACTIVO // PRENDAS EN VENTA: ${saleProductsList.length} // MODO PAGO: ${paymentStatus === 'pendiente' ? 'PAGO PENDIENTE ($0 INGRESO)' : 'PAGO CONFIRMADO (INGRESO CONTABLE)'}`
        }
      >
        <div className="space-y-5">
          {/* Cabecera Principal + Notificación de Feedback */}
          <RegisterSaleHeader
            isBranchAdmin={isBranchAdmin}
            activeAdminBranchObj={activeAdminBranchObj}
            currentUserName={currentUser?.name || 'Super Admin'}
            feedback={feedback}
          />

          {/* SELECTOR RÁPIDO DE CATÁLOGO MONGODB (PARA VINCULAR Y DESCONTAR STOCK REAL) */}
          {catalogProducts.length > 0 && (
            <div className="bg-blue-50/90 border border-blue-300 p-3 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-blue-950 font-bold">
                <PackageSearch className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Autocompletar con Producto del Catálogo en MongoDB (Descuenta Stock Automáticamente):</span>
              </div>
              <select
                value={selectedCatalogProductId}
                onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                className="bg-white border border-[#7f9db9] px-2.5 py-1 text-xs font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer min-w-[260px]"
              >
                <option value="">-- Ingreso Manual / Seleccionar prenda de MongoDB --</option>
                {catalogProducts.map((prod) => {
                  const pid = prod._id?.toString() || prod.id;
                  const pTitle = prod.title || prod.name || 'Prenda sin título';
                  const pPrice = Number(prod.price ?? prod.normalPrice ?? 0);
                  return (
                    <option key={pid} value={pid}>
                      👕 {pTitle} — ${pPrice.toLocaleString('es-CL')} CLP
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* ============================================================== */}
          {/* PASO 1: INFORMACIÓN DEL PRODUCTO A VENDER                      */}
          {/* ============================================================== */}
          <div className="rs-step1-grid">
            {/* COLUMNA IZQUIERDA: FORMULARIO EXACTO A PRODUCT MANAGER */}
            <RegisterSaleProductForm
              saleProductsListLength={saleProductsList.length}
              productTitle={productTitle}
              onChangeProductTitle={setProductTitle}
              normalPriceInput={normalPriceInput}
              normalPriceRaw={normalPriceRaw}
              onNormalPriceChange={handleNormalPriceChange}
              discountPercent={discountPercent}
              onChangeDiscountPercent={setDiscountPercent}
              calculatedOfferPrice={calculatedOfferPrice}
              savingsAmount={savingsAmount}
              weightGrams={weightGrams}
              onChangeWeightGrams={setWeightGrams}
              showCalculator={showCalculator}
              onToggleCalculator={() => setShowCalculator(!showCalculator)}
              calcKg={calcKg}
              calcGrams={calcGrams}
              onCalcKgChange={handleCalcKgChange}
              onCalcGramsChange={handleCalcGramsChange}
              onApplyCalcWeight={handleApplyCalcWeight}
              currentShippingTier={currentShippingTier}
              tagInput={tagInput}
              onChangeTagInput={setTagInput}
              tags={tags}
              onSetTags={setTags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              section={section}
              onSectionChange={handleSectionChange}
              category={category}
              onCategoryChange={handleCategoryChange}
              availableCategoriesForSection={availableCategoriesForSection}
              subcategory={subcategory}
              onChangeSubcategory={setSubcategory}
              availableSubcategoriesForCategory={availableSubcategoriesForCategory}
              specialCategory={specialCategory}
              onChangeSpecialCategory={setSpecialCategory}
              categorySupportsSizes={categorySupportsSizes}
              currentProductTotalUnits={currentProductTotalUnits}
              sizesList={sizesList}
              availableSizesOptions={availableSizesOptions}
              onAddSizeRow={handleAddSizeRow}
              onUpdateSizeRow={handleUpdateSizeRow}
              onRemoveSizeRow={handleRemoveSizeRow}
              onSetDirectQuantity={(q) => setSizesList([{ id: 'single', size: 'Única', quantity: q }])}
              productDescription={productDescription}
              onChangeProductDescription={setProductDescription}
              images={images}
              activePreviewImageIndex={activePreviewImageIndex}
              onSelectPreviewImage={setActivePreviewImageIndex}
              onAddImageFile={handleAddImageFile}
              onRemoveImage={handleRemoveImage}
              onAddProductToSale={handleAddProductToSale}
            />

            {/* COLUMNA DERECHA: VISTA PREVIA STOREFRONT + PRENDAS EN ORDEN */}
            <RegisterSalePreviewAndCart
              specialCategory={specialCategory}
              section={section}
              category={category}
              subcategory={subcategory}
              images={images}
              activePreviewImageIndex={activePreviewImageIndex}
              onSelectPreviewImage={setActivePreviewImageIndex}
              productTitle={productTitle}
              currentProductTotalUnits={currentProductTotalUnits}
              discountPercent={discountPercent}
              calculatedOfferPrice={calculatedOfferPrice}
              normalPriceRaw={normalPriceRaw}
              weightGrams={weightGrams}
              categorySupportsSizes={categorySupportsSizes}
              sizesList={sizesList}
              tags={tags}
              saleProductsList={saleProductsList}
              totalSaleAmount={totalSaleAmount}
              onRemoveProductFromSale={handleRemoveProductFromSale}
            />
          </div>

          {/* ============================================================== */}
          {/* PASO 2: INFORMACIÓN DEL CLIENTE Y MODALIDAD DE ENTREGA         */}
          {/* ============================================================== */}
          <RegisterSaleCustomerSection
            clientFirstName={clientFirstName}
            onChangeClientFirstName={setClientFirstName}
            clientLastName={clientLastName}
            onChangeClientLastName={setClientLastName}
            clientRut={clientRut}
            onChangeClientRut={setClientRut}
            clientPhone={clientPhone}
            clientPhoneDigitsLength={clientPhoneDigits.length}
            onClientPhoneChange={handleClientPhoneChange}
            clientEmail={clientEmail}
            onChangeClientEmail={setClientEmail}
            isBranchAdmin={isBranchAdmin}
            activeAdminBranchObj={activeAdminBranchObj}
            currentUserName={currentUser?.name || 'Super Admin'}
            currentUserEmail={currentUser?.email || 'root@nolimits.cl'}
            saleOriginBranch={saleOriginBranch}
            onChangeSaleOriginBranch={setSaleOriginBranch}
            allBranches={allBranches}
            physicalBranches={physicalBranches}
            deliveryType={deliveryType}
            onChangeDeliveryType={setDeliveryType}
            selectedBranch={selectedBranch}
            onChangeSelectedBranch={setSelectedBranch}
            allRegions={allRegions}
            selectedRegion={selectedRegion}
            onRegionChange={handleRegionChange}
            currentRegionComunas={currentRegionComunas}
            selectedComuna={selectedComuna}
            onChangeSelectedComuna={setSelectedComuna}
            shippingStreet={shippingStreet}
            onChangeShippingStreet={setShippingStreet}
            shippingNumber={shippingNumber}
            onShippingNumberChange={handleShippingNumberChange}
            shippingApartment={shippingApartment}
            onChangeShippingApartment={setShippingApartment}
            shippingPostalCode={shippingPostalCode}
            onPostalCodeChange={handlePostalCodeChange}
            shippingInstructions={shippingInstructions}
            onChangeShippingInstructions={setShippingInstructions}
            shippingCourier={shippingCourier}
            onChangeShippingCourier={setShippingCourier}
          />

          {/* ============================================================== */}
          {/* PASO 3: ESTADO DE LA TRANSACCIÓN: TIPO DE PAGO                 */}
          {/* ============================================================== */}
          <RegisterSalePaymentSection
            paymentStatus={paymentStatus}
            onChangePaymentStatus={setPaymentStatus}
            showReminderModal={showReminderModal}
            onToggleReminderModal={() => setShowReminderModal(!showReminderModal)}
            reminderTitle={reminderTitle}
            onChangeReminderTitle={setReminderTitle}
            clientFirstName={clientFirstName}
            clientLastName={clientLastName}
            reminderDeadlineHours={reminderDeadlineHours}
            onChangeReminderDeadlineHours={setReminderDeadlineHours}
            grandTotal={grandTotal}
            reminderInstruction={reminderInstruction}
            onChangeReminderInstruction={setReminderInstruction}
            saleProductsListLength={saleProductsList.length}
            onResetAll={handleResetAll}
            onFinalizeSale={handleFinalizeSale}
          />
        </div>
      </WindowFrame>

      {/* ============================================================== */}
      {/* MODAL DE COMPROBANTE Y SIMULADOR DE EMAIL AUTOMATIZADO         */}
      {/* ============================================================== */}
      <RegisterSaleCompletedModal
        completedSaleModal={completedSaleModal}
        onClose={() => setCompletedSaleModal(null)}
        onResetAll={handleResetAll}
      />
    </div>
  );
};