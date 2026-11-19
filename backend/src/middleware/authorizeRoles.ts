/* ========================================================= */
/* MIDDLEWARE DE AUTORIZACIÓN POR ROLES (NO LIMITS)          */
/* ========================================================= */
// Este middleware comprueba si el usuario autenticado
// tiene permiso para acceder a una ruta determinada.
//
// IMPORTANTE:
// authenticateUser debe ejecutarse primero,
// porque es quien obtiene el usuario desde
// la sesión y lo incorpora a req.user.

import { Request, Response, NextFunction } from 'express';
import { UserRoleType } from '../models/User.model';

const authorizeRoles = (...allowedRoles: UserRoleType[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    // =================================================
    // 1. COMPROBAR AUTENTICACIÓN
    // =================================================
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Debes iniciar sesión para acceder a este recurso',
      });
    }

    // =================================================
    // 2. OBTENER ROL ACTUAL DESDE EL USUARIO VERIFICADO
    // =================================================
    const userRole = req.user.role;

    // =================================================
    // 3. COMPROBAR AUTORIZACIÓN
    // =================================================
    const hasPermission = allowedRoles.includes(userRole);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta operación',
      });
    }

    // =================================================
    // 4. AUTORIZACIÓN CORRECTA
    // =================================================
    return next();
  };
};

export default authorizeRoles;
export { authorizeRoles };
