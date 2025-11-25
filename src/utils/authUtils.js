/**
 * Utilidades de Autenticación
 * Funciones reutilizables para obtener información del usuario logeado
 */

/**
 * Obtener el ID del usuario logeado desde localStorage
 * @returns {number|null} ID del usuario o null si no está logeado
 */
export const getClienteId = () => {
  // 1. Intentar con 'userId' directo (más rápido)
  const directUserId = localStorage.getItem('userId');
  if (directUserId) {
    return parseInt(directUserId, 10);
  }
  
  // 2. Intentar con 'usuario' (nombre correcto usado en AuthService)
  let userStr = localStorage.getItem('usuario');
  
  // 3. Fallback a 'user' (por compatibilidad)
  if (!userStr) {
    userStr = localStorage.getItem('user');
  }
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id;
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      return null;
    }
  }
  
  return null;
};

/**
 * Obtener el ID del empleado logeado desde localStorage
 * Alias de getClienteId() ya que el ID es el mismo para todos los usuarios
 * @returns {number|null} ID del empleado o null si no está logeado
 */
export const getEmpleadoId = () => {
  return getClienteId(); // El ID del usuario es el mismo para empleados y clientes
};

/**
 * Obtener información completa del usuario logeado
 * @returns {object|null} Objeto con datos del usuario o null
 */
export const getCurrentUser = () => {
  let userStr = localStorage.getItem('usuario');
  
  if (!userStr) {
    userStr = localStorage.getItem('user');
  }
  
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      return null;
    }
  }
  
  return null;
};

/**
 * Obtener el tipo de usuario logeado
 * @returns {string|null} Tipo de usuario (CLIENTE, ADMIN, GERENTE, CAJERO) o null
 */
export const getUserType = () => {
  return localStorage.getItem('tipo');
};

/**
 * Verificar si hay un usuario logeado
 * @returns {boolean}
 */
export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};

/**
 * Obtener el token de autenticación
 * @returns {string|null}
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

