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
    // Si ya es HTTPS, usar directamente; si no, forzar HTTPS
    const origin = window.location.origin;
    if (origin.startsWith('https://')) {
      return origin;
    }
    return origin.replace('http://', 'https://');
  }
  
  // Fallback: usar el origin actual
  return window.location.origin;
};

export const API_BASE_URL = getBaseURL();

// URLs para los microservicios
// En producción, nginx hará proxy, así que usamos el mismo dominio
const getApiUrl = (service) => {
  const hostname = window.location.hostname;
  const origin = window.location.origin;
  
  // Desarrollo local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const ports = {
      producto: '2001',
      pedido: '2002',
      usuario: '2003'
    };
    return `http://localhost:${ports[service]}`;
  }
  
  // Producción: SIEMPRE usar el mismo dominio con HTTPS (sin puerto)
  // Nginx hará proxy a los microservicios HTTP internos
  // Forzar HTTPS siempre en producción
  if (isProduction()) {
    // Construir URL HTTPS explícitamente
    const protocol = 'https://';
    const host = hostname;
    // Eliminar cualquier puerto que pueda estar en el hostname
    const cleanHost = host.split(':')[0];
    return `${protocol}${cleanHost}`;
  }
  
  // Fallback: usar el origin actual
  return origin;
};

// En producción, ignorar variables de entorno HTTP y usar siempre HTTPS a través del proxy
const getFinalApiUrl = (service, envVar) => {
  // Si hay una variable de entorno y estamos en producción
  if (envVar && isProduction()) {
    // Si la variable de entorno es HTTP, ignorarla y usar el proxy HTTPS
    if (envVar.startsWith('http://')) {
      return getApiUrl(service);
    }
    // Si ya es HTTPS, usarla
    if (envVar.startsWith('https://')) {
      return envVar;
    }
  }
  // Si hay variable de entorno y NO estamos en producción, usarla
  if (envVar && !isProduction()) {
    return envVar;
  }
  // Si no hay variable de entorno, usar la detección automática
  return getApiUrl(service);
};

export const API_PRODUCTO_URL = getFinalApiUrl('producto', import.meta.env.VITE_API_PRODUCTO_URL);
export const API_PEDIDO_URL = getFinalApiUrl('pedido', import.meta.env.VITE_API_PEDIDO_URL);
export const API_USUARIO_URL = getFinalApiUrl('usuario', import.meta.env.VITE_API_USUARIO_URL);

// Log para debugging (también en producción para verificar)
console.log('🔧 API Configuration:', {
  API_BASE_URL,
  API_PRODUCTO_URL,
  API_PEDIDO_URL,
  API_USUARIO_URL,
  hostname: window.location.hostname,
  origin: window.location.origin,
  protocol: window.location.protocol,
  isProd: isProduction(),
  envVars: {
    VITE_API_PRODUCTO_URL: import.meta.env.VITE_API_PRODUCTO_URL,
    VITE_API_PEDIDO_URL: import.meta.env.VITE_API_PEDIDO_URL,
    VITE_API_USUARIO_URL: import.meta.env.VITE_API_USUARIO_URL
  }
});

// ✅ Interceptor para agregar token JWT automáticamente a todas las peticiones
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log de la petición en desarrollo
    if (!isProduction()) {
      console.log('📤 Petición:', config.method?.toUpperCase(), config.url, config.headers);
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
    // Log de respuesta exitosa en desarrollo
    if (!isProduction()) {
      console.log('📥 Respuesta:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    // Log detallado de errores
    console.error('🚨 Error en petición:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    if (error.response?.status === 401) {
      // Token expirado o inválido - redirigir a login
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
