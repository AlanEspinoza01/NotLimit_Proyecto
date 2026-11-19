import React from 'react';
import {
  Star,
  ShieldAlert,
  Edit3,
  Trash2,
  AlertTriangle,
  History
} from 'lucide-react';
import {
  CustomerRecord,
  BlacklistReport,
  PreferentialReport,
  formatCLP
} from './customerManagerTypes';

export interface CustomerViewReportsModalProps {
  viewReportsCustomer: CustomerRecord | null;
  setViewReportsCustomer: (cust: CustomerRecord | null) => void;
  viewActiveTab: 'preferencial' | 'negra';
  setViewActiveTab: (val: 'preferencial' | 'negra') => void;
  editingReportId: string | null;
  setEditingReportId: (val: string | null) => void;
  editReason: string;
  setEditReason: (val: string) => void;
  editDebt: string;
  setEditDebt: (val: string) => void;
  editBenefit: string;
  setEditBenefit: (val: string) => void;
  editNotes: string;
  setEditNotes: (val: string) => void;
  handleStartEditReport: (
    type: 'preferencial' | 'negra',
    rep: PreferentialReport | BlacklistReport
  ) => void;
  handleSaveEditedReport: (e: React.FormEvent) => void;
  deleteConfirmTarget: {
    type: 'preferencial' | 'negra';
    reportId: string;
    reportIndex?: number;
  } | null;
  setDeleteConfirmTarget: (
    val: {
      type: 'preferencial' | 'negra';
      reportId: string;
      reportIndex?: number;
    } | null
  ) => void;
  handleDeleteReport: (type: 'preferencial' | 'negra', reportId: string) => void;
}

export const CustomerViewReportsModal: React.FC<CustomerViewReportsModalProps> = ({
  viewReportsCustomer,
  setViewReportsCustomer,
  viewActiveTab,
  setViewActiveTab,
  editingReportId,
  setEditingReportId,
  editReason,
  setEditReason,
  editDebt,
  setEditDebt,
  editBenefit,
  setEditBenefit,
  editNotes,
  setEditNotes,
  handleStartEditReport,
  handleSaveEditedReport,
  deleteConfirmTarget,
  setDeleteConfirmTarget,
  handleDeleteReport
}) => {
  return (
    <>
      {/* ========================================================================= */}
      {/* MODAL "VER": REPORTES DE LISTA PREFERENCIAL Y LISTA NEGRA CON EDICIÓN      */}
      {/* ========================================================================= */}
      {viewReportsCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="nl-cust-reports-modal-window w-full max-w-2xl h-[660px] max-h-[660px] bg-white border-4 border-[#003c74] shadow-2xl flex flex-col animate-fadeIn my-auto">
            {/* Cabecera del Modal de Historial */}
            <div className="shrink-0 bg-gradient-to-r from-[#0055ea] to-[#003c74] p-2 px-3 flex items-center justify-between text-white text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <History className="w-4 h-4 shrink-0" />
                <span>
                  REPORTES Y AUDITORÍA // {viewReportsCustomer.nombre} {viewReportsCustomer.apellido}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setViewReportsCustomer(null);
                  setEditingReportId(null);
                }}
                className="w-5 h-5 bg-[#c75050] text-white flex items-center justify-center font-bold shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col p-3.5 space-y-3 text-xs overflow-hidden">
              {/* Ficha Resumen del Cliente y sus Etiquetas (PEGADO A LA IZQUIERDA) */}
              <div className="shrink-0 p-3 bg-[#f8fafc] border border-gray-300 space-y-2 text-left">
                <div className="text-left">
                  <div className="font-black text-sm text-gray-950">
                    {viewReportsCustomer.nombre} {viewReportsCustomer.apellido}
                  </div>
                  <div className="font-mono text-gray-600 text-[11px] mt-0.5">
                    RUT: <strong>{viewReportsCustomer.rut}</strong> // Correo: {viewReportsCustomer.email} // Tel: {viewReportsCustomer.phone}
                  </div>
                </div>

                <div className="text-left pt-1.5 border-t border-gray-200">
                  <span className="text-[10px] text-gray-600 font-black uppercase tracking-wider block mb-1 text-left">
                    Etiquetas Asociadas:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 justify-start text-left">
                    {viewReportsCustomer.etiquetas.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 font-black text-xs border rounded-xs shadow-2xs ${
                          tag === 'Lista Negra'
                            ? 'bg-rose-100 text-rose-900 border-rose-400'
                            : tag === 'Lista Preferencial'
                            ? 'bg-amber-100 text-amber-900 border-amber-400'
                            : 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                      >
                        {tag === 'Lista Negra' && <ShieldAlert className="w-3 h-3 text-rose-600" />}
                        {tag === 'Lista Preferencial' && <Star className="w-3 h-3 text-amber-600 fill-amber-500" />}
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* PESTAÑAS DENTRO DEL MODAL: LISTA PREFERENCIAL Y LISTA NEGRA */}
              <div className="shrink-0 flex items-center border-b-2 border-gray-300 pb-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setViewActiveTab('preferencial');
                      setEditingReportId(null);
                    }}
                    className={`winxp-button text-xs py-1 px-3 font-bold flex items-center gap-1.5 ${
                      viewActiveTab === 'preferencial'
                        ? 'winxp-button-primary text-amber-950 bg-amber-100 border-amber-600'
                        : 'text-gray-600'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
                    <span>Reportes Lista Preferencial ({viewReportsCustomer.preferentialReports.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setViewActiveTab('negra');
                      setEditingReportId(null);
                    }}
                    className={`winxp-button text-xs py-1 px-3 font-bold flex items-center gap-1.5 ${
                      viewActiveTab === 'negra'
                        ? 'winxp-button-primary text-rose-950 bg-rose-100 border-rose-600'
                        : 'text-gray-600'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                    <span>Reportes Lista Negra ({viewReportsCustomer.blacklistReports.length})</span>
                  </button>
                </div>
              </div>

              {/* LISTADO DE REPORTES CON SCROLL INTERNO PARA CONTROLAR LA ALTURA */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                {viewActiveTab === 'preferencial' ? (
                  /* SECCIÓN LISTA PREFERENCIAL */
                  <div className="space-y-3">
                    {viewReportsCustomer.preferentialReports.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 bg-gray-50 border border-gray-200">
                        No hay reconocimientos registrados en la Lista Preferencial para este cliente.
                      </div>
                    ) : (
                      viewReportsCustomer.preferentialReports.map((rep, idx) => {
                        const isEditing = editingReportId === rep.id;

                        return (
                          <div
                            key={rep.id || idx}
                            className="p-3 bg-amber-50/70 border border-amber-300 rounded-xs space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-1 text-[11px] font-mono text-gray-600 border-b border-amber-200 pb-1">
                              <span className="font-bold text-amber-900">
                                Reporte #{idx + 1} • Fecha: {rep.date}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>Registrado por: <strong>{rep.recordedBy}</strong></span>
                                {!isEditing && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditReport('preferencial', rep)}
                                      className="winxp-button text-[10px] py-0.5 px-2 font-bold text-blue-900 flex items-center gap-1 hover:bg-blue-50"
                                      title="Modificar este registro"
                                    >
                                      <Edit3 className="w-3 h-3 text-blue-700" />
                                      <span>Modificar reporte</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDeleteConfirmTarget({
                                          type: 'preferencial',
                                          reportId: rep.id,
                                          reportIndex: idx + 1
                                        })
                                      }
                                      className="winxp-button text-[10px] py-0.5 px-2 font-bold text-red-900 border-red-300 bg-red-50 hover:bg-red-100 flex items-center gap-1"
                                      title="Eliminar este reporte"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-700" />
                                      <span>Eliminar Reporte</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* FORMULARIO DE MODIFICACIÓN INLINE */}
                            {isEditing ? (
                              <form onSubmit={handleSaveEditedReport} className="space-y-2.5 pt-1 bg-white p-2.5 border border-amber-300 rounded-xs">
                                <div className="font-black text-amber-950 text-xs flex items-center gap-1">
                                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Modificando Reporte de Lista Preferencial #{idx + 1}:</span>
                                </div>

                                <div className="space-y-1">
                                  <label className="font-bold text-gray-800 block text-[11px]">
                                    Motivo / Causa:
                                  </label>
                                  <textarea
                                    rows={2}
                                    required
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    className="w-full winxp-input text-xs p-1.5 bg-white border border-[#7f9db9]"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="font-bold text-gray-800 block text-[11px]">
                                      Beneficio Otorgado:
                                    </label>
                                    <input
                                      type="text"
                                      value={editBenefit}
                                      onChange={(e) => setEditBenefit(e.target.value)}
                                      className="w-full winxp-input text-xs py-1"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="font-bold text-gray-800 block text-[11px]">
                                      Observaciones:
                                    </label>
                                    <input
                                      type="text"
                                      value={editNotes}
                                      onChange={(e) => setEditNotes(e.target.value)}
                                      className="w-full winxp-input text-xs py-1"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-gray-200">
                                  {/* Botón requerido: Eliminar Reporte */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteConfirmTarget({
                                        type: 'preferencial',
                                        reportId: rep.id,
                                        reportIndex: idx + 1
                                      })
                                    }
                                    className="winxp-button text-xs py-1 px-3 text-red-950 font-black flex items-center gap-1.5 border-red-700 bg-red-100 hover:bg-red-200 shadow-xs"
                                    title="Eliminar este reporte permanentemente"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-700" />
                                    <span>Eliminar Reporte</span>
                                  </button>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setEditingReportId(null)}
                                      className="winxp-button text-[11px] py-0.5 px-2.5 font-semibold text-gray-700"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="submit"
                                      className="winxp-button winxp-button-primary text-[11px] py-0.5 px-3 font-bold text-white bg-amber-700"
                                    >
                                      Guardar Cambios
                                    </button>
                                  </div>
                                </div>
                              </form>
                            ) : (
                              /* VISTA DE LECTURA DEL REPORTE */
                              <>
                                <div className="text-gray-900 font-bold leading-snug">
                                  {rep.reason}
                                </div>

                                {rep.benefit && (
                                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 border border-amber-400 rounded-2xs">
                                    <span>⭐ Beneficio Otorgado:</span>
                                    <span>{rep.benefit}</span>
                                  </div>
                                )}

                                {rep.notes && (
                                  <div className="text-[11px] text-gray-600 bg-white p-2 border border-amber-200 rounded-2xs">
                                    <strong>Observación:</strong> {rep.notes}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  /* SECCIÓN LISTA NEGRA */
                  <div className="space-y-3">
                    {viewReportsCustomer.blacklistReports.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 bg-gray-50 border border-gray-200">
                        No hay registros de mal comportamiento o deudas en Lista Negra para este cliente.
                      </div>
                    ) : (
                      viewReportsCustomer.blacklistReports.map((rep, idx) => {
                        const isEditing = editingReportId === rep.id;

                        return (
                          <div
                            key={rep.id || idx}
                            className="p-3 bg-rose-50/70 border border-rose-300 rounded-xs space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-1 text-[11px] font-mono text-gray-600 border-b border-rose-200 pb-1">
                              <span className="font-bold text-rose-900">
                                Incidencia #{idx + 1} • Fecha: {rep.date}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>Registrado por: <strong>{rep.recordedBy}</strong></span>
                                {!isEditing && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditReport('negra', rep)}
                                      className="winxp-button text-[10px] py-0.5 px-2 font-bold text-rose-900 flex items-center gap-1 hover:bg-rose-100"
                                      title="Modificar este registro"
                                    >
                                      <Edit3 className="w-3 h-3 text-rose-700" />
                                      <span>Modificar reporte</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDeleteConfirmTarget({
                                          type: 'negra',
                                          reportId: rep.id,
                                          reportIndex: idx + 1
                                        })
                                      }
                                      className="winxp-button text-[10px] py-0.5 px-2 font-bold text-red-900 border-red-300 bg-red-50 hover:bg-red-100 flex items-center gap-1"
                                      title="Eliminar este reporte"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-700" />
                                      <span>Eliminar Reporte</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* FORMULARIO DE MODIFICACIÓN INLINE */}
                            {isEditing ? (
                              <form onSubmit={handleSaveEditedReport} className="space-y-2.5 pt-1 bg-white p-2.5 border border-rose-300 rounded-xs">
                                <div className="font-black text-rose-950 text-xs flex items-center gap-1">
                                  <Edit3 className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Modificando Reporte de Lista Negra #{idx + 1}:</span>
                                </div>

                                <div className="space-y-1">
                                  <label className="font-bold text-gray-800 block text-[11px]">
                                    Motivo / Causa del Mal Comportamiento:
                                  </label>
                                  <textarea
                                    rows={2}
                                    required
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    className="w-full winxp-input text-xs p-1.5 bg-white border border-[#7f9db9]"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="font-bold text-gray-800 block text-[11px]">
                                      Deuda Impaga ($ CLP):
                                    </label>
                                    <input
                                      type="text"
                                      value={editDebt}
                                      onChange={(e) => {
                                        const num = e.target.value.replace(/[^0-9]/g, '');
                                        setEditDebt(num ? parseInt(num, 10).toLocaleString('es-CL') : '');
                                      }}
                                      className="w-full winxp-input text-xs py-1 font-bold text-rose-900"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="font-bold text-gray-800 block text-[11px]">
                                      Instrucción / Observación:
                                    </label>
                                    <input
                                      type="text"
                                      value={editNotes}
                                      onChange={(e) => setEditNotes(e.target.value)}
                                      className="w-full winxp-input text-xs py-1"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-gray-200">
                                  {/* Botón requerido: Eliminar Reporte */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteConfirmTarget({
                                        type: 'negra',
                                        reportId: rep.id,
                                        reportIndex: idx + 1
                                      })
                                    }
                                    className="winxp-button text-xs py-1 px-3 text-red-950 font-black flex items-center gap-1.5 border-red-700 bg-red-100 hover:bg-red-200 shadow-xs"
                                    title="Eliminar este reporte permanentemente"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-700" />
                                    <span>Eliminar Reporte</span>
                                  </button>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setEditingReportId(null)}
                                      className="winxp-button text-[11px] py-0.5 px-2.5 font-semibold text-gray-700"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="submit"
                                      className="winxp-button winxp-button-primary text-[11px] py-0.5 px-3 font-bold text-white bg-rose-700"
                                    >
                                      Guardar Cambios
                                    </button>
                                  </div>
                                </div>
                              </form>
                            ) : (
                              /* VISTA DE LECTURA DEL REPORTE */
                              <>
                                <div className="text-gray-900 font-bold leading-snug">
                                  {rep.reason}
                                </div>

                                {rep.debtAmount !== undefined && rep.debtAmount > 0 ? (
                                  <div className="inline-flex items-center gap-1 text-[11px] font-black text-rose-900 bg-rose-200/80 px-2 py-0.5 border border-rose-400 rounded-2xs">
                                    <span>⚠️ Deuda Impaga Registrada:</span>
                                    <span>{formatCLP(rep.debtAmount)} CLP</span>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-gray-500 italic">
                                    Sin deuda monetaria registrada en esta incidencia.
                                  </div>
                                )}

                                {rep.notes && (
                                  <div className="text-[11px] text-gray-600 bg-white p-2 border border-rose-200 rounded-2xs">
                                    <strong>Instrucción / Observación:</strong> {rep.notes}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Botón de Cierre Fijo al Pie del Modal */}
              <div className="shrink-0 pt-2 border-t border-gray-300 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setViewReportsCustomer(null);
                    setEditingReportId(null);
                  }}
                  className="winxp-button text-xs py-1 px-4 font-bold text-gray-700"
                >
                  Cerrar Historial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VENTANITA DE CONFIRMACIÓN: "¿ESTÁS SEGURO?" PARA ELIMINAR REPORTE         */}
      {/* ========================================================================= */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
          <div className="nl-cust-modal-window w-full max-w-md bg-[#ece9d8] border-2 border-[#0055ea] shadow-2xl animate-fadeIn">
            {/* Barra de Título Windows XP */}
            <div className="bg-gradient-to-r from-[#0055ea] to-[#003c74] p-1.5 px-3 flex items-center justify-between text-white text-xs font-bold select-none">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Confirmar Eliminación // ¿Estás seguro?</span>
              </span>
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="w-5 h-5 bg-[#c75050] hover:bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="flex items-start gap-3 bg-white p-3 border border-gray-300 shadow-2xs">
                <div className="p-2 bg-amber-100 rounded-full text-amber-700 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-gray-950 text-sm">
                    ¿Estás seguro de que deseas eliminar este reporte?
                  </p>
                  <p className="text-gray-700 text-xs leading-relaxed">
                    Estás a punto de eliminar de forma permanente el{' '}
                    <strong>
                      {deleteConfirmTarget.type === 'preferencial'
                        ? 'Reporte de Lista Preferencial'
                        : 'Reporte de Lista Negra'}
                      {deleteConfirmTarget.reportIndex ? ` #${deleteConfirmTarget.reportIndex}` : ''}
                    </strong>
                    {viewReportsCustomer && (
                      <> del cliente <strong>{viewReportsCustomer.nombre} {viewReportsCustomer.apellido}</strong></>
                    )}
                    . Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="winxp-button text-xs py-1.5 px-4 font-bold text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteReport(deleteConfirmTarget.type, deleteConfirmTarget.reportId)}
                  className="winxp-button text-xs py-1.5 px-4 font-bold text-white bg-red-700 hover:bg-red-800 border-red-900 shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sí, Eliminar Reporte</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
