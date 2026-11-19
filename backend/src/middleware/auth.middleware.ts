import authenticateUser from './authenticateUser';
import authorizeRoles from './authorizeRoles';
import authorizeSucursal from './authorizeSucursal';
import validateRequestOrigin from './validateRequestOrigin';
import { UserRoleType } from '../models/User.model';

/**
 * Re-exporta los middlewares de seguridad principales y mantiene
 * alias compatibles (authenticate, requireRole).
 */
export const authenticate = authenticateUser;

export const requireRole = (allowedRoles: UserRoleType[]) =>
  authorizeRoles(...allowedRoles);

export {
  authenticateUser,
  authorizeRoles,
  authorizeSucursal,
  validateRequestOrigin,
};
