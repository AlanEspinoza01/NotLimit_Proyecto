import { Product } from '../../types';

export const PHONE_PREFIX_OPTIONS = [
  { value: '+56 9', label: '+56 9 (Chile Móvil)' },
  { value: '+56 2', label: '+56 2 (Chile Fijo)' },
  { value: '+54', label: '+54 (Argentina)' },
  { value: '+51', label: '+51 (Perú)' },
  { value: '+57', label: '+57 (Colombia)' },
  { value: '+55', label: '+55 (Brasil)' },
  { value: '+52', label: '+52 (México)' },
  { value: '+34', label: '+34 (España)' },
  { value: '+1', label: '+1 (USA/Canadá)' }
];

// Detectar si una categoría es de vestuario que usa tallas
export const isApparelCategory = (categoryName?: string): boolean => {
  if (!categoryName) return false;
  const c = categoryName.toLowerCase();
  return (
    c.includes('poleron') ||
    c.includes('hoodie') ||
    c.includes('chaqueta') ||
    c.includes('pantalon') ||
    c.includes('pantalón') ||
    c.includes('cargo') ||
    c.includes('polera') ||
    c.includes('top') ||
    c.includes('camisa') ||
    c.includes('short') ||
    c.includes('zapatilla') ||
    c.includes('calzado')
  );
};

// Determinar si una prenda debe mostrar talla (excluye cadenas, bolsos, accesorios sin tallas)
export const hasApparelSize = (product: Product, size?: string): boolean => {
  if (!product.sizes || product.sizes.length === 0) return false;
  if (!isApparelCategory(product.category)) return false;
  if (!size || size === 'Única' || size === 'Sin Talla') return false;
  return true;
};

// Función para dar formato automático al RUT chileno con puntos y guion:
// - Acepta dígitos (0-9) y letra 'k' o 'K' como dígito verificador al final
// - Formatea siempre el dígito verificador en mayúscula (ej: 12.345.678-K)
export const formatRutNumbers = (rawVal: string): string => {
  const cleaned = rawVal.replace(/[^0-9kK]/g, '').slice(0, 9);
  if (!cleaned) return '';
  if (cleaned.length === 1) return cleaned.toUpperCase();
  const dv = cleaned.slice(-1).toUpperCase();
  const body = cleaned.slice(0, -1).replace(/\D/g, '');
  if (!body) return dv;
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
};

// Validación de correo: debe ser real y terminar estrictamente con @gmail.com
export const isGmailValid = (email: string): boolean => {
  const trimmed = email.trim().toLowerCase();
  return (
    trimmed.endsWith('@gmail.com') &&
    trimmed.length > '@gmail.com'.length &&
    !trimmed.includes(' ') &&
    /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(trimmed)
  );
};
