import axios from 'axios';
import { API_BASE_URL } from '../../config/api.js';

const REST_API_BASE_URL = `${API_BASE_URL}/api/dia`;

const axiosConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
};

export const listDiasSemana = async () => {
  try {
    const response = await axios.get(REST_API_BASE_URL, axiosConfig);
    return response;
    
  } catch (error) {
    handleAxiosError(error);
  }
};

export const listDiasHabilitados = async () => {
  try {
    const response = await axios.get(`${REST_API_BASE_URL}/habilitados`, axiosConfig);
    
    return {
      success: true,
      data: response.data,
      message: 'Días habilitados cargados correctamente'
    };
    
  } catch (error) {
    handleAxiosError(error);
  }
};

export const getDiaSemanaById = async (id) => {
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

export const cambiarEstadoDia = async (id, habilitado) => {
  if (!id) {
    throw new Error('ID es requerido para cambiar estado');
  }
  
  if (typeof habilitado !== 'boolean') {
    throw new Error('El estado debe ser un valor booleano');
  }
  
  try {
    const payload = { habilitado };
    const response = await axios.patch(`${REST_API_BASE_URL}/${id}/estado`, payload, axiosConfig);
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

export default {
  listDiasSemana,
  listDiasHabilitados,
  getDiaSemanaById,
  cambiarEstadoDia,
  verificarConexion
};