import crypto from 'node:crypto';
import { env } from '../config/env';

/**
 * Encripta una contraseña en texto plano usando scrypt + salt aleatorio.
 */
export const hashPassword = (plainPassword: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
};

/**
 * Verifica una contraseña en texto plano contra el passwordHash guardado en MongoDB.
 */
export const verifyPassword = (plainPassword: string, storedHash?: string | null): boolean => {
  if (!storedHash) return false;

  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, keyHex] = parts;
    const derivedBuffer = crypto.scryptSync(plainPassword, salt, 64);
    const keyBuffer = Buffer.from(keyHex, 'hex');
    if (derivedBuffer.length !== keyBuffer.length) return false;
    return crypto.timingSafeEqual(derivedBuffer, keyBuffer);
  }

  // Soporte de compatibilidad para hashes de demostración o texto directo en entorno dev
  return storedHash === plainPassword;
};

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'registered' | 'branch_admin' | 'super_admin';
  branchId?: string | null;
  exp: number;
}

/**
 * Genera un token firmado HMAC-SHA256 (formato JWT estándar de 3 partes).
 */
export const signToken = (payload: Omit<JwtPayload, 'exp'>, expiresInHours = 72): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const fullPayload: JwtPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInHours * 3600,
  };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
};

/**
 * Verifica y decodifica un token firmado.
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as JwtPayload;
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};
