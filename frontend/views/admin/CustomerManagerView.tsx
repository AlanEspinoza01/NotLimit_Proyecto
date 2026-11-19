import React, { useState, useMemo, useEffect } from 'react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import api from '../../api/axios';
import {
  CustomerTag,
  BlacklistReport,
  PreferentialReport,
  CustomerRecord,
  STORAGE_CUSTOMERS_KEY,
  formatCLP,
  normalizeCustomer,
  INITIAL_CUSTOMERS
} from '../../components/admin/customers/customerManagerTypes';
import { CustomerHeaderAndTabs } from '../../components/admin/customers/CustomerHeaderAndTabs';
import { CustomerDirectoryTable } from '../../components/admin/customers/CustomerDirectoryTable';
import { CustomerEditPointsModal } from '../../components/admin/customers/CustomerEditPointsModal';
import { CustomerAddReportModal } from '../../components/admin/customers/CustomerAddReportModal';
import { CustomerViewReportsModal } from '../../components/admin/customers/CustomerViewReportsModal';
import '../../components/admin/customers/CustomerManagerView.css';

export type {
  CustomerTag,
  BlacklistReport,
  PreferentialReport,
  CustomerRecord
};

export {
  STORAGE_CUSTOMERS_KEY,
  formatCLP,
  normalizeCustomer,
  INITIAL_CUSTOMERS
};

// Convertir un documento IUser de MongoDB al formato CustomerRecord del frontend
const mapUserDocToCustomerRecord = (doc: any): CustomerRecord => {
  const rawName = String(doc.name || '').trim();
  const nameParts = rawName ? rawName.split(' ') : [];

  const firstName = doc.firstName || doc.nombre || nameParts[0] || 'Cliente';
  const lastName =
    doc.lastName || doc.apellido || nameParts.slice(1).join(' ') || '';

  const rawTags: string[] = Array.isArray(doc.tags)
    ? doc.tags
    : Array.isArray(doc.etiquetas)
    ? doc.etiquetas
    : ['Normal'];

  const prefReports: PreferentialReport[] = Array.isArray(doc.preferentialReports)
    ? doc.preferentialReports.map((r: any) => ({
        id: r.id || `pref_rep_${Date.now()}`,
        date:
          typeof r.date === 'string'
            ? r.date
            : new Date(r.date || Date.now()).toLocaleString('es-CL'),
        reason: r.reason || '',
        benefit: r.benefit || undefined,
        notes: r.notes || undefined,
        recordedBy: r.recordedBy || 'Super Admin'
      }))
    : [];

  const blReports: BlacklistReport[] = Array.isArray(doc.blacklistReports)
    ? doc.blacklistReports.map((r: any) => ({
        id: r.id || `bl_rep_${Date.now()}`,
        date:
          typeof r.date === 'string'
            ? r.date
            : new Date(r.date || Date.now()).toLocaleString('es-CL'),
        reason: r.reason || '',
        debtAmount:
          r.debtAmount !== undefined && Number(r.debtAmount) > 0
            ? Number(r.debtAmount)
            : undefined,
        notes: r.notes || undefined,
        recordedBy: r.recordedBy || 'Super Admin'
      }))
    : [];

  return normalizeCustomer({
    id: doc._id?.toString() || doc.id || `cust_${Date.now()}`,
    nombre: firstName,
    apellido: lastName,
    rut: doc.rut || 'Sin RUT',
    email: doc.email || '',
    phone: doc.phone || '+56 9 0000 0000',
    compras: Number(doc.totalOrdersCount ?? doc.compras) || 0,
    puntosClub: Number(doc.loyaltyPoints ?? doc.puntosClub) || 0,
    totalGastado: Number(doc.totalSpentClp ?? doc.totalGastado) || 0,
    etiquetas: rawTags as CustomerTag[],
    fechaRegistro: doc.createdAt
      ? new Date(doc.createdAt).toISOString().split('T')[0]
      : doc.fechaRegistro || new Date().toISOString().split('T')[0],
    preferentialReports: prefReports,
    blacklistReports: blReports
  });
};

export const CustomerManagerView: React.FC = () => {
  // --- Estado de Clientes conectado a MongoDB ---
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeCustomer);
        }
      }
    } catch (e) {
      console.warn('Error reading customers from localStorage:', e);
    }
    return INITIAL_CUSTOMERS;
  });

  // Sincronizar con localStorage para mantener compatibilidad con PageEditorView
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(customers));
    } catch (e) {
      console.error('Error saving customers to localStorage:', e);
    }
  }, [customers]);

  // --- Vista Activa / Navegación por Pestañas de Etiquetas ---
  const [activeTab, setActiveTab] = useState<'todos' | 'preferencial' | 'negra' | 'mixtos'>('todos');

  // --- Filtros y Búsqueda ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('todos');

  // --- Notificación de Feedback ---
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- Descargar clientes reales desde MongoDB (y sembrar iniciales si no hay ninguno registrado) ---
  useEffect(() => {
    const fetchAndSyncCustomers = async () => {
      try {
        const response = await api.get('/admin/customers');
        const dbUsers: any[] = response.data?.data || [];

        if (dbUsers.length === 0 && INITIAL_CUSTOMERS.length > 0) {
          // Sembrar clientes iniciales en MongoDB para poblar la colección 'users' (role: 'registered')
          const seededList: CustomerRecord[] = [];
          for (const initCust of INITIAL_CUSTOMERS) {
            try {
              const createRes = await api.post('/admin/customers', {
                firstName: initCust.nombre,
                lastName: initCust.apellido,
                rut: initCust.rut,
                email: initCust.email,
                phone: initCust.phone,
                loyaltyPoints: initCust.puntosClub,
                tags: initCust.etiquetas,
                totalOrdersCount: initCust.compras,
                totalSpentClp: initCust.totalGastado,
                preferentialReports: initCust.preferentialReports,
                blacklistReports: initCust.blacklistReports
              });
              if (createRes.data?.data) {
                seededList.push(mapUserDocToCustomerRecord(createRes.data.data));
              }
            } catch (seedErr) {
              console.warn('Aviso sembrando cliente inicial:', seedErr);
            }
          }
          if (seededList.length > 0) {
            setCustomers(seededList);
          }
        } else if (dbUsers.length > 0) {
          const mapped = dbUsers.map(mapUserDocToCustomerRecord);
          setCustomers(mapped);
        }
      } catch (error) {
        console.error('Error cargando clientes desde MongoDB:', error);
      }
    };

    fetchAndSyncCustomers();
  }, []);

  // Función auxiliar para persistir cambios de un cliente en MongoDB
  const syncCustomerToMongoDB = async (
    customerId: string,
    patch: {
      puntosClub?: number;
      lastPointsReason?: string;
      etiquetas?: CustomerTag[];
      preferentialReports?: PreferentialReport[];
      blacklistReports?: BlacklistReport[];
    }
  ) => {
    await api.put(`/admin/customers/${customerId}`, {
      loyaltyPoints: patch.puntosClub,
      lastPointsReason: patch.lastPointsReason,
      tags: patch.etiquetas,
      preferentialReports: patch.preferentialReports,
      blacklistReports: patch.blacklistReports
    });
  };

  // --- Modal: Editar Puntos Club ---
  const [editingPointsCustomer, setEditingPointsCustomer] = useState<CustomerRecord | null>(null);
  const [newPointsValue, setNewPointsValue] = useState<number>(0);
  const [pointsReason, setPointsReason] = useState<string>('');

  // --- Modal: AGREGAR REPORTE (Lista Preferencial o Lista Negra) ---
  const [addReportCustomer, setAddReportCustomer] = useState<CustomerRecord | null>(null);
  const [reportTargetType, setReportTargetType] = useState<'preferencial' | 'negra'>('preferencial');
  const [reportReason, setReportReason] = useState('');
  const [reportDebtAmount, setReportDebtAmount] = useState('');
  const [reportBenefit, setReportBenefit] = useState('');
  const [reportNotes, setReportNotes] = useState('');

  // --- Modal: "VER" REPORTES ---
  const [viewReportsCustomer, setViewReportsCustomer] = useState<CustomerRecord | null>(null);
  const [viewActiveTab, setViewActiveTab] = useState<'preferencial' | 'negra'>('preferencial');

  // --- Estado para Modificar un Reporte Específico ---
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingReportType, setEditingReportType] = useState<'preferencial' | 'negra'>('preferencial');
  const [editReason, setEditReason] = useState('');
  const [editDebt, setEditDebt] = useState('');
  const [editBenefit, setEditBenefit] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // --- Estado para Confirmación de Eliminación ---
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'preferencial' | 'negra';
    reportId: string;
    reportIndex?: number;
  } | null>(null);

  // Sincronizar tab activo con selector de etiqueta
  const handleTabChange = (tab: 'todos' | 'preferencial' | 'negra' | 'mixtos') => {
    setActiveTab(tab);
    if (tab === 'preferencial') {
      setFilterTag('Lista Preferencial');
    } else if (tab === 'negra') {
      setFilterTag('Lista Negra');
    } else if (tab === 'mixtos') {
      setFilterTag('mixtos');
    } else {
      setFilterTag('todos');
    }
  };

  // --- Métricas por Etiquetas ---
  const counts = useMemo(() => {
    const total = customers.length;
    const preferencial = customers.filter((c) => c.etiquetas.includes('Lista Preferencial')).length;
    const negra = customers.filter((c) => c.etiquetas.includes('Lista Negra')).length;
    const normal = customers.filter((c) => c.etiquetas.includes('Normal')).length;
    const mixtos = customers.filter(
      (c) => c.etiquetas.includes('Lista Preferencial') && c.etiquetas.includes('Lista Negra')
    ).length;
    return { total, preferencial, negra, normal, mixtos };
  }, [customers]);

  // --- Filtrado Dinámico de Clientes ---
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      if (filterTag === 'mixtos') {
        if (!cust.etiquetas.includes('Lista Preferencial') || !cust.etiquetas.includes('Lista Negra')) {
          return false;
        }
      } else if (filterTag !== 'todos') {
        if (!cust.etiquetas.includes(filterTag as CustomerTag)) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const fullName = `${cust.nombre} ${cust.apellido}`.toLowerCase();
        const matchesName = fullName.includes(q);
        const matchesRut = cust.rut.toLowerCase().includes(q);
        const matchesEmail = cust.email.toLowerCase().includes(q);
        const matchesPhone = cust.phone.toLowerCase().includes(q);
        const matchesTags = cust.etiquetas.some((t) => t.toLowerCase().includes(q));
        return matchesName || matchesRut || matchesEmail || matchesPhone || matchesTags;
      }

      return true;
    });
  }, [customers, filterTag, searchTerm]);

  // --- Acciones de Puntos Club (MongoDB + Estado) ---
  const handleSavePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPointsCustomer) return;

    const pointsNum = Math.max(0, Number(newPointsValue) || 0);
    const targetCustomer = editingPointsCustomer;

    try {
      await syncCustomerToMongoDB(targetCustomer.id, {
        puntosClub: pointsNum,
        lastPointsReason: pointsReason.trim()
      });

      setCustomers((prev) =>
        prev.map((c) => (c.id === targetCustomer.id ? { ...c, puntosClub: pointsNum } : c))
      );

      setFeedback({
        type: 'success',
        message: `✓ Puntos Club de "${targetCustomer.nombre} ${targetCustomer.apellido}" actualizados a ${pointsNum} pts en MongoDB.`
      });
    } catch (error) {
      console.error('Error guardando puntos en MongoDB:', error);
      setFeedback({
        type: 'error',
        message: 'Error al guardar los Puntos Club en MongoDB.'
      });
    } finally {
      setEditingPointsCustomer(null);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // --- Abrir Modal: "Agregar Reporte" ---
  const handleOpenAddReport = (cust: CustomerRecord, preselectedType: 'preferencial' | 'negra' = 'preferencial') => {
    setAddReportCustomer(cust);
    setReportTargetType(preselectedType);
    setReportReason('');
    setReportDebtAmount('');
    setReportBenefit('');
    setReportNotes('');
  };

  // --- Guardar Nuevo Reporte en MongoDB ---
  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addReportCustomer) return;

    if (!reportReason.trim()) {
      alert('Debes indicar el motivo o causa del reporte.');
      return;
    }

    const nowFormatted = new Date().toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isBlacklist = reportTargetType === 'negra';
    const debtVal = reportDebtAmount ? parseInt(reportDebtAmount.replace(/[^0-9]/g, ''), 10) : undefined;

    let updatedTags = [...addReportCustomer.etiquetas];
    const newTag: CustomerTag = isBlacklist ? 'Lista Negra' : 'Lista Preferencial';
    if (!updatedTags.includes(newTag)) {
      updatedTags.push(newTag);
    }
    if (updatedTags.length > 1 && updatedTags.includes('Normal')) {
      updatedTags = updatedTags.filter((t) => t !== 'Normal');
    }

    let nextBlacklist = [...addReportCustomer.blacklistReports];
    let nextPreferential = [...addReportCustomer.preferentialReports];

    if (isBlacklist) {
      const newBlReport: BlacklistReport = {
        id: `bl_rep_${Date.now()}`,
        date: nowFormatted,
        reason: reportReason.trim(),
        debtAmount: debtVal,
        notes: reportNotes.trim() || undefined,
        recordedBy: 'Super Admin'
      };
      nextBlacklist = [newBlReport, ...nextBlacklist];
    } else {
      const newPrefReport: PreferentialReport = {
        id: `pref_rep_${Date.now()}`,
        date: nowFormatted,
        reason: reportReason.trim(),
        benefit: reportBenefit.trim() || undefined,
        notes: reportNotes.trim() || undefined,
        recordedBy: 'Super Admin'
      };
      nextPreferential = [newPrefReport, ...nextPreferential];
    }

    try {
      await syncCustomerToMongoDB(addReportCustomer.id, {
        etiquetas: updatedTags,
        blacklistReports: nextBlacklist,
        preferentialReports: nextPreferential
      });

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === addReportCustomer.id
            ? {
                ...c,
                etiquetas: updatedTags,
                blacklistReports: nextBlacklist,
                preferentialReports: nextPreferential
              }
            : c
        )
      );

      setFeedback({
        type: 'success',
        message: `✓ Reporte guardado en MongoDB en la ${isBlacklist ? 'Lista Negra' : 'Lista Preferencial'} para "${addReportCustomer.nombre} ${addReportCustomer.apellido}".`
      });
    } catch (error) {
      console.error('Error guardando reporte en MongoDB:', error);
      setFeedback({
        type: 'error',
        message: 'Error al guardar el reporte en MongoDB.'
      });
    } finally {
      setAddReportCustomer(null);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // --- Abrir Modal "VER" Reportes ---
  const handleOpenViewReports = (cust: CustomerRecord) => {
    setViewReportsCustomer(cust);
    if (cust.preferentialReports.length > 0 && cust.blacklistReports.length === 0) {
      setViewActiveTab('preferencial');
    } else if (cust.blacklistReports.length > 0 && cust.preferentialReports.length === 0) {
      setViewActiveTab('negra');
    } else {
      setViewActiveTab('preferencial');
    }
    setEditingReportId(null);
  };

  // --- Iniciar Edición de un Reporte Específico ---
  const handleStartEditReport = (
    type: 'preferencial' | 'negra',
    rep: PreferentialReport | BlacklistReport
  ) => {
    setEditingReportId(rep.id);
    setEditingReportType(type);
    setEditReason(rep.reason);
    setEditNotes(rep.notes || '');

    if (type === 'negra') {
      const bl = rep as BlacklistReport;
      setEditDebt(bl.debtAmount ? bl.debtAmount.toLocaleString('es-CL') : '');
      setEditBenefit('');
    } else {
      const pr = rep as PreferentialReport;
      setEditBenefit(pr.benefit || '');
      setEditDebt('');
    }
  };

  // --- Guardar Modificación de un Reporte en MongoDB ---
  const handleSaveEditedReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewReportsCustomer || !editingReportId) return;

    if (!editReason.trim()) {
      alert('El motivo del reporte no puede quedar vacío.');
      return;
    }

    const debtVal = editDebt ? parseInt(editDebt.replace(/[^0-9]/g, ''), 10) : undefined;

    const updatedBl =
      editingReportType === 'negra'
        ? viewReportsCustomer.blacklistReports.map((r) =>
            r.id === editingReportId
              ? {
                  ...r,
                  reason: editReason.trim(),
                  debtAmount: debtVal,
                  notes: editNotes.trim() || undefined
                }
              : r
          )
        : viewReportsCustomer.blacklistReports;

    const updatedPref =
      editingReportType === 'preferencial'
        ? viewReportsCustomer.preferentialReports.map((r) =>
            r.id === editingReportId
              ? {
                  ...r,
                  reason: editReason.trim(),
                  benefit: editBenefit.trim() || undefined,
                  notes: editNotes.trim() || undefined
                }
              : r
          )
        : viewReportsCustomer.preferentialReports;

    try {
      await syncCustomerToMongoDB(viewReportsCustomer.id, {
        blacklistReports: updatedBl,
        preferentialReports: updatedPref
      });

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === viewReportsCustomer.id
            ? { ...c, blacklistReports: updatedBl, preferentialReports: updatedPref }
            : c
        )
      );

      setViewReportsCustomer((prev) =>
        prev ? { ...prev, blacklistReports: updatedBl, preferentialReports: updatedPref } : null
      );

      setEditingReportId(null);
      setFeedback({
        type: 'success',
        message: '✓ Reporte modificado y sincronizado en MongoDB con éxito.'
      });
    } catch (error) {
      console.error('Error modificando reporte en MongoDB:', error);
      setFeedback({
        type: 'error',
        message: 'No se pudo actualizar el reporte en MongoDB.'
      });
    } finally {
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // --- Eliminar un Reporte Específico en MongoDB ---
  const handleDeleteReport = async (type: 'preferencial' | 'negra', reportId: string) => {
    if (!viewReportsCustomer) return;

    const updatedBl =
      type === 'negra'
        ? viewReportsCustomer.blacklistReports.filter((r) => r.id !== reportId)
        : viewReportsCustomer.blacklistReports;

    const updatedPref =
      type === 'preferencial'
        ? viewReportsCustomer.preferentialReports.filter((r) => r.id !== reportId)
        : viewReportsCustomer.preferentialReports;

    let tags = [...viewReportsCustomer.etiquetas];
    if (type === 'negra' && updatedBl.length === 0) {
      tags = tags.filter((t) => t !== 'Lista Negra');
    }
    if (type === 'preferencial' && updatedPref.length === 0) {
      tags = tags.filter((t) => t !== 'Lista Preferencial');
    }
    if (tags.length === 0) {
      tags = ['Normal'];
    }

    try {
      await syncCustomerToMongoDB(viewReportsCustomer.id, {
        etiquetas: tags,
        blacklistReports: updatedBl,
        preferentialReports: updatedPref
      });

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === viewReportsCustomer.id
            ? {
                ...c,
                etiquetas: tags,
                blacklistReports: updatedBl,
                preferentialReports: updatedPref
              }
            : c
        )
      );

      setViewReportsCustomer((prev) =>
        prev
          ? {
              ...prev,
              etiquetas: tags,
              blacklistReports: updatedBl,
              preferentialReports: updatedPref
            }
          : null
      );

      setEditingReportId(null);
      setDeleteConfirmTarget(null);

      setFeedback({
        type: 'success',
        message: '✓ Reporte eliminado del historial del cliente en MongoDB.'
      });
    } catch (error) {
      console.error('Error eliminando reporte en MongoDB:', error);
      setFeedback({
        type: 'error',
        message: 'No se pudo eliminar el reporte en MongoDB.'
      });
    } finally {
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="nl-cust-manager-wrapper space-y-4 font-sans text-gray-900 pb-16">
      <WindowFrame
        title="CLIENT_DIRECTORY_CORE.SYS - [Administrador Central de Clientes - Super Admin]"
        icon={<PixelIcon name="computer" size={16} />}
        statusBarText={`NODO SUPER ADMIN // MONGODB ACTIVO // TOTAL CLIENTES: ${counts.total} // ETIQUETAS ACTIVAS // AUDITORÍA PERMANENTE`}
      >
        <div className="space-y-4">
          {/* Cabecera, Notificaciones, Pestañas de Etiquetas y Barra de Búsqueda */}
          <CustomerHeaderAndTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleTabChange={handleTabChange}
            counts={counts}
            feedback={feedback}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterTag={filterTag}
            setFilterTag={setFilterTag}
            filteredCount={filteredCustomers.length}
            totalCount={customers.length}
          />

          {/* Tabla Principal: Clientes Registrados y sus Etiquetas */}
          <CustomerDirectoryTable
            filteredCustomers={filteredCustomers}
            onStartEditPoints={(cust) => {
              setEditingPointsCustomer(cust);
              setNewPointsValue(cust.puntosClub);
              setPointsReason('');
            }}
            handleOpenAddReport={handleOpenAddReport}
            handleOpenViewReports={handleOpenViewReports}
          />
        </div>
      </WindowFrame>

      {/* Modal: Editar Puntos Club */}
      <CustomerEditPointsModal
        editingPointsCustomer={editingPointsCustomer}
        setEditingPointsCustomer={setEditingPointsCustomer}
        newPointsValue={newPointsValue}
        setNewPointsValue={setNewPointsValue}
        pointsReason={pointsReason}
        setPointsReason={setPointsReason}
        handleSavePoints={handleSavePoints}
      />

      {/* Modal: Agregar Reporte (Lista Preferencial o Lista Negra) */}
      <CustomerAddReportModal
        addReportCustomer={addReportCustomer}
        setAddReportCustomer={setAddReportCustomer}
        reportTargetType={reportTargetType}
        setReportTargetType={setReportTargetType}
        reportReason={reportReason}
        setReportReason={setReportReason}
        reportDebtAmount={reportDebtAmount}
        setReportDebtAmount={setReportDebtAmount}
        reportBenefit={reportBenefit}
        setReportBenefit={setReportBenefit}
        reportNotes={reportNotes}
        setReportNotes={setReportNotes}
        handleSaveReport={handleSaveReport}
      />

      {/* Modal: Ver, Modificar y Eliminar Reportes Acumulados */}
      <CustomerViewReportsModal
        viewReportsCustomer={viewReportsCustomer}
        setViewReportsCustomer={setViewReportsCustomer}
        viewActiveTab={viewActiveTab}
        setViewActiveTab={setViewActiveTab}
        editingReportId={editingReportId}
        setEditingReportId={setEditingReportId}
        editReason={editReason}
        setEditReason={setEditReason}
        editDebt={editDebt}
        setEditDebt={setEditDebt}
        editBenefit={editBenefit}
        setEditBenefit={setEditBenefit}
        editNotes={editNotes}
        setEditNotes={setEditNotes}
        handleStartEditReport={handleStartEditReport}
        handleSaveEditedReport={handleSaveEditedReport}
        deleteConfirmTarget={deleteConfirmTarget}
        setDeleteConfirmTarget={setDeleteConfirmTarget}
        handleDeleteReport={handleDeleteReport}
      />
    </div>
  );
};

export default CustomerManagerView;