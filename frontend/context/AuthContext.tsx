import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../api/axios';

export type RoleType = User['role'];

const AUTH_STORAGE_KEY = 'nolimits_auth_user';
const TOKEN_STORAGE_KEY = 'nolimits_auth_token';

const GUEST_USER: User = {
  id: 'guest_user',
  name: 'Invitado',
  email: '',
  role: 'guest',
  loyaltyPoints: 0,
  createdAt: new Date().toISOString()
};

export interface RegisterPayload {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  rut?: string;
  phone?: string;
}

export interface AuthContextType {
  currentUser: User | null;
  currentRole: RoleType;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  loginWithGoogle: (payload?: { email?: string; name?: string; googleId?: string; avatarUrl?: string }) => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (role: RoleType) => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  addLoyaltyPoints: (points: number, reason?: string) => Promise<void>;
  deductLoyaltyPoints: (points: number, reason?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.user && isMounted) {
          setCurrentUser(res.data.user);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.data.user));
        }
      } catch {
        // Si no hay cookie activa o expiró, mantenemos el estado local o invitado
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    const loggedUser: User = res.data.user;
    if (res.data.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, res.data.token);
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
    setCurrentUser(loggedUser);
    return loggedUser;
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    const res = await api.post('/auth/register', payload);
    const newUser: User = res.data.user;
    if (res.data.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, res.data.token);
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    setCurrentUser(newUser);
    return newUser;
  };

  const loginWithGoogle = async (payload?: {
    email?: string;
    name?: string;
    googleId?: string;
    avatarUrl?: string;
  }): Promise<User> => {
    const res = await api.post('/auth/google', payload || {});
    const googleUser: User = res.data.user;
    if (res.data.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, res.data.token);
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(googleUser));
    setCurrentUser(googleUser);
    return googleUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
  };

  const switchRole = (role: RoleType) => {
    if (role === 'guest') {
      setCurrentUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    const baseUser: User = currentUser || {
      ...GUEST_USER,
      id: `usr_${role}`,
      name: role === 'super_admin' ? 'Root Administrator' : role === 'branch_admin' ? 'Admin Sucursal' : 'Cliente Registrado',
      email: role === 'super_admin' ? 'root@nolimits.cl' : 'cliente@nolimits.cl',
      role
    };
    const updated = { ...baseUser, role };
    setCurrentUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    const active = currentUser || GUEST_USER;
    const optimisticUser: User = { ...active, ...updates };
    setCurrentUser(optimisticUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(optimisticUser));

    if (active.id && !active.id.startsWith('guest')) {
      try {
        const res = await api.put(`/auth/profile/${active.id}`, updates);
        if (res.data?.user) {
          setCurrentUser(res.data.user);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Error actualizando perfil en MongoDB:', err);
      }
    }
  };

  const addLoyaltyPoints = async (points: number, reason = 'Bonificación Club NoLimits'): Promise<void> => {
    const active = currentUser || GUEST_USER;
    const nextPoints = Math.max(0, (active.loyaltyPoints || 0) + points);
    await updateProfile({
      loyaltyPoints: nextPoints,
      lastPointsReason: reason
    } as Partial<User>);
  };

  const deductLoyaltyPoints = (points: number, reason = 'Canje de Cupón Club NoLimits'): boolean => {
    if (!currentUser) return false;
    const currentPts = currentUser.loyaltyPoints || 0;
    if (currentPts < points) return false;
    const nextPoints = currentPts - points;
    void updateProfile({
      loyaltyPoints: nextPoints,
      lastPointsReason: reason
    } as Partial<User>);
    return true;
  };

  const currentRole: RoleType = currentUser?.role || 'guest';
  const isAuthenticated = Boolean(currentUser && currentUser.role !== 'guest');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        switchRole,
        updateProfile,
        addLoyaltyPoints,
        deductLoyaltyPoints
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};