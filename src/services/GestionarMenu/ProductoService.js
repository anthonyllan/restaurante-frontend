import axios from 'axios';
import { API_BASE_URL } from '../../config/api.js';

const BASE_URL = `${API_BASE_URL}/api/productos`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const listProductos = async () => {
  try {
    const response = await api.get('');
    return {
      success: true,
      data: response.data,
      message: 'Productos cargados correctamente'
    };
  } catch (error) {
    throw handleAxiosError(error);
  }
};

export const getProductoById = async (id) => {
  try {
    const response = await api.get(`/${id}`);
    return {
      success: true,
      data: response.data,
      message: 'Producto obtenido correctamente'
    };
  } catch (error) {
    throw handleAxiosError(error);
  }
};

export const guardarProducto = async (productoData) => {
  try {
    const response = await api.post('', {
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      precio: productoData.precio,
      disponible: productoData.disponible,
      imagen: productoData.imagen || '',
      tiempoPreparacion: productoData.tiempoPreparacion,
      categoria: { id: productoData.idCategoria }
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Producto guardado correctamente'
    };
  } catch (error) {
    throw handleAxiosError(error);
  }
};

export const guardarProductoConDias = async (productoData) => {
  try {
    const response = await api.post('/con-dias', {
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      precio: productoData.precio,
      disponible: productoData.disponible,
      imagen: productoData.imagen || '',
      tiempoPreparacion: productoData.tiempoPreparacion,
      idCategoria: productoData.idCategoria,
      diasDisponibles: productoData.diasDisponibles || []
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Producto guardado correctamente'
    };
  } catch (error) {
    throw handleAxiosError(error);
  }
};

export const actualizarProducto = async (id, productoData) => {
  try {
    const response = await api.put(`/${id}`, {
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      precio: productoData.precio,
      disponible: productoData.disponible,
      imagen: productoData.imagen || '',
      tiempoPreparacion: productoData.tiempoPreparacion,
      categoria: { id: productoData.idCategoria }
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Producto actualizado correctamente'
    };
  } catch (error) {
    throw handleAxiosError(error);
  }
};

export const eliminarProducto = async (id) => {
  try {
    const response = await api.delete(`/${id}`);
    return {
      success: true,
      data: response.data,
      message: 'Producto eliminado correctamente'
    };
  } catch (error) {
    throw handleAxiosError(error);
  }
};

export const subirImagen = async (file) => {
  try {
    const formData = new FormData();
    formData.append('imagen', file);
    
    const response = await axios.post(`${BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000
    });
    
    const imageUrl = response.data.url || response.data.rutaImagen;
    
    return {
      success: true,
      data: {
        ...response.data,
        url: imageUrl,
        rutaImagen: imageUrl
      },
      message: 'Imagen subida correctamente'
    };
  } catch (error) {
    throw handleAxiosError(error);
  }
};

const handleAxiosError = (error) => {
  if (error.code === 'ECONNABORTED') {
    return new Error('Tiempo de espera agotado. Verifique su conexión.');
  }

  if (!error.response) {
    return new Error(`No se pudo conectar al servidor. Verifique que el backend esté ejecutándose en ${BASE_URL}`);
  }

  const status = error.response.status;
  
  let serverMessage = 'Error desconocido del servidor';
  if (error.response.data) {
    if (error.response.data.error) {
      serverMessage = error.response.data.error;
    } else if (error.response.data.message) {
      serverMessage = error.response.data.message;
    } else if (typeof error.response.data === 'string') {
      serverMessage = error.response.data;
    }
  }

  switch (status) {
    case 400:
      return new Error(`Datos inválidos: ${serverMessage}`);
    case 404:
      return new Error('Producto no encontrado');
    case 405:
      return new Error(`Método no permitido: ${serverMessage}`);
    case 409:
      return new Error(serverMessage);
    case 500:
      return new Error(`Error interno del servidor: ${serverMessage}`);
    default:
      return new Error(`Error ${status}: ${serverMessage}`);
  }
};

export default {
  listProductos,
  getProductoById,
  guardarProducto,
  guardarProductoConDias,
  actualizarProducto,
  eliminarProducto,
  subirImagen
};