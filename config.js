// Archivo de configuración para las APIs
// Este archivo se puede importar en tu aplicación frontend

const config = {
    // URLs de los microservicios (IPs públicas de Digital Ocean)
    API_PRODUCTO_URL: process.env.REACT_APP_API_PRODUCTO_URL || 
                       process.env.VITE_API_PRODUCTO_URL || 
                       process.env.VUE_APP_API_PRODUCTO_URL ||
                       'http://164.90.246.132',
    
    API_PEDIDO_URL: process.env.REACT_APP_API_PEDIDO_URL || 
                     process.env.VITE_API_PEDIDO_URL || 
                     process.env.VUE_APP_API_PEDIDO_URL ||
                     'http://24.199.77.75',
    
    API_USUARIO_URL: process.env.REACT_APP_API_USUARIO_URL || 
                     process.env.VITE_API_USUARIO_URL || 
                     process.env.VUE_APP_API_USUARIO_URL ||
                     'http://143.244.210.238',
    
    // Endpoints base
    API_PRODUCTO_BASE: process.env.REACT_APP_API_PRODUCTO_BASE || 
                        process.env.VITE_API_PRODUCTO_BASE || 
                        process.env.VUE_APP_API_PRODUCTO_BASE ||
                        'http://164.90.246.132/api',
    
    API_PEDIDO_BASE: process.env.REACT_APP_API_PEDIDO_BASE || 
                     process.env.VITE_API_PEDIDO_BASE || 
                     process.env.VUE_APP_API_PEDIDO_BASE ||
                     'http://24.199.77.75/api',
    
    API_USUARIO_BASE: process.env.REACT_APP_API_USUARIO_BASE || 
                      process.env.VITE_API_USUARIO_BASE || 
                      process.env.VUE_APP_API_USUARIO_BASE ||
                      'http://143.244.210.238/api',
  };
  
  export default config;
  
  