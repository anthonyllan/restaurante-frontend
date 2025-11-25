import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:2002'}/api/pagos`;

// Crear fecha y hora actual para Java LocalDateTime
const crearLocalDateTimeParaJava = () => {
  const ahora = new Date();
  const fechaMexico = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));

  const año = fechaMexico.getFullYear();
  const mes = fechaMexico.getMonth() + 1;
  const dia = fechaMexico.getDate();
  const hora = fechaMexico.getHours();
  const minuto = fechaMexico.getMinutes();
  const segundo = fechaMexico.getSeconds();

  return [año, mes, dia, hora, minuto, segundo];
};

// Registrar un nuevo pago
export const registrarPago = async (pagoDto) => {
    try {
        // Preparar el DTO con el formato correcto para el backend
        const pagoParaBackend = {
            idPedido: {
                id: pagoDto.idPedido
            },
            fechaPago: pagoDto.fechaPago || crearLocalDateTimeParaJava(),
            metodoPago: pagoDto.metodoPago, // 'EFECTIVO', 'TARJETA', etc.
            estadoPago: pagoDto.estadoPago, // 'PENDIENTE', 'APROBADO', etc.
            referenciaPago: pagoDto.referenciaPago || '',
            monto: Number(pagoDto.monto)
        };

        const response = await axios.post(BASE_URL, pagoParaBackend);
        return {
            success: true,
            data: response.data,
            message: 'Pago registrado correctamente'
        };
    } catch (error) {
        console.error('Error al registrar pago:', error);
        const errorInfo = {
            success: false,
            error: error.response?.data || error.message,
            message: 'Error al registrar el pago'
        };
        throw errorInfo;
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