import axios from 'axios';
import { API_BASE_URL } from '../../config/api.js';

const API_BASE_URL_PRODUCTODIA = `${API_BASE_URL}/api/productodia`;

const apiClient = axios.create({
  baseURL: API_BASE_URL_PRODUCTODIA,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    throw new Error(error.response?.data?.message || error.message);
  }
);

export const getProductoDiasByProducto = async (productoId) => {
  try {
    const response = await apiClient.get(`/producto/${productoId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const guardarProductoDia = async (productoDiaData) => {
  try {
    const dataCorregida = {
      producto: { id: parseInt(productoDiaData.producto.id) },
      dia: { id: parseInt(productoDiaData.dia.id) }
    };
    
    const response = await apiClient.post('', dataCorregida);
    return response;
  } catch (error) {
    throw error;
  }
};

export const eliminarProductoDia = async (id) => {
  try {
    const response = await apiClient.delete(`/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const eliminarProductoDiasPorProducto = async (productoId) => {
  try {
    const response = await getProductoDiasByProducto(productoId);
    const productoDias = response.data;
    
    if (productoDias && productoDias.length > 0) {
      const eliminaciones = productoDias.map(pd => eliminarProductoDia(pd.id));
      await Promise.all(eliminaciones);
    }
    
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const actualizarDiasProducto = async (productoId, diasIds) => {
  try {
    await eliminarProductoDiasPorProducto(productoId);
    
    if (diasIds && diasIds.length > 0) {
      const promesas = diasIds.map(diaId => {
        const data = {
          producto: { id: parseInt(productoId) },
          dia: { id: parseInt(diaId) }
        };
        return guardarProductoDia(data);
      });
      
      await Promise.all(promesas);
    }
    
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export default {
  getProductoDiasByProducto,
  guardarProductoDia,
  eliminarProductoDia,
  eliminarProductoDiasPorProducto,
  actualizarDiasProducto
};