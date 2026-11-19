import React, { useState, useEffect, useMemo } from 'react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { INITIAL_BRANCHES } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import api from '../../api/axios';
import {
  CategoriesVisibilityConfig,
  loadCategoriesVisibility,
  getActiveProductTaxonomy
} from './ProductManagerView';

import '../../components/admin/stock/ProductStockSummaryView.css';
import {
  STORAGE_KEY,
  STORAGE_CATALOG_KEY,
  ProductStockDetail,
  StockSummaryMetrics,
  TaxonomyCounts,
  getOfficialSizeOptionsForTaxonomy,
  mapLegacySizeToOfficial,
  normalizeProductSizesAndStock,
  normalizeProductToCurrentTaxonomy,
  generateInitialStockBySize,
  loadAndSyncProductsStock
} from '../../components/admin/stock/productStockTypes';
import { ProductStockHeader } from '../../components/admin/stock/ProductStockHeader';
import { ProductStockFiltersBar } from '../../components/admin/stock/ProductStockFiltersBar';
import { ProductStockTable } from '../../components/admin/stock/ProductStockTable';
import {
  ProductStockCardsGrid,
  ProductStockHelpGuide
} from '../../components/admin/stock/ProductStockCardsGrid';
import { ProductStockModals } from '../../components/admin/stock/ProductStockModals';

export {
  STORAGE_KEY,
  STORAGE_CATALOG_KEY,
  getOfficialSizeOptionsForTaxonomy,
  mapLegacySizeToOfficial,
  normalizeProductSizesAndStock,
  normalizeProductToCurrentTaxonomy,
  generateInitialStockBySize,
  loadAndSyncProductsStock
};

export type {
  ProductStockDetail,
  StockSummaryMetrics,
  TaxonomyCounts
};

// Convertir un documento IProduct de MongoDB al formato ProductStockDetail de la vista
const mapMongoProductToStockDetail = (doc: any): ProductStockDetail => {
  const id = doc._id?.toString() || doc.id || `prod_${Date.now()}`;
  const title = doc.title || doc.name || 'Prenda NoLimits';
  const price = Number(doc.price ?? doc.normalPrice ?? 0) || 0;
  const section = doc.section || 'Hombre';
  const category = doc.category || 'Ropa Superior';
  const subCategory = doc.subCategory || doc.subcategory || 'Poleras';
  const specialCategory = doc.specialCategory || 'Ninguna';

  const stockBySize: Record<string, number> = {};
  const sizesList: string[] = [];

  const rawBreakdown =
    Array.isArray(doc.sizeBreakdown) && doc.sizeBreakdown.length > 0
      ? doc.sizeBreakdown
      : Array.isArray(doc.sizeStock) && doc.sizeStock.length > 0
      ? doc.sizeStock
      : [];

  if (rawBreakdown.length > 0) {
    rawBreakdown.forEach((item: any) => {
      const sz = String(item.size || 'Única').trim();
      const qty = Math.max(0, Number(item.quantity ?? item.stock ?? 0) || 0);
      if (sz && sz.toLowerCase() !== 'única' && sz.toLowerCase() !== 'unica') {
        if (!sizesList.includes(sz)) sizesList.push(sz);
        stockBySize[sz] = qty;
      } else {
        stockBySize[sz || 'Única'] = qty;
      }
    });
  } else if (doc.stockBySize && typeof doc.stockBySize === 'object') {
    Object.entries(doc.stockBySize).forEach(([sz, qty]) => {
      const cleanSz = String(sz).trim();
      const numQty = Math.max(0, Number(qty) || 0);
      if (cleanSz.toLowerCase() !== 'única' && cleanSz.toLowerCase() !== 'unica') {
        sizesList.push(cleanSz);
      }
      stockBySize[cleanSz] = numQty;
    });
  }

  const calculatedTotal =
    Object.keys(stockBySize).length > 0
      ? Object.values(stockBySize).reduce((acc, v) => acc + v, 0)
      : Math.max(0, Number(doc.totalStock ?? doc.stock ?? 0) || 0);

  const image =
    (Array.isArray(doc.images) && doc.images[0]) ||
    doc.image ||
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80';

  return {
    id,
    title,
    description: doc.description || '',
    price,
    normalPrice: Number(doc.normalPrice ?? price) || price,
    discountPercent: Number(doc.discountPercent ?? 0) || 0,
    weightGrams: Number(doc.weightGrams ?? 500) || 500,
    section,
    category,
    subCategory,
    specialCategory,
    image,
    images: Array.isArray(doc.images) ? doc.images : [image],
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    sizes: sizesList,
    stockBySize,
    totalStock: calculatedTotal,
    stockPerBranch:
      doc.stockPerBranch && typeof doc.stockPerBranch === 'object'
        ? doc.stockPerBranch
        : {
            vina_del_mar: Math.ceil(calculatedTotal * 0.5),
            valparaiso: Math.floor(calculatedTotal * 0.3),
            quilpue: Math.max(
              0,
              calculatedTotal -
                Math.ceil(calculatedTotal * 0.5) -
                Math.floor(calculatedTotal * 0.3)
            )
          },
    lastUpdated: doc.updatedAt || doc.createdAt || new Date().toISOString(),
    notes: doc.notes || ''
  } as unknown as ProductStockDetail;
};

export const ProductStockSummaryView: React.FC = () => {
  const { currentUser } = useAuth();
  const { branches } = useBranch();
  const allBranches = branches.length > 0 ? branches : INITIAL_BRANCHES;
  const isBranchAdmin = currentUser?.role === 'branch_admin';
  const assignedBranchId = isBranchAdmin ? (currentUser?.branchId || 'vina_del_mar') : null;
  const activeBranchObj = useMemo(() => {
    if (!assignedBranchId) return null;
    return (
      allBranches.find((b) => b.id === assignedBranchId) ||
      INITIAL_BRANCHES.find((b) => b.id === assignedBranchId) ||
      null
    );
  }, [allBranches, assignedBranchId]);

  // 1. Estado de productos conectado a MongoDB
  const [products, setProducts] = useState<ProductStockDetail[]>([]);

  // Sincronizar con localStorage por compatibilidad con otros componentes
  useEffect(() => {
    if (products.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      } catch (e) {
        console.error('Error guardando stock en storage', e);
      }
    }
  }, [products]);

  // 2. Filtros y Estados de Control
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedSpecialCategory, setSelectedSpecialCategory] = useState<string>('all');
  const [stockOrder, setStockOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'with_sizes' | 'one_size'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'sold_out'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Umbral editable de Stock Bajo
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nl_low_stock_threshold');
      return saved ? Math.max(1, parseInt(saved, 10)) : 8;
    } catch {
      return 8;
    }
  });

  // Estados de Edición Manual (Modal)
  const [editingProduct, setEditingProduct] = useState<ProductStockDetail | null>(null);
  const [editFormStockBySize, setEditFormStockBySize] = useState<Record<string, number>>({});
  const [editFormTotalStock, setEditFormTotalStock] = useState<number>(0);
  const [editFormPrice, setEditFormPrice] = useState<number>(0);
  const [editFormNotes, setEditFormNotes] = useState<string>('');
  const [newSizeInput, setNewSizeInput] = useState<string>('');
  const [editBranchStock, setEditBranchStock] = useState<Record<string, number>>({});

  // Feedback y Notificaciones
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Descargar productos reales desde MongoDB
  const fetchProductsFromMongoDB = async (showNotification = false) => {
    setIsRefreshing(true);
    try {
      const response = await api.get('/admin/products');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map(mapMongoProductToStockDetail);
        setProducts(mapped);
        if (showNotification) {
          triggerToast(`✓ Stock sincronizado con MongoDB (${mapped.length} producto(s))`);
        }
      }
    } catch (error) {
      console.error('Error cargando stock de productos desde MongoDB:', error);
      triggerToast('Error al sincronizar el stock con MongoDB');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProductsFromMongoDB(false);
  }, []);

  // Persistir actualización de stock de un producto en MongoDB
  const persistProductStockToMongoDB = async (updatedProd: ProductStockDetail) => {
    const entries = Object.entries(updatedProd.stockBySize || {});
    const sizeBreakdown =
      entries.length > 0
        ? entries.map(([size, quantity], idx) => ({
            id: `${idx + 1}`,
            size,
            quantity: Math.max(0, Number(quantity) || 0),
            stock: Math.max(0, Number(quantity) || 0)
          }))
        : [
            {
              id: '1',
              size: 'Única',
              quantity: Math.max(0, Number(updatedProd.totalStock) || 0),
              stock: Math.max(0, Number(updatedProd.totalStock) || 0)
            }
          ];

    await api.put(`/admin/products/${updatedProd.id}`, {
      title: updatedProd.title,
      name: updatedProd.title,
      price: updatedProd.price,
      normalPrice: updatedProd.price,
      section: updatedProd.section,
      category: updatedProd.category,
      subCategory: updatedProd.subCategory,
      subcategory: updatedProd.subCategory,
      specialCategory: updatedProd.specialCategory,
      sizeBreakdown,
      totalStock: updatedProd.totalStock,
      stock: updatedProd.totalStock
    });
  };

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

  const availableCategoriesForFilter = useMemo(() => {
    if (selectedSection === 'all') {
      const map = new Map<string, string[]>();
      activeTaxonomy.forEach((sec) => {
        sec.categories.forEach((cat) => {
          const prevSubs = map.get(cat.name) || [];
          const mergedSubs = Array.from(new Set([...prevSubs, ...cat.subcategories]));
          map.set(cat.name, mergedSubs);
        });
      });
      return Array.from(map.entries()).map(([name, subcategories]) => ({ name, subcategories }));
    }
    const secObj = activeTaxonomy.find((s) => s.section === selectedSection);
    return secObj ? secObj.categories : [];
  }, [activeTaxonomy, selectedSection]);

  const availableSubCategoriesForFilter = useMemo(() => {
    if (selectedCategory === 'all') {
      const allSubs = new Set<string>();
      availableCategoriesForFilter.forEach((c) => c.subcategories.forEach((s) => allSubs.add(s)));
      return Array.from(allSubs);
    }
    const catObj = availableCategoriesForFilter.find((c) => c.name === selectedCategory);
    return catObj ? catObj.subcategories : [];
  }, [availableCategoriesForFilter, selectedCategory]);

  const taxonomyCounts = useMemo<TaxonomyCounts>(() => {
    const bySection: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const bySectionCategory: Record<string, number> = {};
    const bySubCategory: Record<string, number> = {};
    const bySpecial: Record<string, number> = {};

    products.forEach((p) => {
      const sec = p.section || 'Otros';
      const cat = p.category || 'Otros';
      const sub = p.subCategory || 'General';
      const spec = p.specialCategory || 'Ninguna';

      bySection[sec] = (bySection[sec] || 0) + 1;
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      bySectionCategory[`${sec}:::${cat}`] = (bySectionCategory[`${sec}:::${cat}`] || 0) + 1;
      bySubCategory[sub] = (bySubCategory[sub] || 0) + 1;
      bySpecial[spec] = (bySpecial[spec] || 0) + 1;
    });

    return { bySection, byCategory, bySectionCategory, bySubCategory, bySpecial };
  }, [products]);

  const activeCategoryFilterLabel = useMemo(() => {
    const parts: string[] = [];
    if (selectedSection !== 'all') parts.push(`Sección: ${selectedSection}`);
    if (selectedCategory !== 'all') {
      if (selectedCategory.includes(':::')) {
        const [sec, cat] = selectedCategory.split(':::');
        parts.push(`${sec} › ${cat}`);
      } else {
        parts.push(`Categoría: ${selectedCategory}`);
      }
    }
    if (selectedSubCategory !== 'all') parts.push(`Subcategoría: ${selectedSubCategory}`);
    if (selectedSpecialCategory !== 'all') parts.push(`Especial: ${selectedSpecialCategory}`);
    return parts.length > 0 ? parts.join(' | ') : 'Todas las Categorías';
  }, [selectedSection, selectedCategory, selectedSubCategory, selectedSpecialCategory]);

  // 3. Filtrado y Ordenamiento
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedSection !== 'all' && p.section !== selectedSection) {
          return false;
        }

        if (selectedCategory !== 'all') {
          if (selectedCategory.includes(':::')) {
            const [targetSec, targetCat] = selectedCategory.split(':::');
            if (p.section !== targetSec || p.category !== targetCat) {
              return false;
            }
          } else if (p.category !== selectedCategory) {
            return false;
          }
        }

        if (selectedSubCategory !== 'all' && p.subCategory !== selectedSubCategory) {
          return false;
        }

        if (selectedSpecialCategory !== 'all' && (p.specialCategory || 'Ninguna') !== selectedSpecialCategory) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchSection = (p.section || '').toLowerCase().includes(q);
          const matchCategory = p.category.toLowerCase().includes(q);
          const matchSubCategory = (p.subCategory || '').toLowerCase().includes(q);
          const matchSpecial = (p.specialCategory || '').toLowerCase().includes(q);
          const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchSection && !matchCategory && !matchSubCategory && !matchSpecial && !matchTags) {
            return false;
          }
        }

        if (sizeFilter === 'with_sizes' && (!p.sizes || p.sizes.length === 0)) {
          return false;
        }
        if (sizeFilter === 'one_size' && p.sizes && p.sizes.length > 0) {
          return false;
        }

        if (stockStatusFilter === 'in_stock' && p.totalStock <= 0) return false;
        if (stockStatusFilter === 'low_stock' && (p.totalStock <= 0 || p.totalStock > lowStockThreshold)) return false;
        if (stockStatusFilter === 'sold_out' && p.totalStock > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (stockOrder === 'desc') {
          return b.totalStock - a.totalStock;
        } else {
          return a.totalStock - b.totalStock;
        }
      });
  }, [
    products,
    selectedSection,
    selectedCategory,
    selectedSubCategory,
    selectedSpecialCategory,
    stockOrder,
    searchQuery,
    sizeFilter,
    stockStatusFilter,
    lowStockThreshold
  ]);

  // Métricas Consolidadas para KPIs
  const summaryMetrics = useMemo<StockSummaryMetrics>(() => {
    let totalUnits = 0;
    let withSizesCount = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let soldOutCount = 0;

    products.forEach((p) => {
      totalUnits += p.totalStock;
      if (p.sizes && p.sizes.length > 0) withSizesCount++;
      if (p.totalStock === 0) {
        soldOutCount++;
      } else {
        inStockCount++;
        if (p.totalStock <= lowStockThreshold) {
          lowStockCount++;
        }
      }
    });

    return {
      totalUnits,
      totalProducts: products.length,
      withSizesCount,
      withoutSizesCount: products.length - withSizesCount,
      inStockCount,
      lowStockCount,
      soldOutCount
    };
  }, [products, lowStockThreshold]);

  // 4. Actualizaciones Rápidas Inline conectadas a MongoDB
  const handleInlineSizeStockChange = async (
    productId: string,
    size: string,
    delta: number
  ) => {
    if (isBranchAdmin) return;
    let updatedProductObj: ProductStockDetail | null = null;

    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;

        const currentSizeStock = prod.stockBySize?.[size] ?? 0;
        const newSizeStock = Math.max(0, currentSizeStock + delta);

        const updatedSizes = {
          ...(prod.stockBySize || {}),
          [size]: newSizeStock
        };

        const newTotalStock = Object.values(updatedSizes).reduce((acc, val) => acc + val, 0);

        const currentBranches = { ...prod.stockPerBranch };
        const branchIds = Object.keys(currentBranches);
        if (branchIds.length > 0 && branchIds[0]) {
          currentBranches[branchIds[0]] = Math.max(
            0,
            (currentBranches[branchIds[0]] || 0) + delta
          );
        }

        updatedProductObj = {
          ...prod,
          stockBySize: updatedSizes,
          totalStock: newTotalStock,
          stockPerBranch: currentBranches,
          lastUpdated: new Date().toISOString()
        };
        return updatedProductObj;
      })
    );

    if (updatedProductObj) {
      try {
        await persistProductStockToMongoDB(updatedProductObj);
        triggerToast(`✓ Stock de talla ${size} actualizado en MongoDB (${delta > 0 ? '+' : ''}${delta})`);
      } catch (err) {
        console.error('Error actualizando talla en MongoDB:', err);
        triggerToast('Error al guardar cambio de stock en MongoDB');
      }
    }
  };

  const handleInlineTotalStockChange = async (productId: string, delta: number) => {
    if (isBranchAdmin) return;
    let updatedProductObj: ProductStockDetail | null = null;

    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;

        const newTotal = Math.max(0, prod.totalStock + delta);
        const updatedSizes = { ...(prod.stockBySize || {}) };
        if (prod.sizes && prod.sizes.length > 0) {
          const firstSize = prod.sizes[0];
          updatedSizes[firstSize] = Math.max(0, (updatedSizes[firstSize] || 0) + delta);
        } else {
          updatedSizes['Única'] = newTotal;
        }

        updatedProductObj = {
          ...prod,
          totalStock: newTotal,
          stockBySize: updatedSizes,
          lastUpdated: new Date().toISOString()
        };
        return updatedProductObj;
      })
    );

    if (updatedProductObj) {
      try {
        await persistProductStockToMongoDB(updatedProductObj);
        triggerToast(`✓ Stock total actualizado en MongoDB (${delta > 0 ? '+' : ''}${delta})`);
      } catch (err) {
        console.error('Error actualizando stock total en MongoDB:', err);
        triggerToast('Error al guardar el stock en MongoDB');
      }
    }
  };

  // 5. Iniciar Edición Manual en Modal
  const openEditModal = (product: ProductStockDetail) => {
    if (isBranchAdmin) return;
    setEditingProduct(product);
    setEditFormStockBySize({ ...(product.stockBySize || {}) });
    setEditFormTotalStock(product.totalStock);
    setEditFormPrice(product.price);
    setEditFormNotes(product.notes || '');
    setEditBranchStock({ ...(product.stockPerBranch || {}) });
    setNewSizeInput('');
  };

  const closeEditModal = () => {
    setEditingProduct(null);
  };

  // Guardar Cambios Manuales desde el Modal en MongoDB
  const handleSaveEditModal = async () => {
    if (isBranchAdmin || !editingProduct) return;

    const hasSizes = editingProduct.sizes && editingProduct.sizes.length > 0;
    let finalTotalStock = editFormTotalStock;

    if (hasSizes) {
      finalTotalStock = Object.values(editFormStockBySize).reduce((a, b) => a + (Number(b) || 0), 0);
    }

    const updatedProd: ProductStockDetail = {
      ...editingProduct,
      totalStock: Math.max(0, finalTotalStock),
      stockBySize: hasSizes ? editFormStockBySize : { Única: Math.max(0, finalTotalStock) },
      lastUpdated: new Date().toISOString()
    };

    try {
      await persistProductStockToMongoDB(updatedProd);
      setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
      triggerToast(`✓ Stock de "${editingProduct.title}" guardado en MongoDB con éxito`);
      closeEditModal();
    } catch (error) {
      console.error('Error guardando edición de stock en MongoDB:', error);
      triggerToast('Error al actualizar el stock en MongoDB');
    }
  };

  // Agregar nueva talla al producto en edición
  const handleAddNewSize = () => {
    const trimmed = newSizeInput.trim().toUpperCase();
    if (!trimmed || !editingProduct) return;

    if (editingProduct.sizes.includes(trimmed)) {
      alert('Esta talla ya existe en el producto.');
      return;
    }

    const updatedSizes = [...editingProduct.sizes, trimmed];
    setEditingProduct({
      ...editingProduct,
      sizes: updatedSizes
    });

    setEditFormStockBySize((prev) => ({
      ...prev,
      [trimmed]: 0
    }));

    setNewSizeInput('');
  };

  // Eliminar una talla del producto en edición
  const handleRemoveSize = (sizeToRemove: string) => {
    if (!editingProduct) return;
    const updatedSizes = editingProduct.sizes.filter((s) => s !== sizeToRemove);
    const updatedStock = { ...editFormStockBySize };
    delete updatedStock[sizeToRemove];

    setEditingProduct({
      ...editingProduct,
      sizes: updatedSizes
    });
    setEditFormStockBySize(updatedStock);
  };

  // Recarga desde MongoDB
  const handleRefresh = () => {
    fetchProductsFromMongoDB(true);
  };

  // Restablecer todos los filtros
  const handleResetFilters = () => {
    setSelectedSection('all');
    setSelectedCategory('all');
    setSelectedSubCategory('all');
    setSelectedSpecialCategory('all');
    setSearchQuery('');
    setSizeFilter('all');
    setStockStatusFilter('all');
  };

  // 1. Exportar a Excel (.csv)
  const handleExportExcel = () => {
    const BOM = '\uFEFF';
    let content = 'Reporte Oficial de Resumen de Stock - No Limits Apparel (MongoDB)\n';
    content += `Fecha de Emisión;${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}\n`;
    content += `Filtro de Categoría;${activeCategoryFilterLabel}\n`;
    content += `Umbral Stock Bajo;≤ ${lowStockThreshold} unidades\n\n`;

    content += 'Producto;Sección;Categoría;Subcategoría;Categoría Especial;Precio ($ CLP);Stock Total (un.);Desglose por Tallas;Estado de Stock\n';

    filteredAndSortedProducts.forEach((p) => {
      const sizeBreakdown = p.sizes && p.sizes.length > 0
        ? p.sizes.map((s) => `${s}: ${p.stockBySize?.[s] ?? 0} un.`).join(' | ')
        : 'Talla Única';
      const status = p.totalStock === 0 ? 'AGOTADO' : p.totalStock <= lowStockThreshold ? 'STOCK BAJO' : 'EN STOCK';

      const row = [
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.section || 'Hombre'}"`,
        `"${p.category}"`,
        `"${p.subCategory || 'General'}"`,
        `"${p.specialCategory || 'Ninguna'}"`,
        p.price,
        p.totalStock,
        `"${sizeBreakdown}"`,
        status
      ].join(';');

      content += row + '\n';
    });

    const totalUnidades = filteredAndSortedProducts.reduce((acc, p) => acc + p.totalStock, 0);
    content += `\nTOTAL UNIDADES FILTRADAS;;;;;;${totalUnidades};;\n`;

    const blob = new Blob([BOM + content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Resumen_Stock_NoLimits_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Reporte Excel generado con éxito');
  };

  // 2. Exportar a PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const rowsHtml = filteredAndSortedProducts
      .map((p) => {
        const sizeBreakdown = p.sizes && p.sizes.length > 0
          ? p.sizes.map((s) => `<b>${s}:</b> ${p.stockBySize?.[s] ?? 0}`).join(' &nbsp;|&nbsp; ')
          : '<span style="color:#64748b;">Talla Única</span>';
        const isSoldOut = p.totalStock === 0;
        const isLowStock = !isSoldOut && p.totalStock <= lowStockThreshold;
        const statusText = isSoldOut ? 'AGOTADO' : isLowStock ? 'STOCK BAJO' : 'EN STOCK';
        const statusBg = isSoldOut ? '#fee2e2' : isLowStock ? '#fef3c7' : '#dcfce7';
        const statusColor = isSoldOut ? '#991b1b' : isLowStock ? '#92400e' : '#166534';
        const taxonomyLabel = `${p.section ? p.section + ' › ' : ''}${p.category}${p.subCategory ? ' › ' + p.subCategory : ''}${
          p.specialCategory && p.specialCategory !== 'Ninguna' ? `<br/><span style="color:#b45309;font-weight:bold;">⭐ ${p.specialCategory}</span>` : ''
        }`;

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 7px 10px; font-weight: bold; color: #1e293b;">${p.title}</td>
            <td style="padding: 7px 10px; color: #1e40af; font-size: 11px;">${taxonomyLabel}</td>
            <td style="padding: 7px 10px; text-align: right; font-family: monospace; font-weight: bold;">$${p.price.toLocaleString('es-CL')}</td>
            <td style="padding: 7px 10px; text-align: center; font-family: monospace; font-weight: 900; font-size: 13px;">${p.totalStock}</td>
            <td style="padding: 7px 10px; font-size: 11px; color: #334155;">${sizeBreakdown}</td>
            <td style="padding: 7px 10px; text-align: center;">
              <span style="background: ${statusBg}; color: ${statusColor}; padding: 3px 6px; font-size: 10px; font-weight: 900; border-radius: 3px;">
                ${statusText}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    const totalUnidades = filteredAndSortedProducts.reduce((acc, p) => acc + p.totalStock, 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resumen de Stock de Productos - No Limits Apparel</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 30px; color: #0f172a; }
            .header { border-bottom: 3px solid #0055ea; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 20px; font-weight: 900; color: #003c74; margin: 0; }
            .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
            .kpis { display: flex; gap: 16px; margin-bottom: 24px; }
            .kpi { flex: 1; border: 1px solid #cbd5e1; padding: 10px; background: #f8fafc; border-radius: 4px; }
            .kpi-title { font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase; }
            .kpi-value { font-size: 18px; font-weight: 900; margin-top: 4px; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
            th { background: #0055ea; color: white; padding: 8px 10px; text-align: left; }
            tfoot tr { background: #e0f2fe; border-top: 2px solid #0055ea; font-weight: bold; }
            .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">NO LIMITS APPAREL — REPORTE DE STOCK DE PRODUCTOS</h1>
              <div class="sub">Auditoría Super Administrador (MongoDB) // Filtro: ${activeCategoryFilterLabel} // Umbral Stock Bajo: ≤ ${lowStockThreshold} un.</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              Fecha de emisión: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}
            </div>
          </div>

          <div class="kpis">
            <div class="kpi">
              <div class="kpi-title">Productos Con Stock</div>
              <div class="kpi-value" style="color: #15803d;">${summaryMetrics.inStockCount} de ${summaryMetrics.totalProducts}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Stock Bajo (≤ ${lowStockThreshold} un.)</div>
              <div class="kpi-value" style="color: #b45309;">${summaryMetrics.lowStockCount}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Agotados (0 un.)</div>
              <div class="kpi-value" style="color: #b91c1c;">${summaryMetrics.soldOutCount}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Total Unidades Físicas</div>
              <div class="kpi-value" style="color: #1e3a8a;">${totalUnidades.toLocaleString('es-CL')} un.</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Nombre del Producto</th>
                <th>Sección › Categoría › Subcategoría</th>
                <th style="text-align: right;">Precio</th>
                <th style="text-align: center;">Stock Total</th>
                <th>Desglose por Tallas</th>
                <th style="text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 10px; font-weight: 900;">TOTAL FILTRADOS: ${filteredAndSortedProducts.length} PRODUCTOS</td>
                <td></td>
                <td></td>
                <td style="padding: 10px; text-align: center; font-weight: 900; font-family: monospace;">${totalUnidades.toLocaleString('es-CL')}</td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div class="footer">
            Documento de control y auditoría emitido por No Limits Apparel OS (Sincronizado con MongoDB).
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    triggerToast('Reporte PDF listo para guardar o imprimir');
  };

  void editFormPrice;
  void editFormNotes;
  void editBranchStock;
  void handleInlineSizeStockChange;
  void handleAddNewSize;
  void handleRemoveSize;

  return (
    <div className="nl-stock-summary-root space-y-4 font-sans text-gray-900 pb-16">
      <WindowFrame
        title={
          isBranchAdmin
            ? `STOCK_INVENTORY_VIEWER.SYS - [Resumen de Stock (Solo Lectura) - ${activeBranchObj?.city || 'Sucursal'}]`
            : 'STOCK_INVENTORY_MATRIX.SYS - [Resumen de Stock de Productos y Tallas - Super Admin]'
        }
        icon={<PixelIcon name="computer" size={16} />}
        statusBarText={
          isBranchAdmin
            ? `ADMIN SUCURSAL (${activeBranchObj?.city?.toUpperCase() || 'LOCAL'}) // MONGODB ACTIVO // PRODUCTOS EN CATÁLOGO: ${products.length} // STOCK TOTAL: ${summaryMetrics.totalUnits} UN.`
            : `NODO SUPER ADMIN // MONGODB ACTIVO // PRODUCTOS AUDITADOS: ${products.length} // STOCK TOTAL CONSOLIDADO: ${summaryMetrics.totalUnits} UN.`
        }
      >
        <div className="space-y-4 text-xs">
          {/* Barra Superior, Botones de Acción, Toast y Tarjetas KPI */}
          <ProductStockHeader
            isBranchAdmin={isBranchAdmin}
            activeBranchObj={activeBranchObj}
            isRefreshing={isRefreshing}
            handleRefresh={handleRefresh}
            handleExportPDF={handleExportPDF}
            handleExportExcel={handleExportExcel}
            toastMessage={toastMessage}
            setToastMessage={setToastMessage}
            summaryMetrics={summaryMetrics}
            lowStockThreshold={lowStockThreshold}
          />

          {/* Barra de Filtros */}
          <ProductStockFiltersBar
            products={products}
            filteredAndSortedProducts={filteredAndSortedProducts}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedSubCategory={selectedSubCategory}
            setSelectedSubCategory={setSelectedSubCategory}
            selectedSpecialCategory={selectedSpecialCategory}
            setSelectedSpecialCategory={setSelectedSpecialCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            stockOrder={stockOrder}
            setStockOrder={setStockOrder}
            stockStatusFilter={stockStatusFilter}
            setStockStatusFilter={setStockStatusFilter}
            lowStockThreshold={lowStockThreshold}
            setLowStockThreshold={setLowStockThreshold}
            isBranchAdmin={isBranchAdmin}
            viewMode={viewMode}
            setViewMode={setViewMode}
            activeTaxonomy={activeTaxonomy}
            availableCategoriesForFilter={availableCategoriesForFilter}
            availableSubCategoriesForFilter={availableSubCategoriesForFilter}
            taxonomyCounts={taxonomyCounts}
            summaryMetrics={summaryMetrics}
          />

          {/* VISTA 1: TABLA DETALLADA XP vs VISTA 2: TARJETAS VISUALES XP */}
          {viewMode === 'table' ? (
            <ProductStockTable
              filteredAndSortedProducts={filteredAndSortedProducts}
              isBranchAdmin={isBranchAdmin}
              lowStockThreshold={lowStockThreshold}
              setPreviewImage={setPreviewImage}
              handleInlineTotalStockChange={handleInlineTotalStockChange}
              openEditModal={openEditModal}
              handleResetFilters={handleResetFilters}
            />
          ) : (
            <ProductStockCardsGrid
              filteredAndSortedProducts={filteredAndSortedProducts}
              isBranchAdmin={isBranchAdmin}
              lowStockThreshold={lowStockThreshold}
              setPreviewImage={setPreviewImage}
              openEditModal={openEditModal}
            />
          )}

          {/* Información y Ayuda del Módulo */}
          <ProductStockHelpGuide isBranchAdmin={isBranchAdmin} />
        </div>
      </WindowFrame>

      {/* Modales: Edición Manual de Stock y Visor de Imagen */}
      <ProductStockModals
        editingProduct={editingProduct}
        isBranchAdmin={isBranchAdmin}
        closeEditModal={closeEditModal}
        editFormStockBySize={editFormStockBySize}
        setEditFormStockBySize={setEditFormStockBySize}
        editFormTotalStock={editFormTotalStock}
        setEditFormTotalStock={setEditFormTotalStock}
        handleSaveEditModal={handleSaveEditModal}
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
      />
    </div>
  );
};

export default ProductStockSummaryView;