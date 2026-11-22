import React, { useState, useEffect } from 'react';
import { WindowFrame } from '../components/layout/WindowFrame';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useBranch, getBranchScheduleBlocks, formatBranchPickupSummary } from '../context/BranchContext';
import { PixelIcon } from '../components/common/PixelIcon';
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
  saveRedeemedCoupons,
  saveAdminCouponsCatalog, refreshCouponsFromBackend
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
  resolveCatalogProductForOrderItem
} from '../components/profile/profileTypes';

// Componentes segmentados del Perfil de Usuario
import { ProfileSidebar } from '../components/profile/ProfileSidebar';
import { ProfileOrdersTab } from '../components/profile/ProfileOrdersTab';
import { mapConfirmedProfileOrders } from '../components/profile/profileOrdersApi';
import { ProfilePointsTab } from '../components/profile/ProfilePointsTab';
import { ProfileReviewsTab } from '../components/profile/ProfileReviewsTab';
import { ProfileWishlistTab } from '../components/profile/ProfileWishlistTab';
import { ProfileAddressesTab } from '../components/profile/ProfileAddressesTab';
import { ProfileReturnsTab } from '../components/profile/ProfileReturnsTab';
import { ProfileSettingsTab } from '../components/profile/ProfileSettingsTab';
import { ProfileModals } from '../components/profile/ProfileModals';

export const ProfileView: React.FC = () => {
  const { currentUser, logout, updateProfile, addLoyaltyPoints, deductLoyaltyPoints, refreshUser } = useAuth();
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

  // Estados del Formulario de Perfil en "Configuración" (sin datos de maqueta)
  const [profileFirstName, setProfileFirstName] = useState(() => {
    if (currentUser?.firstName) return currentUser.firstName.slice(0, 50);
    const parts = (currentUser?.name || '').trim().split(' ');
    return (parts[0] || '').slice(0, 50);
  });

  const [profileLastName, setProfileLastName] = useState(() => {
    if (currentUser?.lastName) return currentUser.lastName.slice(0, 50);
    const parts = (currentUser?.name || '').trim().split(' ');
    return parts.slice(1).join(' ').slice(0, 50);
  });

  const [profileRut, setProfileRut] = useState(() => {
    return currentUser?.rut ? formatRutWithDotsAndDash(currentUser.rut) : '';
  });

  const [profileEmail, setProfileEmail] = useState(() => {
    return currentUser?.email || '';
  });

  const [profilePhone, setProfilePhone] = useState(() => {
    return currentUser?.phone ? formatChileanMobilePhone(currentUser.phone) : '';
  });

  const [profileAvatarUrl, setProfileAvatarUrl] = useState(() => {
    return currentUser?.avatarUrl || '';
  });
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);

  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Sincronizar campos cuando cambie el usuario autenticado (limpiando si vienen vacíos)
  useEffect(() => {
    if (currentUser) {
      setProfileFirstName((currentUser.firstName || '').slice(0, 50));
      setProfileLastName((currentUser.lastName || '').slice(0, 50));
      setProfileRut(currentUser.rut ? formatRutWithDotsAndDash(currentUser.rut) : '');
      setProfileEmail(currentUser.email || '');
      setProfilePhone(currentUser.phone ? formatChileanMobilePhone(currentUser.phone) : '');
      setProfileAvatarUrl(currentUser.avatarUrl || '');
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
    setProfileAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileAvatarUrl(event.target.result as string);
        setProfileErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
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
    // RUT opcional: solo validar formato si el usuario escribió algo
    if (trimmedRut && rawRutDigits.length < 7) {
      setProfileErrorMsg('Si ingresas un RUT, debe tener al menos 7 dígitos (formato: 12.345.678-K).');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setProfileErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }
    // Teléfono opcional: solo validar formato si el usuario escribió algo
    if (trimmedPhone && rawPhoneDigits.length < 8) {
      setProfileErrorMsg('Si ingresas un teléfono, debe tener al menos 8 dígitos (ejemplo: 9 5689 6328).');
      return;
    }

    try {
      if (profileAvatarFile) {
        const formData = new FormData();
        formData.append('firstName', trimmedFirstName);
        formData.append('lastName', trimmedLastName);
        formData.append('name', `${trimmedFirstName} ${trimmedLastName}`);
        formData.append('rut', trimmedRut);
        formData.append('email', trimmedEmail);
        formData.append('phone', trimmedPhone);
        formData.append('avatar', profileAvatarFile);

        await updateProfile(formData);
        setProfileAvatarFile(null);
      } else {
        await updateProfile({
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          name: `${trimmedFirstName} ${trimmedLastName}`,
          rut: trimmedRut,
          email: trimmedEmail,
          phone: trimmedPhone,
          avatarUrl: profileAvatarUrl
        });
      }

      setProfileSuccessMsg('✓ ¡Perfil actualizado con éxito en MongoDB y Cloudinary!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (error: any) {
      console.error('Error guardando perfil:', error);
      setProfileErrorMsg(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          'No se pudieron guardar los cambios del perfil.'
      );
    }
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

  // La base de datos identifica los artículos reseñados por orden.
  // No leer localStorage: una sesión nueva nunca hereda reseñas de otra cuenta.
  const [reviewsSubTab, setReviewsSubTab] = useState<'pending' | 'completed'>('pending');
  const [myPublishedReviews, setMyPublishedReviews] = useState<UserPublishedReview[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [reviewsError, setReviewsError] = useState('');
  const [profileReload, setProfileReload] = useState(0);

  // Fuente única de información personal: API autenticada + MongoDB Atlas.
  // Se limpia el estado al cambiar de usuario y no se utilizan órdenes de prueba.
  useEffect(() => {
    let active = true;
    setOrders([]);
    setMyPublishedReviews([]);
    setReturnRequests([]);
    setOrdersError('');
    setReviewsError('');

    // Al salir de la sesión nunca deben persistir datos del usuario anterior.
    if (!currentUser?.id || currentUser.role === 'guest') {
      setOrdersLoading(false);
      setReviewsLoading(false);
      return () => { active = false; };
    }

    setOrdersLoading(true);
    setReviewsLoading(true);

    const loadPersonalData = async () => {
      // Un fallo de devoluciones no debe ocultar compras y reseñas válidas.
      const [ordersResult, reviewsResult, returnsResult] = await Promise.allSettled([
        api.get('/orders/my-orders'),
        api.get('/reviews/my-reviews'),
        api.get('/returns/my-returns'),
      ]);
      if (!active) return;

      // Las órdenes confirmadas conservan precio, producto y estado históricos.
      let mongoOrders: PurchaseOrder[] = [];
      if (ordersResult.status === 'fulfilled' && ordersResult.value.data?.success
        && Array.isArray(ordersResult.value.data.data)) {
        mongoOrders = mapConfirmedProfileOrders(ordersResult.value.data.data, catalogProducts);
        setOrders(mongoOrders);
      } else {
        setOrdersError('No se pudo consultar el historial real de compras. Intenta recargarlo.');
      }
      setOrdersLoading(false);

      // El mapa permite mostrar el número comercial real de la orden al reseñar.
      const orderNumbers = new Map(mongoOrders.map(o => [o.id, o.orderNumber]));
      if (reviewsResult.status === 'fulfilled' && reviewsResult.value.data?.success
        && Array.isArray(reviewsResult.value.data.data)) {
        const mongoReviews: UserPublishedReview[] = reviewsResult.value.data.data.map((r: any) => {
          const orderId = String(r.orderId?._id || r.orderId || '');
          return {
            id: String(r._id),
            orderId,
            productId: String(r.productId?._id || r.productId || ''),
            productTitle: r.productId?.title || r.productId?.name || 'Prenda NoLimits',
            productImage: r.productId?.images?.[0] || '',
            productSize: r.productSize || 'Única',
            orderNumber: orderNumbers.get(orderId) || '',
            rating: Number(r.rating) || 5,
            title: r.title || 'Valoración de Prenda',
            comment: r.comment || '',
            photos: Array.isArray(r.photos) ? r.photos : [],
            date: r.createdAt
              ? new Date(r.createdAt).toLocaleDateString('es-CL', {
                  day: 'numeric', month: 'long', year: 'numeric'
                }) : 'Fecha no registrada',
            pointsEarned: Array.isArray(r.photos) && r.photos.length > 0 ? 100 : 20
          };
        });
        setMyPublishedReviews(mongoReviews);
      } else {
        setReviewsError('No se pudieron verificar las reseñas de tu cuenta. Intenta recargarlas.');
      }
      setReviewsLoading(false);

      if (returnsResult.status === 'fulfilled' && returnsResult.value.data?.success
        && Array.isArray(returnsResult.value.data.data)) {
          const mongoReturns: ReturnRequest[] = returnsResult.value.data.data.flatMap((retDoc: any) => {
            const isShipping =
              retDoc.deliveryType === 'envio' || retDoc.returnMethod === 'courier_shipping';

            let mappedStatus: ReturnRequest['currentStatus'] =
              (retDoc.status as ReturnRequest['currentStatus']) || 'Solicitud recibida';
            if (retDoc.returnReviewStatus === 'rejected') {
              mappedStatus = 'Rechazada';
            } else if (retDoc.returnReviewStatus === 'approved' && mappedStatus === 'Solicitud recibida') {
              mappedStatus = isShipping ? 'Envió a punto' : 'Retiro Presencial';
            }

            const itemsList =
              Array.isArray(retDoc.products) && retDoc.products.length > 0
                ? retDoc.products
                : [{ id: retDoc._id, name: retDoc.productName || 'Prenda', size: 'Única', image: '' }];

            return itemsList.map((p: any, idx: number) => ({
              id: `${retDoc._id}_${idx}`,
              ticketNumber: retDoc.ticketNumber || `DEV-${String(retDoc._id).slice(-4).toUpperCase()}`,
              orderNumber: retDoc.orderNumber || 'NL-0000',
              productId: String(p.id || ''),
              productTitle: p.name || 'Prenda NoLimits',
              productSize: p.size || 'Única',
              productImage: p.image || '',
              reason: retDoc.reason || retDoc.returnReason || 'Defecto de fabricación',
              returnMethod: isShipping ? 'courier_shipping' : 'branch_dropoff',
              returnCourier: isShipping ? retDoc.returnCourier || retDoc.shippingCourier || 'paket' : undefined,
              shippingCostClp: Number(retDoc.shippingCostClp) || 0,
              paidByStore: retDoc.paidByStore !== false,
              targetBranchId: isShipping ? 'shipping_courier' : retDoc.branchId || 'vina_del_mar',
              targetBranchName: retDoc.targetBranchName || retDoc.deliveryMethodText || 'Sucursal NoLimits',
              requestDate: retDoc.createdAt
                ? new Date(retDoc.createdAt).toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : 'Reciente',
              currentStatus: mappedStatus,
              notes: retDoc.notes || retDoc.description || '',
              photos: Array.isArray(retDoc.evidencePhotos)
                ? retDoc.evidencePhotos
                : Array.isArray(retDoc.referencePhotos)
                ? retDoc.referencePhotos
                : [],
              rejectionReason: retDoc.rejectionReason || undefined
            }));
          });

        setReturnRequests(mongoReturns);
      }
    };

    void loadPersonalData();
    return () => { active = false; };
  }, [currentUser?.id, currentUser?.role, profileReload]);

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

  // Se eliminaron los 1000 puntos de prueba; las recompensas se acreditan en MongoDB.
 
  // =========================================================================
  // GESTIÓN DE DIRECCIONES (Múltiples Direcciones & Selección de Predeterminada)
  // =========================================================================
  // =========================================================================
  // GESTIÓN DE DIRECCIONES (SINCRONIZADA CON MONGODB)
  // =========================================================================
  const [addresses, setAddresses] = useState<UserAddress[]>(() => {
    if (Array.isArray((currentUser as any)?.addresses) && (currentUser as any).addresses.length > 0) {
      return (currentUser as any).addresses;
    }
    try {
      const saved = localStorage.getItem('nolimits_user_addresses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Sincronizar libreta de direcciones cuando el usuario autenticado carga desde MongoDB
  useEffect(() => {
    if (Array.isArray((currentUser as any)?.addresses)) {
      setAddresses((currentUser as any).addresses);
    }
  }, [currentUser?.id, (currentUser as any)?.addresses]);

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
    const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
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
    const target = addresses.find((a) => a.isDefault) || addresses[0];
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

  const handleSetDefaultAddress = (addressId: string, customList?: UserAddress[]) => {
    const sourceList = customList || addresses;
    const updated = sourceList.map((a) => ({
      ...a,
      isDefault: a.id === addressId
    }));
    setAddresses(updated);

    // Persistir en MongoDB vía AuthContext
    updateProfile({ addresses: updated } as any);

    const selected = updated.find((a) => a.id === addressId);
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

      const displayLabel =
        selected.alias || (selected.street ? `${selected.street} #${selected.number}` : 'Dirección');
      setAddressSuccessMessage(
        `✓ "${displayLabel}" establecida como predeterminada y guardada en MongoDB.`
      );
      setTimeout(() => setAddressSuccessMessage(null), 3500);
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    const addrToDelete = addresses.find((a) => a.id === addressId);
    if (!addrToDelete) return;

    const displayLabel =
      addrToDelete.alias ||
      (addrToDelete.street ? `${addrToDelete.street} #${addrToDelete.number}` : 'esta dirección');
    const confirmed = window.confirm(`¿Deseas eliminar la dirección "${displayLabel}"?`);
    if (!confirmed) return;

    if (editingAddressId === addressId) {
      setEditingAddressId(null);
    }

    const updated = addresses.filter((a) => a.id !== addressId);
    if (addrToDelete.isDefault && updated.length > 0) {
      handleSetDefaultAddress(updated[0].id, updated);
      return;
    }

    setAddresses(updated);
    updateProfile({ addresses: updated } as any);
    setAddressSuccessMessage(`✓ Dirección "${displayLabel}" eliminada de MongoDB.`);
    setTimeout(() => setAddressSuccessMessage(null), 3500);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrAlias.trim()) {
      alert('Por favor ingresa el nombre o alias de la dirección (máx 30 caracteres).');
      return;
    }
    if (
      !newAddrStreet.trim() ||
      (!newAddrIsWithoutNumber && !newAddrNumber.trim()) ||
      !newAddrComuna.trim()
    ) {
      alert('Por favor completa calle, número (o marca Calle sin número) y comuna.');
      return;
    }

    const finalAlias = newAddrAlias.trim().slice(0, 30);
    const finalNumber = newAddrIsWithoutNumber ? 'S/N' : newAddrNumber.trim();
    const recipient =
      currentUser?.name || `${profileFirstName} ${profileLastName}`.trim() || 'Cliente';
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

      if (newAddrIsDefault) {
        handleSetDefaultAddress(editingAddressId, updated);
      } else {
        setAddresses(updated);
        updateProfile({ addresses: updated } as any);
      }

      setEditingAddressId(null);
      setNewAddrAlias('');
      setAddressSuccessMessage(`✓ Dirección "${finalAlias}" actualizada en MongoDB.`);
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
      phone: profilePhone || currentUser?.phone || '',
      notes: newAddrNotes.trim() || undefined,
      isDefault: newAddrIsDefault || addresses.length === 0
    };

    const updatedAddresses = newAddress.isDefault
      ? [...addresses.map((a) => ({ ...a, isDefault: false })), newAddress]
      : [...addresses, newAddress];

    if (newAddress.isDefault) {
      handleSetDefaultAddress(newId, updatedAddresses);
    } else {
      setAddresses(updatedAddresses);
      updateProfile({ addresses: updatedAddresses } as any);
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
    setAddressSuccessMessage(`✓ Nueva dirección "${finalAlias}" guardada en MongoDB.`);
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
  // MÓDULO DE DEVOLUCIONES (CONECTADO A MONGODB + CLOUDINARY)
  // =========================================================================
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);

  // Filtro de devoluciones: Todas, En Proceso, Aprobadas, Rechazadas
  const [returnsFilter, setReturnsFilter] = useState<'all' | 'in_progress' | 'approved' | 'rejected'>('all');

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
  const [returnPhotoFiles, setReturnPhotoFiles] = useState<File[]>([]);
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
    setReturnPhotoFiles([]);

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
    setReturnPhotoFiles((prev) => [...prev, ...filesToRead].slice(0, 10));

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
    setReturnPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Crear nueva solicitud de devolución en MongoDB + Cloudinary
   */
  const handleCreateReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToReturn =
      selectedReturnItems.length > 0
        ? selectedReturnItems
        : selectedReturnItem
        ? [selectedReturnItem]
        : [];

    if (!selectedReturnOrder || itemsToReturn.length === 0) {
      alert('Por favor selecciona al menos una prenda que deseas devolver.');
      return;
    }

    if (returnPhotoFiles.length === 0) {
      alert('Debes adjuntar al menos 1 fotografía de respaldo del producto para ingresar la devolución.');
      return;
    }

    const orderObj = orders.find((o) => o.orderNumber === selectedReturnOrder);
    const branchObj =
      liveBranchSchedules.find((b) => b.id === selectedReturnBranch) || liveBranchSchedules[0];
    const shippingCalc = getReturnShippingCalculation();

    const targetBranchName =
      selectedReturnMethod === 'shipping'
        ? `Envío Paket Express (${returnShippingCommune} · Devolución Pagada por NoLimits: $0 CLP)`
        : branchObj.name;

    const productsPayload = itemsToReturn.map((prodId) => {
      const itemObj = orderObj?.items.find((it) => it.productId === prodId);
      const catalogProd = resolveCatalogProductForOrderItem(prodId, itemObj?.title, catalogProducts);
      return {
        id: itemObj?.productId || catalogProd.id,
        name: itemObj?.title || catalogProd.title,
        size: itemObj?.size || 'Única',
        quantity: itemObj?.quantity || 1,
        price: itemObj?.price || catalogProd.price,
        sku: catalogProd.sku || 'NL-SKU',
        image: itemObj?.image || catalogProd.images?.[0] || ''
      };
    });

    const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
    const shippingAddressObj = {
      region: returnShippingRegion,
      comuna: returnShippingCommune,
      street: defaultAddr?.street || '',
      number: defaultAddr?.number || '',
      apartment: defaultAddr?.apartment || '',
      postalCode: defaultAddr?.postalCode || '',
      notes: defaultAddr?.notes || ''
    };

    try {
      const formData = new FormData();
      formData.append('orderNumber', selectedReturnOrder);
      formData.append('reason', selectedReturnReason);
      formData.append(
        'returnMethod',
        selectedReturnMethod === 'shipping' ? 'courier_shipping' : 'branch_dropoff'
      );
      if (selectedReturnMethod === 'shipping') {
        formData.append('returnCourier', selectedReturnCourier);
      }
      formData.append(
        'shippingCostClp',
        String(selectedReturnMethod === 'shipping' ? shippingCalc.selectedCostForCustomer : 0)
      );
      formData.append(
        'paidByStore',
        String(selectedReturnMethod === 'shipping' ? shippingCalc.isPaidByStore : true)
      );
      formData.append(
        'targetBranchId',
        selectedReturnMethod === 'shipping' ? 'shipping_courier' : branchObj.id
      );
      formData.append('targetBranchName', targetBranchName);
      formData.append(
        'notes',
        selectedReturnNotes.trim() ||
          'Solicitud por falla o defecto ingresada por el cliente. Esperando evaluación del equipo.'
      );
      formData.append(
        'customerName',
        currentUser?.name || `${profileFirstName} ${profileLastName}`.trim()
      );
      formData.append('customerRut', profileRut || currentUser?.rut || '');
      formData.append('customerPhone', profilePhone || currentUser?.phone || '');
      formData.append('shippingAddress', JSON.stringify(shippingAddressObj));
      formData.append('products', JSON.stringify(productsPayload));

      returnPhotoFiles.forEach((file) => {
        formData.append('photos', file);
      });

      const res = await api.post('/returns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const createdAlert = res.data?.data;
      const ticketNumber =
        createdAlert?.ticketNumber || `DEV-${Math.floor(1000 + Math.random() * 9000)}`;

      const newCases: ReturnRequest[] = productsPayload.map((p, idx) => ({
        id: `${createdAlert?._id || Date.now()}_${idx}`,
        ticketNumber,
        orderNumber: selectedReturnOrder,
        productId: p.id,
        productTitle: p.name,
        productSize: p.size,
        productImage: p.image,
        reason: selectedReturnReason,
        returnMethod: selectedReturnMethod === 'shipping' ? 'courier_shipping' : 'branch_dropoff',
        returnCourier: selectedReturnMethod === 'shipping' ? selectedReturnCourier : undefined,
        shippingCostClp:
          selectedReturnMethod === 'shipping' ? shippingCalc.selectedCostForCustomer : 0,
        paidByStore: selectedReturnMethod === 'shipping' ? shippingCalc.isPaidByStore : true,
        targetBranchId: selectedReturnMethod === 'shipping' ? 'shipping_courier' : branchObj.id,
        targetBranchName,
        requestDate: new Date().toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        currentStatus: 'Solicitud recibida',
        notes: selectedReturnNotes.trim() || 'Solicitud ingresada por el cliente.',
        photos: Array.isArray(createdAlert?.evidencePhotos)
          ? createdAlert.evidencePhotos
          : returnPhotos
      }));

      setReturnRequests((prev) => [...newCases, ...prev]);
      setIsNewReturnModalOpen(false);
      setSelectedReturnNotes('');
      setReturnPhotos([]);
      setReturnPhotoFiles([]);
      setSelectedReturnItems([]);
      setReturnSuccessMessage(
        `✓ Solicitud ${ticketNumber} guardada en MongoDB y enviada al equipo. Redirigiendo a Devoluciones...`
      );
      setTimeout(() => {
        setReturnSuccessMessage(null);
        setActiveTab('returns');
      }, 1200);
    } catch (error: any) {
      console.error('Error enviando devolución a MongoDB:', error);
      alert(
        `⚠ ${error.response?.data?.message || 'No se pudo registrar la devolución en el servidor.'}`
      );
    }
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

  // El historial arranca vacío y solo se completa después de verificar MongoDB.
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  const pendingReviewItems = (!ordersLoading && !reviewsLoading && !ordersError && !reviewsError ? orders : [])
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
    .filter((item: any) => {
      // El endpoint de publicación solo acepta identificadores MongoDB reales.
      if (!/^[a-f0-9]{24}$/i.test(item.productId) || item.isReviewed) return false;
      // Una reseña corresponde al producto y a esta orden, no a cualquier compra.
      const sourceOrder = orders.find(o => o.orderNumber === item.orderNumber);
      return !myPublishedReviews.some(rev =>
        rev.orderId === sourceOrder?.id && rev.productId === item.productId
      );
    });

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


// La interfaz de canje original permanece; el código ahora lo emite MongoDB,
// porque un cupón inventado desde localStorage no puede pagarse con Webpay.
// Identificador estable durante un reintento: un doble clic no descuenta puntos dos veces.
const redeemInFlight = React.useRef(false);
const redeemRequest = React.useRef<{templateId:string;requestId:string}|null>(null);
const handleConfirmRedeem = async () => {
  if (!redeemConfirmCoupon || redeemInFlight.current) return;
  const template = redeemConfirmCoupon;
  redeemInFlight.current = true;
  if (redeemRequest.current?.templateId !== template.id) {
    redeemRequest.current = { templateId: template.id, requestId: crypto.randomUUID() };
  }
  try {
    const response = await api.post('/payments/coupons/redeem', {
      templateId: template.id, requestId: redeemRequest.current.requestId
    });
    // Los cupones y el saldo se descargan desde MongoDB; no generar ni acreditar nada localmente.
    await refreshCouponsFromBackend(currentUser?.id || '');
    await refreshUser();
    const issuedCode = String(response.data?.data?.redeemedCoupon?.code || '');
    setRedeemConfirmCoupon(null);
    setPointsNotification(`✓ Canje registrado en MongoDB${issuedCode ? ': ' + issuedCode : ''}.`);
    redeemRequest.current = null;
  } catch(error:any) {
    setPointsNotification(error.response?.data?.message || 'No se pudo verificar el canje. Reintenta con cuidado.');
  } finally { redeemInFlight.current = false; }
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

      // Marcar solo el producto de ESTA orden como reseñado en el estado local
      setOrders((prev) =>
        prev.map((ord) =>
          ord.orderNumber === reviewModalProduct.orderNumber
            ? {
                ...ord,
                items: ord.items.map((it) =>
                  it.productId === reviewModalProduct.productId
                    ? ({ ...it, isReviewed: true } as any)
                    : it
                )
              }
            : ord
        )
      );

      const newMyReview: UserPublishedReview = {
        id: String(savedReview?._id || `my_rev_${Date.now()}`),
        orderId: matchingOrder?.id || '',
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
      const timeA = a.purchasedAt ?? parseOrderDate(a.date);
      const timeB = b.purchasedAt ?? parseOrderDate(b.date);
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
            ordersCount={ordersLoading || ordersError ? null : orders.length}
            pendingReviewsCount={ordersLoading || reviewsLoading || ordersError || reviewsError ? null : pendingReviewItems.length}
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
                ordersLoading={ordersLoading}
                ordersError={ordersError}
                onRetryOrders={() => setProfileReload(n => n + 1)}
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
                hasPurchases={orders.length > 0}
                myPublishedReviews={myPublishedReviews}
                pendingLoading={ordersLoading || reviewsLoading}
                completedLoading={reviewsLoading}
                pendingError={ordersError || reviewsError}
                completedError={reviewsError}
                onRetry={() => setProfileReload(n => n + 1)}
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
                setProfileAvatarUrl={(url) => {
                  setProfileAvatarUrl(url);
                  setProfileAvatarFile(null);
                }}
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
