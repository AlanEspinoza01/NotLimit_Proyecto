import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  User,
  Check,
  Package,
  XCircle,
  ShoppingBag,
  Eye,
  ShieldCheck,
  MapPin,
  Truck,
  Tag
} from 'lucide-react';
import { INITIAL_PRODUCTS } from '../../../services/mockData';
import {
  ALERT_CATEGORY_CONFIG,
  SystemAlert,
  DecisionModalState,
  ConfirmActionModalState,
  ProductDetailModalState,
  ReturnReviewModalState,
  ReferencePhotosModalState
} from './interestNotificationTypes';
import {
  getAlertEmail,
  getAlertProducts,
  getAlertProductLink,
  getAlertShippingAddress,
  getAlertReturnLogistics,
  getAlertPendingPaymentLogistics,
  getAlertSpecificState,
  getAlertReferencePhotos
} from './interestNotificationHelpers';

export interface NotificationAlertCardProps {
  alertItem: SystemAlert;
  isExpanded: boolean;
  toggleDescriptionExpand: (id: string) => void;
  handleDeleteAlert: (id: string, title: string) => void;
  handleToggleAlertStatus: (id: string) => void;
  handleOpenAddReportFromAlert: (al: SystemAlert) => void;
  setDecisionModal: (val: DecisionModalState | null) => void;
  setConfirmActionModal: (val: ConfirmActionModalState | null) => void;
  setProductDetailModal: (val: ProductDetailModalState | null) => void;
  setReturnReviewModal: (val: ReturnReviewModalState | null) => void;
  setReferencePhotosModal: (val: ReferencePhotosModalState | null) => void;
}

export const NotificationAlertCard: React.FC<NotificationAlertCardProps> = ({
  alertItem: al,
  isExpanded,
  toggleDescriptionExpand,
  handleDeleteAlert,
  handleToggleAlertStatus,
  handleOpenAddReportFromAlert,
  setDecisionModal,
  setConfirmActionModal,
  setProductDetailModal,
  setReturnReviewModal,
  setReferencePhotosModal
}) => {
  const config = ALERT_CATEGORY_CONFIG[al.category] || ALERT_CATEGORY_CONFIG.cobro_pendiente;
  const IconComponent = config.icon;
  const isCritical = al.severity === 'critical';
  const isResolved = al.status === 'resolved';
  const isCobroPendiente = al.category === 'cobro_pendiente';

  const isLong = al.description.length > 120;
  const displayedDesc =
    !isExpanded && isLong ? al.description.slice(0, 120) + '...' : al.description;

  const email = getAlertEmail(al);
  const productsList = getAlertProducts(al);

  return (
    <div
      className={`p-3 bg-white border-2 rounded-xs shadow-xs space-y-2.5 transition-all flex flex-col justify-between ${
        isResolved
          ? 'border-gray-300 opacity-75 bg-gray-50'
          : isCobroPendiente
          ? 'border-rose-400 hover:border-rose-600 ring-1 ring-rose-200'
          : isCritical && al.category !== 'producto_agotado'
          ? 'border-red-500 hover:border-red-700'
          : `${config.borderCol} hover:border-gray-700`
      }`}
    >
      {/* Parte Superior: Categoría, Estado y Título */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2 border-b border-gray-200 pb-2">
          <div className="flex items-start gap-2">
            <div
              className={`p-1.5 rounded-xs shrink-0 ${
                isCobroPendiente
                  ? 'bg-rose-100 text-rose-700'
                  : al.category === 'producto_agotado'
                  ? 'bg-purple-100 text-purple-700'
                  : isCritical
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Badge con texto blanco forzado */}
                <span
                  style={{ color: '#ffffff' }}
                  className={`${config.badgeBg} !text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded-xs tracking-wider select-none shadow-2xs`}
                >
                  {config.label}
                </span>

                {/* Etiqueta de estado según el nuevo esquema */}
                {(al.category !== 'producto_agotado' || isResolved) &&
                  (() => {
                    const specificState = getAlertSpecificState(al);
                    let stateBadgeLabel = 'ACTIVA';
                    let stateBadgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-400';

                    if (specificState === 'por_cobrar') {
                      stateBadgeLabel = 'POR COBRAR';
                      stateBadgeClass =
                        'bg-rose-100 text-rose-900 border-rose-400 animate-pulse font-black';
                    } else if (specificState === 'pago_confirmado') {
                      stateBadgeLabel = 'PAGO CONFIRMADO';
                      stateBadgeClass =
                        'bg-emerald-100 text-emerald-950 border-emerald-500 font-black';
                    } else if (specificState === 'pago_anulado') {
                      stateBadgeLabel = 'PAGO ANULADO';
                      stateBadgeClass = 'bg-red-100 text-red-950 border-red-500 font-black';
                    } else if (specificState === 'revision_equipo') {
                      stateBadgeLabel = 'REVISIÓN DE EQUIPO';
                      stateBadgeClass = 'bg-amber-100 text-amber-950 border-amber-400 font-black';
                    } else if (specificState === 'aprobada_admin') {
                      stateBadgeLabel = 'APROBADA POR ADMIN';
                      stateBadgeClass =
                        'bg-emerald-100 text-emerald-950 border-emerald-500 font-black';
                    } else if (specificState === 'rechazada_admin') {
                      stateBadgeLabel = 'RECHAZADA POR ADMIN';
                      stateBadgeClass = 'bg-red-100 text-red-950 border-red-500 font-black';
                    } else if (specificState === 'resuelta') {
                      stateBadgeLabel = 'RESUELTA';
                      stateBadgeClass = 'bg-gray-200 text-gray-700 border-gray-400';
                    } else if (isCritical) {
                      stateBadgeLabel = 'CRÍTICA';
                      stateBadgeClass = 'bg-red-100 text-red-900 border-red-400 animate-pulse';
                    }

                    return (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs border ${stateBadgeClass}`}
                      >
                        {stateBadgeLabel}
                      </span>
                    );
                  })()}

                <span className="font-mono text-[9px] text-gray-500">{al.createdAt}</span>
              </div>

              <h3 className="font-bold text-xs text-[#003c74] mt-1 leading-snug">{al.title}</h3>
            </div>
          </div>

          {![
            'cobro_pendiente',
            'atencion_cliente',
            'producto_agotado',
            'devolucion',
            'producto_personalizado'
          ].includes(al.category) && (
            <button
              type="button"
              onClick={() => handleDeleteAlert(al.id, al.title)}
              className="text-gray-400 hover:text-red-700 p-0.5"
              title="Descartar alerta permanentemente"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Descripción con opción de expandir */}
        <div className="p-2 bg-gray-50 border border-gray-200 rounded-xs text-[11px] text-gray-800 leading-relaxed">
          <p>{displayedDesc}</p>
          {isLong && (
            <button
              type="button"
              onClick={() => toggleDescriptionExpand(al.id)}
              className="mt-1 font-bold text-blue-700 hover:text-blue-900 underline text-[10px] inline-flex items-center gap-0.5"
            >
              {isExpanded ? (
                <>
                  <span>Ver menos</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>Ver más detalle...</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Metadatos relevantes */}
        <div className="interest-notif-meta-grid grid grid-cols-2 gap-2 text-[10px] pt-1">
          <div>
            <span className="text-gray-500 font-bold block">Cliente:</span>
            <span className="font-extrabold text-gray-900 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-blue-700 shrink-0" />
              {al.customerName}
            </span>
          </div>

          {/* RUT Cliente (En Solicitud de Devolución y en Cobros Pendientes cuando es por Envío) */}
          {(al.category === 'devolucion' || (isCobroPendiente && al.deliveryType === 'envio')) && (
            <div>
              <span className="text-gray-500 font-bold block">RUT Cliente:</span>
              <span className="font-mono font-bold text-gray-900 mt-0.5 block">
                {al.customerRut || '20.104.992-1'}
              </span>
            </div>
          )}

          <div>
            <span className="text-gray-500 font-bold block">Contacto WhatsApp/Fono:</span>
            <a
              href={`https://wa.me/${al.customerPhone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-bold text-emerald-800 hover:underline flex items-center gap-1 mt-0.5"
            >
              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
              {al.customerPhone}
            </a>
          </div>

          {/* Correo Electrónico */}
          <div className="col-span-2 sm:col-span-1">
            <span className="text-gray-500 font-bold block">Correo Electrónico:</span>
            <a
              href={`mailto:${email}`}
              className="font-medium text-blue-900 hover:underline flex items-center gap-1 mt-0.5 truncate"
              title={email}
            >
              <Mail className="w-3 h-3 text-amber-700 shrink-0" />
              <span className="truncate">{email}</span>
            </a>
          </div>

          {/* Modalidad de Entrega (En Cobro Pendiente y Solicitud de Devolución) */}
          {(isCobroPendiente || al.category === 'devolucion') && (
            <div className="col-span-2">
              <span className="text-gray-500 font-bold block">
                {al.category === 'devolucion'
                  ? 'Modalidad de Entrega (Devolución):'
                  : 'Modalidad de Entrega:'}
              </span>
              <div
                className={`w-full grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 items-center font-bold text-[10px] mt-0.5 py-1 rounded-xs border ${
                  al.deliveryType === 'retiro'
                    ? 'bg-amber-100 text-amber-950 border-amber-400'
                    : 'bg-blue-100 text-blue-950 border-blue-400'
                }`}
              >
                <span className="pl-2.5 truncate">
                  {al.deliveryType === 'retiro' ? '🏬 Retiro en Tienda' : '🚚 Envío a Domicilio'}
                </span>
                <span className="font-medium text-gray-700 text-left pl-2.5 sm:pl-0 pr-2 truncate">
                  {al.deliveryMethodText ? `(${al.deliveryMethodText})` : ''}
                </span>
              </div>
            </div>
          )}

          {/* VALOR DEL ENVÍO SEGÚN AGENCIA DE TRANSPORTE ESCOGIDA (En Cobro Pendiente cuando es por Envío) */}
          {isCobroPendiente &&
            al.deliveryType === 'envio' &&
            (() => {
              const pendingLogistics = getAlertPendingPaymentLogistics(al);
              return (
                <div className="col-span-2 p-2.5 bg-rose-50/90 border-2 border-rose-400 rounded-xs space-y-1.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-rose-200 pb-1">
                    <span className="text-[10px] font-black uppercase text-rose-950 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                      <span>
                        Agencia de Transporte Escogida: {pendingLogistics.courierName}
                      </span>
                    </span>
                    <span
                      data-force-white="true"
                      style={{ color: '#ffffff', backgroundColor: '#be123c' }}
                      className="!text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-xs"
                    >
                      Envío por {pendingLogistics.courierName}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                    <div className="p-1.5 bg-white border border-rose-200 rounded-xs">
                      <span className="text-[9px] font-bold text-gray-600 uppercase block">
                        Valor Prendas:
                      </span>
                      <span className="font-mono font-black text-xs text-gray-900 block mt-0.5">
                        ${pendingLogistics.productsSubtotalClp.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                    <div className="p-1.5 bg-white border-2 border-blue-400 rounded-xs">
                      <span className="text-[9px] font-bold text-blue-900 uppercase block">
                        Valor de Envío ({pendingLogistics.courierName}):
                      </span>
                      <span className="font-mono font-black text-xs text-blue-900 block mt-0.5">
                        ${pendingLogistics.shippingCostClp.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                    <div className="p-1.5 bg-white border border-rose-400 rounded-xs">
                      <span className="text-[9px] font-bold text-rose-900 uppercase block">
                        Total con Envío:
                      </span>
                      <span className="font-mono font-black text-xs text-rose-800 block mt-0.5">
                        ${pendingLogistics.totalWithShippingClp.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* MOTIVO DE LA SOLICITUD Y AGENCIA / VALOR DE ENVÍO (Exclusivo en Solicitud de Devolución) */}
          {al.category === 'devolucion' &&
            (() => {
              const returnInfo = getAlertReturnLogistics(al);
              return (
                <>
                  {/* 1. Motivo elegido por el usuario */}
                  <div className="col-span-2 p-2 bg-amber-50 border border-amber-400 rounded-xs space-y-1 shadow-2xs">
                    <span className="text-[10px] font-black uppercase text-amber-950 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Motivo de la Solicitud (Seleccionado por el Usuario):</span>
                    </span>
                    <div className="font-extrabold text-[11px] text-gray-950 bg-white px-2 py-1 border border-amber-300 rounded-2xs">
                      {returnInfo.motivo}
                    </div>
                  </div>

                  {/* 2. Agencia de Envío escogida y Valor de Envío (Starken / Blue Express vs Paket) */}
                  {returnInfo.isShipping ? (
                    returnInfo.paidByOwner ? (
                      <div className="col-span-2 p-2.5 bg-emerald-50/90 border-2 border-emerald-500 rounded-xs space-y-1.5 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-emerald-200 pb-1">
                          <span className="text-[10px] font-black uppercase text-emerald-950 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>Agencia de Envío Escogida: {returnInfo.courierName}</span>
                          </span>
                          <span
                            data-force-white="true"
                            style={{ color: '#ffffff', backgroundColor: '#15803d' }}
                            className="!text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-xs"
                          >
                            Envío lo paga el Dueño (NoLimits)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                          <div className="p-1.5 bg-white border border-emerald-400 rounded-xs">
                            <span className="text-[9px] font-bold text-gray-600 uppercase block">
                              Valor de Envío que Paga el Dueño (NoLimits):
                            </span>
                            <span className="font-mono font-black text-xs text-rose-800 block mt-0.5">
                              ${returnInfo.ownerShippingCostClp.toLocaleString('es-CL')} CLP
                            </span>
                          </div>
                          <div className="p-1.5 bg-white border border-emerald-300 rounded-xs">
                            <span className="text-[9px] font-bold text-gray-600 uppercase block">
                              Valor que le sale al Cliente:
                            </span>
                            <span className="font-mono font-black text-xs text-emerald-700 block mt-0.5">
                              $0 CLP{' '}
                              <span className="text-[9px] font-semibold text-gray-600">
                                (El envío lo paga el dueño)
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="col-span-2 p-2.5 bg-blue-50/90 border-2 border-blue-400 rounded-xs space-y-1.5 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-blue-200 pb-1">
                          <span className="text-[10px] font-black uppercase text-blue-950 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>Agencia de Envío Escogida: {returnInfo.courierName}</span>
                          </span>
                          <span
                            data-force-white="true"
                            style={{ color: '#ffffff', backgroundColor: '#b91c1c' }}
                            className="!text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-xs"
                          >
                            Envío lo paga el Usuario (Cliente)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                          <div className="p-1.5 bg-white border border-blue-300 rounded-xs">
                            <span className="text-[9px] font-bold text-gray-600 uppercase block">
                              Valor de Envío que Paga el Usuario:
                            </span>
                            <span className="font-mono font-black text-xs text-blue-900 block mt-0.5">
                              ${returnInfo.customerShippingCostClp.toLocaleString('es-CL')} CLP
                            </span>
                          </div>
                          <div className="p-1.5 bg-white border border-blue-200 rounded-xs">
                            <span className="text-[9px] font-bold text-gray-600 uppercase block">
                              Costo para el Dueño (NoLimits):
                            </span>
                            <span className="font-mono font-black text-xs text-gray-700 block mt-0.5">
                              $0 CLP{' '}
                              <span className="text-[9px] font-semibold text-gray-600">
                                (Pagado por el cliente)
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="col-span-2 p-2 bg-amber-50/70 border border-amber-300 rounded-xs flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-950">
                        Entrega Presencial en Sucursal Física (Sin agencia de envío):
                      </span>
                      <span className="font-mono font-black text-xs text-emerald-800">$0 CLP</span>
                    </div>
                  )}
                </>
              );
            })()}

          {/* Dirección de Envío: En Cobro Pendiente y Solicitud de Devolución cuando la modalidad de entrega es Envío a Domicilio */}
          {(isCobroPendiente || al.category === 'devolucion') &&
            al.deliveryType === 'envio' &&
            (() => {
              const addr = getAlertShippingAddress(al);
              if (!addr) return null;
              return (
                <div className="col-span-2 p-2 bg-blue-50/60 border border-blue-300 rounded-xs space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-blue-950 flex items-center gap-1 border-b border-blue-200 pb-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>Dirección de Envío:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <div>
                      <span className="text-gray-500 font-bold">Región: </span>
                      <strong className="text-gray-900">{addr.region}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold">Comuna: </span>
                      <strong className="text-gray-900">{addr.comuna}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold">Calle: </span>
                      <strong className="text-gray-900">{addr.street}</strong>
                    </div>
                    {addr.number && (
                      <div>
                        <span className="text-gray-500 font-bold">Número: </span>
                        <strong className="text-gray-900 font-mono">{addr.number}</strong>
                      </div>
                    )}
                    {addr.apartment && (
                      <div className="sm:col-span-2">
                        <span className="text-gray-500 font-bold">
                          Departamento / Oficina / Casa:{' '}
                        </span>
                        <strong className="text-gray-900">{addr.apartment}</strong>
                      </div>
                    )}
                    {addr.postalCode && (
                      <div>
                        <span className="text-gray-500 font-bold">Código Postal: </span>
                        <strong className="text-gray-900 font-mono">{addr.postalCode}</strong>
                      </div>
                    )}
                    {addr.notes && (
                      <div className="sm:col-span-2 pt-0.5 border-t border-blue-200/70">
                        <span className="text-gray-500 font-bold">Indicaciones: </span>
                        <span className="font-semibold text-gray-800">{addr.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* Orden N°: Oculto en Atención al Cliente */}
          {al.orderNumber && al.category !== 'atencion_cliente' && (
            <div>
              <span className="text-gray-500 font-bold block">Orden N°:</span>
              <span className="font-mono font-bold text-blue-900 mt-0.5 block">
                #{al.orderNumber}
              </span>
            </div>
          )}

          {/* Monto Asociado: Oculto en Atención al Cliente y en Solicitud de Productos Personalizado */}
          {(al.amount ?? 0) > 0 &&
            al.category !== 'atencion_cliente' &&
            al.category !== 'producto_personalizado' && (
              <div>
                <span className="text-gray-500 font-bold block">Monto Asociado:</span>
                <span className="font-mono font-black text-rose-800 mt-0.5 block">
                  ${(al.amount ?? 0).toLocaleString('es-CL')} CLP
                </span>
              </div>
            )}

          {/* Plazo / Expiración */}
          {al.timeLimitText &&
            al.category !== 'atencion_cliente' &&
            al.category !== 'producto_agotado' &&
            al.category !== 'devolucion' &&
            al.category !== 'producto_personalizado' && (
              <div>
                <span className="text-gray-500 font-bold block">Plazo / Expiración:</span>
                <span className="font-mono font-bold text-red-700 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-red-600 shrink-0" />
                  {al.timeLimitText}
                </span>
              </div>
            )}
        </div>

        {/* SECCIÓN DE PRODUCTOS CLICKEABLES: COBRO PENDIENTE Y SOLICITUD DE DEVOLUCIÓN */}
        {(isCobroPendiente || al.category === 'devolucion') && (
          <div
            className={`p-2.5 border-2 rounded-xs space-y-2 mt-2 shadow-2xs ${
              isCobroPendiente
                ? 'bg-rose-50/80 border-rose-300'
                : 'bg-amber-50/80 border-amber-300'
            }`}
          >
            <div
              className={`flex flex-wrap items-center justify-between gap-1 text-[11px] font-black uppercase tracking-wide border-b pb-1 ${
                isCobroPendiente
                  ? 'text-rose-950 border-rose-200'
                  : 'text-amber-950 border-amber-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShoppingBag
                  className={`w-4 h-4 ${isCobroPendiente ? 'text-rose-700' : 'text-amber-700'}`}
                />
                <span>
                  {isCobroPendiente
                    ? `Detalles del Producto / Prendas por Pagar (${productsList.length}):`
                    : `Productos Solicitados para Devolución (${productsList.length}):`}
                </span>
              </span>
              <span
                className={`font-mono font-black text-xs ${
                  isCobroPendiente ? 'text-rose-900' : 'text-amber-900'
                }`}
              >
                {isCobroPendiente && al.deliveryType === 'envio' ? (
                  (() => {
                    const pendingInfo = getAlertPendingPaymentLogistics(al);
                    return `Prendas: $${pendingInfo.productsSubtotalClp.toLocaleString('es-CL')} + Envío (${pendingInfo.courierName}): $${pendingInfo.shippingCostClp.toLocaleString('es-CL')} = $${pendingInfo.totalWithShippingClp.toLocaleString('es-CL')} CLP`;
                  })()
                ) : (
                  <>Total: ${(al.amount || 0).toLocaleString('es-CL')} CLP</>
                )}
              </span>
            </div>

            {/* Encabezados de columnas estructuradas: Foto, Nombre, Unidades, Precio */}
            <div
              className={`hidden sm:grid sm:grid-cols-12 gap-2 px-2 py-1 border rounded-xs text-[9px] font-black uppercase tracking-wider ${
                isCobroPendiente
                  ? 'bg-rose-100/70 border-rose-200 text-rose-900'
                  : 'bg-amber-100/70 border-amber-200 text-amber-900'
              }`}
            >
              <div className="col-span-2 text-center">Foto</div>
              <div className="col-span-5">Nombre</div>
              <div className="col-span-2 text-center">Unidades</div>
              <div className="col-span-3 text-right">Precio</div>
            </div>

            {/* Filas clickeables para abrir ventanita con todos los detalles y múltiples imágenes */}
            <div className="space-y-1.5">
              {productsList.map((prod, pIdx) => {
                const prodImg =
                  prod.image ||
                  INITIAL_PRODUCTS[pIdx % INITIAL_PRODUCTS.length]?.images[0] ||
                  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800';
                const imgCount = prod.images && prod.images.length > 0 ? prod.images.length : 1;
                const qty = prod.quantity && prod.quantity > 0 ? prod.quantity : 1;
                const unitPrice =
                  prod.price ||
                  (al.amount ? Math.round(al.amount / (productsList.length || 1)) : 38990);
                const subtotal = unitPrice * qty;

                return (
                  <div
                    key={pIdx}
                    onClick={() =>
                      setProductDetailModal({
                        alert: al,
                        product: prod,
                        activeImageIndex: 0
                      })
                    }
                    title="Haz clic para abrir la ventana con todos los detalles del producto y sus imágenes subidas"
                    className={`p-2 bg-white border rounded-xs shadow-2xs transition-all cursor-pointer group ${
                      isCobroPendiente
                        ? 'border-rose-200 hover:border-rose-600 hover:bg-rose-50/40'
                        : 'border-amber-200 hover:border-amber-600 hover:bg-amber-50/40'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* 1. FOTO */}
                      <div className="col-span-3 sm:col-span-2 flex flex-col items-center justify-center">
                        <span className="sm:hidden text-[8px] font-black uppercase text-gray-500 mb-0.5">
                          Foto
                        </span>
                        <div className="relative w-12 h-12 rounded-xs border-2 border-[#7f9db9] group-hover:border-blue-700 overflow-hidden bg-gray-100 shadow-2xs shrink-0">
                          <img
                            src={prodImg}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                INITIAL_PRODUCTS[0]?.images[0] ||
                                'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800';
                            }}
                          />
                          {imgCount > 1 && (
                            <span
                              style={{ color: '#ffffff' }}
                              className="absolute bottom-0 right-0 bg-black/80 !text-white text-[8px] font-mono font-bold px-1 leading-tight"
                            >
                              +{imgCount} fotos
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2. NOMBRE */}
                      <div className="col-span-9 sm:col-span-5 min-w-0">
                        <span className="sm:hidden text-[8px] font-black uppercase text-gray-500 block">
                          Nombre
                        </span>
                        <span
                          className="font-black text-xs text-[#003c74] group-hover:underline block truncate leading-tight"
                          title={prod.name}
                        >
                          {prod.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-1 mt-1 text-[9px]">
                          {prod.size && (
                            <span className="bg-gray-100 text-gray-800 font-mono font-bold px-1.5 py-0.2 rounded-2xs border border-gray-300">
                              {prod.size}
                            </span>
                          )}
                          {prod.sku && (
                            <span className="text-gray-500 font-mono">SKU: {prod.sku}</span>
                          )}
                        </div>
                        <span className="text-[9px] text-blue-700 font-bold inline-flex items-center gap-1 mt-0.5 group-hover:underline">
                          <Eye className="w-2.5 h-2.5" />
                          <span>
                            Ver detalles y {imgCount} {imgCount === 1 ? 'imagen' : 'imágenes'}
                          </span>
                        </span>
                      </div>

                      {/* 3. UNIDADES */}
                      <div className="col-span-6 sm:col-span-2 flex flex-col justify-center items-center bg-gray-50 p-1 rounded-xs border border-gray-200">
                        <span className="text-[8px] sm:hidden font-black uppercase text-gray-500 mb-0.5">
                          Unidades
                        </span>
                        <span className="font-mono font-black text-xs text-rose-950">
                          {qty} {qty === 1 ? 'unidad' : 'unidades'}
                        </span>
                        <span className="hidden sm:block text-[8px] text-gray-500 font-bold uppercase">
                          Unidades
                        </span>
                      </div>

                      {/* 4. PRECIO */}
                      <div
                        className={`col-span-6 sm:col-span-3 flex flex-col justify-center sm:items-end items-center p-1 rounded-xs border ${
                          isCobroPendiente
                            ? 'bg-rose-50/60 border-rose-200'
                            : 'bg-amber-50/60 border-amber-200'
                        }`}
                      >
                        <span className="text-[8px] sm:hidden font-black uppercase text-rose-800 mb-0.5">
                          Precio
                        </span>
                        <span className="font-mono font-black text-xs text-rose-900">
                          ${subtotal.toLocaleString('es-CL')} CLP
                        </span>
                        {qty > 1 && (
                          <span className="text-[8px] text-gray-500 font-mono">
                            (${unitPrice.toLocaleString('es-CL')} c/u)
                          </span>
                        )}
                        <span className="hidden sm:block text-[8px] text-rose-800 font-bold uppercase">
                          Precio
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Producto en solicitud de otras categorías (Agotado / Personalizado) */}
        {!isCobroPendiente &&
          al.category !== 'atencion_cliente' &&
          al.category !== 'devolucion' &&
          (al.productName || al.productImage || al.products?.[0]?.image) &&
          (al.category === 'producto_agotado' ? (
            (() => {
              const soldOutImage = al.productImage || al.products?.[0]?.image || '';
              const soldOutSku = al.productSku || al.products?.[0]?.sku || '';
              return (
                <Link
                  to={getAlertProductLink(al)}
                  className="p-2 bg-purple-50/50 hover:bg-purple-100/80 border border-purple-300 hover:border-purple-600 rounded-xs text-[11px] flex items-center justify-between gap-2.5 shadow-2xs transition-all cursor-pointer group"
                  title="Haz clic para ver la página de detalle de este producto agotado"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {soldOutImage ? (
                      <img
                        src={soldOutImage}
                        alt={al.productName || 'Prenda'}
                        className="w-11 h-11 object-cover rounded-xs border border-purple-400 bg-white shrink-0 group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            INITIAL_PRODUCTS[0]?.images[0] ||
                            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800';
                        }}
                      />
                    ) : (
                      <div className="w-11 h-11 bg-purple-100 border border-purple-300 rounded-xs flex items-center justify-center shrink-0 text-purple-600">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[8px] text-purple-800 font-bold uppercase block leading-none">
                        Prenda Agotada Solicitada (Clic para ver detalle):
                      </span>
                      <strong className="text-[#003c74] group-hover:underline block truncate text-xs mt-0.5">
                        {al.productName}
                      </strong>
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-gray-600 mt-0.5">
                        {al.sizeRequested && (
                          <span className="bg-white border border-purple-300 px-1.5 py-0.2 rounded-2xs font-mono font-bold text-gray-800">
                            {al.sizeRequested}
                          </span>
                        )}
                        {soldOutSku && (
                          <span className="font-mono text-gray-600">SKU: {soldOutSku}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {al.amount && (
                    <div className="text-right shrink-0">
                      <span className="text-[8px] text-gray-500 uppercase block font-bold">
                        Valor Ref.
                      </span>
                      <span className="font-mono font-black text-rose-900 text-xs block">
                        ${al.amount.toLocaleString('es-CL')} CLP
                      </span>
                      <span className="text-[9px] font-bold text-purple-800 group-hover:underline block mt-0.5">
                        Ver producto →
                      </span>
                    </div>
                  )}
                </Link>
              );
            })()
          ) : al.category === 'producto_personalizado' ? (
            (() => {
              const refPhotos = getAlertReferencePhotos(al);
              return (
                <div className="p-2.5 bg-emerald-50/70 border-2 border-emerald-300 rounded-xs space-y-2 mt-1.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-1.5">
                    <div>
                      <span className="text-[9px] text-emerald-900 font-black uppercase block leading-none">
                        Prenda / Encargo a Medida Solicitado:
                      </span>
                      <strong className="text-gray-950 block text-xs mt-0.5">
                        {al.productName}
                      </strong>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
                      {al.productSku && (
                        <span className="font-mono text-gray-600 bg-white px-1.5 py-0.2 rounded-2xs border border-gray-300">
                          SKU: {al.productSku}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fotos de Referencia enviadas por el cliente (Máximo 10) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-950 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        <span>
                          Fotos de Referencia Enviadas ({refPhotos.length} / máx. 10):
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setReferencePhotosModal({
                            alert: al,
                            photos: refPhotos,
                            activeIndex: 0
                          })
                        }
                        className="text-[10px] font-bold text-blue-800 hover:text-blue-950 underline cursor-pointer"
                      >
                        Ampliar galería ({refPhotos.length})
                      </button>
                    </div>

                    <div className="interest-notif-ref-grid grid grid-cols-5 gap-1.5">
                      {refPhotos.map((photoUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setReferencePhotosModal({
                              alert: al,
                              photos: refPhotos,
                              activeIndex: idx
                            })
                          }
                          title={`Ver foto de referencia #${idx + 1} de ${refPhotos.length}`}
                          className="relative aspect-square rounded-xs overflow-hidden border-2 border-emerald-400 hover:border-blue-700 bg-white shadow-2xs group cursor-pointer transition-all"
                        >
                          <img
                            src={photoUrl}
                            alt={`Referencia ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                INITIAL_PRODUCTS[0]?.images[0] ||
                                'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800';
                            }}
                          />
                          <span
                            style={{ color: '#ffffff' }}
                            className="absolute bottom-0 right-0 bg-black/80 !text-white text-[8px] font-mono font-bold px-1 leading-tight"
                          >
                            #{idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="p-2 bg-gray-50 border border-gray-300 rounded-xs text-[11px] flex items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {al.productImage ? (
                  <img
                    src={al.productImage}
                    alt={al.productName || 'Prenda'}
                    className="w-11 h-11 object-cover rounded-xs border border-gray-400 bg-white shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        INITIAL_PRODUCTS[0]?.images[0] ||
                        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800';
                    }}
                  />
                ) : (
                  <div className="w-11 h-11 bg-gray-200 border border-gray-300 rounded-xs flex items-center justify-center shrink-0 text-gray-500">
                    <Package className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[8px] text-gray-500 font-bold uppercase block leading-none">
                    Prenda Asociada:
                  </span>
                  <strong className="text-gray-900 block truncate text-xs mt-0.5">
                    {al.productName}
                  </strong>
                  <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-gray-600 mt-0.5">
                    {al.sizeRequested && (
                      <span className="bg-white border border-gray-300 px-1.5 py-0.2 rounded-2xs font-mono font-bold text-gray-800">
                        {al.sizeRequested}
                      </span>
                    )}
                    {al.productSku && (
                      <span className="font-mono text-gray-500">SKU: {al.productSku}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

        {/* Nota de resolución previa para otras categorías */}
        {(isResolved ||
          al.returnReviewStatus === 'approved' ||
          al.returnReviewStatus === 'rejected') &&
          al.replyNote &&
          !isCobroPendiente && (
            <div
              className={`p-1.5 border text-[10px] rounded-xs shadow-2xs ${
                al.returnReviewStatus === 'rejected'
                  ? 'bg-red-50 border-red-300 text-red-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <strong>Gestión / Auditoría:</strong> {al.replyNote}
            </div>
          )}
      </div>

      {/* BOTONES DE ACCIÓN */}
      {isCobroPendiente ? (
        <div className="pt-2 border-t border-rose-200 mt-2 bg-rose-50/40 -mx-3 -mb-3 p-2.5 rounded-b-xs">
          {!isResolved ? (
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <button
                type="button"
                onClick={() => handleOpenAddReportFromAlert(al)}
                className="winxp-button text-xs py-1 px-2.5 text-blue-950 font-black flex items-center gap-1.5 shadow-xs border-blue-700 bg-blue-50 hover:bg-blue-100"
                title="Agregar un reporte a Lista Preferencial o Lista Negra para este cliente en el Administrador de Clientes"
              >
                <Tag className="w-3.5 h-3.5 text-blue-700" />
                <span>Agregar reporte</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDecisionModal({
                      alert: al,
                      action: 'anular',
                      trackingCode: al.trackingCode || ''
                    })
                  }
                  className="winxp-button text-xs py-1 px-3 text-red-950 font-black flex items-center gap-1.5 border-red-700 bg-red-100 hover:bg-red-200 shadow-xs"
                  title="Rechazar venta por no pago y liberar prendas al inventario"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-700" />
                  <span>Pago Anulado</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDecisionModal({
                      alert: al,
                      action: 'confirmar',
                      trackingCode: al.trackingCode || ''
                    })
                  }
                  className="winxp-button winxp-button-primary text-xs py-1 px-3 text-emerald-950 font-black flex items-center gap-1.5 border-emerald-800 bg-emerald-200 hover:bg-emerald-300 shadow-xs"
                  title="Confirmar pago y pasar la venta al estado 'Solicitud recibida' en Órdenes de Compra"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Pago Confirmado</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {getAlertSpecificState(al) === 'pago_anulado' ? (
                  <span className="font-black text-[11px] text-red-900 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-red-700" />
                    <span>Pago Anulado (Stock Liberado)</span>
                  </span>
                ) : (
                  <span className="font-black text-[11px] text-emerald-900 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pago Confirmado</span>
                  </span>
                )}
                {al.trackingCode && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-blue-100 text-blue-950 border border-blue-400 px-2 py-0.5 rounded-xs">
                    <Truck className="w-3 h-3 text-blue-700" />
                    <span>Seguimiento: {al.trackingCode}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddReportFromAlert(al)}
                  className="winxp-button text-xs py-0.5 px-2.5 text-blue-950 font-black flex items-center gap-1.5 shadow-xs border-blue-700 bg-blue-50 hover:bg-blue-100"
                  title="Agregar un reporte a Lista Preferencial o Lista Negra para este cliente en el Administrador de Clientes"
                >
                  <Tag className="w-3.5 h-3.5 text-blue-700" />
                  <span>Agregar reporte</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAlertStatus(al.id)}
                  className="winxp-button text-xs py-0.5 px-2 text-gray-700 font-bold"
                >
                  Reabrir Cobro
                </button>
              </div>
            </div>
          )}
        </div>
      ) : al.category === 'devolucion' ? (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200 mt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenAddReportFromAlert(al)}
              className="winxp-button text-xs py-1 px-2.5 text-blue-950 font-black flex items-center gap-1.5 shadow-xs border-blue-700 bg-blue-50 hover:bg-blue-100"
              title="Agregar un reporte a Lista Preferencial o Lista Negra para este cliente en el Administrador de Clientes"
            >
              <Tag className="w-3.5 h-3.5 text-blue-700" />
              <span>Agregar reporte</span>
            </button>

            {al.returnReviewStatus === 'approved' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-900 bg-emerald-100 border border-emerald-400 px-2 py-0.5 rounded-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>Aprobada por Admin</span>
              </span>
            )}
            {al.returnReviewStatus === 'rejected' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-900 bg-red-100 border border-red-400 px-2 py-0.5 rounded-xs">
                <XCircle className="w-3 h-3 text-red-700" />
                <span>Rechazada por Admin</span>
              </span>
            )}
            {al.trackingCode && al.returnReviewStatus === 'approved' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-blue-100 text-blue-950 border border-blue-400 px-2 py-0.5 rounded-xs">
                <Truck className="w-3 h-3 text-blue-700" />
                <span>Seguimiento: {al.trackingCode}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setReturnReviewModal({
                alert: al,
                decision:
                  al.returnReviewStatus === 'approved'
                    ? 'approved'
                    : al.returnReviewStatus === 'rejected'
                    ? 'rejected'
                    : null,
                rejectionReason: al.rejectionReason || '',
                trackingCode: al.trackingCode || ''
              })
            }
            className="winxp-button winxp-button-primary text-xs py-1 px-3 text-amber-950 font-black flex items-center gap-1.5 border-amber-700 bg-amber-100 hover:bg-amber-200 shadow-xs"
            title="Abrir panel de Revisión de Equipo (Aprobada por Admin / Rechazada por Admin)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
            <span>Revisión de equipo</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200 mt-2">
          <div>
            {(al.category === 'producto_agotado' ||
              al.category === 'producto_personalizado') && (
              <button
                type="button"
                onClick={() => handleOpenAddReportFromAlert(al)}
                className="winxp-button text-xs py-0.5 px-2.5 text-blue-950 font-black flex items-center gap-1.5 shadow-xs border-blue-700 bg-blue-50 hover:bg-blue-100"
                title="Agregar un reporte a Lista Preferencial o Lista Negra para este cliente en el Administrador de Clientes"
              >
                <Tag className="w-3.5 h-3.5 text-blue-700" />
                <span>Agregar reporte</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(al.category === 'atencion_cliente' ||
              al.category === 'producto_agotado' ||
              al.category === 'producto_personalizado') && (
              <button
                type="button"
                onClick={() => setConfirmActionModal({ alert: al, action: 'delete' })}
                className="winxp-button text-xs py-0.5 px-2.5 font-bold flex items-center gap-1.5 text-red-900 border-red-600 bg-red-50 hover:bg-red-100"
                title="Eliminar solicitud permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-700" />
                <span>Eliminar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (
                  al.category === 'atencion_cliente' ||
                  al.category === 'producto_agotado' ||
                  al.category === 'producto_personalizado'
                ) {
                  setConfirmActionModal({ alert: al, action: 'resolve' });
                } else {
                  handleToggleAlertStatus(al.id);
                }
              }}
              className={`winxp-button text-xs py-0.5 px-2.5 font-bold flex items-center gap-1.5 ${
                isResolved
                  ? 'text-gray-700 border-gray-400 hover:bg-gray-100'
                  : 'text-emerald-900 border-emerald-600 bg-emerald-50 hover:bg-emerald-100'
              }`}
              title={isResolved ? 'Reabrir alerta' : 'Marcar como atendida'}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isResolved ? 'Reactivar Alerta' : 'Marcar Resuelta'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};