import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../api/axios';

export type RoleType = User['role'];
const GUEST_USER: User = { id:'guest_user',name:'Invitado',email:'',role:'guest',loyaltyPoints:0,createdAt:new Date().toISOString() };
export interface RegisterPayload {
  name?: string; firstName?: string; lastName?: string; email: string;
  password?: string; rut?: string; phone?: string;
}
export interface AuthContextType {
  currentUser: User | null; currentRole: RoleType; isAuthenticated: boolean; isLoading: boolean;
  login:(email:string,password?:string)=>Promise<User>;
  register:(payload:RegisterPayload)=>Promise<User>;
  loginWithGoogle:(payload?:{email?:string;name?:string;googleId?:string;avatarUrl?:string})=>Promise<User>;
  logout:()=>Promise<void>; switchRole:(role:RoleType)=>void;
  updateProfile:(updates:Partial<User>)=>Promise<void>;
  addLoyaltyPoints:(points:number,reason?:string)=>Promise<void>;
  deductLoyaltyPoints:(points:number,reason?:string)=>boolean;
  refreshUser:()=>Promise<void>;
}
const AuthContext=createContext<AuthContextType|undefined>(undefined);

export const AuthProvider:React.FC<{children:React.ReactNode}>=({children})=>{
  // Solo memoria para la representación visual. La cookie HttpOnly y /auth/me son la autoridad.
  const [currentUser,setCurrentUser]=useState<User|null>(GUEST_USER);
  const [isLoading,setIsLoading]=useState(true);
  const refreshUser=async():Promise<void>=>{
    try{const res=await api.get('/auth/me');setCurrentUser(res.data?.user||GUEST_USER);}
    catch{setCurrentUser(GUEST_USER);}
  };
  useEffect(()=>{
    // Limpia las claves antiguas expuestas a JavaScript; no toca el carrito.
    for(const key of ['nolimits_auth_token','nolimits_auth_user','nolimits_jwt_token']) localStorage.removeItem(key);
    let active=true;
    void api.get('/auth/me').then(res=>{if(active)setCurrentUser(res.data?.user||GUEST_USER);})
      .catch(()=>{if(active)setCurrentUser(GUEST_USER);}).finally(()=>{if(active)setIsLoading(false);});
    return()=>{active=false;};
  },[]);
  const login=async(email:string,password?:string):Promise<User>=>{
    const {data}=await api.post('/auth/login',{email,password});
    if(!data?.user)throw new Error('La API no devolvió el usuario');
    setCurrentUser(data.user);return data.user;
  };
  const register=async(payload:RegisterPayload):Promise<User>=>{
    const {data}=await api.post('/auth/register',payload);
    if(!data?.user)throw new Error('La API no devolvió el usuario');
    setCurrentUser(data.user);return data.user;
  };
  const loginWithGoogle=async(payload?:{email?:string;name?:string;googleId?:string;avatarUrl?:string}):Promise<User>=>{
    const {data}=await api.post('/auth/google',payload||{});
    if(!data?.user)throw new Error('La API no devolvió el usuario');
    setCurrentUser(data.user);return data.user;
  };
  const logout=async():Promise<void>=>{
    try{await api.post('/auth/logout');}finally{setCurrentUser(GUEST_USER);}
  };
  // Nunca fabricar administradores cambiando el rol localmente.
  const switchRole=(_role:RoleType):void=>{console.warn('El rol se asigna únicamente en MongoDB.');};
  const updateProfile=async(updates:Partial<User>):Promise<void>=>{
    const id=currentUser?.id;
    if(!id||id===GUEST_USER.id)throw new Error('Inicia sesión para editar tu perfil');
    const forbidden=['loyaltyPoints','lastPointsReason','role','tags','isActive','totalSpentClp','totalOrdersCount'];
    if(forbidden.some(key=>Object.prototype.hasOwnProperty.call(updates,key)))throw new Error('Este campo solo puede cambiarlo el servidor');
    const res=await api.put(`/auth/profile/${id}`,updates);
    if(res.data?.user)setCurrentUser(res.data.user);
  };
  // La reseña ya acredita puntos en el backend; solo refrescamos el saldo real.
  const addLoyaltyPoints=async(_points:number,_reason=''):Promise<void>=>{await refreshUser();};
  // Impide débitos locales: los canjes se realizan exclusivamente en el backend.
  const deductLoyaltyPoints=(_points:number,_reason=''):boolean=>false;
  const currentRole:RoleType=currentUser?.role||'guest';
  return <AuthContext.Provider value={{currentUser,currentRole,isAuthenticated:!!currentUser&&currentRole!=='guest',isLoading,
    login,register,loginWithGoogle,logout,switchRole,updateProfile,addLoyaltyPoints,deductLoyaltyPoints,refreshUser}}>
    {children}
  </AuthContext.Provider>;
};
export const useAuth=():AuthContextType=>{
  const context=useContext(AuthContext);
  if(!context)throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  return context;
};
