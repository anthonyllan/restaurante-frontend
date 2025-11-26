import axios from 'axios';

// Usar variables de entorno directamente (en producción serán rutas relativas como /producto-api)
// En desarrollo local, usar localhost con puertos
const getApiUrl = (envVar, defaultUrl) => {
  const envValue = import.meta.env[envVar];
  
  // Si hay variable de entorno, usarla
  if (envValue) {
    return envValue;
  }
  
  // En producción usar las IPs públicas de Digital Ocean, en desarrollo usar localhost
  const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
  
  if (isProduction) {
    // En producción, usar las IPs públicas configuradas o las por defecto
    return defaultUrl;
  }
  
  // En desarrollo local, usar localhost
  if (defaultUrl.includes('164.90.246.132')) {
    return 'http://localhost:2001';
  }
  if (defaultUrl.includes('24.199.77.75')) {
    return 'http://localhost:2002';
  }
  if (defaultUrl.includes('143.244.210.238')) {
    return 'http://localhost:2003';
  }
  return defaultUrl;
};

// URLs de los microservicios (IPs públicas de Digital Ocean)
export const API_PRODUCTO_URL = getApiUrl('VITE_API_PRODUCTO_URL', 'http://164.90.246.132');
export const API_PEDIDO_URL = getApiUrl('VITE_API_PEDIDO_URL', 'http://24.199.77.75');
export const API_USUARIO_URL = getApiUrl('VITE_API_USUARIO_URL', 'http://143.244.210.238');
// API_BASE_URL se usa para productos y categorías, así que debe apuntar al mismo que PRODUCTO_URL
export const API_BASE_URL = getApiUrl('VITE_API_BASE_URL', 'http://164.90.246.132');

// Función helper para construir URLs de imágenes
export const getImageUrl = (rutaImagen) => {
  if (!rutaImagen) return null;
  
  // Si ya es una URL completa, devolverla tal cual
  if (rutaImagen.startsWith('http://') || rutaImagen.startsWith('https://')) {
    return rutaImagen;
  }
  
  // Si es una ruta relativa que empieza con /uploads/, construir la URL completa
  if (rutaImagen.startsWith('/uploads/')) {
    return `${API_PRODUCTO_URL}${rutaImagen}`;
  }
  
  // Si no tiene prefijo, agregarlo
  if (!rutaImagen.startsWith('/')) {
    return `${API_PRODUCTO_URL}/uploads/productos/${rutaImagen}`;
  }
  
  return `${API_PRODUCTO_URL}${rutaImagen}`;
};

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
