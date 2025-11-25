import axios from 'axios';

// URL del backend
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:2002'}/api/pedidos`;

/**
 * Obtener el ÚLTIMO pedido del cliente (más reciente)
 * @param {number} clienteId - ID del cliente logeado
 * @returns {Promise<{data: object|null}>}
 */
export const obtenerUltimoPedidoCliente = async (clienteId) => {
  try {
    if (!clienteId) {
      throw new Error('ID de cliente no proporcionado');
    }

    const url = `${BASE_URL}/cliente/${clienteId}`;
    
    const response = await axios.get(url);
    
    // Verificar si todos los pedidos son del cliente correcto
    if (response.data && response.data.length > 0) {
      const pedidosDelCliente = response.data.filter(p => p.idCliente === clienteId);
      
      if (pedidosDelCliente.length === 0) {
        return { data: null };
      }
      
      // Ordenar por fecha más reciente y tomar solo el primero
      const pedidosOrdenados = pedidosDelCliente.sort((a, b) => 
        new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
      );
      return { data: pedidosOrdenados[0] }; // Retorna solo el último
    }
    
    return { data: null }; // No hay pedidos
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener todos los pedidos del cliente
 * @param {number} clienteId - ID del cliente logeado
 * @returns {Promise<object>}
 */
export const obtenerPedidosPorCliente = async (clienteId) => {
  try {
    if (!clienteId) {
      throw new Error('ID de cliente no proporcionado');
    }

    const url = `${BASE_URL}/cliente/${clienteId}`;
    
    const response = await axios.get(url);
    
    // Verificar y filtrar pedidos del cliente correcto
    if (response.data && response.data.length > 0) {
      const pedidosDelCliente = response.data.filter(p => p.idCliente === clienteId);
      
      // Retornar solo los pedidos del cliente logeado
      return { ...response, data: pedidosDelCliente };
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};
