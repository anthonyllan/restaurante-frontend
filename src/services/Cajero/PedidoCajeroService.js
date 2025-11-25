import axios from 'axios';
import { API_PEDIDO_URL } from '../../config/api.js';

const BASE_URL = `${API_PEDIDO_URL}/api/pedidos`;

// Registrar un nuevo pedido
export const registrarPedido = async (pedidoDto) => {
    try {
        const response = await axios.post(BASE_URL, pedidoDto);
        return response;
    } catch (error) {
        console.error('Error al registrar pedido:', error);
        throw error;
    }
};

// Cambiar estado del pedido
export const cambiarEstadoPedido = async (idPedido, nuevoEstado) => {
    try {
        const response = await axios.put(`${BASE_URL}/${idPedido}/estado`, {
            estado: nuevoEstado
        });
        return response;
    } catch (error) {
        console.error('Error al cambiar estado del pedido:', error);
        throw error;
    }
};

// Obtener pedido por ID
export const obtenerPedidoPorId = async (idPedido) => {
    try {
        const response = await axios.get(`${BASE_URL}/${idPedido}`);
        return response;
    } catch (error) {
        console.error('Error al obtener pedido:', error);
        throw error;
    }
};

// Obtener todos los pedidos
export const obtenerTodosPedidos = async () => {
    try {
        const response = await axios.get(BASE_URL);
        return response;
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        throw error;
    }
};

// Obtener pedidos por cliente
export const obtenerPedidosPorCliente = async (idCliente) => {
    try {
        const response = await axios.get(`${BASE_URL}/cliente/${idCliente}`);
        return response;
    } catch (error) {
        console.error('Error al obtener pedidos del cliente:', error);
        throw error;
    }
};

// Verificar conexión
export const verificarConexion = async () => {
    try {
        const response = await axios.get(BASE_URL);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error de conexión con el servicio de pedidos:', error);
        return { success: false, error: error.message };
    }
};