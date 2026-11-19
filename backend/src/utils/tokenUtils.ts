// Importamos jsonwebtoken para crear
// y verificar los tokens de sesión.
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { CookieOptions } from 'express';

// Definimos el emisor esperado del token.
// Esto permite comprobar que el token
// fue generado por nuestro propio backend No Limits.
const TOKEN_ISSUER = 'no-limits-api';

// Definimos la aplicación que puede utilizar el token.
const TOKEN_AUDIENCE = 'no-limits-app';

// Comprobamos si el backend está ejecutándose en producción.
const isProduction = process.env.NODE_ENV === 'production';

// Definimos el nombre de la cookie.
// En producción utilizamos el prefijo __Host-,
// que exige HTTPS, path "/" y evita que
// otro subdominio configure esta misma cookie.
const AUTH_COOKIE_NAME = isProduction
  ? '__Host-no_limits_session'
  : 'no_limits_session';

export interface VerifiedSessionToken extends JwtPayload {
  sub: string;
  type: 'session';
  tokenVersion: number;
}

// Creamos una función para obtener
// el secreto utilizado por JWT.
const getJwtSecret = (): string => {
  // Obtenemos el secreto desde las variables de entorno.
  const jwtSecret = process.env.JWT_SECRET;

  // Comprobamos que el secreto exista y que sea una cadena de texto.
  if (typeof jwtSecret !== 'string' || !jwtSecret) {
    throw new Error('La variable JWT_SECRET no está definida');
  }

  // Calculamos la longitud real del secreto en bytes.
  const secretLength = Buffer.byteLength(jwtSecret, 'utf8');

  // Comprobamos que el secreto tenga al menos 64 bytes (o 32 en entorno local si se acorta).
  if (secretLength < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 bytes (64 recomendados)');
  }

  // Retornamos el secreto validado.
  return jwtSecret;
};

// Creamos una función que valida la versión de sesión recibida.
function validateTokenVersion(tokenVersion: unknown): asserts tokenVersion is number {
  // Comprobamos que sea un número entero igual o superior a cero.
  const tokenVersionIsValid =
    typeof tokenVersion === 'number' &&
    Number.isInteger(tokenVersion) &&
    tokenVersion >= 0;

  // Si no es válida, detenemos la operación.
  if (!tokenVersionIsValid) {
    throw new Error('La versión de la sesión no es válida');
  }
}

// Creamos una función que genera el token de cualquier usuario registrado.
const generateAuthToken = ({
  userId,
  tokenVersion = 0,
}: {
  userId: string | { toString(): string };
  tokenVersion?: number;
}): string => {
  // Comprobamos que exista el identificador del usuario.
  if (!userId) {
    throw new Error('No se puede generar un token sin usuario');
  }

  // Validamos la versión de la sesión.
  validateTokenVersion(tokenVersion);

  // Obtenemos el secreto JWT previamente validado.
  const jwtSecret = getJwtSecret();

  // Obtenemos la duración configurada. Si no existe, utilizamos dos horas.
  const expiresIn = (process.env.JWT_EXPIRES_IN || '2h') as SignOptions['expiresIn'];

  // Creamos y retornamos el token firmado.
  return jwt.sign(
    {
      // Identificamos el contenido como una sesión de usuario.
      type: 'session',

      // Incluimos la versión utilizada para invalidar sesiones anteriores.
      tokenVersion,
    },
    jwtSecret,
    {
      // Guardamos el identificador del usuario dentro del campo estándar subject.
      subject: userId.toString(),

      // Definimos cuánto durará el token.
      expiresIn,

      // Indicamos quién emitió el token.
      issuer: TOKEN_ISSUER,

      // Indicamos quién puede utilizarlo.
      audience: TOKEN_AUDIENCE,

      // Aceptamos únicamente el algoritmo HS256.
      algorithm: 'HS256',
    }
  );
};

// Creamos una función para verificar un token recibido desde la cookie o header.
const verifyAuthToken = (token: unknown): VerifiedSessionToken => {
  // Comprobamos que el token exista y sea una cadena de texto.
  if (typeof token !== 'string' || !token) {
    throw new Error('No se recibió un token de sesión');
  }

  // Obtenemos el secreto previamente validado.
  const jwtSecret = getJwtSecret();

  // Verificamos: firma, expiración, emisor, audiencia y algoritmo.
  const decodedToken = jwt.verify(token, jwtSecret, {
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    algorithms: ['HS256'],
  });

  // Comprobamos que el contenido decodificado sea un objeto y no una cadena.
  if (typeof decodedToken !== 'object' || decodedToken === null) {
    throw new Error('El contenido del token no es válido');
  }

  // Comprobamos que corresponda a una sesión de usuario.
  if (decodedToken.type !== 'session') {
    throw new Error('El tipo de token no es válido');
  }

  // Comprobamos que exista el identificador del usuario.
  if (typeof decodedToken.sub !== 'string' || !decodedToken.sub) {
    throw new Error('El token no contiene un usuario válido');
  }

  // Validamos la versión incluida dentro del token.
  validateTokenVersion(decodedToken.tokenVersion);

  // Retornamos el contenido verificado del token.
  return decodedToken as VerifiedSessionToken;
};

// Creamos una función que obtiene la duración de la cookie.
const getCookieMaxAge = (): number => {
  const configuredMaxAge = Number(
    process.env.AUTH_COOKIE_MAX_AGE_MS || 7200000
  );

  const maxAgeIsValid =
    Number.isSafeInteger(configuredMaxAge) && configuredMaxAge > 0;

  if (!maxAgeIsValid) {
    return 7200000;
  }

  return configuredMaxAge;
};

// Creamos una función para obtener las opciones de la cookie de sesión.
const getAuthCookieOptions = (): CookieOptions => {
  return {
    // Impedimos que JavaScript del navegador pueda leer directamente el token.
    httpOnly: true,

    // En producción la cookie solamente podrá enviarse mediante HTTPS.
    secure: isProduction,

    // Durante el desarrollo utilizamos lax; en producción none.
    sameSite: isProduction ? 'none' : 'lax',

    // Permitimos enviar la cookie a todas las rutas del backend.
    path: '/',

    // Definimos la duración de la cookie.
    maxAge: getCookieMaxAge(),

    // Solicitamos al navegador dar prioridad alta a esta cookie.
    priority: 'high',
  };
};

// Creamos una función para obtener las opciones utilizadas al eliminar la cookie de sesión.
const getAuthCookieClearOptions = (): CookieOptions => {
  const { maxAge, ...clearOptions } = getAuthCookieOptions();
  void maxAge;
  return clearOptions;
};

export {
  AUTH_COOKIE_NAME,
  TOKEN_ISSUER,
  TOKEN_AUDIENCE,
  generateAuthToken,
  verifyAuthToken,
  getAuthCookieOptions,
  getAuthCookieClearOptions,
};
