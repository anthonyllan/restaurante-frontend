import axios from 'axios';
import { API_PEDIDO_URL } from '../../config/api.js';

const BASE_URL = `${API_PEDIDO_URL}/api/pedidos`;

const pedidoAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'WEB_CLIENTE'
  }
});

export const registrarPedido = async (pedidoDto) => {
  try {
    validarDatosPedido(pedidoDto);
    const pedidoParaEnvio = prepararPedidoParaEnvio(pedidoDto);
    const response = await pedidoAxios.post('', pedidoParaEnvio);
    
    return {
      success: true,
      data: response.data,
      message: 'Pedido registrado correctamente',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const errorInfo = {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString()
    };
    
    if (error.response?.status === 400) {
      errorInfo.message = 'Datos del pedido inválidos. Verifica la información e intenta nuevamente.';
      if (error.response?.data?.error) {
        errorInfo.message = error.response.data.error;
      }
    } else if (error.response?.status === 500) {
      errorInfo.message = 'Error interno del servidor. Por favor intenta más tarde.';
    } else if (error.code === 'ECONNABORTED') {
      errorInfo.message = 'La conexión tardó demasiado. Verifica tu conexión a internet.';
    } else if (error.code === 'ECONNREFUSED') {
      errorInfo.message = 'No se pudo conectar al servidor. Verifica que el servidor esté funcionando.';
    } else {
      errorInfo.message = 'Error al procesar el pedido. Contacta al restaurante si el problema persiste.';
    }
    
    throw errorInfo;
  }
};

export const obtenerMisPedidos = async (idCliente = 1) => {
  try {
    const response = await pedidoAxios.get(`/cliente/${idCliente}`);
    
    const pedidosOrdenados = response.data.sort((a, b) => {
      const fechaA = new Date(a.fechaCreacion);
      const fechaB = new Date(b.fechaCreacion);
      return fechaB - fechaA;
    });
    
    return {
      success: true,
      data: pedidosOrdenados,
      total: pedidosOrdenados.length,
      message: `Se encontraron ${pedidosOrdenados.length} pedidos`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const errorInfo = {
      success: false,
      data: [],
      error: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    };
    
    if (error.response?.status === 404) {
      errorInfo.message = 'No se encontraron pedidos para este cliente.';
    } else {
      errorInfo.message = 'Error al consultar el historial de pedidos.';
    }
    
    throw errorInfo;
  }
};

export const obtenerMiPedido = async (idPedido, idCliente = 1) => {
  try {
    const response = await pedidoAxios.get(`/${idPedido}`);
    
    if (response.data.idCliente !== idCliente) {
      throw new Error('No tienes permiso para ver este pedido');
    }
    
    return {
      success: true,
      data: response.data,
      message: 'Pedido encontrado',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const errorInfo = {
      success: false,
      error: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    };
    
    if (error.message.includes('permiso')) {
      errorInfo.message = 'No tienes permiso para ver este pedido.';
    } else if (error.response?.status === 404) {
      errorInfo.message = 'Pedido no encontrado.';
    } else {
      errorInfo.message = 'Error al consultar el pedido.';
    }
    
    throw errorInfo;
  }
};

export const verificarEstadoPedido = async (idPedido, idCliente = 1) => {
  try {
    const response = await obtenerMiPedido(idPedido, idCliente);
    
    return {
      success: true,
      data: {
        id: response.data.id,
        estado: response.data.estadoPedido,
        fechaCreacion: response.data.fechaCreacion,
        tipoEntrega: response.data.tipoEntrega
      },
      message: `Estado actual: ${response.data.estadoPedido}`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw error;
  }
};

export const verificarConexion = async () => {
  try {
    const response = await pedidoAxios.get('', { timeout: 5000 });
    
    return {
      success: true,
      message: 'Conexión exitosa con el servicio de pedidos',
      status: response.status,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'No se pudo conectar con el servicio de pedidos',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

const validarDatosPedido = (pedidoDto) => {
  const camposObligatorios = [
    'idCliente',
    'fechaCreacion',
    'estadoPedido',
    'tipoEntrega',
    'calle',
    'numeroExterior',
    'colonia',
    'ciudad',
    'estadoDireccion',
    'codigoPostal',
    'numeroTelefono'
  ];
  
  const camposFaltantes = camposObligatorios.filter(campo => 
    !pedidoDto.hasOwnProperty(campo) || 
    pedidoDto[campo] === null || 
    pedidoDto[campo] === undefined ||
    (typeof pedidoDto[campo] === 'string' && pedidoDto[campo].trim() === '')
  );
  
  if (camposFaltantes.length > 0) {
    throw new Error(`Faltan los siguientes campos obligatorios: ${camposFaltantes.join(', ')}`);
  }
  
  if (pedidoDto.numeroTelefono && !/^\d{10}$/.test(pedidoDto.numeroTelefono.toString())) {
    throw new Error('El número de teléfono debe tener exactamente 10 dígitos');
  }
  
  if (pedidoDto.codigoPostal && !/^\d{5}$/.test(pedidoDto.codigoPostal.toString())) {
    throw new Error('El código postal debe tener exactamente 5 dígitos');
  }
};

const prepararPedidoParaEnvio = (pedidoDto) => {
  return {
    idCliente: Number(pedidoDto.idCliente),
    fechaCreacion: pedidoDto.fechaCreacion,
    estadoPedido: pedidoDto.estadoPedido,
    tipoEntrega: pedidoDto.tipoEntrega,
    enLinea: Boolean(pedidoDto.enLinea),
    calle: String(pedidoDto.calle).trim(),
    numeroExterior: String(pedidoDto.numeroExterior).trim(),
    numeroInterior: pedidoDto.numeroInterior ? String(pedidoDto.numeroInterior).trim() : '',
    colonia: String(pedidoDto.colonia).trim(),
    ciudad: String(pedidoDto.ciudad).trim(),
    estadoDireccion: String(pedidoDto.estadoDireccion).trim(),
    codigoPostal: String(pedidoDto.codigoPostal).trim(),
    referenciasEntrega: pedidoDto.referenciasEntrega ? String(pedidoDto.referenciasEntrega).trim() : '',
    numeroTelefono: String(pedidoDto.numeroTelefono).trim()
  };
};

export const formatearFechaPedido = (fecha) => {
  try {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Fecha no válida';
  }
};

export const obtenerDescripcionEstado = (estado) => {
  const estados = {
    'PENDIENTE': 'Pedido recibido, preparando...',
    'REGISTRADO': 'Pedido registrado, pendiente de pago',
    'PAGADO': 'Pedido pagado exitosamente',
    'PREPARANDO': 'Tu pedido se está preparando',
    'LISTO': 'Pedido listo para entrega/recogida',
    'EN_CAMINO': 'Repartidor en camino a tu domicilio',
    'ENTREGADO': 'Pedido entregado exitosamente',
    'CANCELADO': 'Pedido cancelado'
  };
  
  return estados[estado] || 'Estado desconocido';
};

export default {
  registrarPedido,
  obtenerMisPedidos,
  obtenerMiPedido,
  verificarEstadoPedido,
  verificarConexion,
  formatearFechaPedido,
  obtenerDescripcionEstado
};