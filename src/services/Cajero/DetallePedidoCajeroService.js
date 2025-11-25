import axios from 'axios';

const BASE_URL = 'http://localhost:2002/api/detalle-pedido';
const PRODUCTOS_URL = 'http://localhost:2001/api/productos';

// Registrar detalles de pedido
export const registrarDetallesPedido = async (detalles) => {
    try {
        const response = await axios.post(BASE_URL, detalles);
        return response;
    } catch (error) {
        throw error;
    }
};

// Obtener detalles por pedido - CON NOMBRES Y PRECIOS
export const obtenerDetallesPorPedido = async (idPedido) => {
    try {
        const response = await axios.get(`${BASE_URL}/pedido/${idPedido}`);
        const detalles = response.data || [];

        // Obtener nombre Y precio de cada producto
        const detallesConNombresYPrecios = await Promise.all(
            detalles.map(async (detalle) => {
                try {
                    const productoResponse = await axios.get(`${PRODUCTOS_URL}/${detalle.idProducto}`);
                    const producto = productoResponse.data;
                    
                    return {
                        ...detalle,
                        nombreProducto: producto.nombre || `Producto #${detalle.idProducto}`,
                        precio: producto.precio || 0,
                        descripcion: producto.descripcion || '',
                        imagen: producto.imagen || '',
                        tiempoPreparacion: producto.tiempoPreparacion || 0
                    };
                } catch (productoError) {
                    return {
                        ...detalle,
                        nombreProducto: `Producto #${detalle.idProducto}`,
                        precio: 0,
                        descripcion: '',
                        imagen: '',
                        tiempoPreparacion: 0
                    };
                }
            })
        );

        return { ...response, data: detallesConNombresYPrecios };
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