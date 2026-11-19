/**
 * Utilidad para normalizar y validar RUT chileno en el Backend
 */
export const normalizeRut = (rut: string): string => {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};
