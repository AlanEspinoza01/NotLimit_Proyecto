import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import {
  SystemAlert,
  DecisionModalState,
  ConfirmActionModalState,
  ProductDetailModalState,
  ReturnReviewModalState,
  ReferencePhotosModalState
} from './interestNotificationTypes';
import { NotificationAlertCard } from './NotificationAlertCard';

export interface NotificationAlertGridProps {
  filteredAlerts: SystemAlert[];
  expandedDescriptions: Record<string, boolean>;
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

export const NotificationAlertGrid: React.FC<NotificationAlertGridProps> = ({
  filteredAlerts,
  expandedDescriptions,
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
  return (
    <>
      {/* Listado Principal de Alertas Automatizadas */}
      {filteredAlerts.length === 0 ? (
        <div className="p-8 bg-white border border-gray-300 text-center text-gray-500 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <p className="font-bold text-sm text-gray-800">
            No hay alertas activas en esta sección con los filtros seleccionados.
          </p>
          <p className="text-xs text-gray-500">
            Todas las notificaciones automatizadas se encuentran al día y sin pendientes críticos.
          </p>
        </div>
      ) : (
        <div className="interest-notif-alerts-grid grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAlerts.map((al) => (
            <NotificationAlertCard
              key={al.id}
              alertItem={al}
              isExpanded={!!expandedDescriptions[al.id]}
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
          ))}
        </div>
      )}

      {/* Guía Operativa para Super Admin con el nuevo esquema */}
      <div className="p-3 bg-amber-50 border border-amber-300 flex items-start gap-2.5 shadow-xs rounded-xs">
        <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
        <div className="text-[11px] text-amber-950 space-y-1">
          <strong className="block font-bold">
            Esquema Definitivo de Alertas Automatizadas Super Admin:
          </strong>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 pt-0.5 text-[10px]">
            <p>
              • <strong>Cobro Pendiente:</strong> Visualiza el correo y las prendas pendientes. Permite validar con{' '}
              <strong>"Pago Confirmado"</strong> (pasando la orden a <em>"Solicitud recibida"</em> en Órdenes de Compra) o{' '}
              <strong>"Pago Anulado"</strong> (rechazando la orden y liberando el stock).
            </p>
            <p>
              • <strong>Atención al Cliente:</strong> Notificaciones directas de mensajes, dudas prioritarias sobre envíos express y cambios de dirección.
            </p>
            <p>
              • <strong>Solicitud de Producto Agotado:</strong> Lista de espera automatizada para notificar reposiciones exclusivas y Drops a clientes interesados.
            </p>
            <p>
              • <strong>Solicitud de Devolución:</strong> Gestión de garantías y cambios de talla con coordinación presencial en sucursales o Starken.
            </p>
            <p className="md:col-span-2">
              • <strong>Solicitud de Productos Personalizado:</strong> Encargos a medida, confección Y2K y pedidos especiales con cotización técnica directa.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
