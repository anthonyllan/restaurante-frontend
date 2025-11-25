import axios from 'axios';

const BASE_URL = 'http://localhost:2002/api/pagos';

// Registrar un nuevo pago
export const registrarPago = async (pagoDto) => {
    try {
        const response = await axios.post(BASE_URL, pagoDto);
        return response;
    } catch (error) {
        console.error('Error al registrar pago:', error);
        throw error;
    }
};

// Obtener pago por ID
export const obtenerPagoPorId = async (idPago) => {
    try {
        const response = await axios.get(`${BASE_URL}/${idPago}`);
        return response;
    } catch (error) {
        console.error('Error al obtener pago:', error);
        throw error;
    }
};

// Obtener pagos por pedido
export const obtenerPagosPorPedido = async (idPedido) => {
    try {
        const response = await axios.get(`${BASE_URL}/pedido/${idPedido}`);
        return response;
    } catch (error) {
        console.error('Error al obtener pagos del pedido:', error);
        throw error;
    }
};

// Actualizar estado del pago
export const actualizarEstadoPago = async (idPago, nuevoEstado) => {
    try {
        const response = await axios.put(`${BASE_URL}/${idPago}/estado`, {
            estado: nuevoEstado
        });
        return response;
    } catch (error) {
        console.error('Error al actualizar estado del pago:', error);
        throw error;
    }
};

// Verificar conexión
export const verificarConexion = async () => {
    try {
        const response = await axios.get(BASE_URL);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error de conexión con el servicio de pagos:', error);
        return { success: false, error: error.message };
    }
};