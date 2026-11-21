import React, { useState, useEffect } from 'react';
import { WindowFrame } from '../components/layout/WindowFrame';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useBranch, getBranchScheduleBlocks, formatBranchPickupSummary } from '../context/BranchContext';
import { PixelIcon } from '../components/common/PixelIcon';
import { INITIAL_PRODUCTS } from '../services/mockData';
import api from '../api/axios';
import {
  loadAndSyncProductsStock,
  ProductStockDetail
} from './admin/ProductStockSummaryView';
import { useNavigate } from 'react-router-dom';
import {
  RedeemedUserCoupon,
  loadAdminCouponsCatalog,
  loadRedeemedCoupons,
  redeemCouponTemplateForUser
} from '../services/couponsService';
import {
  calculateCourierQuotes,
  getProductWeightGrams,
  CHILE_REGIONS,
  getCommunesByRegion,
  findRegionByCommune,
  ShippingCourierId,
  getWeightTierInfo
} from '../services/shippingQuotesEngine';

// Importar estilos Mobile-First con matriz completa de Media Queries
import '../components/profile/ProfileView.css';

// Re-exportar todos los tipos, constantes y utilidades para preservar compatibilidad total
export {
  OWNER_RETURN_REASONS,
  BRANCH_PHYSICAL_SCHEDULES,
  PRESET_AVATARS,
  formatRutWithDotsAndDash,
  formatChileanMobilePhone,
  parseOrderDate,
  getReturnEligibility,
  getRecentTestOrderDateStr,
  resolveCatalogProductForOrderItem,
  resolveCatalogSizeForOrderItem
} from '../components/profile/profileTypes';

export type {
  UserAddress,
  ReturnRequest,
  UserPublishedReview,
  BranchScheduleInfo,
  PurchaseOrder,
  CouponItem,
  ProfileTabId
} from '../components/profile/profileTypes';


import {
  UserAddress,
  OWNER_RETURN_REASONS,
  ReturnRequest,
  UserPublishedReview,
  BranchScheduleInfo,
  BRANCH_PHYSICAL_SCHEDULES,
  PurchaseOrder,
  CouponItem,
  ProfileTabId,
  formatRutWithDotsAndDash,
  formatChileanMobilePhone,
  parseOrderDate,
  getRecentTestOrderDateStr,
  resolveCatalogProductForOrderItem,
  resolveCatalogSizeForOrderItem
} from '../components/profile/profileTypes';

// Componentes segmentados del Perfil de Usuario
import { ProfileSidebar } from '../components/profile/ProfileSidebar';
import { ProfileOrdersTab } from '../components/profile/ProfileOrdersTab';
import { ProfilePointsTab } from '../components/profile/ProfilePointsTab';
import { ProfileReviewsTab } from '../components/profile/ProfileReviewsTab';
import { ProfileWishlistTab } from '../components/profile/ProfileWishlistTab';
import { ProfileAddressesTab } from '../components/profile/ProfileAddressesTab';
import { ProfileReturnsTab } from '../components/profile/ProfileReturnsTab';
import { ProfileSettingsTab } from '../components/profile/ProfileSettingsTab';
import { ProfileModals } from '../components/profile/ProfileModals';

export const ProfileView: React.FC = () => {
  const { currentUser, logout, updateProfile, addLoyaltyPoints, deductLoyaltyPoints } = useAuth();
  const { wishlist, removeFromWishlist, wishlistCount } = useWishlist();
  const { branches } = useBranch();
  const navigate = useNavigate();

  // Horarios y sucursales físicas sincronizados en vivo con el Administrador de Sucursales
  const liveBranchSchedules: BranchScheduleInfo[] = React.useMemo(() => {
    const physicalBranches = branches.filter(
      b => !b.isCorporate && b.id !== 'casa_matriz' && b.isPhysicalStore !== false && b.allowPickup !== false && b.isActive !== false
    );
    if (physicalBranches.length === 0) return BRANCH_PHYSICAL_SCHEDULES;
    return physicalBranches.map(b => {
      const preset = BRANCH_PHYSICAL_SCHEDULES.find(p => p.id === b.id);
      const blocks = getBranchScheduleBlocks(b);
      return {
        id: b.id,
        name: b.name,
        city: b.city,
        address: b.address,
        scheduleWeekdays: b.scheduleWeekdays || preset?.scheduleWeekdays || 'Lunes a Viernes: 10:30 a 19:30 hrs',
        scheduleSaturday: b.scheduleSaturday || preset?.scheduleSaturday || 'Sábados: 11:00 a 17:00 hrs',
        scheduleSunday: b.scheduleSunday || preset?.scheduleSunday || 'Domingos y Feriados: Cerrado',
        scheduleBlocks: blocks,
        pickupSummary: formatBranchPickupSummary(b),
        phone: b.phone || preset?.phone || '+56 9 8452 1190',
        whatsapp: b.phone || preset?.whatsapp || '+56 9 8452 1190',
        leadContact: b.managerName || preset?.leadContact || 'Jefe de Tienda',
        returnInstructions:
          b.returnInstructions ||
          preset?.returnInstructions ||
          'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.',
        badge: b.badge || preset?.badge || 'Punto Oficial de Retiro'
      };
    });
  }, [branches]);

  // Estados del Formulario de Perfil en "Configuración" (Nombre y Apellido máx. 50 caracteres)
  const [profileFirstName, setProfileFirstName] = useState(() => {
    if (currentUser?.firstName) return currentUser.firstName.slice(0, 50);
    const parts = (currentUser?.name || '').split(' ');
    return (parts[0] || 'Valeria').slice(0, 50);
  });

  const [profileLastName, setProfileLastName] = useState(() => {
    if (currentUser?.lastName) return currentUser.lastName.slice(0, 50);
    const parts = (currentUser?.name || '').split(' ');
    return (parts.slice(1).join(' ') || 'Gallardo').slice(0, 50);
  });

  const [profileRut, setProfileRut] = useState(() => {
    return formatRutWithDotsAndDash(currentUser?.rut || '198765432');
  });

  const [profileEmail, setProfileEmail] = useState(() => {
    return currentUser?.email || 'valeria.cyber@gmail.com';
  });

  const [profilePhone, setProfilePhone] = useState(() => {
    return formatChileanMobilePhone(currentUser?.phone || '956896328');
  });

  const [profileAvatarUrl, setProfileAvatarUrl] = useState(() => {
    return currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
  });

  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Sincronizar campos cuando cambie el usuario autenticado
  useEffect(() => {
    if (currentUser) {
      if (currentUser.firstName) setProfileFirstName(currentUser.firstName.slice(0, 50));
      if (currentUser.lastName) setProfileLastName(currentUser.lastName.slice(0, 50));
      if (currentUser.rut) setProfileRut(formatRutWithDotsAndDash(currentUser.rut));
      if (currentUser.email) setProfileEmail(currentUser.email);
      if (currentUser.phone) setProfilePhone(formatChileanMobilePhone(currentUser.phone));
      if (currentUser.avatarUrl) setProfileAvatarUrl(currentUser.avatarUrl);
    }
  }, [currentUser]);

  // Manejadores con restricciones estrictas (máximo 50 caracteres para nombres, separaciones automáticas)
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileFirstName(e.target.value.slice(0, 50));
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileLastName(e.target.value.slice(0, 50));
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const currentClean = (profileRut || '').replace(/[^0-9kK]/g, '').toUpperCase();
    let newClean = inputValue.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);

    if (inputValue.length < profileRut.length && newClean.length === currentClean.length && newClean.length > 0) {
      newClean = newClean.slice(0, -1);
    }

    const formatted = formatRutWithDotsAndDash(newClean);
    setProfileRut(formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const currentDigits = (profilePhone || '').replace(/\D/g, '');
    let newDigits = inputValue.replace(/\D/g, '').slice(0, 9);

    if (inputValue.length < profilePhone.length && newDigits.length === currentDigits.length && newDigits.length > 0) {
      newDigits = newDigits.slice(0, -1);
    }

    const formatted = formatChileanMobilePhone(newDigits);
    setProfilePhone(formatted);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setProfileErrorMsg('La foto de perfil no debe superar los 3 MB.');
      setTimeout(() => setProfileErrorMsg(null), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileAvatarUrl(event.target.result as string);
        setProfileErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);

    const trimmedFirstName = profileFirstName.trim();
    const trimmedLastName = profileLastName.trim();
    const trimmedRut = profileRut.trim();
    const trimmedPhone = profilePhone.trim();
    const trimmedEmail = profileEmail.trim();

    const rawRutDigits = trimmedRut.replace(/[^0-9kK]/g, '');
    const rawPhoneDigits = trimmedPhone.replace(/\D/g, '');

    if (!trimmedFirstName) {
      setProfileErrorMsg('El Nombre es obligatorio.');
      return;
    }
    if (trimmedFirstName.length > 50) {
      setProfileErrorMsg('El Nombre no puede exceder los 50 caracteres máximo.');
      return;
    }
    if (!trimmedLastName) {
      setProfileErrorMsg('El Apellido es obligatorio.');
      return;
    }
    if (trimmedLastName.length > 50) {
      setProfileErrorMsg('El Apellido no puede exceder los 50 caracteres máximo.');
      return;
    }
    if (!trimmedRut || rawRutDigits.length < 7) {
      setProfileErrorMsg('El RUT es obligatorio para envíos a domicilio y retiros (formato: 12.345.678-K).');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setProfileErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (!trimmedPhone || rawPhoneDigits.length < 8) {
      setProfileErrorMsg('El Teléfono es obligatorio (ejemplo: 9 5689 6328).');
      return;
    }

    updateProfile({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      name: `${trimmedFirstName} ${trimmedLastName}`,
      rut: trimmedRut,
      email: trimmedEmail,
      phone: trimmedPhone,
      avatarUrl: profileAvatarUrl
    });

    setProfileSuccessMsg('✓ ¡Perfil actualizado con éxito! Datos sincronizados con el Checkout y despacho.');
    setTimeout(() => setProfileSuccessMsg(null), 4000);
  };

  // Tab activo
  const [activeTab, setActiveTab] = useState<ProfileTabId>('orders');

  // Filtro para el historial de compras
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'solicitud' | 'preparation_transit' | 'pickup' | 'delivered'>('all');
  const [ordersSort, setOrdersSort] = useState<'newest' | 'oldest'>('newest');

  // Modal para dejar reseña con fotos
  const [reviewModalProduct, setReviewModalProduct] = useState<{
    productId: string;
    title: string;
    image: string;
    orderNumber: string;
  } | null>(null);

  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [reviewPhotoFiles, setReviewPhotoFiles] = useState<File[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);

  // Registro de productos ya reseñados por el usuario
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nolimits_user_reviewed_items');
      return saved ? JSON.parse(saved) : ['prod_cyber_hoodie_01'];
    } catch {
      return ['prod_cyber_hoodie_01'];
    }
  });

  // Sub-pestañas para el módulo "Mis Reseñas": Tab 1: 'Pendientes' y Tab 2: 'Realizadas'
  const [reviewsSubTab, setReviewsSubTab] = useState<'pending' | 'completed'>('pending');

  // Historial de reseñas realizadas por el usuario
  const [myPublishedReviews, setMyPublishedReviews] = useState<UserPublishedReview[]>(() => {
    try {
      const saved = localStorage.getItem('nolimits_my_published_reviews');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'rev_initial_01',
        productId: 'prod_cyber_hoodie_01',
        productTitle: 'Cyber-Tribal Overkill Zip Hoodie',
        productImage: INITIAL_PRODUCTS[0]?.images[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300',
        productSize: 'L',
        orderNumber: 'NL-8842',
        rating: 5,
        title: 'Excelente serigrafía y calce oversized impecable',
        comment: 'La calidad del algodón frisado es pesada y abriga bien. El calce oversized cae perfecto con los parachute pants y los cierres metálicos son ultra resistentes. Muy recomendado el Drop.',
        photos: [
          'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&auto=format&fit=crop&q=80'
        ],
        date: '10 de Octubre 2026',
        pointsEarned: 100
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('nolimits_my_published_reviews', JSON.stringify(myPublishedReviews));
  }, [myPublishedReviews]);

  // Cargar órdenes reales y reseñas publicadas del usuario desde MongoDB
  useEffect(() => {
    if (!currentUser || currentUser.role === 'guest') return;
    let isMounted = true;

    const loadUserOrdersAndReviews = async () => {
      try {
        const [ordersRes, reviewsRes] = await Promise.all([
          api.get('/orders/my-orders'),
          api.get('/reviews/my-reviews')
        ]);

        if (isMounted && ordersRes.data?.success && Array.isArray(ordersRes.data.data)) {
          const mongoOrders: PurchaseOrder[] = ordersRes.data.data.map((o: any) => ({
            id: String(o._id),
            orderNumber: o.orderNumber || 'NL-0000',
            date: o.createdAt
              ? new Date(o.createdAt).toLocaleDateString('es-CL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : 'Reciente',
            total: Number(o.total) || 0,
            deliveryMethod: o.deliveryType === 'envio' ? 'shipping' : 'pickup',
            branchName: o.branchName || 'Viña del Mar',
            branchId: o.branchId || 'vina_del_mar',
            courier: o.shippingDetails?.courier || 'Starken',
            shippingAddress: o.shippingDetails?.address
              ? `${o.shippingDetails.address.street} ${o.shippingDetails.address.number}, ${o.shippingDetails.address.comuna}`
              : undefined,
            trackingNumber: o.shippingDetails?.trackingNumber || undefined,
            currentStatus: (o.status || o.fulfillmentStatus || 'Solicitud recibida') as any,
            items: (o.items || []).map((it: any) => {
              const matchedProd = catalogProducts.find(
                (p) => p.id === String(it.productId) || p.sku === it.sku || p.title === it.name
              );
              return {
                productId: String(it.productId || matchedProd?.id || ''),
                title: it.name || matchedProd?.title || 'Prenda NoLimits',
                size: it.size || 'Única',
                color: matchedProd?.colors?.[0]?.name || 'Void Black',
                quantity: Number(it.quantity) || 1,
                price: Number(it.price) || 0,
                image:
                  matchedProd?.images?.[0] ||
                  INITIAL_PRODUCTS[0]?.images[0] ||
                  ''
              };
            })
          }));

          if (mongoOrders.length > 0) {
            setOrders(mongoOrders);
          }
        }

        if (isMounted && reviewsRes.data?.success && Array.isArray(reviewsRes.data.data)) {
          const mongoReviews: UserPublishedReview[] = reviewsRes.data.data.map((r: any) => ({
            id: String(r._id),
            productId: String(r.productId?._id || r.productId || ''),
            productTitle: r.productId?.title || r.productId?.name || 'Prenda NoLimits',
            productImage:
              r.productId?.images?.[0] ||
              INITIAL_PRODUCTS[0]?.images[0] ||
              '',
            productSize: r.productSize || 'Única',
            orderNumber: String(r.orderId || 'Verificada'),
            rating: Number(r.rating) || 5,
            title: r.title || 'Valoración de Prenda',
            comment: r.comment || '',
            photos: Array.isArray(r.photos) ? r.photos : [],
            date: r.createdAt
              ? new Date(r.createdAt).toLocaleDateString('es-CL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : 'Reciente',
            pointsEarned: Array.isArray(r.photos) && r.photos.length > 0 ? 100 : 20
          }));

          setMyPublishedReviews(mongoReviews);
          setReviewedProductIds(mongoReviews.map((rev) => rev.productId));
        }
      } catch (err) {
        console.error('Error cargando órdenes/reseñas desde MongoDB:', err);
      }
    };

    loadUserOrdersAndReviews();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Catálogo de cupones canjeables administrado por el Super Admin en "Editar Cupones"
  const [adminCouponCatalog, setAdminCouponCatalog] = useState<CouponItem[]>(() =>
    loadAdminCouponsCatalog()
  );

  // Lista de cupones canjeados por el usuario (con código único de 1 solo uso)
  const [redeemedCoupons, setRedeemedCoupons] = useState<RedeemedUserCoupon[]>(() =>
    loadRedeemedCoupons()
  );

  useEffect(() => {
    const syncCouponsState = () => {
      setAdminCouponCatalog(loadAdminCouponsCatalog());
      setRedeemedCoupons(loadRedeemedCoupons());
    };
    window.addEventListener('nl_coupons_updated', syncCouponsState);
    window.addEventListener('storage', syncCouponsState);
    return () => {
      window.removeEventListener('nl_coupons_updated', syncCouponsState);
      window.removeEventListener('storage', syncCouponsState);
    };
  }, []);

  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [pointsNotification, setPointsNotification] = useState<string | null>(null);
  const [redeemConfirmCoupon, setRedeemConfirmCoupon] = useState<CouponItem | null>(null);

  // Bonificación de 1000 puntos solicitada por el usuario para testeo de la cuenta de cliente
  useEffect(() => {
    const testPointsKey = 'nolimits_test_1000_pts_applied_v2';
    if (!localStorage.getItem(testPointsKey)) {
      localStorage.setItem(testPointsKey, 'true');
      addLoyaltyPoints(1000);
    }
  }, []);

  // =========================================================================
  // GESTIÓN DE DIRECCIONES (Múltiples Direcciones & Selección de Predeterminada)
  // =========================================================================
  const [addresses, setAddresses] = useState<UserAddress[]>(() => {
    try {
      const saved = localStorage.getItem('nolimits_user_addresses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'addr_principal_01',
        alias: 'Casa Principal',
        recipientName: currentUser?.name || 'Valeria Gallardo',
        street: 'Av. Libertad',
        number: '1250',
        apartment: 'Depto 402',
        comuna: 'Viña del Mar',
        city: 'Viña del Mar',
        region: 'Región de Valparaíso',
        postalCode: '2520000',
        phone: '+56 9 9123 4567',
        notes: 'Entregar en conserjería edificio torre B',
        isDefault: true
      },
      {
        id: 'addr_trabajo_02',
        alias: 'Estudio / Trabajo',
        recipientName: currentUser?.name || 'Valeria Gallardo',
        street: 'Calle Prat',
        number: '856',
        apartment: 'Oficina 301',
        comuna: 'Valparaíso',
        city: 'Valparaíso',
        region: 'Región de Valparaíso',
        postalCode: '2340000',
        phone: '+56 9 8765 4321',
        notes: 'Horario continuado 09:00 a 18:30 hrs',
        isDefault: false
      }
    ];
  });

  const [addressSuccessMessage, setAddressSuccessMessage] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Nombre o Alias de la Dirección (máx 30 caracteres)
  const [newAddrAlias, setNewAddrAlias] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrNumber, setNewAddrNumber] = useState('');
  const [newAddrIsWithoutNumber, setNewAddrIsWithoutNumber] = useState(false);
  const [newAddrApt, setNewAddrApt] = useState('');
  const [newAddrComuna, setNewAddrComuna] = useState('Viña del Mar');
  const [newAddrPostalCode, setNewAddrPostalCode] = useState('');
  const [newAddrNotes, setNewAddrNotes] = useState('');
  const [newAddrIsDefault, setNewAddrIsDefault] = useState(false);

  // Sincronizar direcciones en localStorage y asegurar dirección predeterminada
  useEffect(() => {
    localStorage.setItem('nolimits_user_addresses', JSON.stringify(addresses));
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
    if (defaultAddr) {
      localStorage.setItem('nolimits_default_address', JSON.stringify(defaultAddr));
    }
  }, [addresses]);

  const handleStartEdit = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setIsAddingAddress(false);

    setNewAddrAlias(addr.alias || '');
    setNewAddrStreet(addr.street || '');

    const isSN =
      (addr.number || '').trim().toUpperCase() === 'S/N' ||
      (addr.number || '').toLowerCase().includes('sin n');

    if (isSN) {
      setNewAddrIsWithoutNumber(true);
      setNewAddrNumber('S/N');
    } else {
      setNewAddrIsWithoutNumber(false);
      setNewAddrNumber(addr.number || '');
    }

    setNewAddrApt(addr.apartment || '');
    setNewAddrComuna(addr.comuna || 'Viña del Mar');
    setNewAddrPostalCode(addr.postalCode || '');
    setNewAddrNotes(addr.notes || '');
    setNewAddrIsDefault(addr.isDefault);
  };

  const handleToggleEditHeader = () => {
    if (editingAddressId !== null) {
      setEditingAddressId(null);
      return;
    }
    if (addresses.length === 0) {
      alert('No tienes direcciones registradas para editar. Por favor agrega una nueva dirección.');
      return;
    }
    setIsAddingAddress(false);
    const target = addresses.find(a => a.isDefault) || addresses[0];
    handleStartEdit(target);
  };

  const handleToggleAddHeader = () => {
    if (isAddingAddress) {
      setIsAddingAddress(false);
      return;
    }
    setEditingAddressId(null);
    setNewAddrAlias('');
    setNewAddrStreet('');
    setNewAddrNumber('');
    setNewAddrIsWithoutNumber(false);
    setNewAddrApt('');
    setNewAddrPostalCode('');
    setNewAddrComuna('Viña del Mar');
    setNewAddrNotes('');
    setNewAddrIsDefault(false);
    setIsAddingAddress(true);
  };

  const handleCancelForm = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setNewAddrAlias('');
    setNewAddrIsWithoutNumber(false);
  };

  const handleSetDefaultAddress = (addressId: string) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === addressId
    }));
    setAddresses(updated);

    const selected = updated.find(a => a.id === addressId);
    if (selected) {
      localStorage.setItem('nolimits_default_address', JSON.stringify(selected));

      try {
        const currentCheckout = JSON.parse(localStorage.getItem('nolimits_checkout_info') || '{}');
        const updatedCheckout = {
          ...currentCheckout,
          customerName: selected.recipientName || currentCheckout.customerName || currentUser?.name,
          customerPhone: selected.phone || currentCheckout.customerPhone,
          shippingCountry: 'Chile',
          shippingStreet: selected.street,
          shippingNumber: selected.number,
          shippingApartment: selected.apartment || '',
          shippingComuna: selected.comuna,
          shippingCity: selected.city || selected.comuna,
          shippingAddress: `${selected.street} ${selected.number}${selected.apartment ? ', ' + selected.apartment : ''}`,
          shippingPostalCode: selected.postalCode || '2520000',
          shippingNotes: selected.notes || ''
        };
        localStorage.setItem('nolimits_checkout_info', JSON.stringify(updatedCheckout));
      } catch {
        // ignore
      }

      const displayLabel = selected.alias || (selected.street ? `${selected.street} #${selected.number}` : 'Dirección');
      setAddressSuccessMessage(`✓ "${displayLabel}" establecida como predeterminada e inyectada al Checkout.`);
      setTimeout(() => setAddressSuccessMessage(null), 3500);
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    const addrToDelete = addresses.find(a => a.id === addressId);
    if (!addrToDelete) return;
    if (addresses.length <= 1) {
      alert('Debes conservar al menos una dirección registrada para despachos.');
      return;
    }
    const displayLabel = addrToDelete.alias || (addrToDelete.street ? `${addrToDelete.street} #${addrToDelete.number}` : 'esta dirección');
    const confirmed = window.confirm(`¿Deseas eliminar la dirección "${displayLabel}"?`);
    if (!confirmed) return;

    if (editingAddressId === addressId) {
      setEditingAddressId(null);
    }

    let updated = addresses.filter(a => a.id !== addressId);
    if (addrToDelete.isDefault && updated.length > 0) {
      updated = updated.map((a, idx) => ({ ...a, isDefault: idx === 0 }));
      handleSetDefaultAddress(updated[0].id);
    }
    setAddresses(updated);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrAlias.trim()) {
      alert('Por favor ingresa el nombre o alias de la dirección (máx 30 caracteres).');
      return;
    }
    if (!newAddrStreet.trim() || (!newAddrIsWithoutNumber && !newAddrNumber.trim()) || !newAddrComuna.trim()) {
      alert('Por favor completa calle, número (o marca Calle sin número) y comuna.');
      return;
    }

    const finalAlias = newAddrAlias.trim().slice(0, 30);
    const finalNumber = newAddrIsWithoutNumber ? 'S/N' : newAddrNumber.trim();
    const recipient = currentUser?.name || 'Valeria Gallardo';

    const resolvedAddrRegion = findRegionByCommune(newAddrComuna.trim());

    if (editingAddressId) {
      const updated = addresses.map((addr) => {
        if (addr.id === editingAddressId) {
          return {
            ...addr,
            alias: finalAlias,
            street: newAddrStreet.trim(),
            number: finalNumber,
            apartment: newAddrApt.trim() || undefined,
            comuna: newAddrComuna.trim(),
            city: newAddrComuna.trim(),
            region: resolvedAddrRegion,
            postalCode: newAddrPostalCode.trim() || undefined,
            notes: newAddrNotes.trim() || undefined,
            isDefault: newAddrIsDefault ? true : addr.isDefault
          };
        }
        return newAddrIsDefault ? { ...addr, isDefault: false } : addr;
      });

      setAddresses(updated);
      if (newAddrIsDefault) {
        handleSetDefaultAddress(editingAddressId);
      }
      setEditingAddressId(null);
      setNewAddrAlias('');
      setAddressSuccessMessage(`✓ Dirección "${finalAlias}" actualizada con éxito.`);
      setTimeout(() => setAddressSuccessMessage(null), 3500);
      return;
    }

    const newId = `addr_${Date.now()}`;
    const newAddress: UserAddress = {
      id: newId,
      alias: finalAlias,
      recipientName: recipient,
      street: newAddrStreet.trim(),
      number: finalNumber,
      apartment: newAddrApt.trim() || undefined,
      comuna: newAddrComuna.trim(),
      city: newAddrComuna.trim(),
      region: resolvedAddrRegion,
      postalCode: newAddrPostalCode.trim() || undefined,
      notes: newAddrNotes.trim() || undefined,
      isDefault: newAddrIsDefault || addresses.length === 0
    };

    let updatedAddresses = [...addresses];
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
      updatedAddresses.push(newAddress);
      handleSetDefaultAddress(newId);
    } else {
      updatedAddresses.push(newAddress);
      setAddresses(updatedAddresses);
    }

    setNewAddrAlias('');
    setNewAddrStreet('');
    setNewAddrNumber('');
    setNewAddrIsWithoutNumber(false);
    setNewAddrApt('');
    setNewAddrPostalCode('');
    setNewAddrNotes('');
    setNewAddrIsDefault(false);
    setIsAddingAddress(false);
    setAddressSuccessMessage(`✓ Nueva dirección "${finalAlias}" registrada con éxito.`);
    setTimeout(() => setAddressSuccessMessage(null), 3500);
  };

  // =========================================================================
  // SINCRONIZACIÓN DE PRODUCTOS Y CATÁLOGO ACTUAL CON ÓRDENES Y DEVOLUCIONES
  // =========================================================================
  const [catalogProducts, setCatalogProducts] = useState<ProductStockDetail[]>(() =>
    loadAndSyncProductsStock()
  );

  useEffect(() => {
    const refreshCatalog = () => setCatalogProducts(loadAndSyncProductsStock());
    window.addEventListener('storage', refreshCatalog);
    window.addEventListener('focus', refreshCatalog);
    return () => {
      window.removeEventListener('storage', refreshCatalog);
      window.removeEventListener('focus', refreshCatalog);
    };
  }, []);

  const getRegisteredClientShippingOrigin = (order?: PurchaseOrder | null) => {
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
    let rawCommune = defaultAddr?.comuna?.trim() || '';

    if (!rawCommune) {
      try {
        const savedDefault = JSON.parse(localStorage.getItem('nolimits_default_address') || '{}');
        if (savedDefault.comuna) rawCommune = String(savedDefault.comuna).trim();
      } catch {
        // ignore
      }
    }

    if (!rawCommune && order?.shippingAddress) {
      const parts = order.shippingAddress.split(',').map(p => p.trim());
      const lastPart = parts[parts.length - 1];
      if (lastPart) rawCommune = lastPart;
    }

    if (!rawCommune) {
      try {
        const savedCheckout = JSON.parse(localStorage.getItem('nolimits_checkout_info') || '{}');
        if (savedCheckout.shippingComuna) rawCommune = String(savedCheckout.shippingComuna).trim();
      } catch {
        // ignore
      }
    }

    if (!rawCommune) rawCommune = 'Viña del Mar';

    const detectedRegion = findRegionByCommune(rawCommune);
    const resolvedRegion =
      defaultAddr?.region &&
      CHILE_REGIONS.includes(defaultAddr.region) &&
      getCommunesByRegion(defaultAddr.region).some(
        c => c.toLowerCase() === rawCommune.toLowerCase()
      )
        ? defaultAddr.region
        : detectedRegion;

    const regionCommunes = getCommunesByRegion(resolvedRegion);
    const matchedCommune =
      regionCommunes.find(c => c.toLowerCase() === rawCommune.toLowerCase()) ||
      regionCommunes[0] ||
      rawCommune;

    const fullStreetAddress = defaultAddr
      ? `${defaultAddr.street} ${defaultAddr.number}${defaultAddr.apartment ? `, ${defaultAddr.apartment}` : ''}`
      : order?.shippingAddress || 'Av. Libertad 1250, Depto 402';

    return {
      region: resolvedRegion,
      commune: matchedCommune,
      alias: defaultAddr?.alias || 'Casa Principal',
      recipientName: defaultAddr?.recipientName || currentUser?.name || 'Cliente Registrado',
      fullStreetAddress
    };
  };

  // =========================================================================
  // MÓDULO DE DEVOLUCIONES (Estados Obligatorios & Horarios de Sucursales)
  // =========================================================================
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>(() => {
    const currentCatalog = loadAndSyncProductsStock();
    const syncRetItem = (ret: ReturnRequest): ReturnRequest => {
      const prod = resolveCatalogProductForOrderItem(ret.productId, ret.productTitle, currentCatalog);
      return {
        ...ret,
        productId: prod.id,
        productTitle: prod.title,
        productSize: resolveCatalogSizeForOrderItem(ret.productSize, prod),
        productImage: prod.images?.[0] || ret.productImage
      };
    };

    try {
      const saved = localStorage.getItem('nolimits_return_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const updated = parsed.map((ret: ReturnRequest) => {
            let item = { ...ret };
            if (item.orderNumber === 'NL-8842') {
              item = {
                ...item,
                orderNumber: 'NL-8320',
                productId: 'prod_vintage_tee_03',
                productTitle: 'Windows XP Glitch 2000 Graphic Tee',
                productSize: 'M',
                productImage: INITIAL_PRODUCTS[2]?.images[0] || 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=300',
                targetBranchId: 'valparaiso',
                targetBranchName: 'Sucursal Valparaíso - Puerto Cyber Lab',
                notes: 'Cliente solicitó cambio alegando daño estético posterior al retiro presencial en sucursal.',
                rejectionReason: 'La prenda presenta signos de uso evidente tras el retiro en sucursal y la etiqueta original fue removida. De acuerdo con las políticas de devolución de Nolimits, solo se aprueban solicitudes por defectos de fabricación o fallas no informadas previas al uso.'
              };
            }
            if (item.rejectionReason && (item.rejectionReason.includes('Ley') || item.rejectionReason.includes('garantía legal'))) {
              item.rejectionReason = 'La prenda presenta signos evidentes de uso y la etiqueta original fue desprendida tras el retiro presencial. De acuerdo con las políticas de devolución de Nolimits, solo se aprueban solicitudes por defectos de fabricación o fallas no informadas previas al uso.';
            }
            if (item.reason === 'Garantía Legal' || item.reason === 'Drop Insatisfecho' || item.reason === 'Cambio de Talla') {
              item.reason = 'Defecto de fabricación (Costuras, cierres o confección)';
            }
            if (item.currentStatus === 'Envió a punto/sucursal') {
              item.currentStatus = item.returnMethod === 'courier_shipping' ? 'Envió a punto' : 'Retiro Presencial';
            }
            return syncRetItem(item);
          });

          if (!updated.some(r => r.currentStatus === 'Envió a punto')) {
            updated.push(
              syncRetItem({
                id: 'ret_case_04',
                ticketNumber: 'DEV-5532',
                orderNumber: 'NL-9550',
                productId: 'prod_chaqueta_biker_10',
                productTitle: 'Chaqueta Biker Cyber-Goth Cuero Vegano con Cierres Y2K',
                productSize: 'L',
                productImage: INITIAL_PRODUCTS[9]?.images[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300',
                reason: 'Defecto de fabricación (Costuras, cierres o confección)',
                returnMethod: 'courier_shipping',
                returnCourier: 'paket',
                shippingCostClp: 0,
                paidByStore: true,
                targetBranchId: 'shipping_courier',
                targetBranchName: 'Envío Paket Express (Devolución Pagada por Nolimits - $0 CLP)',
                requestDate: '15 de Octubre 2026',
                currentStatus: 'Envió a punto',
                notes: 'Defecto de fábrica en cierre verificado por bodega central. Devolución cubierta por Nolimits vía Paket.'
              })
            );
          }

          if (!updated.some(r => r.currentStatus === 'Retiro Presencial')) {
            updated.push(
              syncRetItem({
                id: 'ret_case_05',
                ticketNumber: 'DEV-6277',
                orderNumber: 'NL-9870',
                productId: 'prod_cyber_hoodie_01',
                productTitle: 'Cyber-Tribal Overkill Zip Hoodie',
                productSize: 'M',
                productImage: INITIAL_PRODUCTS[0]?.images[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300',
                reason: 'Defecto de fabricación (Costuras, cierres o confección)',
                returnMethod: 'branch_dropoff',
                targetBranchId: 'vina_del_mar',
                targetBranchName: 'Sucursal Viña del Mar - Mall Marina Studio',
                requestDate: '15 de Octubre 2026',
                currentStatus: 'Retiro Presencial',
                notes: 'Prenda de reemplazo por falla de fábrica reservada en mesón de atención física de sucursal Viña del Mar. Presentar ticket DEV-6277.'
              })
            );
          }

          return updated;
        }
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'ret_case_01',
        ticketNumber: 'DEV-8821',
        orderNumber: 'NL-6104',
        productId: 'prod_cartera_holographic_05',
        productTitle: 'Cartera Y2K Mini Baguette Plateada Mirror',
        productSize: 'Talla Única',
        productImage: INITIAL_PRODUCTS[4]?.images[0] || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300',
        reason: 'Falla o detalle en el material no informado antes de la compra',
        returnMethod: 'branch_dropoff' as const,
        targetBranchId: 'vina_del_mar',
        targetBranchName: 'Sucursal Viña del Mar - Mall Marina Studio',
        requestDate: '12 de Octubre 2026',
        currentStatus: 'Aprobada' as const,
        notes: 'Inspección previa de falla no informada aprobada por administración. Próximamente pasará a Retiro Presencial para entrega física en sucursal.'
      },
      {
        id: 'ret_case_02',
        ticketNumber: 'DEV-9104',
        orderNumber: 'NL-7319',
        productId: 'prod_goth_cargo_02',
        productTitle: 'Gothic Parachute Multipocket Cargo',
        productSize: '42 (Chile) - 32 (USA/W)',
        productImage: INITIAL_PRODUCTS[1]?.images[0] || 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=300',
        reason: 'Defecto de fabricación (Costuras, cierres o confección)',
        returnMethod: 'courier_shipping' as const,
        returnCourier: 'paket' as const,
        shippingCostClp: 0,
        paidByStore: true,
        targetBranchId: 'shipping_courier',
        targetBranchName: 'Envío Paket Express (Devolución Pagada por Nolimits - $0 CLP)',
        requestDate: '14 de Octubre 2026',
        currentStatus: 'Revisión de equipo' as const,
        notes: 'El equipo de control de calidad está evaluando las fotografías del defecto de costura antes de autorizar la devolución por Paket.'
      },
      {
        id: 'ret_case_03',
        ticketNumber: 'DEV-4019',
        orderNumber: 'NL-8320',
        productId: 'prod_vintage_tee_03',
        productTitle: 'Windows XP Glitch 2000 Graphic Tee',
        productSize: 'M',
        productImage: INITIAL_PRODUCTS[2]?.images[0] || 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=300',
        reason: 'Producto recibido con daño o falla previa al uso',
        returnMethod: 'branch_dropoff' as const,
        targetBranchId: 'valparaiso',
        targetBranchName: 'Sucursal Valparaíso - Puerto Cyber Lab',
        requestDate: '14 de Octubre 2026',
        currentStatus: 'Rechazada' as const,
        notes: 'Cliente solicitó cambio alegando daño estético posterior al retiro en sucursal.',
        rejectionReason: 'La prenda presenta signos evidentes de uso y la etiqueta original fue desprendida tras el retiro presencial. De acuerdo con las políticas de devolución de Nolimits, solo se aprueban solicitudes por defectos de fabricación o fallas no informadas previas al uso.',
        rejectionDate: '15 de Octubre 2026',
        adminInspector: 'Administración de Control de Calidad NoLimits'
      },
      {
        id: 'ret_case_04',
        ticketNumber: 'DEV-5532',
        orderNumber: 'NL-9550',
        productId: 'prod_chaqueta_biker_10',
        productTitle: 'Chaqueta Biker Cyber-Goth Cuero Vegano con Cierres Y2K',
        productSize: 'L',
        productImage: INITIAL_PRODUCTS[9]?.images[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300',
        reason: 'Defecto de fabricación (Costuras, cierres o confección)',
        returnMethod: 'courier_shipping' as const,
        returnCourier: 'paket' as const,
        shippingCostClp: 0,
        paidByStore: true,
        targetBranchId: 'shipping_courier',
        targetBranchName: 'Envío Paket Express (Devolución Pagada por Nolimits - $0 CLP)',
        requestDate: '15 de Octubre 2026',
        currentStatus: 'Envió a punto' as const,
        notes: 'Defecto de fabricación en cierre verificado por bodega central. El courier Paket retirará la prenda sin costo para el cliente.'
      },
      {
        id: 'ret_case_05',
        ticketNumber: 'DEV-6277',
        orderNumber: 'NL-9870',
        productId: 'prod_cyber_hoodie_01',
        productTitle: 'Cyber-Tribal Overkill Zip Hoodie',
        productSize: 'M',
        productImage: INITIAL_PRODUCTS[0]?.images[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300',
        reason: 'Defecto de fabricación (Costuras, cierres o confección)',
        returnMethod: 'branch_dropoff' as const,
        targetBranchId: 'vina_del_mar',
        targetBranchName: 'Sucursal Viña del Mar - Mall Marina Studio',
        requestDate: '15 de Octubre 2026',
        currentStatus: 'Retiro Presencial' as const,
        notes: 'Prenda de reemplazo por falla de fábrica reservada en mesón de atención física de sucursal Viña del Mar. Presentar ticket DEV-6277.'
      }
    ].map(syncRetItem);
  });

  // Filtro de devoluciones: Todas, En Proceso, Aprobadas, Rechazadas
  const [returnsFilter, setReturnsFilter] = useState<'all' | 'in_progress' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    localStorage.setItem('nolimits_return_requests', JSON.stringify(returnRequests));
  }, [returnRequests]);

  const [returnSuccessMessage, setReturnSuccessMessage] = useState<string | null>(null);
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);
  const [returnModalStep, setReturnModalStep] = useState<'select_product' | 'confirm' | 'form'>('confirm');
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<string>('');
  const [selectedReturnItem, setSelectedReturnItem] = useState<string>('');
  const [selectedReturnItems, setSelectedReturnItems] = useState<string[]>([]);
  const [selectedReturnReason, setSelectedReturnReason] = useState<string>(OWNER_RETURN_REASONS[0]);
  const [selectedReturnMethod, setSelectedReturnMethod] = useState<'branch' | 'shipping'>('branch');
  const [selectedReturnBranch, setSelectedReturnBranch] = useState<string>('vina_del_mar');
  const [selectedReturnCourier, setSelectedReturnCourier] = useState<ShippingCourierId>('paket');
  const [returnShippingRegion, setReturnShippingRegion] = useState<string>(() => getRegisteredClientShippingOrigin().region);
  const [returnShippingCommune, setReturnShippingCommune] = useState<string>(() => getRegisteredClientShippingOrigin().commune);
  const [selectedReturnNotes, setSelectedReturnNotes] = useState<string>('');
  const [returnPhotos, setReturnPhotos] = useState<string[]>([]);
  const [returnTargetOrder, setReturnTargetOrder] = useState<PurchaseOrder | null>(null);
  const [, setReturnTargetItem] = useState<{ productId: string; title: string; size: string; color: string; image: string; price: number } | null>(null);
  const [rejectionModalReturn, setRejectionModalReturn] = useState<ReturnRequest | null>(null);
  const [isPickupScheduleModalOpen, setIsPickupScheduleModalOpen] = useState(false);

  // Sincronizar automáticamente Región y Comuna de Origen del Envío con los datos del cliente registrado
  useEffect(() => {
    const origin = getRegisteredClientShippingOrigin(returnTargetOrder);
    setReturnShippingRegion(origin.region);
    setReturnShippingCommune(origin.commune);
  }, [addresses, currentUser, isNewReturnModalOpen, selectedReturnOrder]);

  /**
   * Abrir modal de devolución desde la cabecera de la orden.
   */
  const handleOpenOrderReturn = (order: PurchaseOrder) => {
    if (order.currentStatus !== 'Entregado' && order.currentStatus !== 'Retirado') {
      alert('Una devolución no puede ser solicitada si la orden nunca fue retirada o entregada.');
      return;
    }

    const hasRejectedReturn = order.items.some(i => {
      const ret = returnRequests.find(r => r.orderNumber === order.orderNumber && r.productId === i.productId);
      return ret && (ret.currentStatus === 'Rechazada' || !!ret.rejectionReason);
    });
    if (hasRejectedReturn) {
      alert('La solicitud de devolución para esta orden fue rechazada por la administración y se encuentra bloqueada.');
      return;
    }

    const eligibleItems = order.items.filter(i => {
      const ret = returnRequests.find(r => r.orderNumber === order.orderNumber && r.productId === i.productId);
      return !ret;
    });

    if (eligibleItems.length === 0) {
      alert('Esta orden ya no tiene prendas disponibles para solicitar devolución o la devolución previa fue rechazada.');
      return;
    }

    const clientOrigin = getRegisteredClientShippingOrigin(order);

    setSelectedReturnOrder(order.orderNumber);
    setReturnTargetOrder(order);
    setSelectedReturnReason(OWNER_RETURN_REASONS[0]);
    setSelectedReturnMethod(order.deliveryMethod === 'shipping' ? 'shipping' : 'branch');
    setSelectedReturnBranch(order.branchId || 'vina_del_mar');
    setSelectedReturnCourier('paket');
    setReturnShippingRegion(clientOrigin.region);
    setReturnShippingCommune(clientOrigin.commune);
    setSelectedReturnNotes('');
    setReturnPhotos([]);

    if (order.items.length > 1) {
      const firstEligible = eligibleItems[0];
      setSelectedReturnItem(firstEligible.productId);
      setSelectedReturnItems([firstEligible.productId]);
      setReturnTargetItem(firstEligible);
      setReturnModalStep('select_product');
    } else {
      const single = eligibleItems[0];
      setSelectedReturnItem(single.productId);
      setSelectedReturnItems([single.productId]);
      setReturnTargetItem(single);
      setReturnModalStep('confirm');
    }
    setIsNewReturnModalOpen(true);
  };

  /**
   * Calcula automáticamente las tarifas de envío para Paket vs Starken y Blue Express
   */
  const getReturnShippingCalculation = () => {
    const orderObj = orders.find(o => o.orderNumber === selectedReturnOrder);
    const itemsToReturn = selectedReturnItems.length > 0
      ? selectedReturnItems
      : selectedReturnItem ? [selectedReturnItem] : [];

    let totalWeightGrams = 0;
    const itemBreakdowns: { title: string; quantity: number; weightGrams: number }[] = [];

    itemsToReturn.forEach(prodId => {
      const orderItem = orderObj?.items.find(i => i.productId === prodId);
      const catalogProduct = resolveCatalogProductForOrderItem(
        prodId,
        orderItem?.title,
        catalogProducts
      );
      const unitWeight = catalogProduct
        ? getProductWeightGrams(catalogProduct)
        : getProductWeightGrams({ category: orderItem?.title || 'Ropa Superior' });
      const qty = orderItem?.quantity || 1;
      const subtotalWeight = unitWeight * qty;
      totalWeightGrams += subtotalWeight;
      if (orderItem) {
        itemBreakdowns.push({
          title: orderItem.title,
          quantity: qty,
          weightGrams: subtotalWeight
        });
      }
    });

    if (totalWeightGrams <= 0) totalWeightGrams = 600;

    const rawQuotes = calculateCourierQuotes({
      totalWeightGrams,
      destinationRegion: returnShippingRegion,
      destinationCommune: returnShippingCommune,
      originBranch: 'vina_del_mar'
    });

    const tierInfo = getWeightTierInfo(totalWeightGrams);
    const paketQuote = rawQuotes.find(q => q.courierId === 'paket');
    const starkenQuote = rawQuotes.find(q => q.courierId === 'starken');
    const blueQuote = rawQuotes.find(q => q.courierId === 'blue_express');

    const paketReferenceCarrierCost =
      paketQuote && paketQuote.priceClp > 0
        ? paketQuote.priceClp
        : tierInfo?.paketRmRate || 3490;

    const starkenCustomerCost = starkenQuote?.priceClp || 4500;
    const blueCustomerCost = blueQuote?.priceClp || 4300;

    const selectedCostForCustomer =
      selectedReturnCourier === 'paket'
        ? 0
        : selectedReturnCourier === 'starken'
        ? starkenCustomerCost
        : blueCustomerCost;

    const selectedCourierLabel =
      selectedReturnCourier === 'paket'
        ? 'Paket Express'
        : selectedReturnCourier === 'starken'
        ? 'Starken'
        : 'Blue Express';

    return {
      totalWeightGrams,
      weightKgDisplay: (totalWeightGrams / 1000).toFixed(2),
      tierLabel: tierInfo?.label || '0 - 3 KG',
      itemBreakdowns,
      paketReferenceCarrierCost,
      starkenCustomerCost,
      blueCustomerCost,
      selectedCostForCustomer,
      selectedCourierLabel,
      isPaidByStore: selectedReturnCourier === 'paket'
    };
  };

  /**
   * Subida de hasta 10 fotos para la devolución
   */
  const handleReturnPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 10 - returnPhotos.length;
    if (remainingSlots <= 0) {
      alert('Has alcanzado el límite máximo permitido de 10 fotos.');
      return;
    }

    const filesToRead = files.slice(0, remainingSlots);
    filesToRead.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReturnPhotos(prev => {
            if (prev.length >= 10) return prev;
            return [...prev, event.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveReturnPhoto = (index: number) => {
    setReturnPhotos(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Crear nueva solicitud de devolución para una o varias prendas seleccionadas
   */
  const handleCreateReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToReturn = selectedReturnItems.length > 0
      ? selectedReturnItems
      : selectedReturnItem ? [selectedReturnItem] : [];

    if (!selectedReturnOrder || itemsToReturn.length === 0) {
      alert('Por favor selecciona al menos una prenda que deseas devolver.');
      return;
    }

    const orderObj = orders.find(o => o.orderNumber === selectedReturnOrder);
    const branchObj = liveBranchSchedules.find(b => b.id === selectedReturnBranch) || liveBranchSchedules[0];
    const shippingCalc = getReturnShippingCalculation();

    const targetBranchName = selectedReturnMethod === 'shipping'
      ? selectedReturnCourier === 'paket'
        ? `Envío Paket Express (${returnShippingCommune} · Devolución Pagada por Nolimits: $0 CLP)`
        : `Envío ${shippingCalc.selectedCourierLabel} (${returnShippingCommune} · Envío a cargo del cliente: $${shippingCalc.selectedCostForCustomer.toLocaleString('es-CL')} CLP)`
      : branchObj.name;

    const randomTicketNumber = `DEV-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCases: ReturnRequest[] = itemsToReturn.map((prodId, idx) => {
      const itemObj = orderObj?.items.find(it => it.productId === prodId);
      const catalogProd = resolveCatalogProductForOrderItem(prodId, itemObj?.title, catalogProducts);
      return {
        id: `ret_${Date.now()}_${idx}`,
        ticketNumber: itemsToReturn.length > 1 ? `${randomTicketNumber}-${idx + 1}` : randomTicketNumber,
        orderNumber: selectedReturnOrder,
        productId: catalogProd.id,
        productTitle: catalogProd.title,
        productSize: itemObj?.size || resolveCatalogSizeForOrderItem('M', catalogProd),
        productImage: catalogProd.images?.[0] || itemObj?.image || INITIAL_PRODUCTS[0]?.images[0],
        reason: selectedReturnReason,
        returnMethod: selectedReturnMethod === 'shipping' ? 'courier_shipping' : 'branch_dropoff',
        returnCourier: selectedReturnMethod === 'shipping' ? selectedReturnCourier : undefined,
        shippingCostClp: selectedReturnMethod === 'shipping' ? shippingCalc.selectedCostForCustomer : 0,
        paidByStore: selectedReturnMethod === 'shipping' ? shippingCalc.isPaidByStore : true,
        targetBranchId: selectedReturnMethod === 'shipping' ? 'shipping_courier' : branchObj.id,
        targetBranchName: targetBranchName,
        requestDate: new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }),
        currentStatus: 'Solicitud recibida',
        notes: selectedReturnNotes.trim() || 'Solicitud por falla o defecto ingresada por el cliente. Esperando evaluación del equipo.',
        photos: returnPhotos
      };
    });

    setReturnRequests(prev => [...newCases, ...prev]);

    // Sincronizar solicitud de devolución con "Notificaciones de Interés" del Super Administrador
    try {
      const ALERTS_STORAGE_KEY = 'nl_admin_system_alerts_v7';
      const rawAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
      const existingAlerts = rawAlerts ? JSON.parse(rawAlerts) : [];
      if (Array.isArray(existingAlerts)) {
        const alertProducts = itemsToReturn.map((prodId) => {
          const itemObj = orderObj?.items.find(it => it.productId === prodId);
          const catalogProd = resolveCatalogProductForOrderItem(prodId, itemObj?.title, catalogProducts);
          const imgs = catalogProd.images?.length
            ? catalogProd.images
            : [itemObj?.image || INITIAL_PRODUCTS[0]?.images[0]];
          return {
            id: catalogProd.id,
            title: catalogProd.title,
            size: itemObj?.size || resolveCatalogSizeForOrderItem('M', catalogProd),
            quantity: itemObj?.quantity || 1,
            priceClp: itemObj?.price || catalogProd.price,
            image: imgs[0],
            images: imgs,
            returnPhotoEvidence: returnPhotos.length > 0 ? returnPhotos[0] : imgs[0],
            returnEvidenceGallery: returnPhotos.length > 0 ? returnPhotos : imgs,
            description:
              selectedReturnNotes.trim() ||
              `Solicitud de devolución ingresada por el cliente. Motivo: ${selectedReturnReason}.`
          };
        });

        const totalReturnValue = alertProducts.reduce(
          (acc, p) => acc + (p.priceClp || 0) * (p.quantity || 1),
          0
        );

        const newAdminReturnAlert = {
          id: `alert_dev_${Date.now()}`,
          category: 'devolucion',
          severity: 'warning',
          title: `Solicitud de Devolución #${randomTicketNumber} — ${alertProducts[0]?.title || 'Prenda'}`,
          description:
            selectedReturnMethod === 'shipping'
              ? selectedReturnCourier === 'paket'
                ? `Cliente solicita devolución por ${selectedReturnReason.toLowerCase()}. Agencia escogida: Paket Express (${returnShippingCommune}, ${returnShippingRegion}). Al cliente le sale $0 CLP porque el envío lo paga el dueño ($${shippingCalc.paketReferenceCarrierCost.toLocaleString('es-CL')} CLP).`
                : `Cliente solicita devolución por ${selectedReturnReason.toLowerCase()}. Agencia escogida: ${shippingCalc.selectedCourierLabel} (${returnShippingCommune}, ${returnShippingRegion}). Envío a pagar por el usuario: $${shippingCalc.selectedCostForCustomer.toLocaleString('es-CL')} CLP.`
              : `Cliente solicita devolución presencial en ${branchObj.name}. Motivo: ${selectedReturnReason}.`,
          branchId: branchObj.id,
          branchName: branchObj.name,
          timestamp: 'Hace instantes',
          read: false,
          resolved: false,
          metricBadge: `${itemsToReturn.length} ${itemsToReturn.length === 1 ? 'PRENDA' : 'PRENDAS'} · $${totalReturnValue.toLocaleString('es-CL')} CLP`,
          actionLabel: 'Revisión de Equipo',
          orderNumber: selectedReturnOrder,
          customerName:
            currentUser?.name ||
            `${profileFirstName} ${profileLastName}`.trim() ||
            'Valeria Neo-Goth',
          customerRut: profileRut || currentUser?.rut || '20.418.932-5',
          customerEmail: profileEmail || currentUser?.email || 'valeria.k@gmail.com',
          customerPhone: profilePhone || currentUser?.phone || '+56 9 8412 6630',
          deliveryType: selectedReturnMethod === 'shipping' ? 'envio' : 'retiro',
          shippingAddress: `${(addresses.find(a => a.isDefault) || addresses[0])?.street || 'Av. Libertad 742, Depto 904'}, ${returnShippingCommune}, ${returnShippingRegion}`,
          returnReason: selectedReturnReason,
          returnCourier: selectedReturnMethod === 'shipping' ? selectedReturnCourier : undefined,
          returnShippingCostCustomerClp:
            selectedReturnMethod === 'shipping' ? shippingCalc.selectedCostForCustomer : 0,
          returnShippingCostOwnerClp:
            selectedReturnMethod === 'shipping' && selectedReturnCourier === 'paket'
              ? shippingCalc.paketReferenceCarrierCost
              : 0,
          returnInspectionStatus: 'pending',
          products: alertProducts
        };

        localStorage.setItem(
          ALERTS_STORAGE_KEY,
          JSON.stringify([newAdminReturnAlert, ...existingAlerts])
        );
      }
    } catch {
      // ignore storage errors
    }

    setIsNewReturnModalOpen(false);
    setSelectedReturnNotes('');
    setReturnPhotos([]);
    setSelectedReturnItems([]);
    setReturnSuccessMessage(
      itemsToReturn.length > 1
        ? `✓ Solicitud ${randomTicketNumber} (${itemsToReturn.length} prendas) ingresada con éxito. Redirigiendo a Devoluciones...`
        : `✓ Solicitud ${randomTicketNumber} ingresada con éxito. Redirigiendo a Devoluciones...`
    );
    setTimeout(() => {
      setReturnSuccessMessage(null);
      setActiveTab('returns');
    }, 1200);
  };

  const getReturnSteps = (ret: ReturnRequest) => {
    const isShipping = ret.returnMethod === 'courier_shipping';
    return [
      { key: 'Solicitud recibida', label: '1. Solicitud recibida' },
      { key: 'Revisión de equipo', label: '2. Revisión de equipo' },
      { key: 'Aprobado / Rechazado', label: '3. Aprobado / Rechazado' },
      {
        key: isShipping ? 'Envió a punto' : 'Retiro Presencial',
        label: isShipping ? '4. Envió a punto' : '4. Retiro Presencial'
      }
    ];
  };

  const getReturnStepStatus = (
    ret: ReturnRequest,
    stepIndex: number
  ): 'completed' | 'current' | 'rejected' | 'cancelled' | 'pending' => {
    if (ret.currentStatus === 'Rechazada') {
      if (stepIndex < 2) return 'completed';
      if (stepIndex === 2) return 'rejected';
      return 'cancelled';
    }
    const isShipping = ret.returnMethod === 'courier_shipping';
    const fourthKey = isShipping ? 'Envió a punto' : 'Retiro Presencial';
    const statusKeys = ['Solicitud recibida', 'Revisión de equipo', 'Aprobada', fourthKey];

    let currentStatus: string = ret.currentStatus;
    if (currentStatus === 'Envió a punto/sucursal') {
      currentStatus = fourthKey;
    }

    const currentIdx = statusKeys.indexOf(currentStatus);
    if (stepIndex < currentIdx) return 'completed';
    if (stepIndex === currentIdx) return 'current';
    return 'pending';
  };

  const syncOrderWithCurrentCatalog = (
    order: PurchaseOrder,
    catalogList: ProductStockDetail[] = catalogProducts
  ): PurchaseOrder => {
    const syncedItems = (order.items || []).map(it => {
      const prod = resolveCatalogProductForOrderItem(it.productId, it.title, catalogList);
      const unitPrice = prod.salePrice ?? prod.price;
      const syncedSize = resolveCatalogSizeForOrderItem(it.size, prod);
      const syncedColor = prod.colors?.[0]?.name || it.color || 'Void Black';
      const syncedImage = prod.images?.[0] || it.image;

      return {
        ...it,
        productId: prod.id,
        title: prod.title,
        size: syncedSize,
        color: syncedColor,
        quantity: it.quantity || 1,
        price: unitPrice,
        image: syncedImage
      };
    });

    const recalculatedTotal = syncedItems.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    );

    return {
      ...order,
      total: recalculatedTotal > 0 ? recalculatedTotal : order.total,
      items: syncedItems
    };
  };

  const buildInitialPurchaseOrders = (
    catalogList: ProductStockDetail[] = catalogProducts
  ): PurchaseOrder[] => {
    const baseOrders: PurchaseOrder[] = [
      {
        id: 'ord_demo_10',
        orderNumber: 'NL-9985',
        date: getRecentTestOrderDateStr(),
        total: 74980,
        deliveryMethod: 'shipping',
        courier: 'Starken',
        shippingAddress: 'Av. Libertad 1250, Depto 402, Viña del Mar',
        currentStatus: 'Entregado',
        items: [
          {
            productId: 'prod_cyber_hoodie_01',
            title: 'Cyber-Tribal Overkill Zip Hoodie',
            size: 'L',
            color: 'Void Black',
            quantity: 1,
            price: 38990,
            image: INITIAL_PRODUCTS[0]?.images[0] || ''
          },
          {
            productId: 'prod_goth_cargo_02',
            title: 'Gothic Parachute Multipocket Cargo',
            size: '42 (Chile) - 32 (USA/W)',
            color: 'Shadow Grey',
            quantity: 1,
            price: 35990,
            image: INITIAL_PRODUCTS[1]?.images[0] || ''
          }
        ]
      },
      {
        id: 'ord_demo_07',
        orderNumber: 'NL-9870',
        date: '15 de Octubre 2026',
        total: 93970,
        deliveryMethod: 'shipping',
        courier: 'Starken',
        shippingAddress: 'Calle Quillota 450, Depto 302, Viña del Mar',
        currentStatus: 'Entregado',
        items: [
          {
            productId: 'prod_cyber_hoodie_01',
            title: 'Cyber-Tribal Overkill Zip Hoodie',
            size: 'M',
            color: 'Void Black',
            quantity: 1,
            price: 38990,
            image: INITIAL_PRODUCTS[0]?.images[0] || ''
          },
          {
            productId: 'prod_goth_cargo_02',
            title: 'Gothic Parachute Multipocket Cargo',
            size: '44 (Chile) - 34 (USA/W)',
            color: 'Shadow Grey',
            quantity: 1,
            price: 35990,
            image: INITIAL_PRODUCTS[1]?.images[0] || ''
          },
          {
            productId: 'prod_metal_choker_04',
            title: 'Cybernetic Chrome Spiked Collar & Chain',
            size: 'Talla Única',
            color: 'Liquid Chrome',
            quantity: 1,
            price: 18990,
            image: INITIAL_PRODUCTS[3]?.images[0] || ''
          }
        ]
      },
      {
        id: 'ord_demo_05',
        orderNumber: 'NL-9550',
        date: '14 de Octubre 2026',
        total: 68990,
        deliveryMethod: 'shipping',
        courier: 'Blue Express',
        shippingAddress: 'Av. Álvarez 680, Depto 901, Viña del Mar',
        currentStatus: 'Entregado',
        items: [
          {
            productId: 'prod_chaqueta_biker_10',
            title: 'Chaqueta Biker Cyber-Goth Cuero Vegano con Cierres Y2K',
            size: 'L',
            color: 'Pitch Black',
            quantity: 1,
            price: 68990,
            image: INITIAL_PRODUCTS[9]?.images[0] || ''
          }
        ]
      },
      {
        id: 'ord_demo_06',
        orderNumber: 'NL-8320',
        date: '13 de Octubre 2026',
        total: 24990,
        deliveryMethod: 'pickup',
        branchName: 'Valparaíso',
        branchId: 'valparaiso',
        currentStatus: 'Retirado',
        items: [
          {
            productId: 'prod_vintage_tee_03',
            title: 'Windows XP Glitch 2000 Graphic Tee',
            size: 'M',
            color: 'Acid Washed Black',
            quantity: 1,
            price: 24990,
            image: INITIAL_PRODUCTS[2]?.images[0] || ''
          }
        ]
      },
      {
        id: 'ord_demo_01',
        orderNumber: 'NL-8842',
        date: '12 de Octubre 2026',
        total: 57980,
        deliveryMethod: 'pickup',
        branchName: 'Viña del Mar',
        branchId: 'vina_del_mar',
        currentStatus: 'Listo para el retiro de sucursal',
        items: [
          {
            productId: 'prod_cyber_hoodie_01',
            title: 'Cyber-Tribal Overkill Zip Hoodie',
            size: 'L',
            color: 'Void Black',
            quantity: 1,
            price: 38990,
            image: INITIAL_PRODUCTS[0]?.images[0] || ''
          },
          {
            productId: 'prod_metal_choker_04',
            title: 'Cybernetic Chrome Spiked Collar & Chain',
            size: 'Talla Única',
            color: 'Liquid Chrome',
            quantity: 1,
            price: 18990,
            image: INITIAL_PRODUCTS[3]?.images[0] || ''
          }
        ]
      },
      {
        id: 'ord_demo_02',
        orderNumber: 'NL-7319',
        date: '02 de Agosto 2026',
        total: 35990,
        deliveryMethod: 'shipping',
        courier: 'Starken',
        shippingAddress: 'Av. Libertad 1250, Depto 402, Viña del Mar',
        currentStatus: 'Entregado',
        items: [
          {
            productId: 'prod_goth_cargo_02',
            title: 'Gothic Parachute Multipocket Cargo',
            size: '42 (Chile) - 32 (USA/W)',
            color: 'Shadow Grey',
            quantity: 1,
            price: 35990,
            image: INITIAL_PRODUCTS[1]?.images[0] || ''
          }
        ]
      },
      {
        id: 'ord_demo_03',
        orderNumber: 'NL-6104',
        date: '28 de Julio 2026',
        total: 34990,
        deliveryMethod: 'pickup',
        branchName: 'Valparaíso',
        branchId: 'valparaiso',
        currentStatus: 'Retirado',
        items: [
          {
            productId: 'prod_cartera_holographic_05',
            title: 'Cartera Y2K Mini Baguette Plateada Mirror',
            size: 'Talla Única',
            color: 'Liquid Mirror Silver',
            quantity: 1,
            price: 34990,
            image: INITIAL_PRODUCTS[4]?.images[0] || ''
          }
        ]
      },
      {
        id: 'ord_demo_04',
        orderNumber: 'NL-9201',
        date: '14 de Octubre 2026',
        total: 34990,
        deliveryMethod: 'pickup',
        branchName: 'Quilpué',
        branchId: 'quilpue',
        currentStatus: 'En Preparación',
        items: [
          {
            productId: 'prod_chaqueta_windbreaker_sale_11',
            title: 'Chaqueta Cortavientos Reflectante Cyber-Track Y2K',
            size: 'M',
            color: 'Silver Glitch & Neon Green',
            quantity: 1,
            price: 34990,
            image: INITIAL_PRODUCTS[10]?.images[0] || ''
          }
        ]
      },
      {
        id: 'ord_demo_08',
        orderNumber: 'NL-9940',
        date: '16 de Octubre 2026',
        total: 44990,
        deliveryMethod: 'shipping',
        courier: 'Starken',
        shippingAddress: 'Av. Libertad 1250, Depto 402, Viña del Mar',
        currentStatus: 'Solicitud recibida',
        items: [
          {
            productId: 'prod_women_cyber_heel_13',
            title: 'Tacón Plataforma Cyber-Goth Mary Jane Charol',
            size: '37 (Chile/EUR) - 7 (USA)',
            color: 'Mirror Patent Black',
            quantity: 1,
            price: 44990,
            image: INITIAL_PRODUCTS[12]?.images[0] || ''
          }
        ]
      },
      {
        id: 'ord_demo_09',
        orderNumber: 'NL-9350',
        date: '15 de Octubre 2026',
        total: 29990,
        deliveryMethod: 'shipping',
        courier: 'Blue Express',
        shippingAddress: 'Calle Quillota 450, Depto 302, Viña del Mar',
        trackingNumber: 'BX-8829104',
        currentStatus: 'En transito',
        items: [
          {
            productId: 'prod_cartera_cyber_sale_06',
            title: 'Bolso Bandolera Cyber-Goth con Cadena Gruesa & Remaches',
            size: 'Talla Única',
            color: 'Onyx Black',
            quantity: 1,
            price: 29990,
            image: INITIAL_PRODUCTS[5]?.images[0] || ''
          }
        ]
      }
    ];

    return baseOrders.map(ord => syncOrderWithCurrentCatalog(ord, catalogList));
  };

  const [orders, setOrders] = useState<PurchaseOrder[]>(() => {
    const activeCatalog = loadAndSyncProductsStock();
    const syncedInitialOrders = buildInitialPurchaseOrders(activeCatalog);

    try {
      const local = localStorage.getItem('nolimits_user_orders');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map((o: any) =>
            syncOrderWithCurrentCatalog(
              {
                id: o.id || `ord_${Date.now()}`,
                orderNumber: o.orderNumber || 'NL-9999',
                date: o.date || 'Reciente',
                total: o.total || 0,
                deliveryMethod: o.deliveryMethod || 'pickup',
                branchName: o.branchName || 'Viña del Mar',
                branchId: o.branchId || 'vina_del_mar',
                courier: o.courier || 'Starken',
                shippingAddress: o.shippingAddress,
                trackingNumber: o.trackingNumber,
                currentStatus: (o.status as any) || o.currentStatus || 'Solicitud recibida',
                items: (o.items || []).map((it: any) => ({
                  productId: it.productId || 'prod_cyber_hoodie_01',
                  title: it.title || 'Prenda NoLimits Drop',
                  size: it.size || 'M',
                  color: it.color || 'Void Black',
                  quantity: it.quantity || 1,
                  price: it.price || 0,
                  image: it.image || INITIAL_PRODUCTS[0]?.images[0]
                }))
              },
              activeCatalog
            )
          );
          const userOnly = formatted.filter(
            (f: any) => !syncedInitialOrders.some(init => init.orderNumber === f.orderNumber || init.id === f.id)
          );
          return [...userOnly, ...syncedInitialOrders];
        }
      }
    } catch {
      // fallback
    }
    return syncedInitialOrders;
  });

  useEffect(() => {
    if (!catalogProducts || catalogProducts.length === 0) return;

    setOrders(prev => prev.map(ord => syncOrderWithCurrentCatalog(ord, catalogProducts)));

    setReturnRequests(prev =>
      prev.map(ret => {
        const prod = resolveCatalogProductForOrderItem(ret.productId, ret.productTitle, catalogProducts);
        return {
          ...ret,
          productId: prod.id,
          productTitle: prod.title,
          productSize: resolveCatalogSizeForOrderItem(ret.productSize, prod),
          productImage: prod.images?.[0] || ret.productImage
        };
      })
    );

    setMyPublishedReviews(prev =>
      prev.map(rev => {
        const prod = resolveCatalogProductForOrderItem(rev.productId, rev.productTitle, catalogProducts);
        return {
          ...rev,
          productId: prod.id,
          productTitle: prod.title,
          productImage: prod.images?.[0] || rev.productImage
        };
      })
    );
  }, [catalogProducts]);

  const pendingReviewItems = orders
    .filter(o => o.currentStatus === 'Entregado' || o.currentStatus === 'Retirado')
    .flatMap(o =>
      o.items.map(item => ({
        ...item,
        orderNumber: o.orderNumber,
        orderDate: o.date,
        deliveryMethod: o.deliveryMethod,
        branchName: o.branchName
      }))
    )
    .filter(item => !reviewedProductIds.includes(item.productId));

  const filteredReturnRequests = returnRequests.filter(ret => {
    if (returnsFilter === 'in_progress') {
      return ret.currentStatus === 'Solicitud recibida' || ret.currentStatus === 'Revisión de equipo';
    }
    if (returnsFilter === 'approved') {
      return (
        ret.currentStatus === 'Aprobada' ||
        ret.currentStatus === 'Envió a punto' ||
        ret.currentStatus === 'Retiro Presencial' ||
        ret.currentStatus === 'Envió a punto/sucursal'
      );
    }
    if (returnsFilter === 'rejected') {
      return ret.currentStatus === 'Rechazada';
    }
    return true;
  });

  const handleRequestRedeem = (coupon: CouponItem) => {
    if (coupon.totalRedemptions >= coupon.maxUses) {
      setPointsNotification(`El cupón "${coupon.name}" ha agotado su stock máximo de canjes (${coupon.maxUses}).`);
      return;
    }
    if ((currentUser?.loyaltyPoints || 0) < coupon.pointsCost) {
      setPointsNotification(`Puntos insuficientes. Necesitas ${coupon.pointsCost} puntos y tienes ${currentUser?.loyaltyPoints || 0}.`);
      return;
    }
    setRedeemConfirmCoupon(coupon);
  };

  const handleRedeemCoupon = (coupon: CouponItem) => {
    handleRequestRedeem(coupon);
  };

  const handleConfirmRedeem = () => {
    if (!redeemConfirmCoupon) return;
    const coupon = redeemConfirmCoupon;

    if ((currentUser?.loyaltyPoints || 0) < coupon.pointsCost) {
      setPointsNotification(`Puntos insuficientes. Necesitas ${coupon.pointsCost} puntos y tienes ${currentUser?.loyaltyPoints || 0}.`);
      setRedeemConfirmCoupon(null);
      return;
    }

    const success = deductLoyaltyPoints(coupon.pointsCost);
    if (!success) {
      setRedeemConfirmCoupon(null);
      return;
    }

    const { redeemedCoupon, updatedCatalog, updatedRedeemedList } = redeemCouponTemplateForUser({
      template: coupon,
      userEmail: currentUser?.email || 'cliente@gmail.com',
      userName: currentUser?.name || 'Cliente NoLimits'
    });

    setAdminCouponCatalog(updatedCatalog);
    setRedeemedCoupons(updatedRedeemedList);
    setPointsNotification(
      `✓ ¡Cupón canjeado con éxito! Tu código único de 1 solo uso es: ${redeemedCoupon.code} (Vence el ${redeemedCoupon.expiresAtLabel}). Se descontaron ${coupon.pointsCost} puntos.`
    );
    setRedeemConfirmCoupon(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponCode(code);
    setTimeout(() => setCopiedCouponCode(null), 2500);
  };
 
  const handleOpenReviewModal = (
    item: { productId: string; title: string; image: string },
    orderNumber: string
  ) => {
    setReviewModalProduct({
      productId: item.productId,
      title: item.title,
      image: item.image,
      orderNumber
    });
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
    setReviewPhotos([]);
    setReviewPhotoFiles([]);
    setReviewSuccessMessage(null);
  };

  const handleReviewTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[\r\n]+/g, ' ').slice(0, 100);
    setReviewTitle(clean);
  };

  const handleReviewCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const clean = e.target.value.replace(/[\r\n]+/g, ' ').slice(0, 600);
    setReviewComment(clean);
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - reviewPhotos.length;
    if (remainingSlots <= 0) {
      alert('Has alcanzado el límite máximo de 10 imágenes para tu reseña.');
      e.target.value = '';
      return;
    }

    const filesArray = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      alert(
        `Has seleccionado ${files.length} fotos, pero solo puedes adjuntar hasta 10 en total. Se cargarán las primeras ${remainingSlots} imagen(es).`
      );
    }

    setReviewPhotoFiles((prev) => [...prev, ...filesArray].slice(0, 10));

    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReviewPhotos((prev) => {
            if (prev.length >= 10) return prev;
            return [...prev, event.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalProduct) return;

    setReviewSubmitting(true);

    try {
      const matchingOrder = orders.find(
        (o) => o.orderNumber === reviewModalProduct.orderNumber
      );
      const matchingItem = matchingOrder?.items.find(
        (it) => it.productId === reviewModalProduct.productId
      );

      const formData = new FormData();
      formData.append('productId', reviewModalProduct.productId);
      if (matchingOrder?.id) {
        formData.append('orderId', matchingOrder.id);
      }
      formData.append('title', reviewTitle.trim() || 'Valoración de Prenda');
      formData.append('rating', String(reviewRating));
      formData.append('comment', reviewComment.trim());
      formData.append('productSize', matchingItem?.size || 'Única');
      formData.append('branchPurchased', matchingOrder?.branchName || 'Viña del Mar');

      reviewPhotoFiles.forEach((file) => {
        formData.append('photos', file);
      });

      const res = await api.post('/reviews', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const savedReview = res.data?.data;
      const earnedPoints =
        Number(res.data?.earnedPoints) || (reviewPhotoFiles.length > 0 ? 100 : 20);

      addLoyaltyPoints(earnedPoints);

      const updatedReviewed = [...reviewedProductIds, reviewModalProduct.productId];
      setReviewedProductIds(updatedReviewed);
      localStorage.setItem('nolimits_user_reviewed_items', JSON.stringify(updatedReviewed));

      const newMyReview: UserPublishedReview = {
        id: String(savedReview?._id || `my_rev_${Date.now()}`),
        productId: reviewModalProduct.productId,
        productTitle: reviewModalProduct.title,
        productImage: reviewModalProduct.image,
        productSize: matchingItem?.size || 'Única',
        orderNumber: reviewModalProduct.orderNumber,
        rating: reviewRating,
        title: reviewTitle.trim() || 'Valoración de Prenda',
        comment: reviewComment.trim(),
        photos: Array.isArray(savedReview?.photos) ? savedReview.photos : reviewPhotos,
        date: new Date().toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        pointsEarned: earnedPoints
      };

      setMyPublishedReviews((prev) => [newMyReview, ...prev]);
      setReviewSuccessMessage(
        `¡Reseña publicada en MongoDB! Se han acreditado +${earnedPoints} Cyber Points a tu cuenta.`
      );

      setTimeout(() => {
        setReviewModalProduct(null);
        setReviewSuccessMessage(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error publicando reseña en MongoDB:', error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'No se pudo publicar la reseña. Verifica que la compra esté en estado Entregado o Retirado.';
      alert(`⚠ ${msg}`);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const filteredOrders = orders
    .filter(o => {
      if (ordersFilter === 'solicitud') {
        return o.currentStatus === 'Solicitud recibida';
      }
      if (ordersFilter === 'preparation_transit') {
        return o.currentStatus === 'En Preparación' || o.currentStatus === 'En transito';
      }
      if (ordersFilter === 'pickup') {
        return o.currentStatus === 'Listo para el retiro de sucursal';
      }
      if (ordersFilter === 'delivered') {
        return o.currentStatus === 'Entregado' || o.currentStatus === 'Retirado';
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = parseOrderDate(a.date);
      const timeB = parseOrderDate(b.date);
      if (timeA !== timeB) {
        return ordersSort === 'oldest' ? timeA - timeB : timeB - timeA;
      }
      return ordersSort === 'oldest'
        ? a.orderNumber.localeCompare(b.orderNumber)
        : b.orderNumber.localeCompare(a.orderNumber);
    });

  return (
    <div className="nl-profile-view-wrapper space-y-4 font-sans">
      <WindowFrame
        title={`Propiedades_del_Sistema.cpl - [Cuenta: ${(currentUser?.name || 'Usuario').slice(0, 45)}${(currentUser?.name || '').length > 45 ? '...' : ''}]`}
        icon={<PixelIcon name="computer" size={16} />}
        statusBarText={`Nivel de Miembro: Streetwear VIP // Puntos Acumulados: ${currentUser?.loyaltyPoints || 0} Cyber Points`}
      >
        <div className="nl-profile-layout-grid p-3 md:p-5 bg-[#ece9d8] grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Columna Izquierda: Tarjeta de Usuario & Navegación Vertical */}
          <ProfileSidebar
            currentUser={{
              id: currentUser?.id || 'usr_01',
              name: currentUser?.name || 'Usuario',
              email: currentUser?.email || '',
              avatarUrl: currentUser?.avatarUrl,
              loyaltyPoints: currentUser?.loyaltyPoints || 0
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            ordersCount={orders.length}
            pendingReviewsCount={pendingReviewItems.length}
            wishlistCount={wishlistCount}
            returnRequestsCount={returnRequests.length}
            onLogout={() => {
              logout();
              navigate('/');
            }}
          />

          {/* Columna Derecha: Contenido Dinámico según Pestaña Seleccionada */}
          <div className="profile-content-col md:col-span-8 bg-white border border-gray-400 p-4 min-h-[460px] winxp-bevel-in">
            {activeTab === 'orders' && (
              <ProfileOrdersTab
                orders={orders}
                filteredOrders={filteredOrders}
                ordersFilter={ordersFilter}
                setOrdersFilter={setOrdersFilter}
                ordersSort={ordersSort}
                setOrdersSort={setOrdersSort}
                returnRequests={returnRequests}
                catalogProducts={catalogProducts}
                setIsPickupScheduleModalOpen={setIsPickupScheduleModalOpen}
                handleOpenOrderReturn={handleOpenOrderReturn}
                setRejectionModalReturn={setRejectionModalReturn}
              />
            )}

            {activeTab === 'points' && (
              <ProfilePointsTab
                loyaltyPoints={currentUser?.loyaltyPoints || 0}
                pointsNotification={pointsNotification}
                setPointsNotification={setPointsNotification}
                adminCouponCatalog={adminCouponCatalog}
                redeemedCoupons={redeemedCoupons}
                copiedCouponCode={copiedCouponCode}
                handleRedeemCoupon={handleRedeemCoupon}
                handleCopyCode={handleCopyCode}
              />
            )}

            {activeTab === 'reviews' && (
              <ProfileReviewsTab
                reviewsSubTab={reviewsSubTab}
                setReviewsSubTab={setReviewsSubTab}
                pendingReviewItems={pendingReviewItems}
                myPublishedReviews={myPublishedReviews}
                handleOpenReviewModal={handleOpenReviewModal}
              />
            )}

            {activeTab === 'wishlist' && (
              <ProfileWishlistTab
                wishlist={wishlist}
                removeFromWishlist={removeFromWishlist}
              />
            )}

            {activeTab === 'addresses' && (
              <ProfileAddressesTab
                addresses={addresses}
                editingAddressId={editingAddressId}
                isAddingAddress={isAddingAddress}
                addressSuccessMessage={addressSuccessMessage}
                newAddrAlias={newAddrAlias}
                setNewAddrAlias={setNewAddrAlias}
                newAddrStreet={newAddrStreet}
                setNewAddrStreet={setNewAddrStreet}
                newAddrNumber={newAddrNumber}
                setNewAddrNumber={setNewAddrNumber}
                newAddrIsWithoutNumber={newAddrIsWithoutNumber}
                setNewAddrIsWithoutNumber={setNewAddrIsWithoutNumber}
                newAddrApt={newAddrApt}
                setNewAddrApt={setNewAddrApt}
                newAddrPostalCode={newAddrPostalCode}
                setNewAddrPostalCode={setNewAddrPostalCode}
                newAddrComuna={newAddrComuna}
                setNewAddrComuna={setNewAddrComuna}
                newAddrNotes={newAddrNotes}
                setNewAddrNotes={setNewAddrNotes}
                newAddrIsDefault={newAddrIsDefault}
                setNewAddrIsDefault={setNewAddrIsDefault}
                setIsAddingAddress={setIsAddingAddress}
                handleToggleEditHeader={handleToggleEditHeader}
                handleToggleAddHeader={handleToggleAddHeader}
                handleSaveAddress={handleSaveAddress}
                handleStartEdit={handleStartEdit}
                handleCancelForm={handleCancelForm}
                handleSetDefaultAddress={handleSetDefaultAddress}
                handleDeleteAddress={handleDeleteAddress}
              />
            )}

            {activeTab === 'returns' && (
              <ProfileReturnsTab
                returnRequests={returnRequests}
                filteredReturnRequests={filteredReturnRequests}
                returnsFilter={returnsFilter}
                setReturnsFilter={setReturnsFilter}
                returnSuccessMessage={returnSuccessMessage}
                setIsPickupScheduleModalOpen={setIsPickupScheduleModalOpen}
                getReturnSteps={getReturnSteps}
                getReturnStepStatus={getReturnStepStatus}
              />
            )}

            {activeTab === 'settings' && (
              <ProfileSettingsTab
                currentUser={{
                  id: currentUser?.id || 'usr_01',
                  name: currentUser?.name || 'Usuario',
                  firstName: currentUser?.firstName,
                  lastName: currentUser?.lastName,
                  rut: currentUser?.rut,
                  email: currentUser?.email || '',
                  phone: currentUser?.phone,
                  avatarUrl: currentUser?.avatarUrl
                }}
                profileFirstName={profileFirstName}
                setProfileFirstName={setProfileFirstName}
                profileLastName={profileLastName}
                setProfileLastName={setProfileLastName}
                profileRut={profileRut}
                setProfileRut={setProfileRut}
                profileEmail={profileEmail}
                setProfileEmail={setProfileEmail}
                profilePhone={profilePhone}
                setProfilePhone={setProfilePhone}
                profileAvatarUrl={profileAvatarUrl}
                setProfileAvatarUrl={setProfileAvatarUrl}
                profileSuccessMsg={profileSuccessMsg}
                profileErrorMsg={profileErrorMsg}
                handleFirstNameChange={handleFirstNameChange}
                handleLastNameChange={handleLastNameChange}
                handleRutChange={handleRutChange}
                handlePhoneChange={handlePhoneChange}
                handleAvatarFileUpload={handleAvatarFileUpload}
                handleSaveProfile={handleSaveProfile}
              />
            )}
          </div>
        </div>
      </WindowFrame>

      {/* Ventanas Modales del Perfil de Usuario */}
      <ProfileModals
        currentUser={currentUser}
        orders={orders}
        returnRequests={returnRequests}
        liveBranchSchedules={liveBranchSchedules}
        reviewModalProduct={reviewModalProduct}
        setReviewModalProduct={setReviewModalProduct}
        reviewSuccessMessage={reviewSuccessMessage}
        reviewRating={reviewRating}
        setReviewRating={setReviewRating}
        reviewTitle={reviewTitle}
        handleReviewTitleChange={handleReviewTitleChange}
        reviewComment={reviewComment}
        handleReviewCommentChange={handleReviewCommentChange}
        reviewPhotos={reviewPhotos}
        setReviewPhotos={setReviewPhotos}
        handlePhotoFileUpload={handlePhotoFileUpload}
        reviewSubmitting={reviewSubmitting}
        handleSubmitReview={handleSubmitReview}
        isNewReturnModalOpen={isNewReturnModalOpen}
        setIsNewReturnModalOpen={setIsNewReturnModalOpen}
        returnModalStep={returnModalStep}
        setReturnModalStep={setReturnModalStep}
        selectedReturnOrder={selectedReturnOrder}
        selectedReturnItem={selectedReturnItem}
        setSelectedReturnItem={setSelectedReturnItem}
        selectedReturnItems={selectedReturnItems}
        setSelectedReturnItems={setSelectedReturnItems}
        setReturnTargetItem={setReturnTargetItem}
        returnTargetOrder={returnTargetOrder}
        selectedReturnReason={selectedReturnReason}
        setSelectedReturnReason={setSelectedReturnReason}
        selectedReturnMethod={selectedReturnMethod}
        setSelectedReturnMethod={setSelectedReturnMethod}
        selectedReturnBranch={selectedReturnBranch}
        setSelectedReturnBranch={setSelectedReturnBranch}
        selectedReturnCourier={selectedReturnCourier}
        setSelectedReturnCourier={setSelectedReturnCourier}
        returnShippingRegion={returnShippingRegion}
        returnShippingCommune={returnShippingCommune}
        selectedReturnNotes={selectedReturnNotes}
        setSelectedReturnNotes={setSelectedReturnNotes}
        returnPhotos={returnPhotos}
        setReturnPhotos={setReturnPhotos}
        handleReturnPhotoUpload={handleReturnPhotoUpload}
        handleRemoveReturnPhoto={handleRemoveReturnPhoto}
        handleCreateReturnSubmit={handleCreateReturnSubmit}
        getReturnShippingCalculation={getReturnShippingCalculation}
        getRegisteredClientShippingOrigin={getRegisteredClientShippingOrigin}
        rejectionModalReturn={rejectionModalReturn}
        setRejectionModalReturn={setRejectionModalReturn}
        redeemConfirmCoupon={redeemConfirmCoupon}
        setRedeemConfirmCoupon={setRedeemConfirmCoupon}
        handleConfirmRedeem={handleConfirmRedeem}
        isPickupScheduleModalOpen={isPickupScheduleModalOpen}
        setIsPickupScheduleModalOpen={setIsPickupScheduleModalOpen}
      />
    </div>
  );
};

export default ProfileView;
