import React, { useState, useMemo, useEffect } from 'react';
import {
  Store,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Building2,
  RefreshCw
} from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import {
  useBranch,
  getBranchScheduleBlocks,
  composeBranchPickupScheduleFromBlocks
} from '../../context/BranchContext';
import { Branch, BranchScheduleBlock } from '../../types';
import { BASE_3KG_RATES_FROM_V_REGION } from '../../services/shippingQuotesEngine';
import api from '../../api/axios';
import '../../components/admin/branches/BranchManagementView.css';
import {
  BranchEditFormState,
  QuickScheduleFormState,
  DetectedBranchChange,
  createDefaultScheduleBlocks,
  SCHEDULE_PRESETS,
  formatChileanRut
} from '../../components/admin/branches/branchManagementTypes';
import { LiveBranchPreviewCard } from '../../components/admin/branches/LiveBranchPreviewCard';
import { FlexibleScheduleBuilder } from '../../components/admin/branches/FlexibleScheduleBuilder';
import { BranchCreateForm } from '../../components/admin/branches/BranchCreateForm';
import { BranchListGrid } from '../../components/admin/branches/BranchListGrid';
import { BranchModals } from '../../components/admin/branches/BranchModals';

export {
  createDefaultScheduleBlocks,
  SCHEDULE_PRESETS,
  formatChileanRut,
  LiveBranchPreviewCard,
  FlexibleScheduleBuilder,
  BranchCreateForm,
  BranchListGrid,
  BranchModals
};


const normalizeBranchFromDB = (doc: any): Branch => {
  const rawId = doc._id?.toString() || doc.id;
  // Unificamos 'branch-corporativo' y 'casa_matriz' si en el contexto local existe 'casa_matriz'
  const blocks =
    Array.isArray(doc.scheduleBlocks) && doc.scheduleBlocks.length > 0
      ? doc.scheduleBlocks
      : createDefaultScheduleBlocks();

  return {
    id: rawId,
    name: doc.name || '',
    code: doc.code || 'SUC-01',
    region: doc.region || 'Región de Valparaíso',
    city: doc.city || '',
    address: doc.address || '',
    phone: doc.phone || '+56 9 8452 1190',
    managerName: doc.managerName || 'Jefe de Sucursal',
    adminEmail: doc.adminEmail || '',
    adminRut: doc.adminRut || '',
    adminPassword: doc.adminPassword || '',
    isActive: doc.isActive !== false,
    isPhysicalStore: doc.isPhysicalStore !== false && !doc.isCorporate,
    isCorporate: Boolean(doc.isCorporate) || rawId === 'branch-corporativo' || rawId === 'casa_matriz',
    allowPickup: doc.allowPickup !== false && !doc.isCorporate,
    scheduleBlocks: blocks,
    pickupSchedule:
      doc.pickupSchedule || composeBranchPickupScheduleFromBlocks(blocks),
    returnInstructions:
      doc.returnInstructions ||
      'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.',
    badge: doc.badge || 'Punto Oficial de Retiro',
    colorTag: doc.colorTag || '#0055ea',
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  };
};



export const BranchManagementView: React.FC = () => {
  const { branches, addBranch, updateBranch, deleteBranch } = useBranch();
  const [isSyncingBranches, setIsSyncingBranches] = useState<boolean>(false);

  // Sincronizar sucursales desde MongoDB al montar la vista (y sembrar las iniciales si la colección está vacía) 
  const syncBranchesWithBackend = async () => {
    setIsSyncingBranches(true);
    try {
      const response = await api.get('/admin/branches');
      const dbBranches: any[] = response.data?.data || [];

      if (dbBranches.length === 0 && branches.length > 0) {
        for (const initialBranch of branches) {
          await api.put(`/admin/branches/${initialBranch.id}`, {
            ...initialBranch,
            _id: initialBranch.id
          });
        }
      } else if (dbBranches.length > 0) {
        // 1. Limpiar duplicados de Casa Matriz directamente en localStorage si existen
        const corporateCount = branches.filter(
          (b) => b.isCorporate || b.id === 'casa_matriz' || b.id === 'branch-corporativo' || b.code === 'CORP-00'
        ).length;

        if (corporateCount > 1) {
          Object.keys(localStorage).forEach((key) => {
            if (key.toLowerCase().includes('branch')) {
              localStorage.removeItem(key);
            }
          });
          window.location.reload();
          return;
        }

        // 2. Sincronizar cada documento de MongoDB sin duplicar por código ni por ID
        dbBranches.forEach((doc) => {
          const normalized = normalizeBranchFromDB(doc);
          const matchInContext = branches.find(
            (b) =>
              b.id === normalized.id ||
              b.code === normalized.code ||
              (normalized.isCorporate && (b.isCorporate || b.id === 'casa_matriz'))
          );

          if (matchInContext) {
            updateBranch({ ...normalized, id: matchInContext.id });
          } else {
            addBranch(normalized);
          }
        });
      }
    } catch (error) {
      console.error('Error sincronizando sucursales con MongoDB:', error);
    } finally {
      setIsSyncingBranches(false);
    }
  };

  useEffect(() => {
    syncBranchesWithBackend();
  }, []);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('ALL');

  // Vista Previa General de Horarios_Retiro_Sucursales.exe
  const [showGlobalPreviewModal, setShowGlobalPreviewModal] = useState(false);

  // Form State: APERTURA DE NUEVA SUCURSAL FÍSICA
  const [region, setRegion] = useState('Región de Valparaíso');
  const [city, setCity] = useState('Viña del Mar');
  const [customCity, setCustomCity] = useState('');
  const [streetName, setStreetName] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [hasNoStreetNumber, setHasNoStreetNumber] = useState(false);
  const [apartmentOrUnit, setApartmentOrUnit] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [managerName, setManagerName] = useState('');
  const [storeNameLabel, setStoreNameLabel] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('+56 9 8452 1190');
  const [newBranchBadge, setNewBranchBadge] = useState('Punto Oficial de Retiro');
  const [newBranchReturnInstructions, setNewBranchReturnInstructions] = useState(
    'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.'
  );
  const [newBranchScheduleBlocks, setNewBranchScheduleBlocks] = useState<BranchScheduleBlock[]>(
    () => createDefaultScheduleBlocks()
  );

  // Credentials for branch admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRut, setAdminRut] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Edit Branch States
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editForm, setEditForm] = useState<BranchEditFormState | null>(null);

  // Quick Pickup Schedule + Live Preview Modal State
  const [scheduleEditingBranch, setScheduleEditingBranch] = useState<Branch | null>(null);
  const [activePreviewBlockId, setActivePreviewBlockId] = useState<string | null>(null);
  const [quickScheduleForm, setQuickScheduleForm] = useState<QuickScheduleFormState>({
    badge: '',
    phone: '',
    managerName: '',
    returnInstructions: '',
    scheduleBlocks: []
  });

  // Edit Confirmation Modal with Diff & "CONFIRMAR" input
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInputText, setConfirmInputText] = useState('');
  const [detectedChanges, setDetectedChanges] = useState<DetectedBranchChange[]>([]);

  // Delete Confirmation Modal
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  // Chilean regions list from dictionary
  const availableRegions = useMemo(() => {
    return Object.keys(BASE_3KG_RATES_FROM_V_REGION);
  }, []);

  // Cities for selected region in creation form
  const citiesForSelectedRegion = useMemo(() => {
    if (region && BASE_3KG_RATES_FROM_V_REGION[region]) {
      return Object.keys(BASE_3KG_RATES_FROM_V_REGION[region]);
    }
    return [];
  }, [region]);

  // Cities for selected region in edit form
  const citiesForEditRegion = useMemo(() => {
    if (editForm?.region && BASE_3KG_RATES_FROM_V_REGION[editForm.region]) {
      return Object.keys(BASE_3KG_RATES_FROM_V_REGION[editForm.region]);
    }
    return [];
  }, [editForm?.region]);

  // Physical pickup branches for global preview
  const physicalBranches = useMemo(() => {
    return branches.filter((b) => !b.isCorporate && b.id !== 'casa_matriz');
  }, [branches]);

  // Preview values for New Branch form
  const newBranchPreviewCity = customCity.trim() || city || 'Viña del Mar';
  const newBranchPreviewName = storeNameLabel.trim()
    ? `Sucursal ${newBranchPreviewCity} ${storeNameLabel.trim()}`
    : `Sucursal ${newBranchPreviewCity} Centro Hub`;
  const newBranchPreviewAddress = streetName.trim()
    ? `${streetName.trim()} ${hasNoStreetNumber ? 'S/N' : `#${streetNumber.trim() || '100'}`}${
        apartmentOrUnit.trim() ? `, ${apartmentOrUnit.trim()}` : ''
      }`
    : 'Av. Principal #100, Local 1';

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const effectiveCity = customCity.trim() || city;

    if (!effectiveCity) {
      setFormError('Debe ingresar o seleccionar una Ciudad/Comuna válida.');
      return;
    }

    if (!streetName.trim()) {
      setFormError('El campo Calle es obligatorio para la dirección física.');
      return;
    }

    if (!hasNoStreetNumber && !streetNumber.trim()) {
      setFormError('Debe ingresar el Número de la calle o marcar la opción "Calle sin número".');
      return;
    }

    if (postalCode.trim() && !/^\d{1,7}$/.test(postalCode.trim())) {
      setFormError('El Código Postal solo puede contener números y un máximo de 7 caracteres.');
      return;
    }

    const formattedNumber = hasNoStreetNumber ? 'S/N (Calle sin número)' : `#${streetNumber.trim()}`;
    const formattedUnit = apartmentOrUnit.trim() ? `, ${apartmentOrUnit.trim()}` : '';
    const formattedPostal = postalCode.trim() ? ` (CP: ${postalCode.trim()})` : '';
    const composedAddress = `${streetName.trim()} ${formattedNumber}${formattedUnit}${formattedPostal}`;

    if (!managerName.trim()) {
      setFormError('Debe ingresar el Nombre del Jefe de la Sucursal asignado.');
      return;
    }

    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setFormError('Debe ingresar un Correo Electrónico institucional válido para el Administrador.');
      return;
    }

    if (!adminRut.trim() || adminRut.length < 8) {
      setFormError('Debe ingresar un RUT chileno válido para el Administrador de la sucursal.');
      return;
    }

    if (!adminPassword || adminPassword.length < 6) {
      setFormError('La contraseña para el Administrador debe tener al menos 6 caracteres.');
      return;
    }

    if (adminPassword !== adminPasswordConfirm) {
      setFormError('Las contraseñas ingresadas no coinciden. Verifíquelas.');
      return;
    }

    const cleanCityCode = effectiveCity.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'S');
    const branchCode = `${cleanCityCode}-0${branches.length + 1}`;
    const generatedName = storeNameLabel.trim()
      ? `Sucursal ${effectiveCity} ${storeNameLabel.trim()}`
      : `Sucursal ${effectiveCity} Centro Hub`;

    const composedPickupSchedule = composeBranchPickupScheduleFromBlocks(newBranchScheduleBlocks);

    const semanticId = effectiveCity
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const finalId = branches.some((b) => b.id === semanticId)
      ? `${semanticId}_${Date.now().toString().slice(-4)}`
      : semanticId;

    const newBranchPayload: Branch = {
      id: finalId,
      name: generatedName,
      code: branchCode,
      region,
      city: effectiveCity,
      address: composedAddress,
      phone: newBranchPhone.trim() || '+56 9 ' + Math.floor(70000000 + Math.random() * 29999999),
      managerName: managerName.trim(),
      adminEmail: adminEmail.trim(),
      adminRut: adminRut.trim(),
      adminPassword,
      isActive: true,
      isPhysicalStore: true,
      allowPickup: true,
      scheduleBlocks: newBranchScheduleBlocks,
      pickupSchedule: composedPickupSchedule,
      returnInstructions:
        newBranchReturnInstructions.trim() ||
        'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.',
      badge: newBranchBadge.trim() || 'Punto Oficial de Retiro',
      colorTag: '#0055ea',
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      const response = await api.post('/admin/branches', {
        ...newBranchPayload,
        _id: finalId
      });

      const createdBranch = response.data?.data
        ? normalizeBranchFromDB(response.data.data)
        : newBranchPayload;

      addBranch(createdBranch);
      setFormSuccess(
        `✓ ¡Sucursal "${generatedName}" (${branchCode}) guardada en MongoDB! Su cuenta de Administrador (${adminEmail.trim()}) y su horario (${composedPickupSchedule}) fueron creados y sincronizados.`
      );

      // Reset form
      setStreetName('');
      setStreetNumber('');
      setHasNoStreetNumber(false);
      setApartmentOrUnit('');
      setPostalCode('');
      setManagerName('');
      setStoreNameLabel('');
      setNewBranchScheduleBlocks(createDefaultScheduleBlocks());
      setNewBranchBadge('Punto Oficial de Retiro');
      setNewBranchReturnInstructions(
        'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.'
      );
      setAdminEmail('');
      setAdminRut('');
      setAdminPassword('');
      setAdminPasswordConfirm('');
      setCustomCity('');
    } catch (error: any) {
      console.error('Error creando sucursal en MongoDB:', error);
      setFormError(
        error.response?.data?.message || 'Error al registrar la sucursal en la base de datos.'
      );
    }
  };

  // Open Quick Schedule + Live Preview Modal
  const handleOpenQuickScheduleModal = (branch: Branch) => {
    const blocks = getBranchScheduleBlocks(branch);
    setScheduleEditingBranch(branch);
    setActivePreviewBlockId(blocks[0]?.id || null);
    setQuickScheduleForm({
      badge: branch.badge || 'Punto Oficial de Retiro',
      phone: branch.phone || '+56 9 8452 1190',
      managerName: branch.managerName || 'Jefe de Sucursal',
      returnInstructions:
        branch.returnInstructions ||
        'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.',
      scheduleBlocks: blocks
    });
  };

  // Update a single block from inline preview in Quick Schedule modal
  const handleInlinePreviewBlockChange = (
    blockId: string,
    patch: Partial<BranchScheduleBlock>
  ) => {
    setQuickScheduleForm((prev) => ({
      ...prev,
      scheduleBlocks: prev.scheduleBlocks.map((b) =>
        b.id === blockId ? { ...b, ...patch } : b
      )
    }));
  };

  // Save Quick Schedule and synchronize everywhere (MongoDB + Context)
  const handleSaveQuickSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleEditingBranch) return;

    const cleanBlocks =
      quickScheduleForm.scheduleBlocks.length > 0
        ? quickScheduleForm.scheduleBlocks
        : createDefaultScheduleBlocks();
    const composedSchedule = composeBranchPickupScheduleFromBlocks(cleanBlocks);

    const updated: Branch = {
      ...scheduleEditingBranch,
      badge: quickScheduleForm.badge.trim() || 'Punto Oficial de Retiro',
      phone: quickScheduleForm.phone.trim() || scheduleEditingBranch.phone,
      managerName: quickScheduleForm.managerName.trim() || scheduleEditingBranch.managerName,
      scheduleBlocks: cleanBlocks,
      pickupSchedule: composedSchedule,
      returnInstructions:
        quickScheduleForm.returnInstructions.trim() ||
        scheduleEditingBranch.returnInstructions ||
        'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.'
    };

    try {
      await api.put(`/admin/branches/${updated.id}`, updated);
      updateBranch(updated);
      setScheduleEditingBranch(null);
      setFormSuccess(
        `✓ Tarjeta y horario de retiro actualizados en MongoDB para "${updated.name}" (${composedSchedule}).`
      );
    } catch (error) {
      console.error('Error guardando horario rápido en MongoDB:', error);
      setFormError('No se pudo sincronizar el horario en MongoDB.');
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setEditForm({
      name: branch.name,
      region: branch.region || 'Región de Valparaíso',
      city: branch.city,
      address: branch.address,
      phone: branch.phone || '+56 9 8452 1190',
      managerName: branch.managerName,
      badge: branch.badge || 'Punto Oficial de Retiro',
      returnInstructions:
        branch.returnInstructions ||
        'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.',
      scheduleBlocks: getBranchScheduleBlocks(branch),
      adminEmail: branch.adminEmail || '',
      adminRut: branch.adminRut || '',
      adminPassword: branch.adminPassword || '',
      adminPasswordConfirm: branch.adminPassword || '',
      isActive: branch.isActive !== false
    });
    setFormError(null);
  };

  // Check diff and trigger "CONFIRMAR" secondary modal
  const handleReviewEditChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editForm) return;

    if (!editForm.name.trim()) {
      alert('El nombre de la sucursal no puede estar vacío.');
      return;
    }
    if (!editForm.address.trim()) {
      alert('La dirección física no puede estar vacía.');
      return;
    }
    if (!editForm.managerName.trim()) {
      alert('El nombre del jefe asignado no puede estar vacío.');
      return;
    }
    if (editForm.adminPassword && editForm.adminPassword !== editForm.adminPasswordConfirm) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    const changes: DetectedBranchChange[] = [];

    if (editingBranch.name !== editForm.name.trim()) {
      changes.push({
        field: 'Nombre de la Sucursal',
        oldVal: editingBranch.name,
        newVal: editForm.name.trim()
      });
    }

    if ((editingBranch.region || '') !== editForm.region) {
      changes.push({
        field: 'Región',
        oldVal: editingBranch.region || 'Sin definir',
        newVal: editForm.region
      });
    }

    if (editingBranch.city !== editForm.city.trim()) {
      changes.push({
        field: 'Ciudad / Comuna',
        oldVal: editingBranch.city,
        newVal: editForm.city.trim()
      });
    }

    if (editingBranch.address !== editForm.address.trim()) {
      changes.push({
        field: 'Dirección Física',
        oldVal: editingBranch.address,
        newVal: editForm.address.trim()
      });
    }

    if ((editingBranch.phone || '') !== editForm.phone.trim()) {
      changes.push({
        field: 'WhatsApp Sucursal',
        oldVal: editingBranch.phone || 'Sin definir',
        newVal: editForm.phone.trim()
      });
    }

    if (editingBranch.managerName !== editForm.managerName.trim()) {
      changes.push({
        field: 'Jefe de Sucursal Asignado',
        oldVal: editingBranch.managerName,
        newVal: editForm.managerName.trim()
      });
    }

    if (!editingBranch.isCorporate && editingBranch.id !== 'casa_matriz') {
      const oldSummary = composeBranchPickupScheduleFromBlocks(getBranchScheduleBlocks(editingBranch));
      const newSummary = composeBranchPickupScheduleFromBlocks(editForm.scheduleBlocks);

      if (oldSummary !== newSummary) {
        changes.push({
          field: 'Horario de Retiro (Tramos)',
          oldVal: oldSummary,
          newVal: newSummary
        });
      }

      if ((editingBranch.badge || '') !== editForm.badge.trim()) {
        changes.push({
          field: 'Insignia / Etiqueta Tarjeta',
          oldVal: editingBranch.badge || 'Punto Oficial de Retiro',
          newVal: editForm.badge.trim()
        });
      }

      if ((editingBranch.returnInstructions || '') !== editForm.returnInstructions.trim()) {
        changes.push({
          field: 'Nota Importante Retiro',
          oldVal: editingBranch.returnInstructions || '',
          newVal: editForm.returnInstructions.trim()
        });
      }
    }

    if ((editingBranch.adminEmail || '') !== editForm.adminEmail.trim()) {
      changes.push({
        field: 'Correo del Administrador',
        oldVal: editingBranch.adminEmail || 'No asignado',
        newVal: editForm.adminEmail.trim()
      });
    }

    if ((editingBranch.adminRut || '') !== editForm.adminRut.trim()) {
      changes.push({
        field: 'RUT del Administrador',
        oldVal: editingBranch.adminRut || 'No asignado',
        newVal: editForm.adminRut.trim()
      });
    }

    if (editForm.adminPassword && (editingBranch.adminPassword || '') !== editForm.adminPassword) {
      changes.push({
        field: 'Contraseña de Acceso',
        oldVal: '••••••••',
        newVal: '•••••••• (Actualizada)'
      });
    }

    if (editingBranch.isActive !== editForm.isActive) {
      changes.push({
        field: 'Estado Operativo',
        oldVal: editingBranch.isActive ? 'Activa' : 'Inactiva',
        newVal: editForm.isActive ? 'Activa' : 'Inactiva'
      });
    }

    if (changes.length === 0) {
      alert('No se detectaron cambios en los datos de la sucursal.');
      return;
    }

    setDetectedChanges(changes);
    setConfirmInputText('');
    setShowConfirmModal(true);
  };

  // Final apply of changes after "CONFIRMAR" verification (MongoDB + Context)
  const handleApplyConfirmedEdit = async () => {
    if (!editingBranch || !editForm) return;
    if (confirmInputText.trim() !== 'CONFIRMAR') {
      alert('Debe escribir exactamente la palabra CONFIRMAR (en mayúsculas) para autorizar los cambios.');
      return;
    }

    const updated: Branch = {
      ...editingBranch,
      name: editForm.name.trim(),
      region: editForm.region,
      city: editForm.city.trim(),
      address: editForm.address.trim(),
      phone: editForm.phone.trim(),
      managerName: editForm.managerName.trim(),
      badge: editForm.badge.trim() || 'Punto Oficial de Retiro',
      returnInstructions: editForm.returnInstructions.trim(),
      scheduleBlocks: editForm.scheduleBlocks,
      pickupSchedule: composeBranchPickupScheduleFromBlocks(editForm.scheduleBlocks),
      adminEmail: editForm.adminEmail.trim(),
      adminRut: editForm.adminRut.trim(),
      adminPassword: editForm.adminPassword || editingBranch.adminPassword,
      isActive: editForm.isActive
    };

    try {
      await api.put(`/admin/branches/${updated.id}`, updated);
      updateBranch(updated);
      setShowConfirmModal(false);
      setEditingBranch(null);
      setEditForm(null);
      setFormSuccess(`✓ ¡Cambios y horarios guardados en MongoDB para la sucursal "${updated.name}"!`);
    } catch (error: any) {
      console.error('Error actualizando sucursal en MongoDB:', error);
      setFormError(
        error.response?.data?.message || 'Error al actualizar la sucursal en la base de datos.'
      );
    }
  };

  // Delete Branch Execution (MongoDB + Context)
  const handleConfirmDelete = async () => {
    if (!branchToDelete) return;
    try {
      await api.delete(`/admin/branches/${branchToDelete.id}`);
    } catch (error) {
      console.error('Aviso eliminando sucursal en MongoDB:', error);
    }
    deleteBranch(branchToDelete.id);
    setBranchToDelete(null);
    setFormSuccess('✓ La sucursal ha sido eliminada de MongoDB y del sistema central.');
  };

  // Filtered branches list (sin duplicados de ID ni de Casa Matriz)
  const filteredBranches = useMemo(() => {
    const seenIds = new Set<string>();
    let seenCorporate = false;

    return branches.filter((b) => {
      const isCorp = Boolean(b.isCorporate) || b.id === 'casa_matriz' || b.id === 'branch-corporativo' || b.code === 'CORP-00';
      if (isCorp) {
        if (seenCorporate) return false;
        seenCorporate = true;
      }
      if (seenIds.has(b.id)) return false;
      seenIds.add(b.id);

      const matchSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.managerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRegion =
        selectedRegionFilter === 'ALL' || b.region === selectedRegionFilter;

      return matchSearch && matchRegion;
    });
  }, [branches, searchTerm, selectedRegionFilter]);

  return (
    <div className="branch-mgmt-root space-y-4 font-sans text-gray-900 pb-12 relative">
      {isSyncingBranches && (
        <div className="
absolute inset-0 z-50 bg-white/70 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#ece9d8] border-2 border-blue-900 p-4 shadow-xl flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-700 animate-spin" />
            <span className="font-bold text-xs text-blue-950">SINCRONIZANDO SUCURSALES CON MONGODB...</span>
          </div>
        </div>
      )}

      <WindowFrame
        title="BRANCH_MANAGER.SYS - [Administrador de Sucursales Físicas]"
        icon={<PixelIcon name="computer" size={16} />}
        statusBarText="SUPER ADMIN PRIVILEGES // RED NACIONAL DE PUNTOS PICKUP & BODEGAS // SINCRONIZACIÓN MONGODB OK"
      >
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="branch-mgmt-header-bar flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-gray-300 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#003c74]" />
                <h2 className="text-base font-black text-[#003c74] tracking-tight">
                  ADMINISTRADOR DE SUCURSALES FÍSICAS
                </h2>
              </div>
              <p className="text-xs text-blue-800 font-medium mt-0.5">
                // Gestión centralizada de puntos de venta, horarios flexibles con vista previa en vivo y logística de retiro
              </p>
            </div>
            <div className="branch-mgmt-header-actions flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={syncBranchesWithBackend}
                className="winxp-button px-2.5 py-1 font-bold text-blue-900 flex items-center gap-1 cursor-pointer"
                title="Sincronizar con MongoDB"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isSyncingBranches ? 'animate-spin' : ''}`} />
                <span>Sincronizar BD</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGlobalPreviewModal(true)}
                className="winxp-button winxp-button-primary px-3 py-1 font-bold text-blue-950 flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Ver exactamente cómo ven los clientes la ventana Horarios_Retiro_Sucursales.exe y editar cualquier tarjeta"
              >
                <Eye className="w-3.5 h-3.5 text-blue-700" />
                <span>Vista Previa: Horarios_Retiro_Sucursales.exe</span>
              </button>
              <span className="bg-blue-100 text-blue-900 px-2.5 py-1 font-bold border border-blue-300 rounded-xs flex items-center gap-1.5 shadow-xs">
                <Store className="w-3.5 h-3.5 text-blue-700" />
                <span>{filteredBranches.length} Sucursales Activas</span>
              </span>
            </div>
          </div>

          {/* Success / Error Messages */}
          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-400 text-emerald-900 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
              <button
                onClick={() => setFormSuccess(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {formError && (
            <div className="p-3 bg-red-50 border border-red-400 text-red-900 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
              <button
                onClick={() => setFormError(null)}
                className="text-red-700 hover:text-red-900 text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Formulario de Apertura de Nueva Sucursal Física */}
          <BranchCreateForm
            handleCreateBranch={handleCreateBranch}
            region={region}
            setRegion={setRegion}
            availableRegions={availableRegions}
            city={city}
            setCity={setCity}
            citiesForSelectedRegion={citiesForSelectedRegion}
            customCity={customCity}
            setCustomCity={setCustomCity}
            storeNameLabel={storeNameLabel}
            setStoreNameLabel={setStoreNameLabel}
            streetName={streetName}
            setStreetName={setStreetName}
            streetNumber={streetNumber}
            setStreetNumber={setStreetNumber}
            hasNoStreetNumber={hasNoStreetNumber}
            setHasNoStreetNumber={setHasNoStreetNumber}
            apartmentOrUnit={apartmentOrUnit}
            setApartmentOrUnit={setApartmentOrUnit}
            postalCode={postalCode}
            setPostalCode={setPostalCode}
            managerName={managerName}
            setManagerName={setManagerName}
            newBranchPhone={newBranchPhone}
            setNewBranchPhone={setNewBranchPhone}
            newBranchBadge={newBranchBadge}
            setNewBranchBadge={setNewBranchBadge}
            newBranchScheduleBlocks={newBranchScheduleBlocks}
            setNewBranchScheduleBlocks={setNewBranchScheduleBlocks}
            newBranchReturnInstructions={newBranchReturnInstructions}
            setNewBranchReturnInstructions={setNewBranchReturnInstructions}
            newBranchPreviewCity={newBranchPreviewCity}
            newBranchPreviewName={newBranchPreviewName}
            newBranchPreviewAddress={newBranchPreviewAddress}
            adminEmail={adminEmail}
            setAdminEmail={setAdminEmail}
            adminRut={adminRut}
            setAdminRut={setAdminRut}
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
            adminPasswordConfirm={adminPasswordConfirm}
            setAdminPasswordConfirm={setAdminPasswordConfirm}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          {/* Listado y Filtro de Sucursales Físicas Operativas */}
          <BranchListGrid
            filteredBranches={filteredBranches}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedRegionFilter={selectedRegionFilter}
            setSelectedRegionFilter={setSelectedRegionFilter}
            availableRegions={availableRegions}
            handleOpenQuickScheduleModal={handleOpenQuickScheduleModal}
            handleOpenEditModal={handleOpenEditModal}
            setBranchToDelete={setBranchToDelete}
          />
        </div>
      </WindowFrame>

      {/* Ventanas Modales del Administrador de Sucursales */}
      <BranchModals
        showGlobalPreviewModal={showGlobalPreviewModal}
        setShowGlobalPreviewModal={setShowGlobalPreviewModal}
        physicalBranches={physicalBranches}
        handleOpenQuickScheduleModal={handleOpenQuickScheduleModal}
        scheduleEditingBranch={scheduleEditingBranch}
        setScheduleEditingBranch={setScheduleEditingBranch}
        handleSaveQuickSchedule={handleSaveQuickSchedule}
        quickScheduleForm={quickScheduleForm}
        setQuickScheduleForm={setQuickScheduleForm}
        activePreviewBlockId={activePreviewBlockId}
        setActivePreviewBlockId={setActivePreviewBlockId}
        handleInlinePreviewBlockChange={handleInlinePreviewBlockChange}
        editingBranch={editingBranch}
        setEditingBranch={setEditingBranch}
        editForm={editForm}
        setEditForm={setEditForm}
        handleReviewEditChanges={handleReviewEditChanges}
        availableRegions={availableRegions}
        citiesForEditRegion={citiesForEditRegion}
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        detectedChanges={detectedChanges}
        confirmInputText={confirmInputText}
        setConfirmInputText={setConfirmInputText}
        handleApplyConfirmedEdit={handleApplyConfirmedEdit}
        branchToDelete={branchToDelete}
        setBranchToDelete={setBranchToDelete}
        handleConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};