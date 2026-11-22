import React, { useState, useEffect, useMemo } from 'react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import api from '../../api/axios';
import {
  STORAGE_HOME_MEDIA_KEY,
  DEFAULT_HOME_MEDIA_CONFIG,
  HomeMediaConfig
} from '../../components/home/WindowsMediaPlayerWidget/WindowsMediaPlayerWidget';
import {
  getRegionsList,
  getCommunesByRegion,
  ShippingCourierId
} from '../../services/shippingQuotesEngine';
import { Review, ReviewRecord } from '../../types';
import {
  RedeemedUserCoupon,
  loadAdminCouponsCatalog,
  saveAdminCouponsCatalog,
  loadRedeemedCoupons
} from '../../services/couponsService';
import {
  STORAGE_CUSTOMERS_KEY,
  INITIAL_CUSTOMERS,
  normalizeCustomer,
  CustomerRecord,
  CustomerTag,
  BlacklistReport,
  PreferentialReport
} from './CustomerManagerView';
import {
  CategoriesVisibilityConfig,
  loadCategoriesVisibility,
  saveCategoriesVisibility,
  isSectionActive
} from './ProductManagerView';
import { loadAndSyncProductsStock } from './ProductStockSummaryView';

import '../../components/admin/pageEditor/PageEditorView.css';
import {
  EditorTab,
  InformativeSectionKey,
  InformativeConfig,
  STORAGE_INFORMATIVE_KEY,
  STORAGE_SLIDER_KEY,
  STORAGE_SLIDER_SPEED_KEY,
  STORAGE_REVIEWS_KEY,
  STORAGE_SHIPPING_RATES_KEY,
  STORAGE_SHIPPING_HISTORY_KEY,
  DEFAULT_INFORMATIVE_CONFIG,
  SliderItem,
  DEFAULT_SLIDES,
  CouponItem,
  WeightTierKey,
  WEIGHT_TIERS,
  TIER_MULTIPLIERS,
  ShippingRatesMatrix,
  ShippingMatrixSnapshot,
  MAX_SHIPPING_HISTORY_SNAPSHOTS,
  buildDefaultShippingRatesMatrix,
  getCourierDisplayName,
  formatCLP,
  formatChileanWhatsApp,
  getReviewProductInfo,
  getReviewUserEmail,
  STORAGE_BACKGROUND_KEY,
  CustomBackgroundConfig,
  loadCustomBackgroundConfig
} from '../../components/admin/pageEditor/pageEditorTypes';
import { PageEditorHeaderAndTabs } from '../../components/admin/pageEditor/PageEditorHeaderAndTabs';
import { InformativePagesTab } from '../../components/admin/pageEditor/InformativePagesTab';
import { HomeMediaTab } from '../../components/admin/pageEditor/HomeMediaTab';
import { SliderEditorTab } from '../../components/admin/pageEditor/SliderEditorTab';
import { ReviewsEditorTab } from '../../components/admin/pageEditor/ReviewsEditorTab';
import { ShippingRatesTab } from '../../components/admin/pageEditor/ShippingRatesTab';
import { CouponsEditorTab } from '../../components/admin/pageEditor/CouponsEditorTab';
import { CategoriesEditorTab } from '../../components/admin/pageEditor/CategoriesEditorTab';
import { BackgroundEditorTab } from '../../components/admin/pageEditor/BackgroundEditorTab';
import { PageEditorModals } from '../../components/admin/pageEditor/PageEditorModals';

// Re-exportar símbolos públicos para compatibilidad con toda la aplicación
export type {
  InformativeSectionKey,
  InformativeConfig,
  SliderItem,
  CouponItem,
  WeightTierKey,
  ShippingRatesMatrix,
  ShippingMatrixSnapshot,
  CustomBackgroundConfig
};
export {
  STORAGE_INFORMATIVE_KEY,
  DEFAULT_INFORMATIVE_CONFIG,
  WEIGHT_TIERS,
  formatCLP,
  formatChileanWhatsApp,
  STORAGE_BACKGROUND_KEY,
  loadCustomBackgroundConfig
};

export const PageEditorView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EditorTab>('informativas');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Archivos físicos temporales para subir a Cloudinary
  const [homeMediaFile, setHomeMediaFile] = useState<File | null>(null);
  const [slideImageFile, setSlideImageFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);

  // Sincronizar el fondo en este navegador y notificar a App.tsx.
  // MongoDB sigue siendo la fuente oficial; localStorage es únicamente una copia.
  const publishBackground = (config: CustomBackgroundConfig | null): void => {
    try {
      // Si se restauró Bliss, eliminamos la copia local anterior.
      if (config === null) {
        localStorage.removeItem(STORAGE_BACKGROUND_KEY);
      } else {
        // Guardamos el fondo devuelto por MongoDB, no una URL temporal.
        localStorage.setItem(STORAGE_BACKGROUND_KEY, JSON.stringify(config));
      }
    } catch {
      // Un navegador que bloquee el almacenamiento no debe impedir la actualización.
      console.warn('[FONDO] No se pudo actualizar la copia de localStorage.');
    }

    // App.tsx escucha este evento y consulta la versión vigente en MongoDB.
    window.dispatchEvent(new Event('nl_background_updated'));
  };

  // Función centralizada para sincronizar cambios en MongoDB (+ Cloudinary si hay archivo)
  const syncStoreSettingsToBackend = async (
    partialSettings: Record<string, any>,
    fileField?: { fieldName: 'homeMediaFile' | 'slideFile' | 'backgroundFile'; file: File | null },
    extraFields?: Record<string, string>
  ) => {
    const formData = new FormData();
    formData.append('settings', JSON.stringify(partialSettings));

    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
    }
    if (fileField && fileField.file) {
      formData.append(fileField.fieldName, fileField.file);
    }

    const response = await api.put('/admin/store-settings', formData);
    return response.data?.data;
  };

  // ==========================================================================
  // ESTADO 1B: VIDEO O GIF DEL HOME
  // ==========================================================================
  const [homeMediaConfig, setHomeMediaConfig] = useState<HomeMediaConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HOME_MEDIA_KEY);
      if (saved) return { ...DEFAULT_HOME_MEDIA_CONFIG, ...JSON.parse(saved) };
    } catch (e) { }
    return DEFAULT_HOME_MEDIA_CONFIG;
  });

  const handleHomeMediaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    const detectedType: 'video' | 'gif' = isGif ? 'gif' : 'video';

    setHomeMediaFile(file); // Guardar archivo físico para Cloudinary

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setHomeMediaConfig((prev) => ({
          ...prev,
          mediaType: detectedType,
          src: reader.result as string,
          fileName: file.name,
          title: file.name || prev.title
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveHomeMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payloadToSave = {
        ...homeMediaConfig,
        src: homeMediaConfig.src.startsWith('http') ? homeMediaConfig.src : ''
      };
      const updatedDoc = await syncStoreSettingsToBackend(
        { homeMediaConfig: payloadToSave },
        { fieldName: 'homeMediaFile', file: homeMediaFile }
      );
      const finalMedia = updatedDoc?.homeMediaConfig || homeMediaConfig;
      setHomeMediaConfig(finalMedia);
      setHomeMediaFile(null);
      localStorage.setItem(STORAGE_HOME_MEDIA_KEY, JSON.stringify(finalMedia));
      window.dispatchEvent(new Event('nl_home_media_updated'));
      setFeedback({
        type: 'success',
        message: '✓ ¡Video / GIF del Home subido a Cloudinary y publicado en MongoDB exitosamente!'
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('Error guardando HomeMedia:', err);
      setFeedback({
        type: 'error',
        message: 'Error al subir el archivo multimedia a Cloudinary.'
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleClearHomeMedia = async () => {
    const cleared: HomeMediaConfig = {
      mediaType: 'gif',
      src: '',
      fileName: '',
      title: 'Clip_Promocional.wmv'
    };
    setHomeMediaConfig(cleared);
    setHomeMediaFile(null);
    try {
      await syncStoreSettingsToBackend({ homeMediaConfig: cleared });
      localStorage.setItem(STORAGE_HOME_MEDIA_KEY, JSON.stringify(cleared));
      window.dispatchEvent(new Event('nl_home_media_updated'));
      setFeedback({
        type: 'success',
        message: '✓ Pantalla multimedia del Home restablecida en MongoDB y Cloudinary.'
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) { }
  };

  // ==========================================================================
  // ESTADO 1: PÁGINAS INFORMATIVAS
  // ==========================================================================
  const [informativeConfig, setInformativeConfig] = useState<InformativeConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_INFORMATIVE_KEY);
      if (saved) {
        return { ...DEFAULT_INFORMATIVE_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error reading informative config:', e);
    }
    return DEFAULT_INFORMATIVE_CONFIG;
  });

  const [activeInfoSection, setActiveInfoSection] = useState<InformativeSectionKey>('quienesSomos');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_INFORMATIVE_KEY, JSON.stringify(informativeConfig));
      window.dispatchEvent(new Event('nl_informative_config_updated'));
    } catch (e) { }
  }, [
    informativeConfig.whatsappNumber,
    informativeConfig.instagramUrl,
    informativeConfig.tiktokUrl
  ]);

  const handleSaveInformative = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await syncStoreSettingsToBackend({ infoTexts: informativeConfig });
      localStorage.setItem(STORAGE_INFORMATIVE_KEY, JSON.stringify(informativeConfig));
      window.dispatchEvent(new Event('nl_informative_config_updated'));
      setFeedback({
        type: 'success',
        message: '✓ ¡Páginas informativas y redes del footer guardadas en MongoDB exitosamente!'
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('Error guardando páginas informativas:', err);
      setFeedback({ type: 'error', message: 'Error al guardar la configuración informativa en MongoDB.' });
    }
  };

  // ==========================================================================
  // ESTADO 2: SLIDER DE LA PÁGINA DE INICIO (MÁXIMO 8 IMÁGENES)
  // ==========================================================================
  const [slides, setSlides] = useState<SliderItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SLIDER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return DEFAULT_SLIDES;
  });

  const [sliderSpeed, setSliderSpeed] = useState<number>(() => {
    try {
      const savedSpeed = localStorage.getItem(STORAGE_SLIDER_SPEED_KEY);
      if (savedSpeed) {
        const parsedSpeed = Number(savedSpeed);
        if (!isNaN(parsedSpeed) && parsedSpeed >= 1000) return parsedSpeed;
      }
    } catch (e) { }
    return 4500;
  });

  const handleChangeSliderSpeed = async (newSpeed: number) => {
    setSliderSpeed(newSpeed);
    try {
      await syncStoreSettingsToBackend({ sliderSpeed: newSpeed });
      localStorage.setItem(STORAGE_SLIDER_SPEED_KEY, String(newSpeed));
      window.dispatchEvent(new Event('nl_slider_updated'));
      setFeedback({
        type: 'success',
        message: `✓ Velocidad del Slider actualizada a ${newSpeed / 1000} segundos en MongoDB.`
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const [editingSlide, setEditingSlide] = useState<SliderItem | null>(null);
  const [isNewSlide, setIsNewSlide] = useState<boolean>(false);
  const [slideImageUrl, setSlideImageUrl] = useState('');
  const [slideImageFileName, setSlideImageFileName] = useState('');
  const [slideTitle, setSlideTitle] = useState('');
  const [slideTag, setSlideTag] = useState('');

  const handleSaveSlidesToStorage = async (
    updatedSlides: SliderItem[],
    targetSlideId?: string,
    fileToUpload?: File | null
  ) => {
    try {
      const updatedDoc = await syncStoreSettingsToBackend(
        { sliders: updatedSlides },
        { fieldName: 'slideFile', file: fileToUpload || null },
        targetSlideId ? { targetSlideId } : undefined
      );
      const finalSlides = updatedDoc?.sliders || updatedSlides;
      setSlides(finalSlides);
      localStorage.setItem(STORAGE_SLIDER_KEY, JSON.stringify(finalSlides));
      window.dispatchEvent(new Event('nl_slider_updated'));
      setSlideImageFile(null);
      setFeedback({ type: 'success', message: '✓ Slider de inicio sincronizado con Cloudinary y MongoDB.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      console.error(e);
      setFeedback({ type: 'error', message: 'Error al guardar el Slider en el servidor.' });
    }
  };

  const handleOpenEditSlide = (slide: SliderItem) => {
    setEditingSlide(slide);
    setIsNewSlide(false);
    setSlideImageUrl(slide.imageUrl);
    setSlideImageFileName('');
    setSlideImageFile(null);
    setSlideTitle(slide.title);
    setSlideTag(slide.tag || '');
  };

  const handleOpenNewSlide = () => {
    if (slides.length >= 8) {
      setFeedback({ type: 'error', message: 'Límite alcanzado: El Slider permite un máximo de 8 imágenes.' });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }
    const newId = `slide-${Date.now()}`;
    setEditingSlide({
      id: newId,
      imageUrl: '',
      title: 'NUEVA DIAPOSITIVA // COLECCIÓN NO LIMITS',
      tag: 'NUEVO DROP'
    });
    setIsNewSlide(true);
    setSlideImageUrl('');
    setSlideImageFileName('');
    setSlideImageFile(null);
    setSlideTitle('NUEVA DIAPOSITIVA // COLECCIÓN NO LIMITS');
    setSlideTag('NUEVO DROP');
  };

  const handleLocalSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlideImageFile(file); // Archivo físico para subir a Cloudinary
    setSlideImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSlideImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSlideModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide || (!slideImageUrl.trim() && !slideImageFile) || !slideTitle.trim()) {
      setFeedback({ type: 'error', message: 'Debes subir una imagen desde tu equipo y completar el título.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const cleanUrl = slideImageUrl.startsWith('http')
      ? slideImageUrl.trim()
      : 'https://placeholder.cloudinary.com';

    if (isNewSlide) {
      if (slides.length >= 8) return;
      const newEntry: SliderItem = {
        id: editingSlide.id,
        imageUrl: cleanUrl,
        title: slideTitle.trim(),
        tag: slideTag.trim() || undefined
      };
      await handleSaveSlidesToStorage([...slides, newEntry], editingSlide.id, slideImageFile);
    } else {
      const updated = slides.map((s) =>
        s.id === editingSlide.id
          ? {
            ...s,
            imageUrl: cleanUrl,
            title: slideTitle.trim(),
            tag: slideTag.trim() || undefined
          }
          : s
      );
      await handleSaveSlidesToStorage(updated, editingSlide.id, slideImageFile);
    }
    setEditingSlide(null);
  };

  const handleDeleteSlide = (slideId: string) => {
    if (slides.length <= 1) {
      setFeedback({ type: 'error', message: 'Debe haber al menos 1 diapositiva activa en el slider.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (window.confirm('¿Seguro que deseas eliminar esta diapositiva del slider?')) {
      const filtered = slides.filter((s) => s.id !== slideId);
      handleSaveSlidesToStorage(filtered);
    }
  };

  // ==========================================================================
  // ESTADO 3: EDITAR RESEÑAS (CONECTADO A MONGODB)
  // ==========================================================================
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchAdminReviews = async () => {
      try {
        const res = await api.get('/admin/reviews');
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          const mapped: Review[] = res.data.data.map((doc: any) => ({
            id: String(doc._id),
            productId: String(doc.productId?._id || doc.productId || ''),
            userId: String(doc.userId?._id || doc.userId || ''),
            userName: doc.userName || 'Cliente NoLimits',
            rating: Number(doc.rating) || 5,
            title: doc.title || 'Valoración de Prenda',
            comment: doc.comment || '',
            date: doc.createdAt
              ? new Date(doc.createdAt).toLocaleDateString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })
              : '',
            verifiedPurchase: true,
            photos: Array.isArray(doc.photos) ? doc.photos : [],
            likes: Number(doc.likes) || 0,
            branchPurchased: doc.branchPurchased || 'Viña del Mar',
            isHidden: Boolean(doc.isHidden),
            userEmail: doc.userId?.email || '',
            productTitle: doc.productId?.title || doc.productId?.name || '',
            productImage: doc.productId?.images?.[0] || '',
            productPrice: Number(doc.productId?.price) || 0,
            productSku: doc.productId?.sku || '',
            productCategory: doc.productId?.category || ''
          } as Review));
          setReviews(mapped);
        }
      } catch (err) {
        console.error('Error cargando reseñas de administración desde MongoDB:', err);
      }
    };
    fetchAdminReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  const [reviewsSearch, setReviewsSearch] = useState('');
  const [selectedReviewDetail, setSelectedReviewDetail] = useState<Review | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [targetReviewForRecord, setTargetReviewForRecord] = useState<Review | null>(null);
  const [recordListType, setRecordListType] = useState<'preferencial' | 'negra'>('preferencial');
  const [recordReason, setRecordReason] = useState('');
  const [recordBenefit, setRecordBenefit] = useState('');
  const [recordDebtAmount, setRecordDebtAmount] = useState('');
  const [recordNotes, setRecordNotes] = useState('');
  const [recordAdminName, setRecordAdminName] = useState('Super Admin');

  const handleRequestDeleteReview = (rev: Review) => {
    setReviewToDelete(rev);
  };

  const handleConfirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    const reviewId = reviewToDelete.id;
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (selectedReviewDetail?.id === reviewId) {
        setSelectedReviewDetail(null);
      }
      setReviewToDelete(null);
      setFeedback({
        type: 'success',
        message: '✓ Reseña y sus fotos eliminadas permanentemente de MongoDB y Cloudinary.'
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (error: any) {
      console.error('Error eliminando reseña:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Error al eliminar la reseña en MongoDB.'
      });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleToggleReviewVisibility = async (rev: Review) => {
    const currentlyHidden = Boolean((rev as any).isHidden);
    try {
      const res = await api.put(`/admin/reviews/${rev.id}/visibility`, {
        isHidden: !currentlyHidden
      });
      const nextHidden =
        typeof res.data?.data?.isHidden === 'boolean'
          ? res.data.data.isHidden
          : !currentlyHidden;

      setReviews((prev) =>
        prev.map((r) => (r.id === rev.id ? ({ ...r, isHidden: nextHidden } as Review) : r))
      );
      if (selectedReviewDetail?.id === rev.id) {
        setSelectedReviewDetail({ ...selectedReviewDetail, isHidden: nextHidden } as Review);
      }
      setFeedback({
        type: 'success',
        message: nextHidden
          ? '✓ Reseña ocultada del catálogo público en MongoDB.'
          : '✓ Reseña visible nuevamente en el catálogo público.'
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error: any) {
      console.error('Error cambiando visibilidad de reseña:', error);
      setFeedback({
        type: 'error',
        message: 'No se pudo actualizar la visibilidad de la reseña.'
      });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleOpenAddReviewModal = (rev: Review, initialType: 'preferencial' | 'negra' = 'preferencial') => {
    setTargetReviewForRecord(rev);
    setRecordListType(initialType);
    setRecordReason('');
    setRecordBenefit('');
    setRecordDebtAmount('');
    setRecordNotes('');
    setRecordAdminName('Super Admin');
    setIsAddReviewModalOpen(true);
  };

  const handleCreateReviewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReviewForRecord || !recordReason.trim()) {
      setFeedback({ type: 'error', message: 'Por favor indica el motivo o causa del registro.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const isBlacklist = recordListType === 'negra';
    const debtVal = recordDebtAmount ? parseInt(recordDebtAmount.replace(/[^0-9]/g, ''), 10) : undefined;
    const nowFormatted = new Date().toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newRecord: ReviewRecord = {
      id: `rec_${Date.now()}`,
      date: nowFormatted,
      listType: recordListType,
      title: isBlacklist ? 'Lista Negra' : 'Lista Preferencial',
      note: recordReason.trim(),
      benefit: !isBlacklist && recordBenefit.trim() ? recordBenefit.trim() : undefined,
      debtAmount: isBlacklist ? debtVal : undefined,
      notes: recordNotes.trim() || undefined,
      adminName: recordAdminName.trim() || 'Super Admin'
    };

    const updated = reviews.map((r) => {
      if (r.id === targetReviewForRecord.id) {
        const updatedRev = {
          ...r,
          records: [...(r.records || []), newRecord]
        };
        if (selectedReviewDetail?.id === r.id) {
          setSelectedReviewDetail(updatedRev);
        }
        return updatedRev;
      }
      return r;
    });

    setReviews(updated);
    try {
      localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(updated));
    } catch (err) { }

    // Sincronizar también con el directorio de clientes (STORAGE_CUSTOMERS_KEY)
    try {
      const reviewerEmail = ((targetReviewForRecord as any).userEmail || getReviewUserEmail(targetReviewForRecord)).toLowerCase();
      const savedCustRaw = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
      let custList: CustomerRecord[] = savedCustRaw
        ? JSON.parse(savedCustRaw).map(normalizeCustomer)
        : [...INITIAL_CUSTOMERS];

      const newTag: CustomerTag = isBlacklist ? 'Lista Negra' : 'Lista Preferencial';
      let matched = false;

      custList = custList.map((c) => {
        const fullName = `${c.nombre} ${c.apellido}`.toLowerCase();
        if (
          c.email.toLowerCase() === reviewerEmail ||
          fullName === targetReviewForRecord.userName.toLowerCase()
        ) {
          matched = true;
          let updatedTags = [...c.etiquetas];
          if (!updatedTags.includes(newTag)) updatedTags.push(newTag);
          if (updatedTags.length > 1 && updatedTags.includes('Normal')) {
            updatedTags = updatedTags.filter((t) => t !== 'Normal');
          }
          if (isBlacklist) {
            const blRep: BlacklistReport = {
              id: `bl_rep_${Date.now()}`,
              date: nowFormatted,
              reason: recordReason.trim(),
              debtAmount: debtVal,
              notes: recordNotes.trim() || undefined,
              recordedBy: recordAdminName.trim() || 'Super Admin'
            };
            return {
              ...c,
              etiquetas: updatedTags,
              blacklistReports: [blRep, ...c.blacklistReports]
            };
          } else {
            const prefRep: PreferentialReport = {
              id: `pref_rep_${Date.now()}`,
              date: nowFormatted,
              reason: recordReason.trim(),
              benefit: recordBenefit.trim() || undefined,
              notes: recordNotes.trim() || undefined,
              recordedBy: recordAdminName.trim() || 'Super Admin'
            };
            return {
              ...c,
              etiquetas: updatedTags,
              preferentialReports: [prefRep, ...c.preferentialReports]
            };
          }
        }
        return c;
      });

      if (!matched) {
        const nameParts = targetReviewForRecord.userName.trim().split(' ');
        const firstName = nameParts[0] || 'Cliente';
        const lastName = nameParts.slice(1).join(' ') || 'NoLimits';
        const newCust: CustomerRecord = {
          id: `cust_${Date.now()}`,
          nombre: firstName,
          apellido: lastName,
          rut: '19.000.000-K',
          email: reviewerEmail,
          phone: '+56 9 8000 0000',
          compras: 1,
          puntosClub: 50,
          totalGastado: (targetReviewForRecord as any).productPrice || getReviewProductInfo(targetReviewForRecord).price,
          etiquetas: [newTag],
          fechaRegistro: new Date().toISOString().split('T')[0],
          blacklistReports: isBlacklist
            ? [
              {
                id: `bl_rep_${Date.now()}`,
                date: nowFormatted,
                reason: recordReason.trim(),
                debtAmount: debtVal,
                notes: recordNotes.trim() || undefined,
                recordedBy: recordAdminName.trim() || 'Super Admin'
              }
            ]
            : [],
          preferentialReports: !isBlacklist
            ? [
              {
                id: `pref_rep_${Date.now()}`,
                date: nowFormatted,
                reason: recordReason.trim(),
                benefit: recordBenefit.trim() || undefined,
                notes: recordNotes.trim() || undefined,
                recordedBy: recordAdminName.trim() || 'Super Admin'
              }
            ]
            : []
        };
        custList = [newCust, ...custList];
      }

      localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(custList));
    } catch (e) { }

    setIsAddReviewModalOpen(false);
    setTargetReviewForRecord(null);
    setFeedback({
      type: 'success',
      message: `✓ Registro de "${isBlacklist ? 'Lista Negra' : 'Lista Preferencial'}" añadido a ${targetReviewForRecord.userName}.`
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  const filteredReviews = useMemo(() => {
    if (!reviewsSearch.trim()) return reviews;
    const q = reviewsSearch.toLowerCase();
    return reviews.filter((r) => {
      const prodInfo = getReviewProductInfo(r);
      const productTitle = ((r as any).productTitle || prodInfo.title || '').toLowerCase();
      const email = ((r as any).userEmail || getReviewUserEmail(r) || '').toLowerCase();
      return (
        r.userName.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        productTitle.includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q)
      );
    });
  }, [reviews, reviewsSearch]);

  // ==========================================================================
  // ESTADO 4: EDITAR VALORES DE ENVÍOS (shippingQuotesEngine.ts)
  // ==========================================================================
  const allRegions = useMemo(() => getRegionsList(), []);
  const [selectedShippingRegion, setSelectedShippingRegion] = useState<string>('Región de Valparaíso');
  const [selectedCourier, setSelectedCourier] = useState<ShippingCourierId>('starken');
  const [inflationRate, setInflationRate] = useState<number | ''>(5);
  const [inflationScope, setInflationScope] = useState<
    'all' | 'starken' | 'blue_express' | 'paket' | 'region'
  >('all');
  const [isInflationConfirmOpen, setIsInflationConfirmOpen] = useState<boolean>(false);
  const [isShippingHistoryOpen, setIsShippingHistoryOpen] = useState<boolean>(false);
  const [isResetFactoryConfirmOpen, setIsResetFactoryConfirmOpen] = useState<boolean>(false);

  const defaultShippingRatesMatrix = useMemo<ShippingRatesMatrix>(() => {
    return buildDefaultShippingRatesMatrix();
  }, []);

  const [shippingRatesMatrix, setShippingRatesMatrix] = useState<ShippingRatesMatrix>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SHIPPING_RATES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return JSON.parse(JSON.stringify(defaultShippingRatesMatrix));
  });

  const [shippingHistory, setShippingHistory] = useState<ShippingMatrixSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SHIPPING_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return [];
  });

  const recordShippingSnapshot = (actionLabel: string, currentMatrix: ShippingRatesMatrix) => {
    const nowFormatted = new Date().toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const newSnapshot: ShippingMatrixSnapshot = {
      id: `snap_${Date.now()}`,
      date: nowFormatted,
      actionLabel,
      matrix: JSON.parse(JSON.stringify(currentMatrix))
    };
    const updatedHistory = [newSnapshot, ...shippingHistory].slice(0, MAX_SHIPPING_HISTORY_SNAPSHOTS);
    setShippingHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_SHIPPING_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (e) { }
    return updatedHistory;
  };

  const currentRegionCities = useMemo(() => {
    return getCommunesByRegion(selectedShippingRegion);
  }, [selectedShippingRegion]);

  const handleRequestApplyInflationRate = () => {
    const rate = typeof inflationRate === 'number' ? inflationRate : 0;
    if (rate === 0) {
      setFeedback({ type: 'error', message: 'Ingresa un porcentaje de ajuste distinto de 0 (ej: 5 o -5).' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setIsInflationConfirmOpen(true);
  };

  const handleConfirmApplyInflationRate = async () => {
    const rate = typeof inflationRate === 'number' ? inflationRate : 0;
    if (rate === 0) return;

    const scopeDesc =
      inflationScope === 'all'
        ? 'Todo Chile (Todas las Agencias)'
        : inflationScope === 'region'
          ? `${selectedShippingRegion} (${getCourierDisplayName(selectedCourier)})`
          : `Solo Agencia ${getCourierDisplayName(inflationScope)}`;

    const nextHistory = recordShippingSnapshot(
      `Antes de aplicar reajuste ${rate > 0 ? '+' : ''}${rate}% en ${scopeDesc}`,
      shippingRatesMatrix
    );

    const factor = 1 + rate / 100;
    const updated: ShippingRatesMatrix = JSON.parse(JSON.stringify(shippingRatesMatrix));

    Object.keys(updated).forEach((c) => {
      if (
        (inflationScope === 'starken' ||
          inflationScope === 'blue_express' ||
          inflationScope === 'paket') &&
        c !== inflationScope
      ) {
        return;
      }
      if (inflationScope === 'region' && c !== selectedCourier) return;

      Object.keys(updated[c]).forEach((r) => {
        if (inflationScope === 'region' && r !== selectedShippingRegion) return;

        Object.keys(updated[c][r]).forEach((city) => {
          WEIGHT_TIERS.forEach((tier) => {
            const currentVal = updated[c][r][city][tier] || 5000;
            updated[c][r][city][tier] = Math.max(0, Math.round((currentVal * factor) / 10) * 10);
          });
        });
      });
    });

    setShippingRatesMatrix(updated);
    try {
      localStorage.setItem(STORAGE_SHIPPING_RATES_KEY, JSON.stringify(updated));
      await syncStoreSettingsToBackend({ shippingRatesMatrix: updated, shippingHistory: nextHistory });
    } catch (e) { }

    setIsInflationConfirmOpen(false);
    setFeedback({
      type: 'success',
      message: `✓ ¡Reajuste de ${rate > 0 ? '+' : ''}${rate}% aplicado y guardado en MongoDB!`
    });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleUndoLastShippingChange = async () => {
    if (shippingHistory.length === 0) return;
    const [latest, ...rest] = shippingHistory;
    setShippingRatesMatrix(latest.matrix);
    setShippingHistory(rest);
    try {
      localStorage.setItem(STORAGE_SHIPPING_RATES_KEY, JSON.stringify(latest.matrix));
      localStorage.setItem(STORAGE_SHIPPING_HISTORY_KEY, JSON.stringify(rest));
      await syncStoreSettingsToBackend({ shippingRatesMatrix: latest.matrix, shippingHistory: rest });
    } catch (e) { }
    setFeedback({
      type: 'success',
      message: `✓ Cambio deshecho. Se restauraron las tarifas previas (${latest.date}) en MongoDB.`
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleRestoreSnapshot = async (snap: ShippingMatrixSnapshot) => {
    const nextHistory = recordShippingSnapshot(`Antes de restaurar respaldo del ${snap.date}`, shippingRatesMatrix);
    const restored = JSON.parse(JSON.stringify(snap.matrix));
    setShippingRatesMatrix(restored);
    try {
      localStorage.setItem(STORAGE_SHIPPING_RATES_KEY, JSON.stringify(restored));
      await syncStoreSettingsToBackend({ shippingRatesMatrix: restored, shippingHistory: nextHistory });
    } catch (e) { }
    setIsShippingHistoryOpen(false);
    setFeedback({
      type: 'success',
      message: `✓ Tarifas restauradas a la versión del ${snap.date} en MongoDB.`
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleConfirmResetFactoryRates = async () => {
    const nextHistory = recordShippingSnapshot('Antes de restablecer tarifas oficiales de fábrica', shippingRatesMatrix);
    const freshCopy: ShippingRatesMatrix = JSON.parse(JSON.stringify(defaultShippingRatesMatrix));
    setShippingRatesMatrix(freshCopy);
    try {
      localStorage.setItem(STORAGE_SHIPPING_RATES_KEY, JSON.stringify(freshCopy));
      await syncStoreSettingsToBackend({ shippingRatesMatrix: freshCopy, shippingHistory: nextHistory });
    } catch (e) { }
    setIsResetFactoryConfirmOpen(false);
    setIsShippingHistoryOpen(false);
    setFeedback({
      type: 'success',
      message: '✓ Todas las tarifas fueron restablecidas a sus valores de fábrica en MongoDB.'
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRestoreSingleCity = async (city: string) => {
    const origCity = defaultShippingRatesMatrix[selectedCourier]?.[selectedShippingRegion]?.[city];
    if (!origCity) return;
    const nextHistory = recordShippingSnapshot(
      `Antes de restaurar ciudad ${city} (${selectedCourier.toUpperCase()})`,
      shippingRatesMatrix
    );
    const copy: ShippingRatesMatrix = JSON.parse(JSON.stringify(shippingRatesMatrix));
    copy[selectedCourier][selectedShippingRegion][city] = { ...origCity };
    setShippingRatesMatrix(copy);
    try {
      localStorage.setItem(STORAGE_SHIPPING_RATES_KEY, JSON.stringify(copy));
      await syncStoreSettingsToBackend({ shippingRatesMatrix: copy, shippingHistory: nextHistory });
    } catch (e) { }
    setFeedback({
      type: 'success',
      message: `✓ Tarifas de ${city} (${selectedCourier.toUpperCase()}) restauradas en MongoDB.`
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAutoCalculateCityTiers = async (city: string) => {
    const currentCity = shippingRatesMatrix[selectedCourier]?.[selectedShippingRegion]?.[city];
    if (!currentCity) return;
    const baseVal = currentCity['1KG-3KG'] || 5000;
    const nextHistory = recordShippingSnapshot(
      `Antes de autocalcular tramos de ${city} desde base ${formatCLP(baseVal)}`,
      shippingRatesMatrix
    );
    const copy: ShippingRatesMatrix = JSON.parse(JSON.stringify(shippingRatesMatrix));
    copy[selectedCourier][selectedShippingRegion][city] = {
      '0-1KG': Math.round((baseVal * TIER_MULTIPLIERS['0-1KG']) / 10) * 10,
      '1KG-3KG': baseVal,
      '3KG-6KG': Math.round((baseVal * TIER_MULTIPLIERS['3KG-6KG']) / 10) * 10,
      '6KG-12KG': Math.round((baseVal * TIER_MULTIPLIERS['6KG-12KG']) / 10) * 10,
      '12KG-20KG': Math.round((baseVal * TIER_MULTIPLIERS['12KG-20KG']) / 10) * 10
    };
    setShippingRatesMatrix(copy);
    try {
      localStorage.setItem(STORAGE_SHIPPING_RATES_KEY, JSON.stringify(copy));
      await syncStoreSettingsToBackend({ shippingRatesMatrix: copy, shippingHistory: nextHistory });
    } catch (e) { }
    setFeedback({
      type: 'success',
      message: `✓ Tramos de ${city} calculados y guardados en MongoDB.`
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleManualRateChange = (city: string, tier: WeightTierKey, newValue: number) => {
    setShippingRatesMatrix((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (!copy[selectedCourier]) copy[selectedCourier] = {};
      if (!copy[selectedCourier][selectedShippingRegion]) copy[selectedCourier][selectedShippingRegion] = {};
      if (!copy[selectedCourier][selectedShippingRegion][city]) {
        copy[selectedCourier][selectedShippingRegion][city] = {
          '0-1KG': 4500,
          '1KG-3KG': 5500,
          '3KG-6KG': 6800,
          '6KG-12KG': 8900,
          '12KG-20KG': 12500
        };
      }
      copy[selectedCourier][selectedShippingRegion][city][tier] = Math.max(0, newValue);
      return copy;
    });
  };

  const handleSaveShippingRates = async () => {
    try {
      let nextHistory = shippingHistory;
      const savedRaw = localStorage.getItem(STORAGE_SHIPPING_RATES_KEY);
      if (savedRaw) {
        nextHistory = recordShippingSnapshot(
          `Guardado manual (${selectedShippingRegion} · ${selectedCourier.toUpperCase()})`,
          JSON.parse(savedRaw)
        );
      }
      localStorage.setItem(STORAGE_SHIPPING_RATES_KEY, JSON.stringify(shippingRatesMatrix));
      await syncStoreSettingsToBackend({ shippingRatesMatrix, shippingHistory: nextHistory });
      setFeedback({
        type: 'success',
        message: '✓ Matriz de tarifas guardada en MongoDB y punto de restauración registrado.'
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (e) {
      setFeedback({ type: 'error', message: 'Error al guardar tarifas de envío en MongoDB.' });
    }
  };

  // ==========================================================================
  // ESTADO 5: EDITAR CUPONES EXCLUSIVOS (CONECTADO CON PUNTOS ACUMULADOS)
  // ==========================================================================
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [redeemedCouponsLog, setRedeemedCouponsLog] = useState<RedeemedUserCoupon[]>([]);

  // El editor solo presenta información obtenida de la API administrativa.

  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [selectedCouponForHistory, setSelectedCouponForHistory] = useState<CouponItem | 'ALL' | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<CouponItem | null>(null);

  const [couponName, setCouponName] = useState('');
  const [couponBadge, setCouponBadge] = useState('POPULAR');
  const [couponPointsCost, setCouponPointsCost] = useState<number | ''>(500);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountType, setCouponDiscountType] = useState<'percentage' | 'fixed' | 'free_shipping'>('fixed');
  const [couponDiscountValue, setCouponDiscountValue] = useState<number | ''>(5000);
  const [couponExpirationRule, setCouponExpirationRule] = useState<string>(
    '2 semanas de vida tiene después del canjeo'
  );
  const [couponMinPurchase, setCouponMinPurchase] = useState<number | ''>(25000);
  const [couponMaxUses, setCouponMaxUses] = useState<number | ''>(100);

  const generateUniqueCouponCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let prefix = 'NL-';
    for (let i = 0; i < 4; i++) {
      prefix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponCode(prefix);
  };

  const handleSuggestPointsByRule = () => {
    if (couponDiscountType === 'fixed' && Number(couponDiscountValue) > 0) {
      setCouponPointsCost(Math.max(50, Math.round(Number(couponDiscountValue) / 10)));
    } else if (couponDiscountType === 'percentage' && Number(couponDiscountValue) > 0) {
      setCouponPointsCost(Math.max(100, Number(couponDiscountValue) * 30));
    } else {
      setCouponPointsCost(350);
    }
  };

  const handleOpenCreateCoupon = () => {
    setEditingCouponId(null);
    setCouponName('');
    setCouponBadge('POPULAR');
    setCouponPointsCost(500);
    generateUniqueCouponCode();
    setCouponDiscountType('fixed');
    setCouponDiscountValue(5000);
    setCouponExpirationRule('2 semanas de vida tiene después del canjeo');
    setCouponMinPurchase(25000);
    setCouponMaxUses(100);
    setCouponModalOpen(true);
  };

  const handleOpenEditCoupon = (coup: CouponItem) => {
    setEditingCouponId(coup.id);
    setCouponName(coup.name);
    setCouponBadge(coup.badge || 'EXCLUSIVO');
    setCouponPointsCost(coup.pointsCost || 300);
    setCouponCode(coup.code);
    setCouponDiscountType(coup.discountType);
    setCouponDiscountValue(coup.discountType === 'free_shipping' ? 0 : coup.discountValue);
    setCouponExpirationRule(coup.expirationRule);
    setCouponMinPurchase(coup.minPurchase);
    setCouponMaxUses(coup.maxUses || 100);
    setCouponModalOpen(true);
  };

  // Releer el estado verdadero después de cada cambio: nunca confirmar antes de MongoDB.
  const refreshAdminCoupons = async (): Promise<void> => {
    const [catalog, log] = await Promise.all([
      api.get('/admin/coupons'), api.get('/admin/coupons/redemptions')
    ]);
    const rows: CouponItem[] = Array.isArray(catalog.data?.data) ? catalog.data.data : [];
    setCoupons(rows);
    saveAdminCouponsCatalog(rows);
    setRedeemedCouponsLog(Array.isArray(log.data?.data) ? log.data.data : []);
  };

  const handleToggleCouponActive = async (coup: CouponItem) => {
    try {
      await api.patch(`/admin/coupons/${encodeURIComponent(coup.id)}`, { isActive: !coup.isActive });
      await refreshAdminCoupons();
      setFeedback({ type: 'success', message: `Cupón ${!coup.isActive ? 'activado' : 'pausado'} en MongoDB` });
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.response?.data?.message || 'No se pudo actualizar el cupón' });
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    let days = 14;
    if (couponExpirationRule.includes('1 semana')) days = 7;
    else if (couponExpirationRule.includes('2 semana')) days = 14;
    else if (couponExpirationRule.includes('3 semana')) days = 21;
    else if (couponExpirationRule.includes('4 semana')) days = 28;
    const payload = {
      name: couponName.trim(), badge: couponBadge.trim() || 'EXCLUSIVO',
      pointsCost: Number(couponPointsCost), code: couponCode.trim().toUpperCase().replace(/-XP-\d+$/, ''),
      discountType: couponDiscountType,
      discountValue: couponDiscountType === 'free_shipping' ? 0 : Number(couponDiscountValue),
      expirationDays: days, minPurchase: Number(couponMinPurchase) || 0,
      maxUses: Number(couponMaxUses)
    };
    if (!payload.name || !payload.code || payload.pointsCost <= 0 || payload.maxUses < 1) {
      setFeedback({ type: 'error', message: 'Revisa nombre, prefijo, puntos y límite de canjes' }); return;
    }
    try {
      if (editingCouponId) await api.put(`/admin/coupons/${encodeURIComponent(editingCouponId)}`, payload);
      else await api.post('/admin/coupons', payload);
      await refreshAdminCoupons();
      setCouponModalOpen(false);
      setFeedback({ type: 'success', message: 'Cupón guardado correctamente en MongoDB' });
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.response?.data?.message || 'No se pudo guardar el cupón' });
    }
  };

  const handleConfirmDeleteCoupon = async () => {
    if (!couponToDelete) return;
    try {
      await api.delete(`/admin/coupons/${encodeURIComponent(couponToDelete.id)}`);
      await refreshAdminCoupons();
      setCouponToDelete(null);
      setFeedback({ type: 'success', message: 'Cupón retirado del catálogo de MongoDB' });
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.response?.data?.message || 'No se pudo eliminar el cupón' });
    }
  };

  // ==========================================================================
  // ESTADO 6: EDITAR CATEGORÍAS (ACTIVAR / DESACTIVAR SIN ELIMINAR)
  // ==========================================================================
  const [categoriesVisibility, setCategoriesVisibility] = useState<CategoriesVisibilityConfig>(() =>
    loadCategoriesVisibility()
  );
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  useEffect(() => {
    const syncVis = () => setCategoriesVisibility(loadCategoriesVisibility());
    window.addEventListener('nl_categories_visibility_updated', syncVis);
    window.addEventListener('storage', syncVis);
    return () => {
      window.removeEventListener('nl_categories_visibility_updated', syncVis);
      window.removeEventListener('storage', syncVis);
    };
  }, []);

  const allCatalogProducts = useMemo(() => loadAndSyncProductsStock(), []);

  const handleToggleSectionVisibility = async (sectionName: string) => {
    const currentlyActive = isSectionActive(sectionName, categoriesVisibility);
    const updatedDisabledSections = currentlyActive
      ? [...categoriesVisibility.disabledSections, sectionName]
      : categoriesVisibility.disabledSections.filter(
        (s) => s.toLowerCase() !== sectionName.toLowerCase()
      );
    const nextConfig: CategoriesVisibilityConfig = {
      ...categoriesVisibility,
      disabledSections: updatedDisabledSections
    };
    setCategoriesVisibility(nextConfig);
    saveCategoriesVisibility(nextConfig);
    try {
      await syncStoreSettingsToBackend({ categoriesVisibility: nextConfig });
    } catch (e) { }
    setFeedback({
      type: 'success',
      message: `✓ Sección "${sectionName}" ahora está ${currentlyActive ? 'DESACTIVADA' : 'ACTIVA'
        } en MongoDB.`
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleCategoryVisibility = async (sectionName: string, categoryName: string) => {
    const key = `${sectionName}::${categoryName}`;
    const isDirectlyDisabled = categoriesVisibility.disabledCategories.some(
      (c) => c.toLowerCase() === key.toLowerCase()
    );
    const updatedDisabledCategories = isDirectlyDisabled
      ? categoriesVisibility.disabledCategories.filter(
        (c) => c.toLowerCase() !== key.toLowerCase()
      )
      : [...categoriesVisibility.disabledCategories, key];

    const updatedDisabledSections = isDirectlyDisabled
      ? categoriesVisibility.disabledSections.filter(
        (s) => s.toLowerCase() !== sectionName.toLowerCase()
      )
      : categoriesVisibility.disabledSections;

    const nextConfig: CategoriesVisibilityConfig = {
      ...categoriesVisibility,
      disabledSections: updatedDisabledSections,
      disabledCategories: updatedDisabledCategories
    };
    setCategoriesVisibility(nextConfig);
    saveCategoriesVisibility(nextConfig);
    try {
      await syncStoreSettingsToBackend({ categoriesVisibility: nextConfig });
    } catch (e) { }
    setFeedback({
      type: 'success',
      message: `✓ Categoría "${sectionName} › ${categoryName}" ahora está ${isDirectlyDisabled ? 'ACTIVA' : 'DESACTIVADA'
        } en MongoDB.`
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleSubcategoryVisibility = async (
    sectionName: string,
    categoryName: string,
    subcategoryName: string
  ) => {
    const subKey = `${sectionName}::${categoryName}::${subcategoryName}`;
    const catKey = `${sectionName}::${categoryName}`;
    const isDirectlyDisabled = categoriesVisibility.disabledSubcategories.some(
      (sc) => sc.toLowerCase() === subKey.toLowerCase()
    );

    const updatedDisabledSubcategories = isDirectlyDisabled
      ? categoriesVisibility.disabledSubcategories.filter(
        (sc) => sc.toLowerCase() !== subKey.toLowerCase()
      )
      : [...categoriesVisibility.disabledSubcategories, subKey];

    const updatedDisabledCategories = isDirectlyDisabled
      ? categoriesVisibility.disabledCategories.filter(
        (c) => c.toLowerCase() !== catKey.toLowerCase()
      )
      : categoriesVisibility.disabledCategories;

    const updatedDisabledSections = isDirectlyDisabled
      ? categoriesVisibility.disabledSections.filter(
        (s) => s.toLowerCase() !== sectionName.toLowerCase()
      )
      : categoriesVisibility.disabledSections;

    const nextConfig: CategoriesVisibilityConfig = {
      disabledSections: updatedDisabledSections,
      disabledCategories: updatedDisabledCategories,
      disabledSubcategories: updatedDisabledSubcategories
    };
    setCategoriesVisibility(nextConfig);
    saveCategoriesVisibility(nextConfig);
    try {
      await syncStoreSettingsToBackend({ categoriesVisibility: nextConfig });
    } catch (e) { }
    setFeedback({
      type: 'success',
      message: `✓ Subcategoría "${sectionName} › ${categoryName} › ${subcategoryName}" ahora está ${isDirectlyDisabled ? 'ACTIVA' : 'DESACTIVADA'
        } en MongoDB.`
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleEnableAllCategories = async () => {
    const cleanConfig: CategoriesVisibilityConfig = {
      disabledSections: [],
      disabledCategories: [],
      disabledSubcategories: []
    };
    setCategoriesVisibility(cleanConfig);
    saveCategoriesVisibility(cleanConfig);
    try {
      await syncStoreSettingsToBackend({ categoriesVisibility: cleanConfig });
    } catch (e) { }
    setFeedback({
      type: 'success',
      message: '✓ ¡Todas las secciones, categorías y subcategorías fueron activadas en MongoDB!'
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  // ==========================================================================
  // ESTADO 7: EDITAR FONDO DE LA PÁGINA (SUBIR IMAGEN PERSONALIZADA A CLOUDINARY)
  // ==========================================================================
  const [backgroundConfig, setBackgroundConfig] = useState<CustomBackgroundConfig>(() =>
    loadCustomBackgroundConfig()
  );
  const [draftBgUrl, setDraftBgUrl] = useState<string>(() => loadCustomBackgroundConfig().imageUrl);
  const [draftBgFileName, setDraftBgFileName] = useState<string>(
    () => loadCustomBackgroundConfig().fileName || ''
  );
  const [draftBgFitMode, setDraftBgFitMode] = useState<'cover' | 'contain' | 'repeat'>(
    () => loadCustomBackgroundConfig().fitMode || 'cover'
  );

  const handleLocalBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackgroundFile(file); // Guardamos el archivo físico para subirlo a Cloudinary
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const uploadedDataUrl = reader.result;
        setDraftBgUrl(uploadedDataUrl);
        setDraftBgFileName(file.name);
        setFeedback({
          type: 'success',
          message: `✓ Imagen "${file.name}" cargada en vista previa. Presiona "Guardar Fondo" para subirla a Cloudinary.`
        });
        setTimeout(() => setFeedback(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomBackground = async () => {
    if (!draftBgUrl && !backgroundFile) {
      setFeedback({
        type: 'error',
        message: 'Primero selecciona una imagen desde tu equipo para aplicarla como fondo.'
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    const nextBg: CustomBackgroundConfig = {
      imageUrl: draftBgUrl.startsWith('http') ? draftBgUrl : backgroundConfig.imageUrl || '',
      fileName: draftBgFileName || 'Fondo_Personalizado.png',
      fitMode: draftBgFitMode,
      updatedAt: new Date().toLocaleString('es-CL')
    };
    try {
      const updatedDoc = await syncStoreSettingsToBackend(
        { backgroundConfig: nextBg },
        { fieldName: 'backgroundFile', file: backgroundFile }
      );
      const savedBg = updatedDoc?.backgroundConfig || nextBg;
      setBackgroundConfig(savedBg);
      setDraftBgUrl(savedBg.imageUrl);
      setBackgroundFile(null);
      // Actualizamos el fondo visible después de confirmar el guardado en MongoDB.
      publishBackground(savedBg);
      setFeedback({
        type: 'success',
        message: '✓ ¡Fondo personalizado subido a Cloudinary y sincronizado en MongoDB!'
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Error al subir la imagen de fondo a Cloudinary.'
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleRestoreDefaultBackground = async () => {
    const defaultBg: CustomBackgroundConfig = {
      imageUrl: '',
      fileName: '',
      fitMode: 'cover',
      updatedAt: ''
    };
    try {
      // Solo restaurar la interfaz después de confirmar el cambio en MongoDB.
      await syncStoreSettingsToBackend({ backgroundConfig: defaultBg });
      setBackgroundConfig(defaultBg);
      setDraftBgUrl('');
      setDraftBgFileName('');
      setBackgroundFile(null);
      setDraftBgFitMode('cover');
      publishBackground(null);
      setFeedback({
        type: 'success',
        message: '✓ Fondo original (Windows XP Bliss) restaurado en MongoDB.'
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (error) {
      // No afirmar éxito ni borrar el fondo local cuando el servidor falla.
      console.error('[FONDO] No se pudo restaurar el fondo oficial:', error);
      setFeedback({
        type: 'error',
        message: 'No fue posible restaurar el fondo en MongoDB. Inténtalo nuevamente.'
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // ==========================================================================
  // DESCARGAR CONFIGURACIÓN REAL DESDE MONGODB AL ABRIR EL EDITOR
  // ==========================================================================
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const response = await api.get('/admin/store-settings');
        const dbData = response.data?.data;
        if (!dbData) return;

        if (dbData.infoTexts && Object.keys(dbData.infoTexts).length > 0) {
          setInformativeConfig((prev) => ({ ...prev, ...dbData.infoTexts }));
          localStorage.setItem(STORAGE_INFORMATIVE_KEY, JSON.stringify(dbData.infoTexts));
        }
        if (dbData.homeMediaConfig && (dbData.homeMediaConfig.src || dbData.homeMediaConfig.videoUrl)) {
          const mediaCfg: HomeMediaConfig = {
            mediaType: dbData.homeMediaConfig.mediaType || 'gif',
            src: dbData.homeMediaConfig.src || dbData.homeMediaConfig.videoUrl || '',
            fileName: dbData.homeMediaConfig.fileName || '',
            title: dbData.homeMediaConfig.title || 'Clip_Promocional.wmv'
          };
          setHomeMediaConfig(mediaCfg);
          localStorage.setItem(STORAGE_HOME_MEDIA_KEY, JSON.stringify(mediaCfg));
        }
        if (Array.isArray(dbData.sliders) && dbData.sliders.length > 0) {
          setSlides(dbData.sliders);
          localStorage.setItem(STORAGE_SLIDER_KEY, JSON.stringify(dbData.sliders));
        }
        if (typeof dbData.sliderSpeed === 'number' && dbData.sliderSpeed >= 1000) {
          setSliderSpeed(dbData.sliderSpeed);
          localStorage.setItem(STORAGE_SLIDER_SPEED_KEY, String(dbData.sliderSpeed));
        }
        if (dbData.backgroundConfig) {
          setBackgroundConfig(dbData.backgroundConfig);
          setDraftBgUrl(dbData.backgroundConfig.imageUrl || '');
          setDraftBgFileName(dbData.backgroundConfig.fileName || '');
          setDraftBgFitMode(dbData.backgroundConfig.fitMode || 'cover');
          // Sincronizar el fondo que devuelve MongoDB al abrir el editor.
          publishBackground(dbData.backgroundConfig);
        }
        if (dbData.categoriesVisibility && dbData.categoriesVisibility.disabledSections) {
          setCategoriesVisibility(dbData.categoriesVisibility);
          saveCategoriesVisibility(dbData.categoriesVisibility);
        }
        if (dbData.shippingRatesMatrix && Object.keys(dbData.shippingRatesMatrix).length > 0) {
          setShippingRatesMatrix(dbData.shippingRatesMatrix);
          localStorage.setItem(STORAGE_SHIPPING_RATES_KEY, JSON.stringify(dbData.shippingRatesMatrix));
        }
        if (Array.isArray(dbData.shippingHistory)) {
          setShippingHistory(dbData.shippingHistory);
          localStorage.setItem(STORAGE_SHIPPING_HISTORY_KEY, JSON.stringify(dbData.shippingHistory));
        }
        if (Array.isArray(dbData.coupons)) {
          setCoupons(dbData.coupons);
          saveAdminCouponsCatalog(dbData.coupons);
        }
        const redemptions = await api.get('/admin/coupons/redemptions');
        setRedeemedCouponsLog(Array.isArray(redemptions.data?.data) ? redemptions.data.data : []);
      } catch (error) {
        console.error('Error cargando StoreSettings desde MongoDB:', error);
      }
    };
    fetchStoreSettings();
  }, []);

  return (
    <div className="nl-page-editor-root space-y-4 font-sans text-gray-900 pb-16">
      <WindowFrame
        title="SITE_CONTENT_EDITOR.SYS - [Editor Maestro de la Página // Super Admin]"
        icon={<PixelIcon name="computer" size={16} />}
        statusBarText={`SUPER ADMIN // EDITOR GLOBAL // TABS: INFORMATIVAS, SLIDER (MÁX 8), RESEÑAS, ENVÍOS (16 REGIONES), CUPONES // NO LIMITS OS`}
      >
        <div className="space-y-4">
          <PageEditorHeaderAndTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            feedback={feedback}
            slidesCount={slides.length}
            reviewsCount={reviews.length}
            couponsCount={coupons.length}
          />

          {activeTab === 'informativas' && (
            <InformativePagesTab
              informativeConfig={informativeConfig}
              setInformativeConfig={setInformativeConfig}
              activeInfoSection={activeInfoSection}
              setActiveInfoSection={setActiveInfoSection}
              handleSaveInformative={handleSaveInformative}
            />
          )}

          {activeTab === 'home_media' && (
            <HomeMediaTab
              homeMediaConfig={homeMediaConfig}
              setHomeMediaConfig={setHomeMediaConfig}
              handleHomeMediaFileUpload={handleHomeMediaFileUpload}
              handleSaveHomeMedia={handleSaveHomeMedia}
              handleClearHomeMedia={handleClearHomeMedia}
            />
          )}

          {activeTab === 'slider' && (
            <SliderEditorTab
              slides={slides}
              sliderSpeed={sliderSpeed}
              handleChangeSliderSpeed={handleChangeSliderSpeed}
              handleOpenNewSlide={handleOpenNewSlide}
              handleOpenEditSlide={handleOpenEditSlide}
              handleDeleteSlide={handleDeleteSlide}
            />
          )}

          {activeTab === 'resenas' && (
            <ReviewsEditorTab
              reviewsSearch={reviewsSearch}
              setReviewsSearch={setReviewsSearch}
              filteredReviews={filteredReviews}
              setSelectedReviewDetail={setSelectedReviewDetail}
              handleOpenAddReviewModal={handleOpenAddReviewModal}
              handleToggleReviewVisibility={handleToggleReviewVisibility}
              handleRequestDeleteReview={handleRequestDeleteReview}
            />
          )}

          {activeTab === 'envios' && (
            <ShippingRatesTab
              allRegions={allRegions}
              selectedShippingRegion={selectedShippingRegion}
              setSelectedShippingRegion={setSelectedShippingRegion}
              selectedCourier={selectedCourier}
              setSelectedCourier={setSelectedCourier}
              inflationRate={inflationRate}
              setInflationRate={setInflationRate}
              inflationScope={inflationScope}
              setInflationScope={setInflationScope}
              shippingHistory={shippingHistory}
              currentRegionCities={currentRegionCities}
              shippingRatesMatrix={shippingRatesMatrix}
              defaultShippingRatesMatrix={defaultShippingRatesMatrix}
              handleUndoLastShippingChange={handleUndoLastShippingChange}
              setIsShippingHistoryOpen={setIsShippingHistoryOpen}
              setIsResetFactoryConfirmOpen={setIsResetFactoryConfirmOpen}
              handleSaveShippingRates={handleSaveShippingRates}
              handleRequestApplyInflationRate={handleRequestApplyInflationRate}
              handleManualRateChange={handleManualRateChange}
              handleAutoCalculateCityTiers={handleAutoCalculateCityTiers}
              handleRestoreSingleCity={handleRestoreSingleCity}
            />
          )}

          {activeTab === 'cupones' && (
            <CouponsEditorTab
              coupons={coupons}
              redeemedCouponsLog={redeemedCouponsLog}
              setSelectedCouponForHistory={setSelectedCouponForHistory}
              handleOpenCreateCoupon={handleOpenCreateCoupon}
              handleToggleCouponActive={handleToggleCouponActive}
              handleOpenEditCoupon={handleOpenEditCoupon}
              setCouponToDelete={setCouponToDelete}
            />
          )}

          {activeTab === 'categorias' && (
            <CategoriesEditorTab
              categoriesVisibility={categoriesVisibility}
              selectedSectionFilter={selectedSectionFilter}
              setSelectedSectionFilter={setSelectedSectionFilter}
              allCatalogProducts={allCatalogProducts}
              handleEnableAllCategories={handleEnableAllCategories}
              handleToggleSectionVisibility={handleToggleSectionVisibility}
              handleToggleCategoryVisibility={handleToggleCategoryVisibility}
              handleToggleSubcategoryVisibility={handleToggleSubcategoryVisibility}
            />
          )}

          {activeTab === 'fondo' && (
            <BackgroundEditorTab
              backgroundConfig={backgroundConfig}
              setBackgroundConfig={setBackgroundConfig}
              draftBgUrl={draftBgUrl}
              draftBgFileName={draftBgFileName}
              draftBgFitMode={draftBgFitMode}
              setDraftBgFitMode={setDraftBgFitMode}
              handleLocalBackgroundUpload={handleLocalBackgroundUpload}
              handleSaveCustomBackground={handleSaveCustomBackground}
              handleRestoreDefaultBackground={handleRestoreDefaultBackground}
            />
          )}
        </div>
      </WindowFrame>

      <PageEditorModals
        editingSlide={editingSlide}
        setEditingSlide={setEditingSlide}
        isNewSlide={isNewSlide}
        slideTitle={slideTitle}
        setSlideTitle={setSlideTitle}
        slideImageUrl={slideImageUrl}
        slideImageFileName={slideImageFileName}
        slideTag={slideTag}
        setSlideTag={setSlideTag}
        handleLocalSlideImageUpload={handleLocalSlideImageUpload}
        handleSaveSlideModal={handleSaveSlideModal}
        selectedReviewDetail={selectedReviewDetail}
        setSelectedReviewDetail={setSelectedReviewDetail}
        handleOpenAddReviewModal={handleOpenAddReviewModal}
        handleRequestDeleteReview={handleRequestDeleteReview}
        isAddReviewModalOpen={isAddReviewModalOpen}
        setIsAddReviewModalOpen={setIsAddReviewModalOpen}
        targetReviewForRecord={targetReviewForRecord}
        setTargetReviewForRecord={setTargetReviewForRecord}
        recordListType={recordListType}
        setRecordListType={setRecordListType}
        recordReason={recordReason}
        setRecordReason={setRecordReason}
        recordBenefit={recordBenefit}
        setRecordBenefit={setRecordBenefit}
        recordDebtAmount={recordDebtAmount}
        setRecordDebtAmount={setRecordDebtAmount}
        recordNotes={recordNotes}
        setRecordNotes={setRecordNotes}
        handleCreateReviewRecord={handleCreateReviewRecord}
        reviewToDelete={reviewToDelete}
        setReviewToDelete={setReviewToDelete}
        handleConfirmDeleteReview={handleConfirmDeleteReview}
        couponModalOpen={couponModalOpen}
        setCouponModalOpen={setCouponModalOpen}
        editingCouponId={editingCouponId}
        couponName={couponName}
        setCouponName={setCouponName}
        couponBadge={couponBadge}
        setCouponBadge={setCouponBadge}
        couponPointsCost={couponPointsCost}
        setCouponPointsCost={setCouponPointsCost}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        couponDiscountType={couponDiscountType}
        setCouponDiscountType={setCouponDiscountType}
        couponDiscountValue={couponDiscountValue}
        setCouponDiscountValue={setCouponDiscountValue}
        couponExpirationRule={couponExpirationRule}
        setCouponExpirationRule={setCouponExpirationRule}
        couponMinPurchase={couponMinPurchase}
        setCouponMinPurchase={setCouponMinPurchase}
        couponMaxUses={couponMaxUses}
        setCouponMaxUses={setCouponMaxUses}
        generateUniqueCouponCode={generateUniqueCouponCode}
        handleSuggestPointsByRule={handleSuggestPointsByRule}
        handleSaveCoupon={handleSaveCoupon}
        selectedCouponForHistory={selectedCouponForHistory}
        setSelectedCouponForHistory={setSelectedCouponForHistory}
        redeemedCouponsLog={redeemedCouponsLog}
        couponToDelete={couponToDelete}
        setCouponToDelete={setCouponToDelete}
        handleConfirmDeleteCoupon={handleConfirmDeleteCoupon}
        isInflationConfirmOpen={isInflationConfirmOpen}
        setIsInflationConfirmOpen={setIsInflationConfirmOpen}
        inflationRate={inflationRate}
        inflationScope={inflationScope}
        selectedShippingRegion={selectedShippingRegion}
        selectedCourier={selectedCourier}
        currentRegionCities={currentRegionCities}
        shippingRatesMatrix={shippingRatesMatrix}
        handleConfirmApplyInflationRate={handleConfirmApplyInflationRate}
        isShippingHistoryOpen={isShippingHistoryOpen}
        setIsShippingHistoryOpen={setIsShippingHistoryOpen}
        shippingHistory={shippingHistory}
        handleRestoreSnapshot={handleRestoreSnapshot}
        isResetFactoryConfirmOpen={isResetFactoryConfirmOpen}
        setIsResetFactoryConfirmOpen={setIsResetFactoryConfirmOpen}
        handleConfirmResetFactoryRates={handleConfirmResetFactoryRates}
      />
    </div>
  );
};
