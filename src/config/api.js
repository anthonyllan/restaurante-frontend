import axios from 'axios';

// Detecta automáticamente la URL base según el entorno
const getBaseURL = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol; // 'http:' o 'https:'
  
  // Si estamos en localhost o 127.0.0.1, usar localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:2001';
  }
  
  // En producción, usar el mismo dominio con HTTPS (nginx hará proxy)
  // Esto resuelve el problema de Mixed Content
  return `${protocol}//${hostname}`;
};

export const API_BASE_URL = getBaseURL();

// URLs para los microservicios
// En producción, nginx hará proxy, así que usamos rutas relativas
const getApiUrl = (service) => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Desarrollo local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const ports = {
      producto: '2001',
      pedido: '2002',
      usuario: '2003'
    };
    return `http://localhost:${ports[service]}`;
  }
  
  // Producción: usar el mismo dominio (nginx hará proxy)
  return `${protocol}//${hostname}`;
};

export const API_PRODUCTO_URL = import.meta.env.VITE_API_PRODUCTO_URL || getApiUrl('producto');
export const API_PEDIDO_URL = import.meta.env.VITE_API_PEDIDO_URL || getApiUrl('pedido');
export const API_USUARIO_URL = import.meta.env.VITE_API_USUARIO_URL || getApiUrl('usuario');

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
