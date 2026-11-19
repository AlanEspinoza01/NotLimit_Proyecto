import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel, IUser } from '../models/User.model';
import { BranchModel } from '../models/Branch.model';
import { ApiError } from '../utils/ApiError';
import {
  BCRYPT_ROUNDS,
  hashPassword,
  comparePassword,
  PasswordValidationError,
} from '../utils/passwordUtils';
import { generateAuthToken } from '../utils/tokenUtils';
import {
  MAX_LOGIN_ATTEMPTS,
  ACCOUNT_LOCK_TIME_MS,
} from '../config/loginSecurityPolicy';

/**
 * Transforma un documento de usuario de MongoDB (UserModel) al formato esperado por el FrontEnd.
 */
export const serializeUser = (userDoc: IUser) => {
  const fullName =
    `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim() ||
    userDoc.email.split('@')[0];

  return {
    id: String(userDoc._id),
    firstName: userDoc.firstName,
    lastName: userDoc.lastName || '',
    name: fullName,
    email: userDoc.email,
    rut: userDoc.rut || '',
    phone: userDoc.phone || '',
    avatarUrl: userDoc.avatarUrl || '',
    role: userDoc.role,
    branchId: userDoc.branchId || undefined,
    loyaltyPoints: userDoc.loyaltyPoints ?? 0,
    lastPointsReason: userDoc.lastPointsReason || '',
    tags: userDoc.tags || ['Normal'],
    totalOrdersCount: userDoc.totalOrdersCount ?? 0,
    totalSpentClp: userDoc.totalSpentClp ?? 0,
    isActive: userDoc.isActive ?? true,
    wishlistProductIds: (userDoc.wishlistProductIds || []).map((id) => String(id)),
    addresses: userDoc.addresses || [],
    preferentialReports: userDoc.preferentialReports || [],
    blacklistReports: userDoc.blacklistReports || [],
    createdAt: userDoc.createdAt
      ? userDoc.createdAt.toISOString()
      : new Date().toISOString(),
  };
};

/**
 * Garantiza que existan las sucursales y cuentas base en MongoDB (super_admin, branch_admins y clientes)
 * para que la validación de sucursales activas en authenticateUser funcione desde el primer inicio.
 */
export const ensureBaseUsersSeeded = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 1) return;

  const baseBranches = [
    {
      _id: 'branch-corporativo',
      name: 'Casa Matriz Corporativa (Global)',
      code: 'CORP-00',
      city: 'Santiago',
      region: 'Región Metropolitana',
      address: 'Av. Providencia 1208, Piso 14',
      phone: '+56 9 0000 0001',
      managerName: 'Root Administrator',
      adminEmail: 'root@nolimits.cl',
      adminRut: '16.111.222-3',
      allowPickup: false,
      isActive: true,
      isCorporate: true,
    },
    {
      _id: 'vina_del_mar',
      name: 'Viña del Mar Central Hub',
      code: 'VINA-01',
      city: 'Viña del Mar',
      region: 'Valparaíso',
      address: 'Av. Libertad 450, Local 12',
      phone: '+56 9 8452 1190',
      managerName: 'Sebastián Valdés',
      adminEmail: 'admin.vina@nolimits.cl',
      adminRut: '17.432.890-3',
      allowPickup: true,
      isActive: true,
      isCorporate: false,
    },
    {
      _id: 'valparaiso',
      name: 'Valparaíso Puerto Cyber Lab',
      code: 'VALPO-02',
      city: 'Valparaíso',
      region: 'Valparaíso',
      address: 'Calle Condell 1190',
      phone: '+56 9 7312 9044',
      managerName: 'Camila Rojas',
      adminEmail: 'valpo@nolimits.cl',
      adminRut: '18.221.334-5',
      allowPickup: true,
      isActive: true,
      isCorporate: false,
    },
    {
      _id: 'quilpue',
      name: 'Quilpué Urbano Showroom',
      code: 'QUIL-03',
      city: 'Quilpué',
      region: 'Valparaíso',
      address: 'Av. Los Carrera 820',
      phone: '+56 9 6128 4402',
      managerName: 'Martín Araya',
      adminEmail: 'quilpue@nolimits.cl',
      adminRut: '18.998.776-1',
      allowPickup: true,
      isActive: true,
      isCorporate: false,
    },
  ];

  for (const b of baseBranches) {
    const existingBranch = await BranchModel.findById(b._id);
    if (!existingBranch) {
      await BranchModel.create(b);
    }
  }

  const baseAccounts = [
    {
      firstName: 'Root',
      lastName: 'Administrator',
      email: 'root@nolimits.cl',
      rut: '16.111.222-3',
      passwordPlain: 'admin123',
      phone: '+56 9 0000 0001',
      role: 'super_admin' as const,
      branchId: 'branch-corporativo',
      loyaltyPoints: 0,
      tags: ['Normal'],
    },
    {
      firstName: 'Sebastián',
      lastName: 'Valdés',
      email: 'admin.vina@nolimits.cl',
      rut: '17.432.890-3',
      passwordPlain: 'admin123',
      phone: '+56 9 8452 1190',
      role: 'branch_admin' as const,
      branchId: 'vina_del_mar',
      loyaltyPoints: 0,
      tags: ['Normal'],
    },
    {
      firstName: 'Carlos',
      lastName: 'López',
      email: 'carlos.lopez@nolimits.cl',
      rut: '15.123.456-7',
      passwordPlain: 'admin123',
      phone: '+56 9 1234 5678',
      role: 'branch_admin' as const,
      branchId: 'vina_del_mar',
      loyaltyPoints: 0,
      tags: ['Normal'],
    },
    {
      firstName: 'Camila',
      lastName: 'Rojas',
      email: 'valpo@nolimits.cl',
      rut: '18.221.334-5',
      passwordPlain: 'admin123',
      phone: '+56 9 7312 9044',
      role: 'branch_admin' as const,
      branchId: 'valparaiso',
      loyaltyPoints: 0,
      tags: ['Normal'],
    },
    {
      firstName: 'Martín',
      lastName: 'Araya',
      email: 'quilpue@nolimits.cl',
      rut: '18.998.776-1',
      passwordPlain: 'admin123',
      phone: '+56 9 6128 4402',
      role: 'branch_admin' as const,
      branchId: 'quilpue',
      loyaltyPoints: 0,
      tags: ['Normal'],
    },
    {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
      rut: '12.345.678-9',
      passwordPlain: '123456',
      phone: '+56 9 1234 5678',
      role: 'registered' as const,
      branchId: null,
      loyaltyPoints: 150,
      tags: ['Normal'],
    },
    {
      firstName: 'Valeria',
      lastName: 'Neo-Goth',
      email: 'valeria.k@gmail.com',
      rut: '19.824.112-K',
      passwordPlain: '123456',
      phone: '+56 9 9123 4567',
      role: 'registered' as const,
      branchId: null,
      loyaltyPoints: 1340,
      tags: ['Normal'],
    },
  ];

  for (const acc of baseAccounts) {
    const existing = await UserModel.findOne({ email: acc.email }).select('+passwordHash');
    if (!existing) {
      const hashed = await bcrypt.hash(acc.passwordPlain, BCRYPT_ROUNDS);
      await UserModel.create({
        firstName: acc.firstName,
        lastName: acc.lastName,
        email: acc.email,
        rut: acc.rut,
        passwordHash: hashed,
        tokenVersion: 0,
        failedLoginAttempts: 0,
        lockUntil: null,
        phone: acc.phone,
        role: acc.role,
        branchId: acc.branchId,
        loyaltyPoints: acc.loyaltyPoints,
        tags: acc.tags,
        isActive: true,
      });
    } else if (
      existing.passwordHash &&
      existing.passwordHash.startsWith('scrypt$')
    ) {
      // Migrar automáticamente hashes antiguos scrypt$ a bcrypt
      existing.passwordHash = await bcrypt.hash(acc.passwordPlain, BCRYPT_ROUNDS);
      await existing.save();
    }
  }
};

/**
 * Servicio de Login contra MongoDB (colección `users`)
 * Incluye protección por intentos fallidos (MAX_LOGIN_ATTEMPTS) y bloqueo temporal (ACCOUNT_LOCK_TIME_MS).
 */
export const loginUserService = async (email: string, password?: string) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new ApiError(400, 'Debes ingresar tu correo electrónico y contraseña.');
  }

  await ensureBaseUsersSeeded();

  let user = await UserModel.findOne({ email: normalizedEmail }).select(
    '+passwordHash +tokenVersion +failedLoginAttempts +lockUntil'
  );

  // Si no existe en users pero coincide con el adminEmail de una sucursal en branches, lo aprovisionamos
  if (!user && mongoose.connection.readyState === 1) {
    const branch = await BranchModel.findOne({ adminEmail: normalizedEmail });
    if (branch) {
      const nameParts = (branch.managerName || 'Administrador Sucursal')
        .trim()
        .split(' ');
      const firstName = nameParts[0] || 'Admin';
      const lastName = nameParts.slice(1).join(' ');
      const defaultHash = await bcrypt.hash(password || 'admin123', BCRYPT_ROUNDS);
      user = await UserModel.create({
        firstName,
        lastName,
        email: normalizedEmail,
        rut: branch.adminRut || undefined,
        passwordHash: defaultHash,
        tokenVersion: 0,
        failedLoginAttempts: 0,
        lockUntil: null,
        phone: branch.phone || '',
        role: branch.isCorporate ? 'super_admin' : 'branch_admin',
        branchId: String(branch._id),
        loyaltyPoints: 0,
        tags: ['Normal'],
        isActive: true,
      });
    }
  }

  if (!user || !user.passwordHash) {
    throw new ApiError(401, 'Credenciales inválidas. Verifica tu correo y contraseña.');
  }

  if (user.isActive === false) {
    throw new ApiError(403, 'Esta cuenta de usuario se encuentra desactivada.');
  }

  // Verificar si la cuenta está temporalmente bloqueada por exceso de intentos fallidos
  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    const remainingMinutes = Math.max(
      1,
      Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000)
    );
    throw new ApiError(
      423,
      `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta nuevamente en ${remainingMinutes} minuto(s).`
    );
  }

  // Verificar contraseña con bcrypt (soportando placeholders de ejemplo si existen en semillas manuales)
  const isBcryptPlaceholder = user.passwordHash.startsWith('$2b$10$Ejemplo');
  const passwordMatches = isBcryptPlaceholder
    ? true
    : await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    const nextAttempts = (user.failedLoginAttempts || 0) + 1;

    if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.failedLoginAttempts = 0;
      user.lockUntil = new Date(Date.now() + ACCOUNT_LOCK_TIME_MS);
      await user.save();
      throw new ApiError(
        423,
        'Has superado el máximo de intentos permitidos. Tu cuenta ha sido bloqueada por 15 minutos.'
      );
    }

    user.failedLoginAttempts = nextAttempts;
    await user.save();

    const remainingAttempts = MAX_LOGIN_ATTEMPTS - nextAttempts;
    throw new ApiError(
      401,
      `Credenciales inválidas. Te quedan ${remainingAttempts} intento(s) antes del bloqueo temporal.`
    );
  }

  // Si inició sesión correctamente, limpiamos contadores de bloqueo si existían
  if ((user.failedLoginAttempts && user.failedLoginAttempts > 0) || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
  }

  const serialized = serializeUser(user);
  const token = generateAuthToken({
    userId: serialized.id,
    tokenVersion: user.tokenVersion ?? 0,
  });

  return { user: serialized, token };
};

/**
 * Servicio de Registro de nuevo cliente en MongoDB (`users`)
 * Valida la complejidad de la contraseña mediante passwordUtils.ts y la cifra con bcrypt.
 */
export const registerUserService = async (payload: {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  rut?: string;
  phone?: string;
}) => {
  const normalizedEmail = (payload.email || '').trim().toLowerCase();
  if (!normalizedEmail || !payload.password) {
    throw new ApiError(400, 'Debes ingresar nombre, correo y contraseña.');
  }

  if (!normalizedEmail.endsWith('@gmail.com')) {
    throw new ApiError(400, 'El correo electrónico debe terminar en @gmail.com');
  }

  const existingEmail = await UserModel.findOne({ email: normalizedEmail });
  if (existingEmail) {
    throw new ApiError(
      409,
      'Ya existe una cuenta registrada con ese correo electrónico.'
    );
  }

  if (payload.rut && payload.rut.trim()) {
    const existingRut = await UserModel.findOne({ rut: payload.rut.trim() });
    if (existingRut) {
      throw new ApiError(409, 'Ya existe un usuario registrado con este RUT.');
    }
  }

  let hashedPassword: string;
  try {
    hashedPassword = await hashPassword(payload.password);
  } catch (err) {
    const pwdErr = err as PasswordValidationError;
    if (pwdErr.code === 'INVALID_PASSWORD') {
      throw new ApiError(400, pwdErr.message);
    }
    throw err;
  }

  let firstName = (payload.firstName || '').trim();
  let lastName = (payload.lastName || '').trim();

  if (!firstName && payload.name) {
    const parts = payload.name.trim().split(/\s+/);
    firstName = parts[0] || normalizedEmail.split('@')[0];
    lastName = parts.slice(1).join(' ');
  }
  if (!firstName) {
    firstName = normalizedEmail.split('@')[0];
  }

  const newUser = await UserModel.create({
    firstName,
    lastName,
    email: normalizedEmail,
    rut: payload.rut && payload.rut.trim() ? payload.rut.trim() : undefined,
    passwordHash: hashedPassword,
    tokenVersion: 0,
    failedLoginAttempts: 0,
    lockUntil: null,
    phone: payload.phone || '',
    role: 'registered',
    branchId: null,
    loyaltyPoints: 100,
    lastPointsReason: 'Bono de bienvenida por registro en No Limits',
    tags: ['Normal'],
    isActive: true,
  });

  const serialized = serializeUser(newUser);
  const token = generateAuthToken({
    userId: serialized.id,
    tokenVersion: 0,
  });

  return { user: serialized, token };
};

/**
 * Servicio de autenticación con Google en MongoDB (`users`)
 */
export const googleAuthUserService = async (payload: {
  email?: string;
  name?: string;
  googleId?: string;
  avatarUrl?: string;
}) => {
  const normalizedEmail = (
    payload.email || 'sebastian.stream@gmail.com'
  )
    .trim()
    .toLowerCase();
  const googleId = payload.googleId || `google_${normalizedEmail}`;

  let user = await UserModel.findOne({
    $or: [{ googleId }, { email: normalizedEmail }],
  }).select('+tokenVersion');

  if (!user) {
    const nameParts = (payload.name || 'Sebastián Cyber Guest')
      .trim()
      .split(/\s+/);
    const firstName = nameParts[0] || 'Usuario';
    const lastName = nameParts.slice(1).join(' ');

    user = await UserModel.create({
      firstName,
      lastName,
      email: normalizedEmail,
      googleId,
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
      avatarUrl:
        payload.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'registered',
      branchId: null,
      loyaltyPoints: 150,
      lastPointsReason: 'Bono de bienvenida con Google Auth',
      tags: ['Normal'],
      isActive: true,
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    if (payload.avatarUrl && !user.avatarUrl) {
      user.avatarUrl = payload.avatarUrl;
    }
    await user.save();
  }

  const serialized = serializeUser(user);
  const token = generateAuthToken({
    userId: serialized.id,
    tokenVersion: user.tokenVersion ?? 0,
  });

  return { user: serialized, token };
};

/**
 * Obtiene el perfil actualizado desde MongoDB por su ID
 */
export const getUserByIdService = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'ID de usuario inválido.');
  }
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(404, 'Usuario no encontrado en la base de datos.');
  }
  return serializeUser(user);
};

/**
 * Actualiza los datos de perfil, direcciones o puntos de un usuario en MongoDB
 */
export const updateUserProfileService = async (
  userId: string,
  data: Record<string, any>
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'ID de usuario inválido.');
  }

  const updateFields: Record<string, any> = {};

  if (data.firstName !== undefined)
    updateFields.firstName = String(data.firstName).trim();
  if (data.lastName !== undefined)
    updateFields.lastName = String(data.lastName).trim();
  if (!data.firstName && data.name !== undefined) {
    const parts = String(data.name).trim().split(/\s+/);
    updateFields.firstName = parts[0] || 'Usuario';
    updateFields.lastName = parts.slice(1).join(' ');
  }
  if (data.rut !== undefined && String(data.rut).trim() !== '') {
    updateFields.rut = String(data.rut).trim();
  }
  if (data.phone !== undefined) updateFields.phone = String(data.phone).trim();
  if (data.avatarUrl !== undefined)
    updateFields.avatarUrl = String(data.avatarUrl);
  if (data.loyaltyPoints !== undefined)
    updateFields.loyaltyPoints = Number(data.loyaltyPoints);
  if (data.lastPointsReason !== undefined)
    updateFields.lastPointsReason = String(data.lastPointsReason);
  if (Array.isArray(data.addresses)) updateFields.addresses = data.addresses;
  if (Array.isArray(data.tags)) updateFields.tags = data.tags;

  const updated = await UserModel.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new ApiError(404, 'Usuario no encontrado para actualizar.');
  }

  return serializeUser(updated);
};
