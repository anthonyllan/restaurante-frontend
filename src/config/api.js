import axios from 'axios';

// Usar variables de entorno directamente (en producción serán rutas relativas como /producto-api)
// En desarrollo local, usar localhost con puertos
const getApiUrl = (envVar, defaultPort) => {
  const envValue = import.meta.env[envVar];
  
  // Si hay variable de entorno, usarla (será ruta relativa en producción)
  if (envValue) {
    return envValue;
  }
  
  // En desarrollo local, usar localhost con puerto
  return `http://localhost:${defaultPort}`;
};

export const API_PRODUCTO_URL = getApiUrl('VITE_API_PRODUCTO_URL', '2001');
export const API_PEDIDO_URL = getApiUrl('VITE_API_PEDIDO_URL', '2002');
export const API_USUARIO_URL = getApiUrl('VITE_API_USUARIO_URL', '2003');
// API_BASE_URL se usa para productos y categorías, así que debe apuntar al mismo que PRODUCTO_URL
export const API_BASE_URL = getApiUrl('VITE_API_BASE_URL', '2001');

// ✅ Interceptor para agregar token JWT automáticamente a todas las peticiones
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Interceptor para manejar errores de autenticación
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido - redirigir a login
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
