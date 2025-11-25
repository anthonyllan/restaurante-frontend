import React, { useEffect, useState } from 'react';
import { obtenerUltimoPedidoCliente } from '../../services/Cliente/SeguimientoPedidoCliente';
import { obtenerPagosPorPedido } from '../../services/Cliente/PagoClienteService';
import { getClienteId } from '../../utils/authUtils';
import { FiRefreshCw, FiCheck, FiClock, FiTruck, FiDollarSign } from 'react-icons/fi';
import { BsClipboardCheck } from 'react-icons/bs';
import { MdRestaurant } from 'react-icons/md';
import './SeguimientoClienteComponent.css';

const SeguimientoClienteComponent = () => {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar último pedido del cliente
  const cargarUltimoPedido = async () => {
    try {
      setLoading(true);
      setError('');
      
      // ✅ Obtener ID del cliente desde localStorage
      const clienteId = getClienteId();
      
      if (!clienteId) {
        setError('No se pudo obtener el ID del cliente. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      const response = await obtenerUltimoPedidoCliente(clienteId);
      let pedidoObtenido = response.data;

      if (pedidoObtenido) {
        try {
          const responsePagos = await obtenerPagosPorPedido(pedidoObtenido.id);
          const pagos = responsePagos.data || [];

          if (pagos.length > 0) {
            const pagoTarjeta = pagos.find(p => p.metodoPago?.toUpperCase?.() === 'TARJETA');
            const pagoEfectivo = pagos.find(p => p.metodoPago?.toUpperCase?.() === 'EFECTIVO');
            const ultimoPago = pagos[pagos.length - 1];

            const infoPago = pagoTarjeta
              ? {
                  metodoPagoDetectado: 'TARJETA',
                  estadoPagoDetectado: pagoTarjeta.estadoPago?.toUpperCase?.() || null
                }
              : pagoEfectivo
                ? {
                    metodoPagoDetectado: 'EFECTIVO',
                    estadoPagoDetectado: pagoEfectivo.estadoPago?.toUpperCase?.() || null
                  }
                : ultimoPago
                  ? {
                      metodoPagoDetectado: ultimoPago.metodoPago?.toUpperCase?.() || null,
                      estadoPagoDetectado: ultimoPago.estadoPago?.toUpperCase?.() || null
                    }
                  : null;

            if (infoPago) {
              pedidoObtenido = {
                ...pedidoObtenido,
                ...infoPago
              };
            }
          }
        } catch (error) {
          // Ignorar errores de pago y continuar con la información básica del pedido
        }
      }

      setPedido(pedidoObtenido);
    } catch (err) {
      setError('Error al cargar tu pedido más reciente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUltimoPedido();
    const interval = setInterval(cargarUltimoPedido, 10000); // actualiza cada 10s
    return () => clearInterval(interval);
  }, []);

  // Determinar pasos del proceso según el estado del pedido
  const obtenerPasosProceso = () => {
    if (!pedido) return [];

    const estadoActual = pedido.estadoPedido;
    const tipoEntrega = pedido.tipoEntrega;
    
    // Flujo para DOMICILIO: PAGADO → PREPARANDO → LISTO → EN_CAMINO → ENTREGADO
    if (tipoEntrega === 'DOMICILIO') {
      return [
        { id: 'PAGADO', nombre: 'Pagado', icono: <FiDollarSign /> },
        { id: 'PREPARANDO', nombre: 'Preparando', icono: <MdRestaurant /> },
        { id: 'LISTO', nombre: 'Listo', icono: <FiCheck /> },
        { id: 'EN_CAMINO', nombre: 'En Camino', icono: <FiTruck /> },
        { id: 'ENTREGADO', nombre: 'Entregado', icono: <FiCheck /> }
      ];
    }
    
    const metodoPago = pedido.metodoPagoDetectado?.toUpperCase?.() ||
      pedido.metodoPago?.toUpperCase?.() ||
      null;
    const estadoPago = pedido.estadoPagoDetectado?.toUpperCase?.() ||
      pedido.estadoPago?.toUpperCase?.() ||
      null;

    const esTarjeta = metodoPago === 'TARJETA' || estadoPago === 'APROBADO';

    if (esTarjeta) {
      // Flujo para PARA_LLEVAR con tarjeta: PAGADO → PREPARANDO → LISTO → ENTREGADO
      return [
        { id: 'PAGADO', nombre: 'Pagado', icono: <FiDollarSign /> },
        { id: 'PREPARANDO', nombre: 'Preparando', icono: <MdRestaurant /> },
        { id: 'LISTO', nombre: 'Listo', icono: <FiCheck /> },
        { id: 'ENTREGADO', nombre: 'Entregado', icono: <FiTruck /> }
      ];
    }

    // Flujo para PARA_LLEVAR en efectivo: REGISTRADO → PREPARANDO → LISTO → PAGADO → ENTREGADO
    return [
      { id: 'REGISTRADO', nombre: 'Pedido Registrado', icono: <BsClipboardCheck /> },
      { id: 'PREPARANDO', nombre: 'Preparando', icono: <MdRestaurant /> },
      { id: 'LISTO', nombre: 'Listo', icono: <FiCheck /> },
      { id: 'PAGADO', nombre: 'Pagado en Restaurante', icono: <FiDollarSign /> },
      { id: 'ENTREGADO', nombre: 'Entregado', icono: <FiTruck /> }
    ];
  };

  // Determinar si un paso está completado
  const estaCompletado = (paso) => {
    if (!pedido) return false;
    
    const pasos = obtenerPasosProceso();
    const estadoActual = pedido.estadoPedido;
    const indiceActual = pasos.findIndex(p => p.id === estadoActual);
    const indicePaso = pasos.findIndex(p => p.id === paso);
    
    // Si el estado actual es ENTREGADO y el paso es ENTREGADO, está completado
    if (estadoActual === 'ENTREGADO' && paso === 'ENTREGADO') {
      return true;
    }
    
    return indicePaso < indiceActual;
  };

  // Determinar si un paso está activo (en proceso)
  const estaActivo = (paso) => {
    if (!pedido) return false;
    
    const estadoActual = pedido.estadoPedido;
    
    // ENTREGADO es un estado final, no debe mostrarse como "activo"
    if (estadoActual === 'ENTREGADO' && paso === 'ENTREGADO') {
      return false;
    }
    
    return estadoActual === paso;
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha no válida';
    }
  };

  return (
    <div className="cli-seguimiento-container">
      <div className="cli-seguimiento-header">
        <h1><BsClipboardCheck /> Seguimiento de tu Pedido</h1>
        <p>Visualiza el estado actual de tu pedido más reciente</p>
      </div>

      <div className="cli-seguimiento-controls">
        <button className="cli-seguimiento-refreshBtn" onClick={cargarUltimoPedido}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      {loading && (
        <div className="cli-seguimiento-loadingContainer">
          <div className="cli-seguimiento-spinner"></div>
          <p>Cargando pedido...</p>
        </div>
      )}

      {error && (
        <div className="cli-seguimiento-alert cli-seguimiento-alertError">
          <span>{error}</span>
          <button 
            className="cli-seguimiento-alertClose" 
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      {!loading && !pedido && (
        <div className="cli-seguimiento-empty">
          <div className="cli-seguimiento-emptyIcon">📄</div>
          <h3>No tienes pedidos registrados</h3>
          <p>Realiza tu primer pedido para visualizarlo aquí.</p>
        </div>
      )}

      {!loading && pedido && (
        <div className="cli-seguimiento-pedido-detail">
          <div className="cli-seguimiento-info-card">
            <h2>Pedido #{pedido.id}</h2>
            <div className="cli-seguimiento-info-grid">
              <div className="cli-seguimiento-info-item">
                <span className="cli-seguimiento-label">Fecha:</span>
                <span className="cli-seguimiento-value">{formatearFecha(pedido.fechaCreacion)}</span>
              </div>
              <div className="cli-seguimiento-info-item">
                <span className="cli-seguimiento-label">Tipo de Entrega:</span>
                <span className="cli-seguimiento-value">
                  {pedido.tipoEntrega === 'PARA_LLEVAR' ? 'Para llevar' : 'A domicilio'}
                </span>
              </div>
              <div className="cli-seguimiento-info-item">
                <span className="cli-seguimiento-label">Estado Actual:</span>
                <span className={`cli-seguimiento-badge cli-seguimiento-badge-${pedido.estadoPedido.toLowerCase()}`}>
                  {pedido.estadoPedido}
                </span>
              </div>
            </div>
          </div>

          <div className="cli-seguimiento-timeline">
            <h3>Progreso del Pedido</h3>
            <div className="cli-timeline">
              {obtenerPasosProceso().map((paso, index) => (
                <div 
                  key={paso.id} 
                  className={`cli-timeline-step ${estaCompletado(paso.id) ? 'completado' : ''} ${estaActivo(paso.id) ? 'activo' : ''}`}
                >
                  <div className="cli-timeline-icon">
                    {estaCompletado(paso.id) ? <FiCheck /> : paso.icono}
                  </div>
                  <div className="cli-timeline-content">
                    <h4>{paso.nombre}</h4>
                    {estaActivo(paso.id) && (
                      <p className="cli-timeline-status">
                        <FiClock /> En proceso...
                      </p>
                    )}
                  </div>
                  {index < obtenerPasosProceso().length - 1 && (
                    <div className={`cli-timeline-line ${estaCompletado(obtenerPasosProceso()[index + 1].id) ? 'completado' : ''}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {pedido.tipoEntrega === 'DOMICILIO' && (
            <div className="cli-seguimiento-direccion">
              <h3>Dirección de Entrega</h3>
              <p>{pedido.calle} {pedido.numeroExterior} {pedido.numeroInterior ? `, Int. ${pedido.numeroInterior}` : ''}</p>
              <p>{pedido.colonia}, {pedido.ciudad}, {pedido.estadoDireccion}</p>
              <p>C.P. {pedido.codigoPostal}</p>
              {pedido.referenciasEntrega && <p><strong>Referencias:</strong> {pedido.referenciasEntrega}</p>}
              <p><strong>Teléfono:</strong> {pedido.numeroTelefono}</p>
              
              {pedido.estadoPedido === 'EN_CAMINO' && (
                <div className="cli-seguimiento-alert cli-seguimiento-alertSuccess">
                  <FiTruck /> Tu pedido está en camino. El repartidor llegará pronto a tu domicilio.
                </div>
              )}
              {pedido.estadoPedido === 'LISTO' && (
                <div className="cli-seguimiento-alert cli-seguimiento-alertSuccess">
                  <FiCheck /> Tu pedido está listo. Pronto será enviado a tu domicilio.
                </div>
              )}
            </div>
          )}

          {pedido.tipoEntrega === 'PARA_LLEVAR' && (
            <div className="cli-seguimiento-recoger">
              <h3>Información de Recogida</h3>
              <p><strong>Ubicación del Restaurante:</strong></p>
              <p>Zaragoza #6, Centro, Chilpancingo, Guerrero</p>
              <p>C.P. 39020</p>
              <p><strong>Teléfono de contacto:</strong> {pedido.numeroTelefono}</p>
              {pedido.estadoPedido === 'LISTO' && (
                <div className="cli-seguimiento-alert cli-seguimiento-alertSuccess">
                  <FiCheck /> Tu pedido está listo para recoger. {pedido.metodoPagoDetectado === 'TARJETA' ? 'Preséntate en el restaurante para recogerlo.' : 'Preséntate en el restaurante para recoger y pagar.'}
                </div>
              )}
              {pedido.metodoPagoDetectado === 'TARJETA' && pedido.estadoPedido === 'PAGADO' && (
                <div className="cli-seguimiento-alert cli-seguimiento-alertSuccess">
                  <FiDollarSign /> Pago recibido exitosamente. Nuestro equipo está preparando tu pedido.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeguimientoClienteComponent;