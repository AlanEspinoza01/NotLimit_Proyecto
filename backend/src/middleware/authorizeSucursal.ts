// =========================================================
// AUTORIZACIÓN DE ACCESO A UNA SUCURSAL (NO LIMITS)
// =========================================================
// Uso previsto (después de authenticateUser y authorizeRoles):
// router.get('/:sucursalId/...', authenticateUser,
//   authorizeRoles('branch_admin', 'super_admin'),
//   authorizeSucursal(), controlador);
//
// La sucursal siempre se identifica mediante un parámetro
// explícito de la ruta. Nunca se elige silenciosamente desde
// req.body, req.query o la sucursal del usuario.

import { Request, Response, NextFunction } from 'express';
import { BranchModel } from '../models/Branch.model';

// En No Limits, los _id de la colección 'branches' son strings semánticos
// como 'branch-santiago-centro', 'branch-la-serena', 'branch-ovalle', 'branch-corporativo'.
const isValidBranchIdFormat = (value: unknown): value is string => {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{2,64}$/.test(value.trim());
};

export interface AuthorizeSucursalOptions {
  param?: string;
}

const authorizeSucursal = ({ param = 'sucursalId' }: AuthorizeSucursalOptions = {}) => {
  if (typeof param !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(param)) {
    throw new TypeError('El nombre del parámetro de sucursal no es válido');
  }

  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Debes iniciar sesión para acceder a este recurso',
        });
      }

      // No aceptamos identificadores proporcionados a través de
      // cuerpos o consultas, ni usamos una sede por defecto.
      const rawParam = req.params?.[param];
      const requestedId = Array.isArray(rawParam) ? rawParam[0] : rawParam;

      if (!isValidBranchIdFormat(requestedId)) {
        return res.status(400).json({
          success: false,
          message: 'El identificador de la sucursal no es válido',
        });
      }

      const normalizedBranchId = requestedId.trim();

      // Verificamos permisos según el rol en No Limits:
      // - 'branch_admin': solo puede acceder a su propia sucursal (req.user.branchId === normalizedBranchId).
      // - 'super_admin': puede supervisar y operar cualquier sucursal activa de la red.
      // - 'registered': no tiene acceso administrativo a sucursales.
      const isSuperAdmin = req.user.role === 'super_admin';
      const isAssignedBranchAdmin =
        req.user.role === 'branch_admin' && req.user.branchId === normalizedBranchId;

      if (!isSuperAdmin && !isAssignedBranchAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta sucursal',
        });
      }

      // Consultamos el estado actual de la sucursal en MongoDB.
      const sucursal = await BranchModel.findOne({
        _id: normalizedBranchId,
        isActive: true,
      }).select('_id code name city region address phone isActive isCorporate allowPickup');

      if (!sucursal) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta sucursal',
        });
      }

      // El controlador ya no necesita volver a interpretar un ID del cliente.
      req.sucursal = sucursal;
      req.branch = sucursal;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export default authorizeSucursal;
export { authorizeSucursal };
