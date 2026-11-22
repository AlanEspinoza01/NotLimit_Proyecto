/**
 * Datos mínimos de una cuenta para el enlace de acceso de la barra superior.
 * Mantiene la lógica fuera de React, para poder comprobar el caso GUEST_USER.
 */
export interface NavbarAccount {
  firstName?: string;
  name?: string;
}

export interface AccountNavInfo {
  to: '/auth' | '/profile';
  label: string;
  title: string;
}

/**
 * Nunca inferir autenticación desde la existencia del objeto currentUser:
 * AuthContext utiliza un objeto GUEST_USER aun sin iniciar sesión.
 */
export function resolveAccountNav(
  isAuthenticated: boolean,
  currentUser: NavbarAccount | null
): AccountNavInfo {
  // Visitante: siempre mostrar texto visible y enlazar al inicio de sesión.
  if (!isAuthenticated) {
    return { to: '/auth', label: 'Iniciar sesión', title: 'Iniciar sesión' };
  }

  // Si la API entrega firstName, usarlo; si no, obtenerlo de name.
  const firstName = currentUser?.firstName?.trim();
  const nameFromFullName = currentUser?.name?.trim().split(/\s+/)[0];

  // Nunca dejar el botón vacío por datos incompletos de la cuenta.
  const label = firstName || nameFromFullName || 'Mi cuenta';
  return { to: '/profile', label, title: 'Mi perfil' };
}
