import axios from 'axios';
import { API_BASE_URL } from '../../config/api.js';

const REST_API_BASE_URL = `${API_BASE_URL}/api/categorias`;

const axiosConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
};

export const subirImagen = async (file) => {
  if (!file) {
    throw new Error('Archivo es requerido');
  }
  
  try {
    const formData = new FormData();
    formData.append('imagen', file);
    
    const response = await axios.post(`${REST_API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
    
    return response;
    
  } catch (error) {
    handleAxiosError(error);
  }
};

export const listCategorias = async () => {
  try {
    const response = await axios.get(REST_API_BASE_URL, axiosConfig);
    return response;
    
  } catch (error) {
    handleAxiosError(error);
  }
};

export const getCategoriaById = async (id) => {
  if (!id) {
    throw new Error('ID es requerido');
  }
  
  try {
    const response = await axios.get(`${REST_API_BASE_URL}/${id}`, axiosConfig);
    return response;
    
  } catch (error) {
    handleAxiosError(error);
  }
};

export const guardarCategoria = async (categoria) => {
  const errores = validarCategoria(categoria);
  if (errores.length > 0) {
    throw new Error(errores.join(', '));
  }
  
  try {
    const payload = { 
      nombre: categoria.nombre.trim(),
      descripcion: categoria.descripcion.trim(),
      imagen: categoria.imagen || ''
    };
    
    const response = await axios.post(REST_API_BASE_URL, payload, axiosConfig);
    return response;
    
  } catch (error) {
    handleAxiosError(error);
  }
};

export const actualizarCategoria = async (id, categoria) => {
  if (!id) {
    throw new Error('ID es requerido para actualizar');
  }
  
  const errores = validarCategoria(categoria);
  if (errores.length > 0) {
    throw new Error(errores.join(', '));
  }
  
  try {
    const payload = { 
      nombre: categoria.nombre.trim(),
      descripcion: categoria.descripcion.trim(),
      imagen: categoria.imagen || ''
    };
    
    const response = await axios.put(`${REST_API_BASE_URL}/${id}`, payload, axiosConfig);
    return response;
    
  } catch (error) {
    handleAxiosError(error);
  }
};

export const eliminarCategoria = async (id) => {
  if (!id) {
    throw new Error('ID es requerido para eliminar');
  }
  
  try {
    const response = await axios.delete(`${REST_API_BASE_URL}/${id}`, axiosConfig);
    return response;
    
  } catch (error) {
    handleAxiosError(error);
  }
};

export const verificarConexion = async () => {
  try {
    const response = await axios.get(REST_API_BASE_URL, {
      ...axiosConfig,
      timeout: 5000,
    });
    
    return { success: true, message: 'Conexión exitosa', data: response.data };
    
  } catch (error) {
    return { 
      success: false, 
      message: formatearErrorAxios(error),
      error: error.code || 'UNKNOWN_ERROR'
    };
  }
};

const handleAxiosError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data || error.response.statusText;
    
    throw new Error(`Error ${status}: ${message}`);
    
  } else if (error.request) {
    throw new Error('Error de conexión: No se pudo conectar con el servidor. Verifica que el backend esté corriendo en ' + REST_API_BASE_URL);
    
  } else {
    throw new Error('Error de configuración: ' + error.message);
  }
};

const formatearErrorAxios = (error) => {
  if (error.code === 'ECONNREFUSED') {
    return 'No se pudo conectar al servidor. Verifica que esté corriendo.';
  }
  
  if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return 'Tiempo de espera agotado. Verifica tu conexión.';
  }
  
  if (error.response) {
    return `Error del servidor (${error.response.status}): ${error.response.data?.message || 'Error desconocido'}`;
  }
  
  return error.message || 'Error desconocido';
};

export const validarCategoria = (categoria) => {
  const errores = [];
  
  if (!categoria) {
    errores.push('Los datos de la categoría son requeridos');
    return errores;
  }
  
  if (!categoria.nombre) {
    errores.push('El nombre de la categoría es requerido');
  } else if (!categoria.nombre.trim()) {
    errores.push('El nombre de la categoría no puede estar vacío');
  } else if (categoria.nombre.trim().length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres');
  } else if (categoria.nombre.trim().length > 100) {
    errores.push('El nombre no puede tener más de 100 caracteres');
  }
  
  if (!categoria.descripcion) {
    errores.push('La descripción de la categoría es requerida');
  } else if (!categoria.descripcion.trim()) {
    errores.push('La descripción de la categoría no puede estar vacía');
  } else if (categoria.descripcion.trim().length < 10) {
    errores.push('La descripción debe tener al menos 10 caracteres');
  } else if (categoria.descripcion.trim().length > 500) {
    errores.push('La descripción no puede tener más de 500 caracteres');
  }
  
  if (categoria.imagen && categoria.imagen.length > 255) {
    errores.push('La ruta de la imagen es muy larga');
  }
  
  return errores;
};

export const formatearNombre = (nombre) => {
  if (!nombre) return '';
  return nombre.trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const truncarDescripcion = (descripcion, maxLength = 100) => {
  if (!descripcion) return '';
  if (descripcion.length <= maxLength) return descripcion;
  return descripcion.substring(0, maxLength).trim() + '...';
};