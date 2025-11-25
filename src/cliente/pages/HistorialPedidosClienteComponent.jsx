import React, { useEffect, useState } from 'react';
import { obtenerPedidosPorCliente } from '../../services/Cliente/SeguimientoPedidoCliente';
import { getClienteId } from '../../utils/authUtils';
import PedidoCard from './PedidoCardCliente.jsx';
import { FiRefreshCw, FiX } from 'react-icons/fi';
import { BsClockHistory } from 'react-icons/bs';
import { MdRestaurant } from 'react-icons/md';
import './HistorialPedidosClienteComponent.css';

const HistorialPedidosClienteComponent = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar todos los pedidos del cliente
  const cargarPedidos = async () => {
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

      const response = await obtenerPedidosPorCliente(clienteId);
      setPedidos(response.data || []);
    } catch (err) {
      setError('Error al cargar el historial de pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
    // Actualizar cada minuto (menos frecuente que el seguimiento)
    const interval = setInterval(cargarPedidos, 60000);
    return () => clearInterval(interval);
  }, []);

  // Ordenar por fecha más reciente
  const pedidosOrdenados = [...pedidos].sort((a, b) => 
    new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
  );

  // Separar pedidos activos y completados
  const pedidosActivos = pedidosOrdenados.filter(p => p.estadoPedido !== 'ENTREGADO');
  const pedidosCompletados = pedidosOrdenados.filter(p => p.estadoPedido === 'ENTREGADO');

  return (
    <div className="cli-historial-container">
      {/* Header minimalista */}
      <div className="cli-historial-header">
        <h1><BsClockHistory /> Historial de Pedidos</h1>
        <p>Revisa todos tus pedidos anteriores y su estado actual</p>
      </div>

      {/* Botón de actualizar */}
      <div className="cli-historial-controls">
        <button className="cli-historial-refresh-btn" onClick={cargarPedidos}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="cli-historial-loading">
          <div className="cli-historial-spinner"></div>
          <p>Cargando historial...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="cli-historial-alert cli-historial-alert-error">
          <span>{error}</span>
          <button 
            className="cli-historial-alert-close" 
            onClick={() => setError('')}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Sin pedidos */}
      {!loading && pedidos.length === 0 && (
        <div className="cli-historial-empty">
          <div className="cli-historial-empty-icon">📋</div>
          <h3>No tienes pedidos registrados</h3>
          <p>Realiza tu primer pedido desde el menú para verlo aquí.</p>
        </div>
      )}

      {/* Grid de pedidos */}
      {!loading && pedidosOrdenados.length > 0 && (
        <div className="cli-historial-content">
          {/* Pedidos activos */}
          {pedidosActivos.length > 0 && (
            <>
              <div className="cli-historial-section-header">
                <h2>Pedidos en Proceso ({pedidosActivos.length})</h2>
              </div>
              <div className="cli-historial-grid">
                {pedidosActivos.map((pedido) => (
                  <PedidoCard key={pedido.id} pedido={pedido} esCliente={true} />
                ))}
              </div>
            </>
          )}

          {/* Separador */}
          {pedidosActivos.length > 0 && pedidosCompletados.length > 0 && (
            <div className="cli-historial-divider">
              <div className="cli-historial-divider-line"></div>
              <span className="cli-historial-divider-text">
                <MdRestaurant /> Pedidos Completados ({pedidosCompletados.length})
              </span>
              <div className="cli-historial-divider-line"></div>
            </div>
          )}

          {/* Pedidos completados */}
          {pedidosCompletados.length > 0 && pedidosActivos.length === 0 && (
            <div className="cli-historial-section-header">
              <h2>Pedidos Completados ({pedidosCompletados.length})</h2>
            </div>
          )}
          {pedidosCompletados.length > 0 && (
            <div className="cli-historial-grid cli-historial-grid-completados">
              {pedidosCompletados.map((pedido) => (
                <PedidoCard key={pedido.id} pedido={pedido} esCliente={true} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistorialPedidosClienteComponent;