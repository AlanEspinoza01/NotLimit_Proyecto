// Importamos bcryptjs para cifrar
// y comparar contraseñas.
import bcrypt from 'bcryptjs';

// Definimos el costo utilizado por bcrypt.
// Un valor de 12 ofrece un equilibrio razonable
// entre seguridad y tiempo de procesamiento.
const BCRYPT_ROUNDS = 12;

// Definimos el largo mínimo permitido (8 caracteres para mantener compatibilidad con los usuarios de No Limits).
const MIN_PASSWORD_LENGTH = 8;

// Bcrypt procesa como máximo 72 bytes.
// No es exactamente lo mismo que 72 caracteres,
// porque algunos símbolos pueden utilizar varios bytes.
const MAX_PASSWORD_BYTES = 72;

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordValidationError extends Error {
  code?: string;
}

// Creamos una función que valida
// si una contraseña cumple las reglas de seguridad.
const validatePassword = (password: unknown): PasswordValidationResult => {
  // Creamos un arreglo para guardar todos los problemas encontrados.
  const errors: string[] = [];

  // Comprobamos que la contraseña realmente sea un texto.
  if (typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['La contraseña debe ser una cadena de texto'],
    };
  }

  // Comprobamos la cantidad mínima de caracteres.
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
    );
  }

  // Calculamos el tamaño real de la contraseña en bytes UTF-8.
  const passwordBytes = Buffer.byteLength(password, 'utf8');

  // Evitamos superar el límite procesado por bcrypt.
  if (passwordBytes > MAX_PASSWORD_BYTES) {
    errors.push('La contraseña no puede superar los 72 bytes');
  }

  // Comprobamos que exista al menos una letra minúscula.
  if (!/[a-záéíóúñ]/u.test(password)) {
    errors.push('La contraseña debe incluir al menos una letra minúscula');
  }

  // Comprobamos que exista al menos una letra mayúscula.
  if (!/[A-ZÁÉÍÓÚÑ]/u.test(password)) {
    errors.push('La contraseña debe incluir al menos una letra mayúscula');
  }

  // Comprobamos que exista al menos un número.
  if (!/\d/u.test(password)) {
    errors.push('La contraseña debe incluir al menos un número');
  }

  // Comprobamos que exista al menos un carácter especial.
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/u.test(password)) {
    errors.push('La contraseña debe incluir al menos un carácter especial');
  }

  // Retornamos el resultado completo de la validación.
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Creamos una función que cifra una contraseña segura.
const hashPassword = async (password: unknown): Promise<string> => {
  // Validamos la contraseña antes de cifrarla.
  const validation = validatePassword(password);

  // Si no cumple las reglas, detenemos el proceso.
  if (!validation.isValid) {
    const error: PasswordValidationError = new Error(
      validation.errors.join('. ')
    );
    error.code = 'INVALID_PASSWORD';
    throw error;
  }

  // Generamos el hash utilizando bcrypt.
  const passwordHash = await bcrypt.hash(password as string, BCRYPT_ROUNDS);

  return passwordHash;
};

// Creamos una función para comparar
// la contraseña ingresada con el hash almacenado.
const comparePassword = async (
  password: unknown,
  passwordHash: unknown
): Promise<boolean> => {
  // Evitamos ejecutar bcrypt si alguno de los valores no es válido.
  if (
    typeof password !== 'string' ||
    typeof passwordHash !== 'string' ||
    !password ||
    !passwordHash
  ) {
    return false;
  }

  // bcrypt cifra internamente la contraseña y la compara con el hash guardado.
  const passwordsMatch = await bcrypt.compare(password, passwordHash);

  return passwordsMatch;
};

export {
  BCRYPT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_BYTES,
  validatePassword,
  hashPassword,
  comparePassword,
};
