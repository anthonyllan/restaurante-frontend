import axios from 'axios';

// Función para detectar si estamos en producción
const isProduction = () => {
  const hostname = window.location.hostname;
  return hostname.includes('ondigitalocean.app') || 
         hostname.includes('.com') || 
         hostname.includes('.net') ||
         (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'));
};

// Detecta automáticamente la URL base según el entorno
const getBaseURL = () => {
  const hostname = window.location.hostname;
  
  // Si estamos en localhost, usar localhost con puerto
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:2001';
  }
  
  // En producción, usar el mismo dominio con HTTPS (sin puerto)
  // Nginx hará proxy a los microservicios
  if (isProduction()) {
    // Usar el origin completo pero forzar HTTPS
    return window.location.origin.replace('http://', 'https://');
  }
  
  // Fallback: usar el origin actual
  return window.location.origin;
};

export const API_BASE_URL = getBaseURL();

// URLs para los microservicios
// En producción, nginx hará proxy, así que usamos el mismo dominio
const getApiUrl = (service) => {
  const hostname = window.location.hostname;
  
  // Desarrollo local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const ports = {
      producto: '2001',
      pedido: '2002',
      usuario: '2003'
    };
    return `http://localhost:${ports[service]}`;
  }
  
  // Producción: usar el mismo dominio con HTTPS (sin puerto)
  // Nginx hará proxy a los microservicios HTTP internos
  if (isProduction()) {
    // Usar el origin completo pero forzar HTTPS y eliminar cualquier puerto
    const origin = window.location.origin.replace('http://', 'https://');
    // Eliminar puerto si existe (ej: https://example.com:8080 -> https://example.com)
    return origin.split(':').slice(0, 2).join(':');
  }
  
  // Fallback: usar el origin actual
  return window.location.origin;
};

export const API_PRODUCTO_URL = import.meta.env.VITE_API_PRODUCTO_URL || getApiUrl('producto');
export const API_PEDIDO_URL = import.meta.env.VITE_API_PEDIDO_URL || getApiUrl('pedido');
export const API_USUARIO_URL = import.meta.env.VITE_API_USUARIO_URL || getApiUrl('usuario');

// Log para debugging (solo en desarrollo)
if (!isProduction()) {
  console.log('API Configuration:', {
    API_BASE_URL,
    API_PRODUCTO_URL,
    API_PEDIDO_URL,
    API_USUARIO_URL,
    hostname: window.location.hostname,
    origin: window.location.origin,
    protocol: window.location.protocol
  });
}

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
