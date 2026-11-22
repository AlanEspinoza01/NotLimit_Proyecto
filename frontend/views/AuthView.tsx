import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, KeyRound, Users, UserPlus } from 'lucide-react';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';

type AuthScreen = 'options' | 'login' | 'register';

export const AuthView = () => {
  const { login, register, loginWithGoogle, isAuthenticated, currentRole } = useAuth();
  const navigate = useNavigate();

  // Controla qué pantalla se está mostrando (Opciones, Login, o Registro)
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('options');

  // Estados de los formularios
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirección inteligente si el usuario inicia sesión con éxito
  useEffect(() => {
    if (isAuthenticated) {
      if (currentRole === 'branch_admin' || currentRole === 'super_admin') {
        navigate('/admin/orders', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    }
  }, [isAuthenticated, currentRole, navigate]);

  // Manejador del Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Ocurrió un error al intentar iniciar sesión.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejador del Registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email, password, name: fullName });
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Ocurrió un error al intentar registrar la cuenta.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // GIS entrega únicamente una credencial firmada; la identidad se valida en Express.
  const handleGoogleCredential = async (credential: string) => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle(credential);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Título dinámico de la ventana según la pantalla
  const getWindowTitle = () => {
    if (currentScreen === 'register') return 'Registro_Usuario.exe - [Crear Cuenta Windows XP]';
    if (currentScreen === 'login') return 'Formulario_de_Acceso.exe - [Iniciar Sesión Windows XP]';
    return 'Iniciar_Sesion.exe - [Windows XP Logon]';
  };

  return (
    <div className="max-w-[400px] mx-auto mt-12 mb-12">
      <div className="winxp-window bg-[#ece9d8] border-2 border-[#0055ea] shadow-xl flex flex-col">
        
        {/* Barra de Título */}
        <div 
          className="winxp-titlebar px-2.5 py-1 text-white font-bold flex items-center justify-between select-none"
          style={{ background: 'linear-gradient(180deg, #0058ee 0%, #3593ff 8%, #288eff 40%, #127dff 88%, #036bfe 93%, #0050ee 100%)' }}
        >
          <div className="flex items-center gap-1.5 text-xs truncate">
            {currentScreen === 'register' ? <UserPlus className="w-4 h-4 text-yellow-300" /> : <KeyRound className="w-4 h-4 text-yellow-300" />}
            <span>{getWindowTitle()}</span>
          </div>
          <div className="flex gap-0.5">
            <div className="winxp-btn-ctrl winxp-btn-min"></div>
            <div className="winxp-btn-ctrl winxp-btn-max"></div>
            <div className="winxp-btn-ctrl winxp-btn-close"></div>
          </div>
        </div>

        {/* Barra de Menú */}
        <div className="bg-[#ece9d8] text-[11px] px-2 py-1 flex items-center gap-3 border-b border-white shadow-[0_1px_0_rgba(172,168,153,1)] select-none">
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-default">Archivo</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-default">Edición</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-default">Ver</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-default">Favoritos</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-default">Herramientas</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-default">Ayuda</span>
        </div>

        {/* Contenido Principal */}
        <div className="p-3">
          {/* Cabecera Informativa Blanca */}
          <div className="bg-white border border-[#7f9db9] p-3 flex items-start gap-3 mb-4">
            <Users className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 text-xs">
                {currentScreen === 'register' ? 'Formulario de Registro de Usuario' : 
                 currentScreen === 'login' ? 'Formulario de Acceso a NoLimits' : 
                 'Para comenzar, inicie su sesión'}
              </h3>
              <p className="text-[11px] text-gray-600 leading-tight mt-0.5">
                {currentScreen === 'register' ? 'Cree una cuenta para acumular Cyber Points y gestionar sus envíos.' : 
                 currentScreen === 'login' ? 'Ingrese su correo electrónico y contraseña registrados.' : 
                 'Acceso a historial de pedidos, cupones y seguimiento de envíos.'}
              </p>
            </div>
          </div>

          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-500 p-2 mb-4 text-red-700 text-[11px] font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* === PANTALLA 1: OPCIONES INICIALES === */}
          {currentScreen === 'options' && (
            <div className="space-y-4 px-2 pb-4">
              {/* Google Identity Services renderiza su botón oficial en la estética de nuestra ventana XP. */}
              <GoogleSignInButton onCredential={handleGoogleCredential} disabled={isSubmitting} />

              <button
                type="button"
                onClick={() => setCurrentScreen('login')}
                className="w-full bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold text-xs py-2.5 border border-[#8e0000] shadow-sm transition-colors cursor-pointer"
              >
                Iniciar sesión
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-gray-600 mb-2">¿Aún no estás registrado?</p>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('register')}
                  className="w-full bg-[#757575] hover:bg-[#616161] text-white font-bold text-xs py-2.5 border border-[#424242] shadow-sm transition-colors cursor-pointer"
                >
                  ¡Regístrate ahora!
                </button>
              </div>
            </div>
          )}

          {/* === PANTALLA 2: FORMULARIO DE LOGIN === */}
          {currentScreen === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3 px-2 pb-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-800 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="winxp-input w-full text-xs py-1.5 px-2 bg-white"
                  placeholder="usuario@correo.cl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-800 mb-1">Contraseña de Acceso:</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="winxp-input w-full text-xs py-1.5 px-2 bg-white font-mono"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold text-xs py-2.5 border border-[#8e0000] shadow-sm transition-colors ${
                    isSubmitting ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                  }`}
                >
                  {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </div>

              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('register')}
                  className="text-[11px] font-bold text-blue-800 hover:underline cursor-pointer"
                >
                  ¿Aún no estás registrado? Crear cuenta aquí
                </button>
              </div>
            </form>
          )}

          {/* === PANTALLA 3: FORMULARIO DE REGISTRO === */}
          {currentScreen === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 px-2 pb-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-800 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                  className="winxp-input w-full text-xs py-1.5 px-2 bg-white"
                  placeholder="Ej. Martín González"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-800 mb-1">Correo Electrónico (Debe terminar en @gmail.com):</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="winxp-input w-full text-xs py-1.5 px-2 bg-white"
                  placeholder="usuario@gmail.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-800 mb-1">Contraseña de Acceso:</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="winxp-input w-full text-xs py-1.5 px-2 bg-white font-mono"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-800 mb-1">Confirmar Contraseña:</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="winxp-input w-full text-xs py-1.5 px-2 bg-white font-mono"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-[#757575] hover:bg-[#616161] text-white font-bold text-xs py-2.5 border border-[#424242] shadow-sm transition-colors ${
                    isSubmitting ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                  }`}
                >
                  {isSubmitting ? 'Registrando...' : '¡Regístrate ahora!'}
                </button>
              </div>

              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('login')}
                  className="text-[11px] font-bold text-blue-800 hover:underline cursor-pointer"
                >
                  ¿Ya tienes cuenta? Iniciar sesión aquí
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Pie de Página de Seguridad */}
        <div className="bg-[#ece9d8] border-t border-[#7f9db9] px-2 py-1.5 flex justify-between items-center text-[9px] text-gray-600 font-mono uppercase mt-auto">
          <span>Seguridad SSL 128-Bits // {currentScreen === 'register' ? 'Registro' : 'Autenticación'} Oficial NoLimits</span>
          <span>Red Local: 100 Mbps</span>
        </div>

      </div>
    </div>
  );
};
