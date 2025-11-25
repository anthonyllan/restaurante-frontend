import React, { useState } from 'react';
import { obtenerDetallesPorPedido } from '../../services/Cliente/DetallePedidoClienteService';
import { FiPackage, FiClock, FiHome, FiShoppingBag, FiChevronDown, FiLoader } from 'react-icons/fi';
import { MdDateRange, MdAccessTime } from 'react-icons/md';
import './PedidoCardCliente.css';

const PedidoCard = ({ pedido }) => {
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [detallesProductos, setDetallesProductos] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatearHora = (fecha) =>
    new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const calcularTiempoTranscurrido = (fechaCreacion) => {
    const ahora = new Date();
    const fechaPedido = new Date(fechaCreacion);
    const diferencia = ahora - fechaPedido;
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    return horas > 0 ? `${horas}h ${minutos % 60}m` : `${minutos}m`;
  };

  const cargarDetallesProductos = async () => {
    if (mostrarDetalles) {
      setMostrarDetalles(false);
      return;
    }

    try {
      setCargandoDetalles(true);
      const response = await obtenerDetallesPorPedido(pedido.id);
      setDetallesProductos(response.data || []);
      setMostrarDetalles(true);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      setDetallesProductos([]);
      setMostrarDetalles(true);
    } finally {
      setCargandoDetalles(false);
    }
  };

  const calcularTotal = () => {
    if (detallesProductos && detallesProductos.length > 0) {
      return detallesProductos.reduce((total, detalle) => {
        const precio = parseFloat(detalle.precio) || 0;
        const cantidad = parseInt(detalle.cantidad) || 0;
        return total + (precio * cantidad);
      }, 0).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className={`pedido-card ${pedido.estadoPedido?.toLowerCase()}`}>
      <div className="pedido-card-header">
        <div>
          <span className="pedido-id">Pedido #{pedido.id}</span>
          <span className="pedido-tipo">
            {pedido.tipoEntrega === 'DOMICILIO' ? <FiHome /> : <FiShoppingBag />}
            {pedido.tipoEntrega?.replace('_', ' ')}
          </span>
        </div>
        <div className="pedido-estado">{pedido.estadoPedido}</div>
      </div>

      <div className="pedido-fechas">
        <span><MdDateRange /> {formatearFecha(pedido.fechaCreacion)}</span>
        <span><MdAccessTime /> {formatearHora(pedido.fechaCreacion)}</span>
        <span><FiClock /> {calcularTiempoTranscurrido(pedido.fechaCreacion)}</span>
      </div>

      <button
        className="pedido-ver-detalles"
        onClick={cargarDetallesProductos}
        disabled={cargandoDetalles}
      >
        {cargandoDetalles ? (
          <>
            <FiLoader className="spinner" /> Cargando...
          </>
        ) : (
          <>
            <FiPackage /> {mostrarDetalles ? 'Ocultar Detalles' : 'Ver Detalles'}
            <FiChevronDown className={mostrarDetalles ? 'rotated' : ''} />
          </>
        )}
      </button>

      {mostrarDetalles && (
        <div className="pedido-detalles">
          {detallesProductos.length > 0 ? (
            <>
              <div className="pedido-detalles-lista">
                {detallesProductos.map((detalle, index) => (
                  <div key={index} className="pedido-item">
                    <div className="pedido-item-info">
                      <span className="pedido-item-cantidad">{detalle.cantidad}x</span>
                      <span className="pedido-item-nombre">{detalle.nombreProducto}</span>
                    </div>
                    <div className="pedido-item-precio">
                      <span className="pedido-item-precio-unitario">
                        ${parseFloat(detalle.precio).toFixed(2)} c/u
                      </span>
                      <span className="pedido-item-precio-total">
                        ${(parseFloat(detalle.precio) * parseInt(detalle.cantidad)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pedido-total-line">
                <span className="pedido-total-label">Total:</span>
                <span className="pedido-total-valor">${calcularTotal()}</span>
              </div>
            </>
          ) : (
            <p className="pedido-sin-detalles">No se encontraron detalles de productos.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PedidoCard;
