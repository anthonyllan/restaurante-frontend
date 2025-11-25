import axios from 'axios';

const BASE_URL_PEDIDOS = `${import.meta.env.VITE_API_PEDIDO_URL || 'http://localhost:2002'}/api/pedidos`;
const BASE_URL_PAGOS = `${import.meta.env.VITE_API_PEDIDO_URL || 'http://localhost:2002'}/api/pagos`;
const BASE_URL_VENTAS = `${import.meta.env.VITE_API_PEDIDO_URL || 'http://localhost:2002'}/api/ventas`;

/**
 * Servicio de Gestión de Ingresos para Administrador
 * Gestiona pedidos, pagos y ventas con filtros por periodo
 */

// ==================== PEDIDOS ====================

/**
 * Obtener todos los pedidos
 */
export const obtenerTodosPedidos = async () => {
  try {
    const response = await axios.get(BASE_URL_PEDIDOS);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar pedidos'
    };
  }
};

/**
 * Obtener pedido por ID
 */
export const obtenerPedidoPorId = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL_PEDIDOS}/${id}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar pedido'
    };
  }
};

// ==================== PAGOS ====================

/**
 * Obtener todos los pagos
 */
export const obtenerTodosPagos = async () => {
  try {
    const response = await axios.get(BASE_URL_PAGOS);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error al obtener pagos:', error);
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar pagos'
    };
  }
};

/**
 * Obtener pagos por pedido
 */
export const obtenerPagosPorPedido = async (idPedido) => {
  try {
    const response = await axios.get(`${BASE_URL_PAGOS}/pedido/${idPedido}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error al obtener pagos del pedido:', error);
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar pagos del pedido'
    };
  }
};

// ==================== VENTAS ====================

/**
 * Obtener todas las ventas
 */
export const obtenerTodasVentas = async () => {
  try {
    const response = await axios.get(BASE_URL_VENTAS);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error al obtener ventas:', error);
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar ventas'
    };
  }
};

/**
 * Obtener ventas por empleado
 */
export const obtenerVentasPorEmpleado = async (idEmpleado) => {
  try {
    const response = await axios.get(`${BASE_URL_VENTAS}/empleado/${idEmpleado}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error al obtener ventas del empleado:', error);
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar ventas del empleado'
    };
  }
};

/**
 * Obtener venta por pedido
 */
export const obtenerVentaPorPedido = async (idPedido) => {
  try {
    const response = await axios.get(`${BASE_URL_VENTAS}/pedido/${idPedido}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error al obtener venta del pedido:', error);
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar venta del pedido'
    };
  }
};

// ==================== UTILIDADES ====================

/**
 * Formatear fecha para mostrar
 */
export const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A';
  
  try {
    // Si es array [año, mes, día, hora, minuto, segundo]
    if (Array.isArray(fecha)) {
      const [year, month, day, hour = 0, minute = 0] = fecha;
      const date = new Date(year, month - 1, day, hour, minute);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Si es string
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

/**
 * Formatear moneda
 */
export const formatearMoneda = (monto) => {
  if (monto === null || monto === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(monto);
};

/**
 * Obtener nombre del método de pago
 */
export const obtenerNombreMetodoPago = (metodo) => {
  const metodos = {
    'TARJETA': 'Tarjeta',
    'EFECTIVO': 'Efectivo'
  };
  return metodos[metodo] || metodo;
};

/**
 * Obtener nombre del estado de pago
 */
export const obtenerNombreEstadoPago = (estado) => {
  const estados = {
    'PENDIENTE': 'Pendiente',
    'APROBADO': 'Aprobado',
    'RECHAZADO': 'Rechazado',
    'CANCELADO': 'Cancelado'
  };
  return estados[estado] || estado;
};

/**
 * Filtrar datos por periodo
 */
export const filtrarPorPeriodo = (datos, periodo, fechaInicio = null, fechaFin = null) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return datos.filter(item => {
    let fechaItem;

    // Extraer fecha del item (puede estar en diferentes campos)
    if (item.fechaCreacion) {
      fechaItem = parseFecha(item.fechaCreacion);
    } else if (item.fechaPago) {
      fechaItem = parseFecha(item.fechaPago);
    } else if (item.fechaVenta) {
      fechaItem = parseFecha(item.fechaVenta);
    } else {
      return false;
    }

    if (!fechaItem) return false;
    fechaItem.setHours(0, 0, 0, 0);

    switch (periodo) {
      case 'hoy':
        return fechaItem.getTime() === hoy.getTime();

      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        return fechaItem >= inicioSemana && fechaItem <= finSemana;

      case 'mes':
        return fechaItem.getMonth() === hoy.getMonth() && 
               fechaItem.getFullYear() === hoy.getFullYear();

      case 'personalizado':
        if (fechaInicio && fechaFin) {
          const inicio = new Date(fechaInicio);
          const fin = new Date(fechaFin);
          inicio.setHours(0, 0, 0, 0);
          fin.setHours(23, 59, 59, 999);
          return fechaItem >= inicio && fechaItem <= fin;
        }
        return true;

      default:
        return true;
    }
  });
};

/**
 * Parsear fecha (array o string)
 */
const parseFecha = (fecha) => {
  try {
    if (Array.isArray(fecha)) {
      const [year, month, day] = fecha;
      return new Date(year, month - 1, day);
    }
    return new Date(fecha);
  } catch (error) {
    console.error('Error al parsear fecha:', error);
    return null;
  }
};
