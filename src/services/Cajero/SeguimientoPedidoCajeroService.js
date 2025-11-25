import axios from 'axios';
import { getEmpleadoId } from '../../utils/authUtils';

const BASE_URL = 'http://localhost:2002/api/pedidos';

// Obtener todos los pedidos
export const obtenerTodosPedidos = async () => {
    try {
        const response = await axios.get(BASE_URL);
        return response;
    } catch (error) {
        throw error;
    }
};

// ✅ Obtener pedidos locales (PICKUP_EN_MOSTRADOR) DEL CAJERO LOGEADO
export const obtenerPedidosLocales = async () => {
    try {
        const empleadoId = getEmpleadoId();
        
        if (!empleadoId) {
            throw new Error('ID de empleado no encontrado. Por favor, inicia sesión nuevamente.');
        }

        const response = await axios.get(BASE_URL);
        
        // ✅ Filtrar por tipo de entrega Y por empleado
        const pedidosLocales = response.data.filter(pedido => 
            pedido.tipoEntrega === 'PICKUP_EN_MOSTRADOR' &&
            pedido.idEmpleado === empleadoId
        );

        return { ...response, data: pedidosLocales };
    } catch (error) {
        throw error;
    }
};

// ✅ Obtener pedidos en línea (DOMICILIO y PARA_LLEVAR) - VISIBLES PARA TODOS LOS CAJEROS
export const obtenerPedidosEnLinea = async () => {
    try {
        const response = await axios.get(BASE_URL);
        
        // ✅ Filtrar SOLO por tipo de entrega (SIN filtrar por empleado)
        // Los pedidos en línea son de clientes y cualquier cajero puede gestionarlos
        const pedidosEnLinea = response.data.filter(pedido => 
            pedido.tipoEntrega === 'DOMICILIO' || pedido.tipoEntrega === 'PARA_LLEVAR'
        );

        return { ...response, data: pedidosEnLinea };
    } catch (error) {
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
        throw error;
    }
};

// Obtener pedido por ID
export const obtenerPedidoPorId = async (idPedido) => {
    try {
        const response = await axios.get(`${BASE_URL}/${idPedido}`);
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