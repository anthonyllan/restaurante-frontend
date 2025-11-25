import axios from 'axios';
import { API_PEDIDO_URL } from '../../config/api.js';

const BASE_URL = `${API_PEDIDO_URL}/api/ventas`;

// Obtener todas las ventas
export const obtenerTodasVentas = async () => {
    try {
        const response = await axios.get(BASE_URL);
        return response;
    } catch (error) {
        throw error;
    }
};

// Obtener ventas por empleado (cajero)
export const obtenerVentasPorEmpleado = async (idEmpleado) => {
    try {
        const url = `${BASE_URL}/empleado/${idEmpleado}`;
        const response = await axios.get(url);
        return response;
    } catch (error) {
        throw error;
    }
};

// Obtener venta por pedido
export const obtenerVentaPorPedido = async (idPedido) => {
    try {
        const response = await axios.get(`${BASE_URL}/pedido/${idPedido}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Registrar una venta manualmente (si es necesario)
export const registrarVenta = async (ventaDto) => {
    try {
        const response = await axios.post(BASE_URL, ventaDto);
        return response;
    } catch (error) {
        throw error;
    }
};

// Verificar conexión
export const verificarConexion = async () => {
    try {
        const response = await axios.get(BASE_URL);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};