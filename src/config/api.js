import axios from 'axios';

// Detecta automáticamente la URL base según el entorno
const getBaseURL = () => {
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    
    // Si estamos en localhost o 127.0.0.1, usar localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:2001';
    }
    // Si estamos accediendo por IP, usar la misma IP para la API
    return `http://${hostname}:2001`;
  };
  
export const API_BASE_URL = getBaseURL();

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