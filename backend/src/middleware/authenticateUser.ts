// backend/src/middleware/authenticateUser.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { UserModel, IUser } from '../models/User.model';
import { BranchModel, IBranch } from '../models/Branch.model';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '../utils/tokenUtils';

// Extendemos la interfaz Request de Express para incluir
// el usuario autenticado y la sucursal verificada.
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      sucursal?: IBranch | null;
      branch?: IBranch | null;
    }
  }
}

/**
 * Extrae el token JWT desde la cookie HttpOnly o desde el encabezado Authorization Bearer.
 */
const extractTokenFromRequest = (req: Request): string | null => {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.trim()) {
    return cookieToken.trim();
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) {
      return bearerToken;
    }
  }

  return null;
};

// =========================================================
// AUTENTICACIÓN DEL USUARIO (NO LIMITS)
// =========================================================
// Este middleware comprueba que:
// - Exista una cookie de sesión o token Bearer.
// - El JWT sea válido (firma, expiración, issuer, audience).
// - El usuario continúe existiendo en MongoDB.
// - La cuenta permanezca activa (isActive: true).
// - La sesión no haya sido invalidada (tokenVersion).
// - Si es 'branch_admin', su sucursal asignada (branchId) exista y continúe activa.
const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // =====================================================
    // 1. OBTENEMOS EL TOKEN
    // =====================================================
    const token = extractTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Debes iniciar sesión',
      });
    }

    // =====================================================
    // 2. VERIFICAMOS EL JWT
    // =====================================================
    const decoded = verifyAuthToken(token);

    // =====================================================
    // 3. VALIDAMOS EL IDENTIFICADOR
    // =====================================================
    if (!mongoose.isObjectIdOrHexString(decoded.sub)) {
      return res.status(401).json({
        success: false,
        message: 'La sesión no es válida',
      });
    }

    // =====================================================
    // 4. BUSCAMOS EL USUARIO ACTUAL EN MONGODB
    // =====================================================
    const user = await UserModel.findById(decoded.sub).select('+tokenVersion');

    // =====================================================
    // 5. VALIDAMOS LA CUENTA
    // =====================================================
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'La sesión no es válida',
      });
    }

    // =====================================================
    // 6. VALIDAMOS LA VERSIÓN DEL TOKEN
    // =====================================================
    const currentTokenVersion =
      typeof user.tokenVersion === 'number' ? user.tokenVersion : 0;

    if (currentTokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'La sesión no es válida',
      });
    }

    // =====================================================
    // 7. VALIDAMOS LA SUCURSAL SEGÚN EL ROL EN NO LIMITS
    // =====================================================
    // En No Limits:
    // - 'registered' (cliente): no pertenece a una sucursal física (branchId es null).
    // - 'branch_admin': debe tener obligatoriamente un branchId activo en la colección 'branches'.
    // - 'super_admin': tiene alcance global (puede tener branchId 'branch-corporativo' o null).
    if (user.role === 'branch_admin') {
      if (!user.branchId) {
        return res.status(401).json({
          success: false,
          message: 'La cuenta de administrador de sucursal no tiene una sede asignada',
        });
      }

      const activeBranch = await BranchModel.findOne({
        _id: user.branchId,
        isActive: true,
      });

      if (!activeBranch) {
        return res.status(401).json({
          success: false,
          message: 'La sucursal asignada a esta cuenta no está activa',
        });
      }

      req.sucursal = activeBranch;
      req.branch = activeBranch;
    } else if (user.branchId) {
      const assignedBranch = await BranchModel.findOne({
        _id: user.branchId,
        isActive: true,
      });
      req.sucursal = assignedBranch || null;
      req.branch = assignedBranch || null;
    }

    // =====================================================
    // 8. GUARDAMOS EL USUARIO AUTENTICADO
    // =====================================================
    req.user = user;

    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: 'La sesión no es válida o ha expirado',
    });
  }
};

export default authenticateUser;
export { authenticateUser };
