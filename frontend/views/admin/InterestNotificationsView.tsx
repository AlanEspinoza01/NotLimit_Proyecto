import React, { useState, useEffect, useMemo } from 'react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import api from '../../api/axios';
import {
  STORAGE_CUSTOMERS_KEY,
  INITIAL_CUSTOMERS,
  normalizeCustomer,
  type CustomerRecord,
  type CustomerTag,
  type BlacklistReport,
  type PreferentialReport
} from './CustomerManagerView';
import '../../components/admin/notifications/InterestNotificationsView.css';
import {
  STORAGE_ALERTS_KEY,
  STORAGE_PURCHASE_ORDERS_SUPER_KEY,
  STORAGE_PURCHASE_ORDERS_ADMIN_KEY,
  OFFICIAL_RETURN_REASONS,
  ALERT_CATEGORY_CONFIG,
  INITIAL_SYSTEM_ALERTS,
  type AlertCategory,
  type AlertProductItem,
  type AlertShippingAddress,
  type AlertStatusFilterValue,
  type SystemAlert,
  type DecisionModalState,
  type ConfirmActionModalState,
  type ProductDetailModalState,
  type ReturnReviewModalState,
  type ReferencePhotosModalState,
  type AddCustomerReportModalState,
  type CategoryCountMap
} from '../../components/admin/notifications/interestNotificationTypes';
import {
  enrichAlertProductItem,
  getAlertProducts,
  getAlertEmail,
  getAlertProductLink,
  getAlertShippingAddress,
  getAlertReturnLogistics,
  getAlertPendingPaymentLogistics,
  getAlertSpecificState,
  getAlertReferencePhotos,
  getAlertTimestampScore,
  loadAndReconcileSystemAlerts
} from '../../components/admin/notifications/interestNotificationHelpers';
import { NotificationKpisAndFilters } from '../../components/admin/notifications/NotificationKpisAndFilters';
import { NotificationAlertCard } from '../../components/admin/notifications/NotificationAlertCard';
import { NotificationAlertGrid } from '../../components/admin/notifications/NotificationAlertGrid';
import { NotificationModals } from '../../components/admin/notifications/NotificationModals';

export {
  STORAGE_ALERTS_KEY,
  STORAGE_PURCHASE_ORDERS_SUPER_KEY,
  STORAGE_PURCHASE_ORDERS_ADMIN_KEY,
  OFFICIAL_RETURN_REASONS,
  ALERT_CATEGORY_CONFIG,
  INITIAL_SYSTEM_ALERTS,
  enrichAlertProductItem,
  getAlertProducts,
  getAlertEmail,
  getAlertProductLink,
  getAlertShippingAddress,
  getAlertReturnLogistics,
  getAlertPendingPaymentLogistics,
  getAlertSpecificState,
  getAlertReferencePhotos,
  getAlertTimestampScore,
  loadAndReconcileSystemAlerts,
  NotificationKpisAndFilters,
  NotificationAlertCard,
  NotificationAlertGrid,
  NotificationModals
};

export type {
  AlertCategory,
  AlertProductItem,
  AlertShippingAddress,
  AlertStatusFilterValue,
  SystemAlert,
  DecisionModalState,
  ConfirmActionModalState,
  ProductDetailModalState,
  ReturnReviewModalState,
  ReferencePhotosModalState,
  AddCustomerReportModalState,
  CategoryCountMap
};

// Mapear documento de SystemAlertModel (MongoDB) a la interfaz SystemAlert del frontend
const mapMongoAlertToFrontend = (doc: any): SystemAlert => {
  const id = doc._id?.toString() || doc.id || `alt_${Date.now()}`;
  const isReturnAlert = doc.category === 'devolucion';
  const evidencePhotos: string[] = Array.isArray(doc.referencePhotos)
    ? doc.referencePhotos.filter(Boolean)
    : [];

  const rawProds = Array.isArray(doc.products) ? doc.products : [];
  const enrichedProducts = rawProds.map((p: any, idx: number) => {
    const baseImages = Array.isArray(p.images) ? p.images : p.image ? [p.image] : [];
    const finalImages =
      isReturnAlert && evidencePhotos.length > 0
        ? evidencePhotos
        : baseImages;
    const finalMainImage =
      isReturnAlert && evidencePhotos.length > 0
        ? evidencePhotos[0]
        : p.image || baseImages[0] || '';

    return enrichAlertProductItem(
      {
        id: p.id || `prod_${idx + 1}`,
        name: p.name || 'Prenda NoLimits',
        quantity: Number(p.quantity) || 1,
        size: p.size || 'Única',
        price: Number(p.price) || 0,
        sku: p.sku || 'NL-SKU',
        image: finalMainImage,
        images: finalImages,
        description: p.description || '',
        category: p.category || ''
      },
      idx
    );
  });

  return {
    ...doc,
    id,
    category: (doc.category || 'cobro_pendiente') as AlertCategory,
    title: doc.title || 'Notificación del Sistema',
    description: doc.description || '',
    severity: doc.severity || 'high',
    customerName: doc.customerName || 'Cliente NoLimits',
    customerRut: doc.customerRut?.trim() ? doc.customerRut : 'Sin RUT',
    customerPhone: doc.customerPhone?.trim() ? doc.customerPhone : 'Sin teléfono',
    customerEmail: doc.customerEmail || 'cliente@nolimits.cl',
    branchId: doc.branchId || 'casa_matriz',
    deliveryType: doc.deliveryType || 'retiro',
    deliveryMethodText: doc.deliveryMethodText || '',
    shippingAddress: doc.shippingAddress || undefined,
    orderNumber: doc.orderNumber || undefined,
    amount: Number(doc.amount) || 0,
    productName: doc.productName || enrichedProducts[0]?.name || undefined,
    productLink: doc.productLink || undefined,
    products: enrichedProducts,
    referencePhotos: evidencePhotos.length > 0 ? evidencePhotos : undefined,
    timeLimitText: doc.timeLimitText || '24 horas',
    dueHours: Number(doc.dueHours) || 24,
    expiresAt: doc.expiresAt || undefined,
    status: doc.status === 'resolved' ? 'resolved' : 'active',
    resolvedAt: doc.resolvedAt || undefined,
    replyNote: doc.replyNote || undefined,
    paymentResolutionStatus: doc.paymentResolutionStatus || undefined,
    returnReviewStatus: doc.returnReviewStatus || undefined,
    rejectionReason: doc.rejectionReason || undefined,
    trackingCode: doc.trackingCode || undefined,
    createdAt: doc.createdAt || new Date().toISOString(),
    isAutomated: doc.isAutomated ?? true
  } as SystemAlert;
};

// Mapear documento de ReturnModel (colección 'returns') a SystemAlert para la pestaña Devoluciones
const mapMongoReturnToFrontendAlert = (doc: any): SystemAlert => {
  const id = doc._id?.toString() || doc.id || `ret_${Date.now()}`;
  const evidencePhotos: string[] = Array.isArray(doc.evidencePhotos)
    ? doc.evidencePhotos.filter(Boolean)
    : [];

  const rawProds = Array.isArray(doc.products) ? doc.products : [];
  const enrichedProducts = rawProds.map((p: any, idx: number) =>
    enrichAlertProductItem(
      {
        id: p.id || `prod_${idx + 1}`,
        name: p.name || 'Prenda NoLimits',
        quantity: Number(p.quantity) || 1,
        size: p.size || 'Única',
        price: Number(p.price) || 0,
        sku: p.sku || 'NL-SKU',
        image: evidencePhotos[0] || p.image || '',
        images: evidencePhotos.length > 0 ? evidencePhotos : p.image ? [p.image] : [],
        description: doc.notes || '',
        category: ''
      },
      idx
    )
  );

  const isResolved =
    doc.returnReviewStatus === 'approved' || doc.returnReviewStatus === 'rejected';

  return {
    id,
    category: 'devolucion',
    title: `Solicitud de Devolución #${doc.ticketNumber || 'DEV'} — ${
      enrichedProducts[0]?.name || 'Prenda'
    }`,
    description: doc.notes || '',
    severity: 'warning',
    customerName: doc.customerName || 'Cliente NoLimits',
    customerRut: doc.customerRut?.trim() ? doc.customerRut : 'Sin RUT',
    customerPhone: doc.customerPhone?.trim() ? doc.customerPhone : 'Sin teléfono',
    customerEmail: doc.customerEmail || 'cliente@nolimits.cl',
    branchId: doc.branchId || 'vina_del_mar',
    deliveryType: doc.deliveryType === 'envio' ? 'envio' : 'retiro',
    deliveryMethodText: doc.targetBranchName || '',
    shippingCourier: doc.returnCourier || '',
    shippingCostClp: Number(doc.shippingCostClp) || 0,
    shippingAddress: doc.shippingAddress || undefined,
    orderNumber: doc.orderNumber || undefined,
    amount: Number(doc.totalAmount) || 0,
    productName: enrichedProducts[0]?.name || undefined,
    products: enrichedProducts,
    referencePhotos: evidencePhotos,
    returnReason: doc.reason || 'Defecto de fabricación',
    timeLimitText: '24 horas',
    dueHours: 24,
    status: isResolved ? 'resolved' : 'active',
    resolvedAt: doc.resolvedAt || undefined,
    replyNote: doc.replyNote || undefined,
    returnReviewStatus:
      doc.returnReviewStatus === 'approved' || doc.returnReviewStatus === 'rejected'
        ? doc.returnReviewStatus
        : undefined,
    rejectionReason: doc.rejectionReason || undefined,
    trackingCode: doc.trackingCode || undefined,
    createdAt: doc.createdAt || new Date().toISOString(),
    isAutomated: false
  } as SystemAlert;
};

export const InterestNotificationsView: React.FC = () => {
  // Pestaña activa: cualquiera de las 5 categorías oficiales (inicia en Cobro Pendiente)
  const [activeTab, setActiveTab] = useState<AlertCategory>('cobro_pendiente');

  // Estado de alertas conectado a MongoDB
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);

  // Sincronizar con localStorage para mantener compatibilidad con contadores del menú
  useEffect(() => {
    if (alerts.length > 0) {
      localStorage.setItem(STORAGE_ALERTS_KEY, JSON.stringify(alerts));
    }
  }, [alerts]);

  // Estados de control de UI
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Estados para Modal de Respuesta Rápida
  const [replyingAlert, setReplyingAlert] = useState<SystemAlert | null>(null);
  const [replyChannel, setReplyChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [replyCustomText, setReplyCustomText] = useState<string>('');

  // Estado para la ventanita de confirmación "¿Estás seguro?" en Cobro Pendiente
  const [decisionModal, setDecisionModal] = useState<DecisionModalState | null>(null);

  // Estado para la ventanita de confirmación "¿Estás seguro?" al Marcar Resuelta o Eliminar
  const [confirmActionModal, setConfirmActionModal] = useState<ConfirmActionModalState | null>(null);

  // Estado para la ventanita de Detalles del Producto y Galería de Imágenes
  const [productDetailModal, setProductDetailModal] = useState<ProductDetailModalState | null>(null);

  // Estado para la ventanita de "Revisión de equipo" en Solicitud de Devolución
  const [returnReviewModal, setReturnReviewModal] = useState<ReturnReviewModalState | null>(null);

  // Estado para visor ampliado de Fotos de Referencia en Solicitud de Productos Personalizado
  const [referencePhotosModal, setReferencePhotosModal] =
    useState<ReferencePhotosModalState | null>(null);

  // Estado para Modal "Agregar reporte" (sincronizado con User.model.ts en MongoDB)
  const [addReportModal, setAddReportModal] = useState<AddCustomerReportModalState | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Cargar alertas (system_alerts), clientes (users) y devoluciones (returns) desde MongoDB
  const fetchAlertsFromMongoDB = async (showNotification = false) => {
    setIsRefreshing(true);
    try {
      const [alertsRes, custRes, returnsRes] = await Promise.all([
        api.get('/admin/alerts'),
        api.get('/admin/customers'),
        api.get('/returns/admin')
      ]);

      if (custRes.data?.success && Array.isArray(custRes.data.data)) {
        setDbCustomers(custRes.data.data);
      }

      const mappedReturns: SystemAlert[] =
        returnsRes.data?.success && Array.isArray(returnsRes.data.data)
          ? returnsRes.data.data.map(mapMongoReturnToFrontendAlert)
          : [];

      let mappedOtherAlerts: SystemAlert[] = [];
      if (alertsRes.data?.success && Array.isArray(alertsRes.data.data)) {
        mappedOtherAlerts = alertsRes.data.data
          .filter((doc: any) => doc.category !== 'devolucion')
          .map(mapMongoAlertToFrontend);
      }

      const combined = [...mappedReturns, ...mappedOtherAlerts];
      setAlerts(combined);

      if (showNotification) {
        triggerToast(
          `✓ Sincronizado desde MongoDB (${mappedReturns.length} devolución(es) y ${mappedOtherAlerts.length} alerta(s))`
        );
      }
    } catch (error) {
      console.error('Error cargando alertas desde MongoDB:', error);
      setAlerts(loadAndReconcileSystemAlerts());
      if (showNotification) {
        triggerToast('Error al conectar con MongoDB; mostrando caché local');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlertsFromMongoDB(false);
  }, []);

  const toggleDescriptionExpand = (id: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filtrado y ordenamiento de alertas
  const filteredAlerts = useMemo(() => {
    const matching = alerts.filter((al) => {
      if (al.category !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = al.title.toLowerCase().includes(q);
        const matchDesc = al.description.toLowerCase().includes(q);
        const matchCustomer = al.customerName?.toLowerCase().includes(q) || false;
        const matchRut = al.customerRut?.toLowerCase().includes(q) || false;
        const matchPhone = al.customerPhone?.toLowerCase().includes(q) || false;
        const matchEmail = (al.customerEmail || getAlertEmail(al)).toLowerCase().includes(q);
        const matchOrder = al.orderNumber?.toLowerCase().includes(q) || false;
        const matchProduct = al.productName?.toLowerCase().includes(q) || false;
        const matchProductsList = (al.products || []).some((p) =>
          p.name.toLowerCase().includes(q)
        );
        if (
          !matchTitle &&
          !matchDesc &&
          !matchCustomer &&
          !matchRut &&
          !matchPhone &&
          !matchEmail &&
          !matchOrder &&
          !matchProduct &&
          !matchProductsList
        ) {
          return false;
        }
      }
      return true;
    });

    return [...matching].sort((a, b) => {
      const scoreA = getAlertTimestampScore(a);
      const scoreB = getAlertTimestampScore(b);
      return sortOrder === 'newest' ? scoreB - scoreA : scoreA - scoreB;
    });
  }, [alerts, activeTab, sortOrder, searchQuery]);

  // Descartar/eliminar alerta abriendo ventanita de confirmación "¿Estás seguro?"
  const handleDeleteAlert = (id: string, _title: string) => {
    const target = alerts.find((a) => a.id === id);
    if (target) {
      setConfirmActionModal({ alert: target, action: 'delete' });
    }
  };

  // Alternar estado Resuelta / Activa en MongoDB
  const handleToggleAlertStatus = async (id: string) => {
    const target = alerts.find((a) => a.id === id);
    if (!target) return;

    const newStatus = target.status === 'active' ? 'resolved' : 'active';
    const resolvedAt = newStatus === 'resolved' ? new Date().toLocaleString('es-CL') : '';

    try {
      await api.put(`/admin/alerts/${id}`, {
        status: newStatus,
        resolvedAt,
        replyNote: newStatus === 'active' ? '' : target.replyNote || '',
        paymentResolutionStatus: newStatus === 'active' ? '' : target.paymentResolutionStatus || ''
      });

      setAlerts((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            return {
              ...a,
              status: newStatus,
              resolvedAt: resolvedAt || undefined,
              replyNote: newStatus === 'active' ? undefined : a.replyNote,
              paymentResolutionStatus: newStatus === 'active' ? undefined : a.paymentResolutionStatus
            };
          }
          return a;
        })
      );
      triggerToast('✓ Estado de la alerta actualizado en MongoDB');
    } catch (error) {
      console.error('Error actualizando estado de alerta en MongoDB:', error);
      triggerToast('Error al actualizar el estado en MongoDB');
    }
  };

  // Ejecutar acción confirmada desde la ventanita "¿Estás seguro?" (Marcar Resuelta o Eliminar en MongoDB)
  const handleExecuteConfirmAction = async () => {
    if (!confirmActionModal) return;
    const { alert: targetAlert, action } = confirmActionModal;

    try {
      if (action === 'delete') {
        await api.delete(`/admin/alerts/${targetAlert.id}`);
        setAlerts((prev) => prev.filter((a) => a.id !== targetAlert.id));
        triggerToast(`✓ Solicitud "${targetAlert.title}" eliminada permanentemente de MongoDB.`);
      } else {
        const newStatus = targetAlert.status === 'active' ? 'resolved' : 'active';
        const resolvedAt = newStatus === 'resolved' ? new Date().toLocaleString('es-CL') : '';

        await api.put(`/admin/alerts/${targetAlert.id}`, {
          status: newStatus,
          resolvedAt
        });

        setAlerts((prev) =>
          prev.map((a) => {
            if (a.id === targetAlert.id) {
              return {
                ...a,
                status: newStatus,
                resolvedAt: resolvedAt || undefined
              };
            }
            return a;
          })
        );
        triggerToast(
          targetAlert.status === 'active'
            ? `✓ Solicitud "${targetAlert.title}" marcada como resuelta en MongoDB.`
            : `✓ Solicitud "${targetAlert.title}" reactivada en MongoDB.`
        );
      }
    } catch (error) {
      console.error('Error ejecutando acción en MongoDB:', error);
      triggerToast('Error de conexión con MongoDB al procesar la alerta');
    }

    setConfirmActionModal(null);
  };

  // Ejecutar decisión de "Revisión de equipo" en Solicitud de Devolución (MongoDB: returns + orders)
  const handleExecuteReturnReview = async () => {
    if (!returnReviewModal) return;
    const { alert: targetAlert, decision, rejectionReason, trackingCode } = returnReviewModal;

    if (!decision) {
      setReturnReviewModal({
        ...returnReviewModal,
        errorMessage: 'Por favor selecciona una opción: "Aprobada por Admin" o "Rechazada por Admin".'
      });
      return;
    }

    const isHomeDelivery = targetAlert.deliveryType === 'envio';
    const cleanTracking = trackingCode.trim();

    if (decision === 'approved' && isHomeDelivery && !cleanTracking) {
      setReturnReviewModal({
        ...returnReviewModal,
        errorMessage:
          'Debes ingresar el código de seguimiento para confirmar la devolución con envío a domicilio.'
      });
      return;
    }

    if (decision === 'rejected' && !rejectionReason.trim()) {
      setReturnReviewModal({
        ...returnReviewModal,
        errorMessage:
          'Debes escribir la razón del rechazo para confirmar el rechazo de la devolución.'
      });
      return;
    }

    const isApproved = decision === 'approved';
    const cleanReason = rejectionReason.trim();
    const resolvedAt = new Date().toLocaleString('es-CL');
    const noteText = isApproved
      ? isHomeDelivery
        ? `Revisión de equipo: Aprobada por Admin. Código de seguimiento registrado: ${cleanTracking}.`
        : 'Revisión de equipo: Aprobada por Admin. Devolución autorizada para retiro/entrega presencial en sucursal.'
      : `Revisión de equipo: Rechazada por Admin. Razón del rechazo: "${cleanReason}"`;

    try {
      await api.put(`/returns/admin/${targetAlert.id}/review`, {
        decision,
        rejectionReason: isApproved ? '' : cleanReason,
        trackingCode: isApproved && isHomeDelivery ? cleanTracking : '',
        replyNote: noteText
      });

      setAlerts((prev) =>
        prev.map((a) => {
          if (a.id === targetAlert.id) {
            return {
              ...a,
              status: 'resolved',
              resolvedAt,
              returnReviewStatus: isApproved ? 'approved' : 'rejected',
              rejectionReason: isApproved ? undefined : cleanReason,
              trackingCode: isApproved && isHomeDelivery ? cleanTracking : undefined,
              replyNote: noteText
            };
          }
          return a;
        })
      );

      triggerToast(
        isApproved
          ? isHomeDelivery
            ? `✓ Devolución "${targetAlert.title}" Aprobada en MongoDB (Seguimiento: ${cleanTracking}).`
            : `✓ Devolución "${targetAlert.title}" Aprobada por Admin en MongoDB.`
          : `✓ Devolución "${targetAlert.title}" Rechazada por Admin en MongoDB.`
      );
      setReturnReviewModal(null);
    } catch (error) {
      console.error('Error guardando revisión de devolución en MongoDB:', error);
      triggerToast('Error al guardar la revisión de devolución en MongoDB');
    }
  };

  // Abrir modal de respuesta rápida
  const handleOpenReplyModal = (alertItem: SystemAlert) => {
    setReplyingAlert(alertItem);
    if (alertItem.category === 'cobro_pendiente') {
      setReplyChannel('email');
    } else {
      setReplyChannel('whatsapp');
    }

    let initialText = '';
    if (alertItem.category === 'cobro_pendiente') {
      const email = getAlertEmail(alertItem);
      initialText = `Estimado/a ${alertItem.customerName},\n\nLe escribimos de No Limits respecto a su compra #${
        alertItem.orderNumber || 'NL-LIVE'
      } por un monto de $${(alertItem.amount || 0).toLocaleString(
        'es-CL'
      )} CLP asociado al correo ${email}.\n\nLe recordamos que el plazo límite de pago está por expirar. Para confirmar su orden y proceder con la preparación de sus prendas, por favor responda a este correo adjuntando su comprobante de transferencia bancaria.\n\nAtentamente,\nEquipo de Cobranzas No Limits`;
    } else if (alertItem.category === 'atencion_cliente') {
      initialText = `¡Hola ${alertItem.customerName}! Te escribimos del equipo de atención al cliente de No Limits en relación a tu consulta sobre "${alertItem.title}". Con gusto te confirmamos los detalles de tu solicitud.`;
    } else if (alertItem.category === 'producto_agotado') {
      initialText = `¡Hola ${alertItem.customerName}! Te escribimos de No Limits. Vimos tu interés en "${
        alertItem.productName || 'la prenda solicitada'
      }". Te informamos que tendremos reposición exclusiva la próxima semana. ¿Te gustaría que te reservemos una unidad prioritaria?`;
    } else if (alertItem.category === 'devolucion') {
      initialText = `¡Hola ${alertItem.customerName}! Recibimos tu solicitud de cambio / devolución para tu pedido #${
        alertItem.orderNumber || ''
      }. Puedes realizar el cambio presencialmente en nuestras sucursales de Viña del Mar o Valparaíso, o coordinar retiro vía Starken. ¿Qué modalidad te acomoda más?`;
    } else if (alertItem.category === 'producto_personalizado') {
      initialText = `¡Hola ${alertItem.customerName}! Recibimos tu solicitud de personalización para "${
        alertItem.productName || 'tu prenda a medida'
      }". Revisamos tu diseño y podemos confeccionarlo. ¿Te gustaría agendar una llamada o coordinar los detalles finales por aquí?`;
    } else {
      initialText = `¡Hola ${alertItem.customerName}! Te escribimos del equipo de No Limits respecto a tu requerimiento.`;
    }

    setReplyCustomText(initialText);
  };

  // Enviar respuesta y guardar nota en MongoDB
  const handleSendReply = async () => {
    if (!replyingAlert) return;

    if (replyChannel === 'whatsapp') {
      const cleanPhone = replyingAlert.customerPhone.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(replyCustomText);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      window.open(waUrl, '_blank');
    } else {
      const email = getAlertEmail(replyingAlert);
      const mailUrl = `mailto:${email}?subject=${encodeURIComponent(
        replyingAlert.title
      )}&body=${encodeURIComponent(replyCustomText)}`;
      window.open(mailUrl, '_blank');
    }

    const isCobro = replyingAlert.category === 'cobro_pendiente';
    const channelLabel = replyChannel === 'email' ? 'CORREO ELECTRÓNICO' : 'WHATSAPP';
    const timeStr = new Date().toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const newReplyNote = isCobro
      ? `Aviso de cobro enviado por correo (${timeStr}): "${replyCustomText.slice(0, 70)}..."`
      : `Respuesta enviada vía ${channelLabel}: "${replyCustomText.slice(0, 80)}..."`;

    const newStatus = isCobro ? 'active' : 'resolved';
    const resolvedAt = isCobro ? '' : new Date().toLocaleString('es-CL');

    try {
      await api.put(`/admin/alerts/${replyingAlert.id}`, {
        replyNote: newReplyNote,
        status: newStatus,
        resolvedAt
      });
    } catch (err) {
      console.error('Error guardando nota de respuesta en MongoDB:', err);
    }

    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== replyingAlert.id) return a;
        return {
          ...a,
          replyNote: newReplyNote,
          status: newStatus,
          resolvedAt: resolvedAt || undefined
        };
      })
    );

    triggerToast(
      isCobro
        ? `✓ Correo enviado con éxito a ${replyingAlert.customerName}. La orden sigue pendiente de cobro.`
        : `✓ Respuesta enviada a ${replyingAlert.customerName} y registrada en MongoDB.`
    );
    setReplyingAlert(null);
  };

  // Ejecución de la decisión confirmada (Pago Confirmado o Pago Anulado en MongoDB + OrderModel)
  const handleExecuteDecision = async () => {
    if (!decisionModal) return;
    const { alert: targetAlert, action } = decisionModal;
    const isConfirming = action === 'confirmar';
    const resolvedAt = new Date().toLocaleString('es-CL');
    const paymentResolutionStatus = isConfirming ? 'confirmed' : 'cancelled';

    try {
      await api.put(`/admin/alerts/${targetAlert.id}`, {
        status: 'resolved',
        resolvedAt,
        paymentResolutionStatus,
        replyNote: ''
      });

      setAlerts((prev) =>
        prev.map((a) => {
          if (a.id === targetAlert.id) {
            return {
              ...a,
              status: 'resolved',
              resolvedAt,
              paymentResolutionStatus,
              replyNote: undefined
            };
          }
          return a;
        })
      );

      triggerToast(
        isConfirming
          ? `✓ Pago Confirmado en MongoDB: La orden #${targetAlert.orderNumber} pasó al estado "Solicitud recibida" en Órdenes de Compra.`
          : `✓ Pago Anulado en MongoDB: La orden #${targetAlert.orderNumber} fue cancelada en el sistema.`
      );
    } catch (error) {
      console.error('Error ejecutando resolución de cobro en MongoDB:', error);
      triggerToast('Error al sincronizar la decisión con MongoDB');
    }

    setDecisionModal(null);
  };

  const handleRefresh = () => {
    fetchAlertsFromMongoDB(true);
  };

  // Abrir modal "Agregar reporte" buscando en los clientes reales de MongoDB
  const handleOpenAddReportFromAlert = (al: SystemAlert) => {
    let directory: CustomerRecord[] =
      dbCustomers.length > 0
        ? dbCustomers.map((c: any) =>
            normalizeCustomer({
              ...c,
              id: c._id?.toString() || c.id,
              nombre: c.firstName || (c.name ? c.name.split(' ')[0] : 'Cliente'),
              apellido: c.lastName || (c.name ? c.name.split(' ').slice(1).join(' ') : ''),
              compras: c.totalOrdersCount ?? 0,
              puntosClub: c.loyaltyPoints ?? 0,
              totalGastado: c.totalSpentClp ?? 0,
              etiquetas: Array.isArray(c.tags) && c.tags.length > 0 ? c.tags : ['Normal']
            })
          )
        : INITIAL_CUSTOMERS;

    const alertNameLower = (al.customerName || '').trim().toLowerCase();
    const alertRutLower = (al.customerRut || '').trim().toLowerCase();
    const alertEmailLower = getAlertEmail(al).trim().toLowerCase();

    let matchedCustomer = directory.find((c) => {
      const fullName = `${c.nombre} ${c.apellido}`.trim().toLowerCase();
      return (
        fullName === alertNameLower ||
        (alertNameLower.length > 4 && fullName.startsWith(alertNameLower)) ||
        (alertEmailLower && c.email.trim().toLowerCase() === alertEmailLower)
      );
    });

    if (!matchedCustomer && alertRutLower) {
      matchedCustomer = directory.find((c) => c.rut.trim().toLowerCase() === alertRutLower);
    }

    if (!matchedCustomer) {
      const nameParts = (al.customerName || 'Cliente NoLimits').trim().split(/\s+/);
      const nombre = nameParts[0] || 'Cliente';
      const apellido = nameParts.slice(1).join(' ') || 'NoLimits';
      matchedCustomer = {
        id: `cust_alert_${al.id}`,
        nombre,
        apellido,
        rut: al.customerRut || 'Sin RUT',
        email: getAlertEmail(al),
        phone: al.customerPhone || 'Sin teléfono',
        compras: 1,
        puntosClub: 30,
        totalGastado: al.amount || 38990,
        etiquetas: ['Normal'],
        fechaRegistro: new Date().toISOString().slice(0, 10),
        blacklistReports: [],
        preferentialReports: []
      };
    }

    const defaultDebt =
      al.category === 'cobro_pendiente' && al.amount ? al.amount.toLocaleString('es-CL') : '';

    setAddReportModal({
      alert: al,
      customer: matchedCustomer,
      targetType: 'preferencial',
      reason: '',
      debtAmount: defaultDebt,
      benefit: '',
      notes: ''
    });
  };

  // Guardar el reporte directamente en la colección 'users' de MongoDB (y en localStorage)
  const handleSaveCustomerReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addReportModal) return;

    const { customer, targetType, reason, debtAmount, benefit, notes } = addReportModal;
    if (!reason.trim()) {
      setAddReportModal({
        ...addReportModal,
        errorMessage: 'Debes indicar el motivo o causa del reporte.'
      });
      return;
    }

    const nowFormatted = new Date().toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isBlacklist = targetType === 'negra';
    const debtVal = debtAmount ? parseInt(debtAmount.replace(/[^0-9]/g, ''), 10) : undefined;
    const newTag: CustomerTag = isBlacklist ? 'Lista Negra' : 'Lista Preferencial';

    let updatedTags = [...customer.etiquetas];
    if (!updatedTags.includes(newTag)) {
      updatedTags.push(newTag);
    }
    if (updatedTags.length > 1 && updatedTags.includes('Normal')) {
      updatedTags = updatedTags.filter((t) => t !== 'Normal');
    }

    const updatedBlacklistReports: BlacklistReport[] = isBlacklist
      ? [
          {
            id: `bl_rep_${Date.now()}`,
            date: nowFormatted,
            reason: reason.trim(),
            debtAmount: debtVal,
            notes: notes.trim() || undefined,
            recordedBy: 'Super Admin'
          },
          ...(customer.blacklistReports || [])
        ]
      : customer.blacklistReports || [];

    const updatedPreferentialReports: PreferentialReport[] = !isBlacklist
      ? [
          {
            id: `pref_rep_${Date.now()}`,
            date: nowFormatted,
            reason: reason.trim(),
            benefit: benefit.trim() || undefined,
            notes: notes.trim() || undefined,
            recordedBy: 'Super Admin'
          },
          ...(customer.preferentialReports || [])
        ]
      : customer.preferentialReports || [];

    try {
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(customer.id);
      if (isMongoId) {
        await api.put(`/admin/customers/${customer.id}`, {
          tags: updatedTags,
          blacklistReports: updatedBlacklistReports,
          preferentialReports: updatedPreferentialReports
        });
      } else {
        const createRes = await api.post('/admin/customers', {
          firstName: customer.nombre,
          lastName: customer.apellido,
          rut: customer.rut,
          email: customer.email,
          phone: customer.phone,
          loyaltyPoints: customer.puntosClub,
          totalOrdersCount: customer.compras,
          totalSpentClp: customer.totalGastado,
          tags: updatedTags,
          blacklistReports: updatedBlacklistReports,
          preferentialReports: updatedPreferentialReports
        });
        const createdId = createRes.data?.data?._id;
        if (createdId) {
          await api.put(`/admin/customers/${createdId}`, {
            tags: updatedTags,
            blacklistReports: updatedBlacklistReports,
            preferentialReports: updatedPreferentialReports
          });
        }
      }
    } catch (err) {
      console.error('Error guardando reporte de cliente en MongoDB:', err);
    }

    triggerToast(
      `✓ Reporte añadido en MongoDB a la ${
        isBlacklist ? 'Lista Negra' : 'Lista Preferencial'
      } para "${customer.nombre} ${customer.apellido}". Disponible en Administrador de Clientes.`
    );
    setAddReportModal(null);
  };

  // Métricas automáticas para tarjetas KPI
  const countByCategory = useMemo<CategoryCountMap>(() => {
    const counts: CategoryCountMap = {
      cobro_pendiente: { total: 0, active: 0, amount: 0 },
      atencion_cliente: { total: 0, active: 0, amount: 0 },
      producto_agotado: { total: 0, active: 0, amount: 0 },
      devolucion: { total: 0, active: 0, amount: 0 },
      producto_personalizado: { total: 0, active: 0, amount: 0 }
    };

    alerts.forEach((a) => {
      if (counts[a.category]) {
        counts[a.category].total += 1;
        if (a.status === 'active') {
          counts[a.category].active += 1;
          counts[a.category].amount += a.amount || 0;
        }
      }
    });

    return counts;
  }, [alerts]);

  void handleOpenReplyModal;

  return (
    <div className="interest-notif-root space-y-4 font-sans text-gray-900 pb-16">
      <WindowFrame
        title="INTEREST_NOTIFICATIONS_CENTER.SYS - [Centro de Notificaciones & Alertas Automatizadas (MongoDB) - Super Admin]"
        icon={<PixelIcon name="computer" size={16} />}
        statusBarText={`SUPER ADMIN // MONGODB SYSTEM_ALERTS + RETURNS ACTIVO // 5 CATEGORÍAS ACTIVAS // TOTAL: ${alerts.length}`}
      >
        <div className="space-y-4 text-xs">
          {/* Cabecera, Toast, Tarjetas KPI, Pestañas y Barra de Filtros */}
          <NotificationKpisAndFilters
            handleRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            toastMessage={toastMessage}
            setToastMessage={setToastMessage}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            countByCategory={countByCategory}
            filteredCount={filteredAlerts.length}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          {/* Grilla Principal de Alertas Automatizadas y Guía Operativa */}
          <NotificationAlertGrid
            filteredAlerts={filteredAlerts}
            expandedDescriptions={expandedDescriptions}
            toggleDescriptionExpand={toggleDescriptionExpand}
            handleDeleteAlert={handleDeleteAlert}
            handleToggleAlertStatus={handleToggleAlertStatus}
            handleOpenAddReportFromAlert={handleOpenAddReportFromAlert}
            setDecisionModal={setDecisionModal}
            setConfirmActionModal={setConfirmActionModal}
            setProductDetailModal={setProductDetailModal}
            setReturnReviewModal={setReturnReviewModal}
            setReferencePhotosModal={setReferencePhotosModal}
          />
        </div>
      </WindowFrame>

      {/* Modales del Centro de Notificaciones & Alertas */}
      <NotificationModals
        decisionModal={decisionModal}
        setDecisionModal={setDecisionModal}
        handleExecuteDecision={handleExecuteDecision}
        replyingAlert={replyingAlert}
        setReplyingAlert={setReplyingAlert}
        replyChannel={replyChannel}
        setReplyChannel={setReplyChannel}
        replyCustomText={replyCustomText}
        setReplyCustomText={setReplyCustomText}
        handleSendReply={handleSendReply}
        confirmActionModal={confirmActionModal}
        setConfirmActionModal={setConfirmActionModal}
        handleExecuteConfirmAction={handleExecuteConfirmAction}
        productDetailModal={productDetailModal}
        setProductDetailModal={setProductDetailModal}
        returnReviewModal={returnReviewModal}
        setReturnReviewModal={setReturnReviewModal}
        handleExecuteReturnReview={handleExecuteReturnReview}
        referencePhotosModal={referencePhotosModal}
        setReferencePhotosModal={setReferencePhotosModal}
        addReportModal={addReportModal}
        setAddReportModal={setAddReportModal}
        handleSaveCustomerReport={handleSaveCustomerReport}
      />
    </div>
  );
};

export default InterestNotificationsView;