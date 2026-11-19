import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Package,
  User,
  Briefcase,
  Calendar,
  Truck,
  Phone,
  Mail,
  DollarSign,
  Globe,
  MapPin,
  PlusCircle,
  Edit,
  Eye,
  Trash2,
  Search,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { useAuth } from '../../context/AuthContext';
import { BASE_3KG_RATES_FROM_V_REGION } from '../../services/shippingQuotesEngine';
import api from '../../api/axios';

export interface SupplierRecord {
  id: string;
  companyName: string;
  productsOffered: string;
  contactName: string;
  contactRole: string;
  orderDays: string;
  deliveryDays: string;
  phone: string;
  email: string;
  minimumPurchase: number;
  website: string;
  region: string;
  city: string;
  street: string;
  number: string;
  reference: string;
  postalCode: string;
  createdAt: string;
  updatedAt?: string;
}

// Lista de Regiones y Ciudades de Chile sincronizadas directamente desde shippingQuotesEngine.ts
const CHILE_REGIONS: Record<string, string[]> = Object.keys(BASE_3KG_RATES_FROM_V_REGION).reduce(
  (acc, reg) => {
    acc[reg] = Object.keys(BASE_3KG_RATES_FROM_V_REGION[reg] || {});
    return acc;
  },
  {} as Record<string, string[]>
);

/**
 * Auto-separador de teléfono numérico con límite estricto de 13 dígitos
 * Ejemplo Chile: 56984529911 -> 56 9 8452 9911
 * Con el prefijo '+' fijo al inicio se visualiza como: +56 9 8452 9911
 */
export function formatPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (!digits) return '';

  // Formato para Chile (comienza con 56)
  if (digits.startsWith('56')) {
    if (digits.length <= 2) return digits; // 56
    if (digits.length <= 3) return `${digits.slice(0, 2)} ${digits.slice(2)}`; // 56 9
    if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3)}`; // 56 9 8452
    if (digits.length <= 11) {
      return `${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`; // 56 9 8452 9911
    }
    // 12 o 13 dígitos numéricos
    return `${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)} ${digits.slice(11, 13)}`;
  }

  // Formato internacional general (hasta 13 dígitos numéricos)
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)} ${digits.slice(11, 13)}`.trim();
}

// Función auxiliar para normalizar un documento de MongoDB al formato SupplierRecord del frontend
const normalizeSupplierFromDB = (doc: any): SupplierRecord => ({
  id: doc._id?.toString() || doc.id || `supp_${Date.now()}`,
  companyName: doc.companyName || '',
  productsOffered: doc.productsOffered || '',
  contactName: doc.contactName || '',
  contactRole: doc.contactRole || '',
  orderDays: doc.orderDays || '',
  deliveryDays: doc.deliveryDays || '',
  phone: doc.phone || '',
  email: doc.email || '',
  minimumPurchase: Number(doc.minimumPurchase) || 0,
  website: doc.website || '',
  region: doc.region || doc.address?.region || 'Región de Valparaíso',
  city: doc.city || doc.address?.city || doc.address?.comuna || 'Viña del Mar',
  street: doc.street || doc.address?.street || '',
  number: doc.number || doc.address?.number || 'S/N',
  reference: doc.reference || doc.address?.reference || '',
  postalCode: doc.postalCode || doc.address?.postalCode || '',
  createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
  updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined
});

export const SupplierManagementView: React.FC = () => {
  const { currentUser } = useAuth();

  // Directorio de proveedores conectado a MongoDB
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState<boolean>(true);

  const fetchSuppliers = async () => {
    setIsLoadingSuppliers(true);
    try {
      const response = await api.get('/admin/suppliers');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const normalized = response.data.data.map(normalizeSupplierFromDB);
        setSuppliers(normalized);
        localStorage.setItem('nolimits_suppliers_records', JSON.stringify(normalized));
      }
    } catch (error) {
      console.error('Error cargando proveedores desde MongoDB:', error);
      setStatusMessage({
        type: 'error',
        text: 'Error al conectar con el servidor para obtener los proveedores.'
      });
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Modo de edición
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados de los campos del formulario
  const [companyName, setCompanyName] = useState<string>('');
  const [productsOffered, setProductsOffered] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [contactRole, setContactRole] = useState<string>('');
  const [orderDays, setOrderDays] = useState<string>('Lunes y Miércoles');
  const [deliveryDays, setDeliveryDays] = useState<string>('Martes y Jueves');
  const [phoneRawDigits, setPhoneRawDigits] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [rawMinPurchase, setRawMinPurchase] = useState<string>('150000');
  const [formattedMinPurchase, setFormattedMinPurchase] = useState<string>('150.000');
  const [website, setWebsite] = useState<string>('');

  // Campos de ubicación
  const [region, setRegion] = useState<string>('Región de Valparaíso');
  const [city, setCity] = useState<string>('Viña del Mar');
  const [street, setStreet] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [isNoNumber, setIsNoNumber] = useState<boolean>(false);
  const [reference, setReference] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('2520000');

  // Filtros y búsquedas
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Modales
  const [modalSupplier, setModalSupplier] = useState<SupplierRecord | null>(null); // "Ver más información"
  const [deleteCandidate, setDeleteCandidate] = useState<SupplierRecord | null>(null); // "Eliminar"
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Ciudades disponibles según la región seleccionada en el formulario
  const availableCities = useMemo(() => {
    return CHILE_REGIONS[region] || ['Otra Ciudad'];
  }, [region]);

  // Al cambiar de región, reiniciar ciudad a la primera de la lista
  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    const cities = CHILE_REGIONS[newRegion];
    if (cities && cities.length > 0) {
      setCity(cities[0]);
    }
  };

  // Manejo de input de dinero con auto-separador para mínimo de compra
  const handleMinPurchaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      setRawMinPurchase('');
      setFormattedMinPurchase('');
      return;
    }
    const num = parseInt(val, 10);
    setRawMinPurchase(val);
    setFormattedMinPurchase(num.toLocaleString('es-CL'));
  };

  // Manejo de teléfono: numérico con auto-separador, prefijo '+' fijo al inicio, máx 13 dígitos numéricos
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 13);
    setPhoneRawDigits(digitsOnly);
  };

  // Manejo de número: numérico
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNoNumber) return;
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setNumber(digitsOnly);
  };

  // Manejo de código postal: numérico con límite estricto de 7 caracteres
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 7);
    setPostalCode(digitsOnly);
  };

  // Cargar datos en el formulario para EDITAR
  const handleStartEdit = (supp: SupplierRecord) => {
    setEditingId(supp.id);
    setCompanyName(supp.companyName);
    setProductsOffered(supp.productsOffered);
    setContactName(supp.contactName);
    setContactRole(supp.contactRole);
    setOrderDays(supp.orderDays);
    setDeliveryDays(supp.deliveryDays);
    const phoneDigits = (supp.phone || '').replace(/\D/g, '').slice(0, 13);
    setPhoneRawDigits(phoneDigits);
    setEmail(supp.email);
    setRawMinPurchase(String(supp.minimumPurchase));
    setFormattedMinPurchase(supp.minimumPurchase.toLocaleString('es-CL'));
    setWebsite(supp.website || '');
    setRegion(supp.region);
    setCity(supp.city);
    setStreet(supp.street);
    const cleanNumber = supp.number === 'S/N' ? 'S/N' : (supp.number || '').replace(/\D/g, '');
    setNumber(cleanNumber);
    setIsNoNumber(cleanNumber === 'S/N' || !cleanNumber);
    setReference(supp.reference);
    setPostalCode((supp.postalCode || '').replace(/\D/g, '').slice(0, 7));
    setStatusMessage(null);

    // Scroll suave hacia el formulario
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  // Limpiar formulario
  const resetForm = () => {
    setCompanyName('');
    setProductsOffered('');
    setContactName('');
    setContactRole('');
    setOrderDays('Lunes y Miércoles');
    setDeliveryDays('Martes y Jueves');
    setPhoneRawDigits('');
    setEmail('');
    setRawMinPurchase('100000');
    setFormattedMinPurchase('100.000');
    setWebsite('');
    setRegion('Región de Valparaíso');
    setCity('Viña del Mar');
    setStreet('');
    setNumber('');
    setIsNoNumber(false);
    setReference('');
    setPostalCode('2520000');
  };

  // Guardar (Agregar o Actualizar en MongoDB)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      setStatusMessage({ type: 'error', text: 'Debe ingresar el Nombre de la empresa.' });
      return;
    }

    if (!productsOffered.trim()) {
      setStatusMessage({ type: 'error', text: 'Debe especificar los Productos que ofrece el proveedor.' });
      return;
    }

    if (!contactName.trim()) {
      setStatusMessage({ type: 'error', text: 'Debe ingresar el Nombre de la persona de contacto.' });
      return;
    }

    const minPurchaseNum = parseInt(rawMinPurchase, 10) || 0;
    const finalNumber = isNoNumber ? 'S/N' : (number.trim() ? number.replace(/\D/g, '') : 'S/N');
    const finalPostalCode = postalCode.replace(/\D/g, '').slice(0, 7);
    const finalPhone = phoneRawDigits ? `+${formatPhoneDigits(phoneRawDigits)}` : '';
    const cleanWebsite = website.trim() === 'https://' ? '' : website.trim();

    const payload = {
      companyName: companyName.trim(),
      productsOffered: productsOffered.trim(),
      contactName: contactName.trim(),
      contactRole: contactRole.trim(),
      orderDays: orderDays.trim(),
      deliveryDays: deliveryDays.trim(),
      phone: finalPhone,
      email: email.trim(),
      minimumPurchase: minPurchaseNum,
      website: cleanWebsite,
      region,
      city,
      street: street.trim(),
      number: finalNumber,
      reference: reference.trim(),
      postalCode: finalPostalCode
    };

    try {
      if (editingId) {
        // MODO ACTUALIZAR EN MONGODB (PUT)
        const response = await api.put(`/admin/suppliers/${editingId}`, payload);
        if (response.data?.success) {
          const updatedRecord = normalizeSupplierFromDB(response.data.data);
          const nextList = suppliers.map((s) => (s.id === editingId ? updatedRecord : s));
          setSuppliers(nextList);
          localStorage.setItem('nolimits_suppliers_records', JSON.stringify(nextList));
          setStatusMessage({
            type: 'success',
            text: `✓ ¡Proveedor "${companyName}" actualizado correctamente en MongoDB!`
          });
          setEditingId(null);
          resetForm();
        }
      } else {
        // MODO CREAR EN MONGODB (POST)
        const response = await api.post('/admin/suppliers', payload);
        if (response.data?.success) {
          const createdRecord = normalizeSupplierFromDB(response.data.data);
          const nextList = [createdRecord, ...suppliers];
          setSuppliers(nextList);
          localStorage.setItem('nolimits_suppliers_records', JSON.stringify(nextList));
          setStatusMessage({
            type: 'success',
            text: `✓ ¡Proveedor "${companyName}" registrado con éxito en MongoDB!`
          });
          resetForm();
        }
      }
    } catch (error: any) {
      console.error('Error guardando proveedor en MongoDB:', error);
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.message || 'Ocurrió un error al guardar el proveedor en la base de datos.'
      });
    }
  };

  // Confirmar eliminación en MongoDB (DELETE)
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      const response = await api.delete(`/admin/suppliers/${deleteCandidate.id}`);
      if (response.data?.success) {
        const nextList = suppliers.filter((s) => s.id !== deleteCandidate.id);
        setSuppliers(nextList);
        localStorage.setItem('nolimits_suppliers_records', JSON.stringify(nextList));
        if (editingId === deleteCandidate.id) {
          handleCancelEdit();
        }
        setStatusMessage({
          type: 'success',
          text: `✓ Proveedor "${deleteCandidate.companyName}" eliminado permanentemente de MongoDB.`
        });
      }
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      setStatusMessage({
        type: 'error',
        text: 'No se pudo eliminar el proveedor de la base de datos.'
      });
    } finally {
      setDeleteCandidate(null);
    }
  };

  // Filtrado de proveedores en el directorio
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (regionFilter !== 'all' && s.region !== regionFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          s.companyName.toLowerCase().includes(q) ||
          s.productsOffered.toLowerCase().includes(q) ||
          s.contactName.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [suppliers, regionFilter, searchTerm]);

  return (
    <div className="space-y-4 font-sans text-gray-900 pb-16 relative">
      {isLoadingSuppliers && (
        <div className="
absolute inset-0 z-50 bg-white/70 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#ece9d8] border-2 border-blue-900 p-4 shadow-xl flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-700 animate-spin" />
            <span className="font-bold text-xs text-blue-950">SINCRONIZANDO PROVEEDORES DESDE MONGODB...</span>
          </div>
        </div>
      )}

      <WindowFrame
        title="SUPER_ROOT_SUPPLIERS.SYS - [Gestión & Directorio de Proveedores]"
        icon={<PixelIcon name="folder-open" size={16} />}
        statusBarText={`AUDITORÍA SUPER ADMIN // PROVEEDORES ACTIVOS: ${suppliers.length} // SINCRONIZACIÓN MONGODB OK`}
      >
        <div className="space-y-4">
          {/* Cabecera y Navegación Superior */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Link to="/admin/inventory">
                  <button
                    type="button"
                    className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1 font-semibold"
                    title="Regresar a Gestión de Inventario"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-green-700" />
                    <span>Inventario</span>
                  </button>
                </Link>

                <span
                  className="bg-indigo-700 !text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs tracking-wider uppercase flex items-center gap-1 shadow-xs"
                  style={{ color: '#ffffff' }}
                >
                  <Building2 className="w-3 h-3 text-indigo-200" />
                  <span style={{ color: '#ffffff' }} className="!text-white font-black">
                    CADENA DE SUMINISTRO
                  </span>
                </span>

                <h2 className="text-sm font-extrabold text-[#003c74] uppercase tracking-wide">
                  Crear y Editar Proveedores
                </h2>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Administración de socios comerciales, insumos textiles, herrajes góticos, días de pedido y despacho por región.
              </p>
            </div>
          </div>

          {/* Mensajes de Estado */}
          {statusMessage && (
            <div
              className={`p-2.5 rounded-xs border text-xs flex items-center justify-between ${
                statusMessage.type === 'success'
                  ? 'bg-green-50 border-green-300 text-green-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-gray-500 hover:text-black font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* =================================================================
              COMPONENTE 1: FORMULARIO "CREAR / EDITAR PROVEEDOR"
              Con todos los campos requeridos
              ================================================================= */}
          <div className="bg-[#f0f4f8] border border-[#7f9db9] p-4 winxp-bevel-out space-y-4">
            <div className="flex items-center justify-between border-b border-gray-300 pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-700" />
                <h3 className="font-bold text-xs text-blue-950 uppercase tracking-wide">
                  {editingId ? '★ Editar Información de Proveedor' : 'Formulario: Crear Nuevo Proveedor'}
                </h3>
              </div>
              {editingId && (
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-xs border border-amber-300">
                  Modo Edición Activo
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* SECCIÓN 1: DATOS DE LA EMPRESA & PRODUCTOS */}
              <div className="bg-white border border-gray-300 p-3 rounded-xs space-y-3">
                <div className="font-bold text-blue-900 border-b border-gray-200 pb-1 text-[11px] uppercase flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-700" />
                  <span>1. Datos de la Empresa y Suministros</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Nombre de la empresa */}
                  <div className="space-y-1">
                    <label htmlFor="company-name" className="block font-bold text-gray-800">
                      Nombre de la empresa: <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ej: Textiles Andinos SpA"
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner font-semibold"
                    />
                  </div>

                  {/* Sitio web */}
                  <div className="space-y-1">
                    <label htmlFor="supplier-website" className="block font-bold text-gray-800 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-gray-500" />
                      <span>Sitio web (opcional):</span>
                    </label>
                    <input
                      id="supplier-website"
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.proveedor.cl"
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner font-mono"
                    />
                  </div>

                  {/* Productos que ofrece */}
                  <div className="md:col-span-2 space-y-1">
                    <label htmlFor="products-offered" className="block font-bold text-gray-800">
                      Productos que ofrece: <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="products-offered"
                      type="text"
                      required
                      value={productsOffered}
                      onChange={(e) => setProductsOffered(e.target.value)}
                      placeholder="Ej: Algodón frisado 480 GSM, cierres metálicos dobles, etiquetas cromadas, tintas serigráficas"
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner"
                    />
                    <p className="text-[10px] text-gray-500">
                      Detalle los insumos, telas, piezas o acabados que suministra a NoLimits.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: CONTACTO & CONDICIONES COMERCIALES */}
              <div className="bg-white border border-gray-300 p-3 rounded-xs space-y-3">
                <div className="font-bold text-blue-900 border-b border-gray-200 pb-1 text-[11px] uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-700" />
                  <span>2. Contacto Comercial y Logística de Pedidos</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Nombre persona de contacto */}
                  <div className="space-y-1">
                    <label htmlFor="contact-name" className="block font-bold text-gray-800">
                      Nombre persona de contacto: <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ej: Rodrigo Valenzuela"
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner"
                    />
                  </div>

                  {/* Cargo del contacto */}
                  <div className="space-y-1">
                    <label htmlFor="contact-role" className="block font-bold text-gray-800">
                      Cargo del contacto (opcional):
                    </label>
                    <input
                      id="contact-role"
                      type="text"
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value)}
                      placeholder="Ej: Vendedor, Ejecutivo de Ventas"
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner"
                    />
                  </div>

                  {/* Teléfono */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="supplier-phone" className="block font-bold text-gray-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-500" />
                        <span>Teléfono:</span>
                      </label>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {phoneRawDigits.length}/13 dígitos
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-blue-900 select-none pointer-events-none">
                        +
                      </span>
                      <input
                        id="supplier-phone"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9 ]*"
                        value={phoneRawDigits ? formatPhoneDigits(phoneRawDigits) : ''}
                        onChange={handlePhoneChange}
                        placeholder="56 9 8452 9911"
                        className="w-full bg-white border border-[#7f9db9] pl-6 pr-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner font-mono font-semibold"
                      />
                    </div>
                  </div>

                  {/* Correo */}
                  <div className="space-y-1">
                    <label htmlFor="supplier-email" className="block font-bold text-gray-800 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-500" />
                      <span>Correo (opcional):</span>
                    </label>
                    <input
                      id="supplier-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ventas@proveedor.cl"
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner font-mono"
                    />
                  </div>

                  {/* Días de pedido */}
                  <div className="space-y-1">
                    <label htmlFor="order-days" className="block font-bold text-gray-800 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-700" />
                      <span>Días de pedido:</span>
                    </label>
                    <input
                      id="order-days"
                      type="text"
                      value={orderDays}
                      onChange={(e) => setOrderDays(e.target.value)}
                      placeholder="Ej: Lunes y Miércoles"
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner"
                    />
                  </div>

                  {/* Días de reparto */}
                  <div className="space-y-1">
                    <label htmlFor="delivery-days" className="block font-bold text-gray-800 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-green-700" />
                      <span>Días de reparto:</span>
                    </label>
                    <input
                      id="delivery-days"
                      type="text"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                      placeholder="Ej: Martes y Jueves"
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner"
                    />
                  </div>

                  {/* Mínimo de compra */}
                  <div className="sm:col-span-2 space-y-1">
                    <label htmlFor="min-purchase" className="block font-bold text-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-green-700" />
                        <span>Mínimo de compra ($ CLP):</span>
                      </span>
                      <span className="text-[10px] text-blue-600 font-normal">Auto-separador de miles</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-xs text-gray-500">
                        $
                      </span>
                      <input
                        id="min-purchase"
                        type="text"
                        inputMode="numeric"
                        value={formattedMinPurchase}
                        onChange={handleMinPurchaseChange}
                        placeholder="100.000"
                        className="w-full bg-white border border-[#7f9db9] pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: UBICACIÓN */}
              <div className="bg-white border border-gray-300 p-3 rounded-xs space-y-3">
                <div className="font-bold text-blue-900 border-b border-gray-200 pb-1 text-[11px] uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-700" />
                  <span>3. Ubicación Geográfica</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Seleccione Región */}
                  <div className="space-y-1">
                    <label htmlFor="supplier-region" className="block font-bold text-gray-800">
                      Seleccione Región: <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="supplier-region"
                      value={region}
                      onChange={(e) => handleRegionChange(e.target.value)}
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner font-semibold cursor-pointer"
                    >
                      {Object.keys(CHILE_REGIONS).map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seleccione Ciudad */}
                  <div className="space-y-1">
                    <label htmlFor="supplier-city" className="block font-bold text-gray-800">
                      Seleccione Ciudad: <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="supplier-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner font-semibold cursor-pointer"
                    >
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Calle */}
                  <div className="space-y-1">
                    <label htmlFor="supplier-street" className="block font-bold text-gray-800">
                      Calle:
                    </label>
                    <input
                      id="supplier-street"
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ej: Av. Libertad"
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner"
                    />
                  </div>

                  {/* Número con casilla de 'Sin número' */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="supplier-number" className="block font-bold text-gray-800">
                        Número:
                      </label>
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isNoNumber}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsNoNumber(checked);
                            if (checked) {
                              setNumber('S/N');
                            } else {
                              setNumber('');
                            }
                          }}
                          className="w-3.5 h-3.5 text-blue-600 rounded-xs border-gray-400 focus:ring-0 cursor-pointer"
                        />
                        <span>Sin número (S/N)</span>
                      </label>
                    </div>
                    <input
                      id="supplier-number"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      disabled={isNoNumber}
                      value={isNoNumber ? 'S/N' : number}
                      onChange={handleNumberChange}
                      placeholder={isNoNumber ? 'S/N' : 'Ej: 1420 (solo números)'}
                      className={`w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner font-mono ${
                        isNoNumber ? 'bg-gray-100 text-gray-500 cursor-not-allowed italic font-semibold' : ''
                      }`}
                    />
                  </div>

                  {/* Referencia */}
                  <div className="space-y-1">
                    <label htmlFor="supplier-reference" className="block font-bold text-gray-800">
                      Referencia (opcional):
                    </label>
                    <input
                      id="supplier-reference"
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Ej: Galpón 4, frente a estación metro"
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner"
                    />
                  </div>

                  {/* Código postal (numérico, máx 7 caracteres) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="supplier-postal" className="block font-bold text-gray-800">
                        Código postal (opcional):
                      </label>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {postalCode.length}/7 dígitos
                      </span>
                    </div>
                    <input
                      id="supplier-postal"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={7}
                      value={postalCode}
                      onChange={handlePostalCodeChange}
                      placeholder="Ej: 2520000"
                      className="w-full bg-white border border-[#7f9db9] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-inner font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de Agregar / Actualizar Proveedor */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-gray-300">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="winxp-button text-xs py-1.5 px-4 text-gray-800"
                  >
                    Cancelar Edición
                  </button>
                )}

                <button
                  type="button"
                  onClick={resetForm}
                  className="winxp-button text-xs py-1.5 px-4 text-gray-800"
                >
                  Limpiar Formulario
                </button>

                <button
                  type="submit"
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4 text-blue-800" />
                  <span>{editingId ? 'Actualizar Proveedor' : 'Agregar Proveedor'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* =================================================================
              COMPONENTE 2: DIRECTORIO DE PROVEEDORES REGISTRADOS
              Con botones: (Editar, Ver más información, Eliminar)
              ================================================================= */}
          <div className="bg-white border border-[#7f9db9] p-3 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-800" />
                <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide">
                  Directorio de Proveedores Registrados ({filteredSuppliers.length})
                </h4>
              </div>

              {/* Filtro por región y buscador */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={fetchSuppliers}
                  className="winxp-button text-xs py-1 px-2.5 text-blue-900 flex items-center gap-1 font-semibold"
                  title="Actualizar desde MongoDB"
                >
                  <RefreshCw className={`w-3 h-3 text-blue-700 ${isLoadingSuppliers ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>

                <div className="flex items-center gap-1 bg-white px-2 py-1 border border-gray-400 text-xs shadow-inner">
                  <span className="font-bold text-gray-700 text-[11px]">Región:</span>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="text-xs bg-transparent focus:outline-none cursor-pointer font-bold text-blue-900"
                  >
                    <option value="all">Todas las Regiones</option>
                    {Object.keys(CHILE_REGIONS).map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-white px-2 py-1 border border-gray-400 text-xs shadow-inner w-56">
                  <Search className="w-3 h-3 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar empresa, producto, contacto..."
                    className="w-full text-xs bg-transparent focus:outline-none text-gray-900"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-black font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabla de Proveedores con Botones (Editar, Ver más información, Eliminar) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200">
                <thead className="bg-[#e4ebf5] text-blue-950 font-bold border-b border-gray-300 text-[11px]">
                  <tr>
                    <th className="py-2 px-2.5">Empresa</th>
                    <th className="py-2 px-2.5">Productos que Ofrece</th>
                    <th className="py-2 px-2.5">Persona de Contacto</th>
                    <th className="py-2 px-2.5">Contacto (Fono / Email)</th>
                    <th className="py-2 px-2.5">Ubicación</th>
                    <th className="py-2 px-2.5 text-right">Mínimo Compra</th>
                    <th className="py-2 px-2.5 text-center w-48">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500 italic">
                        No se encontraron proveedores registrados en la base de datos.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supp) => {
                      const isCurrentEditing = editingId === supp.id;
                      return (
                        <tr
                          key={supp.id}
                          className={`transition-colors ${
                            isCurrentEditing
                              ? 'bg-amber-50 font-semibold'
                              : 'hover:bg-blue-50/60'
                          }`}
                        >
                          {/* Empresa */}
                          <td className="py-2 px-2.5">
                            <div className="font-bold text-gray-900 text-xs">
                              {supp.companyName}
                            </div>
                            {supp.website && supp.website !== 'https://' && (
                              <a
                                href={supp.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-700 hover:underline flex items-center gap-0.5 mt-0.5 font-mono"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>{supp.website.replace('https://', '').replace('http://', '')}</span>
                              </a>
                            )}
                          </td>

                          {/* Productos que ofrece */}
                          <td className="py-2 px-2.5 text-[11px] text-gray-700 max-w-xs truncate" title={supp.productsOffered}>
                            {supp.productsOffered}
                          </td>

                          {/* Persona de Contacto & Cargo */}
                          <td className="py-2 px-2.5">
                            <div className="font-bold text-gray-900 text-[11px]">
                              {supp.contactName}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {supp.contactRole || 'Contacto'}
                            </div>
                          </td>

                          {/* Teléfono & Correo */}
                          <td className="py-2 px-2.5 text-[11px] font-mono text-gray-600 whitespace-nowrap">
                            <div>{supp.phone}</div>
                            <div className="text-[10px] text-blue-800">{supp.email}</div>
                          </td>

                          {/* Ubicación (Ciudad / Región) */}
                          <td className="py-2 px-2.5 text-[11px] text-gray-700 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">{supp.city}</div>
                            <div className="text-[10px] text-gray-500">{supp.region}</div>
                          </td>

                          {/* Mínimo de compra */}
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-green-800 text-xs whitespace-nowrap">
                            ${supp.minimumPurchase.toLocaleString('es-CL')} CLP
                          </td>

                          {/* BOTONES REQUERIDOS: Editar, Ver más información, Eliminar */}
                          <td className="py-2 px-2.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {/* 1. Botón "Editar" */}
                              <button
                                type="button"
                                onClick={() => handleStartEdit(supp)}
                                className="winxp-button text-[10px] py-0.5 px-2 text-blue-900 hover:bg-blue-50 font-bold flex items-center gap-1"
                                title="Editar datos del proveedor"
                              >
                                <Edit className="w-3 h-3 text-blue-700" />
                                <span>Editar</span>
                              </button>

                              {/* 2. Botón "Ver más información" */}
                              <button
                                type="button"
                                onClick={() => setModalSupplier(supp)}
                                className="winxp-button text-[10px] py-0.5 px-2 text-gray-800 hover:bg-gray-100 font-bold flex items-center gap-1"
                                title="Ver ficha técnica completa del proveedor"
                              >
                                <Eye className="w-3 h-3 text-indigo-700" />
                                <span>Ver más</span>
                              </button>

                              {/* 3. Botón "Eliminar" */}
                              <button
                                type="button"
                                onClick={() => setDeleteCandidate(supp)}
                                className="winxp-button text-[10px] py-0.5 px-1.5 text-red-700 hover:bg-red-50 hover:border-red-400"
                                title="Eliminar proveedor"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </WindowFrame>

      {/* =================================================================
          MODAL WINDOWS XP: "VER MÁS INFORMACIÓN" DEL PROVEEDOR
          ================================================================= */}
      {modalSupplier && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <WindowFrame
            title={`FICHA DE PROVEEDOR: ${modalSupplier.companyName.toUpperCase()}`}
            icon={<PixelIcon name="info" size={16} />}
            showControls={true}
            onClose={() => setModalSupplier(null)}
            statusBarText="AUDITORÍA DE PROVEEDOR // FICHA TÉCNICA OFICIAL"
            className="max-w-5xl w-full shadow-2xl max-h-[82vh] flex flex-col"
          >
            <div className="p-4 space-y-3.5 font-sans text-xs overflow-y-auto max-h-[calc(82vh-60px)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-2.5">
                <div>
                  <h3 className="font-extrabold text-base md:text-lg text-blue-900 leading-tight">
                    {modalSupplier.companyName}
                  </h3>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Proveedor registrado el {modalSupplier.createdAt.substring(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-900 font-bold px-3 py-1 rounded-xs border border-green-300 text-xs">
                    Mínimo de Compra: ${modalSupplier.minimumPurchase.toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-[#f8fafc] border border-gray-300 p-3 rounded-xs space-y-1.5">
                    <div className="font-bold text-blue-900 text-[11px] uppercase flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-blue-700" />
                      <span>Productos y Suministros Ofrecidos</span>
                    </div>
                    <p className="text-gray-800 leading-relaxed font-medium text-xs break-words">
                      {modalSupplier.productsOffered}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xs space-y-1">
                      <div className="font-bold text-blue-900 text-[10px] uppercase flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-700" />
                        <span>Días de Pedido</span>
                      </div>
                      <div className="font-bold text-gray-900 text-xs leading-normal">{modalSupplier.orderDays || 'No especificado'}</div>
                    </div>

                    <div className="bg-green-50 border border-green-200 p-2.5 rounded-xs space-y-1">
                      <div className="font-bold text-green-900 text-[10px] uppercase flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-green-700" />
                        <span>Días de Reparto / Despacho</span>
                      </div>
                      <div className="font-bold text-gray-900 text-xs leading-normal">{modalSupplier.deliveryDays || 'No especificado'}</div>
                    </div>
                  </div>

                  {modalSupplier.website && modalSupplier.website !== 'https://' && (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xs text-xs">
                      <span className="font-semibold text-gray-700">Sitio Web Oficial:</span>
                      <a
                        href={modalSupplier.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 hover:underline font-mono font-bold flex items-center gap-1 break-all"
                      >
                        <span>{modalSupplier.website}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="bg-[#f8fafc] border border-gray-300 p-3 rounded-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-gray-700 text-[11px] uppercase flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-700" />
                        <span>Contacto Comercial</span>
                      </div>
                      <span className="text-[10px] text-indigo-900 font-bold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-xs">
                        {modalSupplier.contactRole || 'Sin cargo especificado'}
                      </span>
                    </div>
                    <div className="font-extrabold text-gray-900 text-sm">
                      {modalSupplier.contactName}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-gray-200">
                      <div className="flex items-center gap-1.5 text-gray-800">
                        <Phone className="w-3.5 h-3.5 text-green-700 shrink-0" />
                        <span className="break-all">{modalSupplier.phone || 'No registrado'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-800">
                        <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        {modalSupplier.email ? (
                          <a href={`mailto:${modalSupplier.email}`} className="hover:underline break-all">
                            {modalSupplier.email}
                          </a>
                        ) : (
                          <span className="text-gray-400">No registrado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] border border-gray-300 p-3 rounded-xs space-y-2">
                    <div className="font-bold text-blue-900 text-[11px] uppercase flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-700" />
                      <span>Ubicación Física Completa</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div>
                        <span className="text-gray-500 font-semibold block text-[10px] uppercase">Región:</span>
                        <span className="font-bold text-gray-900 block leading-tight">{modalSupplier.region}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold block text-[10px] uppercase">Ciudad / Comuna:</span>
                        <span className="font-bold text-gray-900 block leading-tight">{modalSupplier.city}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold block text-[10px] uppercase">Dirección (Calle y N°):</span>
                        <span className="font-bold text-gray-900 block leading-tight">
                          {modalSupplier.street || 'S/N'} {modalSupplier.number ? `#${modalSupplier.number}` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold block text-[10px] uppercase">Código Postal:</span>
                        <span className="font-mono font-bold text-gray-900 block">
                          {modalSupplier.postalCode || 'Opcional / S/N'}
                        </span>
                      </div>
                      {modalSupplier.reference && (
                        <div className="sm:col-span-2 pt-1 border-t border-gray-200">
                          <span className="text-gray-500 font-semibold block text-[10px] uppercase">Referencia de Entrega:</span>
                          <span className="text-gray-800 italic text-[11px] leading-relaxed block">{modalSupplier.reference}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-gray-300 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleStartEdit(modalSupplier);
                    setModalSupplier(null);
                  }}
                  className="winxp-button text-xs py-1.5 px-4 font-bold text-blue-900 flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-blue-700" />
                  <span>Editar este Proveedor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalSupplier(null)}
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </WindowFrame>
        </div>
      )}

      {/* =================================================================
          MODAL WINDOWS XP: CONFIRMAR ELIMINACIÓN DE PROVEEDOR
          ================================================================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <WindowFrame
            title="DIRECTORIO - [Confirmar Eliminación de Proveedor]"
            icon={<PixelIcon name="warning" size={16} />}
            showControls={true}
            onClose={() => setDeleteCandidate(null)}
            statusBarText="ATENCIÓN: ELIMINACIÓN PERMANENTE DEL DIRECTORIO"
            className="max-w-md w-full shadow-2xl"
          >
            <div className="p-4 space-y-3 font-sans text-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-7 h-7 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-blue-900">
                    ¿Desea eliminar a este proveedor?
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    Se eliminará permanentemente la ficha de <strong className="text-red-900">{deleteCandidate.companyName}</strong> ({deleteCandidate.city}) de la base de datos de NoLimits.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-300 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  className="winxp-button text-xs py-1.5 px-4 text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-red-950 bg-red-100 border border-red-600 hover:bg-red-200"
                >
                  Eliminar Proveedor
                </button>
              </div>
            </div>
          </WindowFrame>
        </div>
      )}
    </div>
  );
};