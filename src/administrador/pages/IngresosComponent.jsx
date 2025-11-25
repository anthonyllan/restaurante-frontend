import React, { useState, useEffect } from 'react';
import {
  FiDollarSign, FiCalendar, FiRefreshCw, FiDownload,
  FiAlertCircle, FiCheck, FiX, FiTrendingUp, FiShoppingCart,
  FiCreditCard
} from 'react-icons/fi';
import {
  obtenerTodosPedidos,
  obtenerTodosPagos,
  obtenerTodasVentas,
  formatearFecha,
  formatearMoneda,
  obtenerNombreMetodoPago,
  obtenerNombreEstadoPago,
  filtrarPorPeriodo
} from '../../services/Administrador/IngresosService';
import { obtenerPerfilCliente } from '../../services/Cliente/PerfilClienteService';
import { generarReporteIngresosPDF } from '../../services/Administrador/PDFService';
import './IngresosComponent.css';

const IngresosComponent = () => {
  // Estados principales
  const [pedidos, setPedidos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clienteCache, setClienteCache] = useState({});

  // Estados de filtros
  const [periodo, setPeriodo] = useState('mes'); // hoy, semana, mes, personalizado
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Estados filtrados
  const [datosFiltrados, setDatosFiltrados] = useState({
    pedidos: [],
    pagos: [],
    ventas: []
  });

  // Cargar datos al montar
  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrar datos cuando cambie el periodo o las fechas
  useEffect(() => {
    aplicarFiltros();
  }, [periodo, fechaInicio, fechaFin, pedidos, pagos, ventas]);

  useEffect(() => {
    if (!pedidos || pedidos.length === 0) return;

    let cancelado = false;

    const cargarClientes = async () => {
      const idsClientes = [...new Set(pedidos.map(p => p.idCliente).filter(Boolean))];
      const idsPorBuscar = idsClientes.filter(id => !clienteCache[id]);

      if (idsPorBuscar.length === 0) return;

      const nuevosClientes = {};

      await Promise.all(
        idsPorBuscar.map(async (clienteId) => {
          try {
            const responseCliente = await obtenerPerfilCliente(clienteId);
            const datosCliente = responseCliente.data;
            const nombreCompleto = [datosCliente?.nombre, datosCliente?.apellidos]
              .filter(Boolean)
              .join(' ')
              .trim();
            nuevosClientes[clienteId] = nombreCompleto || datosCliente?.nombre || `Cliente #${clienteId}`;
          } catch (err) {
            nuevosClientes[clienteId] = `Cliente #${clienteId}`;
          }
        })
      );

      if (!cancelado && Object.keys(nuevosClientes).length > 0) {
        setClienteCache(prev => ({
          ...prev,
          ...nuevosClientes
        }));
      }
    };

    cargarClientes();

    return () => {
      cancelado = true;
    };
  }, [pedidos, clienteCache]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [pedidosRes, pagosRes, ventasRes] = await Promise.all([
        obtenerTodosPedidos(),
        obtenerTodosPagos(),
        obtenerTodasVentas()
      ]);

      setPedidos(pedidosRes.data);
      setPagos(pagosRes.data);
      setVentas(ventasRes.data);

    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos de ingresos');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    const pedidosFiltrados = filtrarPorPeriodo(pedidos, periodo, fechaInicio, fechaFin);
    const pagosFiltrados = filtrarPorPeriodo(pagos, periodo, fechaInicio, fechaFin);
    const ventasFiltradas = filtrarPorPeriodo(ventas, periodo, fechaInicio, fechaFin);

    setDatosFiltrados({
      pedidos: pedidosFiltrados,
      pagos: pagosFiltrados,
      ventas: ventasFiltradas
    });
  };

  const handlePeriodoChange = (nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    if (nuevoPeriodo !== 'personalizado') {
      setFechaInicio('');
      setFechaFin('');
    }
  };

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const totalPedidos = datosFiltrados.pedidos.length;
    
    const totalIngresos = datosFiltrados.pagos
      .filter(p => p.estadoPago === 'APROBADO')
      .reduce((sum, p) => sum + (p.monto || 0), 0);

    const pagosTarjeta = datosFiltrados.pagos.filter(p => p.metodoPago === 'TARJETA').length;
    const pagosEfectivo = datosFiltrados.pagos.filter(p => p.metodoPago === 'EFECTIVO').length;

    const promedioVenta = totalPedidos > 0 ? totalIngresos / totalPedidos : 0;

    return {
      totalPedidos,
      totalIngresos,
      pagosTarjeta,
      pagosEfectivo,
      promedioVenta
    };
  };

  const obtenerNombreCliente = (pedido) => {
    if (!pedido || pedido.idCliente === null || pedido.idCliente === undefined) {
      return 'Cliente mostrador';
    }

    return clienteCache[pedido.idCliente] || `Cliente #${pedido.idCliente}`;
  };

  const stats = calcularEstadisticas();

  const handleGenerarPDF = () => {
    try {
      setError('');
      generarReporteIngresosPDF(datosFiltrados, periodo, fechaInicio, fechaFin, clienteCache);
      setSuccess('Reporte PDF generado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Error al generar el reporte PDF');
    }
  };

  if (loading) {
    return (
      <div className="admin-ingresos-loading">
        <div className="admin-ingresos-spinner"></div>
        <p>Cargando datos de ingresos...</p>
      </div>
    );
  }

  return (
    <div className="admin-ingresos-container">
      {/* Header */}
      <div className="admin-ingresos-header">
        <div className="admin-ingresos-header-content">
          <h1><FiDollarSign /> Gestión de Ingresos</h1>
          <p>Visualiza las ventas y pagos por periodo</p>
        </div>
        <button className="admin-ingresos-btn-primary" onClick={cargarDatos}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="admin-ingresos-alert error">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={() => setError('')}><FiX /></button>
        </div>
      )}

      {success && (
        <div className="admin-ingresos-alert success">
          <FiCheck />
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><FiX /></button>
        </div>
      )}

      {/* Filtros de Periodo */}
      <div className="admin-ingresos-filtros">
        <div className="admin-ingresos-filtros-header">
          <FiCalendar />
          <span>Filtrar por Periodo</span>
        </div>

        <div className="admin-ingresos-filtros-botones">
          <button
            className={`admin-ingresos-filtro-btn ${periodo === 'hoy' ? 'active' : ''}`}
            onClick={() => handlePeriodoChange('hoy')}
          >
            Hoy
          </button>
          <button
            className={`admin-ingresos-filtro-btn ${periodo === 'semana' ? 'active' : ''}`}
            onClick={() => handlePeriodoChange('semana')}
          >
            Esta Semana
          </button>
          <button
            className={`admin-ingresos-filtro-btn ${periodo === 'mes' ? 'active' : ''}`}
            onClick={() => handlePeriodoChange('mes')}
          >
            Este Mes
          </button>
          <button
            className={`admin-ingresos-filtro-btn ${periodo === 'personalizado' ? 'active' : ''}`}
            onClick={() => handlePeriodoChange('personalizado')}
          >
            Personalizado
          </button>
        </div>

        {periodo === 'personalizado' && (
          <div className="admin-ingresos-fechas-personalizadas">
            <div className="admin-ingresos-fecha-grupo">
              <label>Fecha Inicio:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="admin-ingresos-fecha-grupo">
              <label>Fecha Fin:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="admin-ingresos-stats">
        <div className="admin-ingresos-stat-card total">
          <div className="admin-ingresos-stat-icon">
            <FiDollarSign />
          </div>
          <div className="admin-ingresos-stat-info">
            <span className="admin-ingresos-stat-value">{formatearMoneda(stats.totalIngresos)}</span>
            <span className="admin-ingresos-stat-label">Ingresos Totales</span>
          </div>
        </div>

        <div className="admin-ingresos-stat-card">
          <div className="admin-ingresos-stat-icon">
            <FiShoppingCart />
          </div>
          <div className="admin-ingresos-stat-info">
            <span className="admin-ingresos-stat-value">{stats.totalPedidos}</span>
            <span className="admin-ingresos-stat-label">Pedidos</span>
          </div>
        </div>

        <div className="admin-ingresos-stat-card">
          <div className="admin-ingresos-stat-icon">
            <FiTrendingUp />
          </div>
          <div className="admin-ingresos-stat-info">
            <span className="admin-ingresos-stat-value">{formatearMoneda(stats.promedioVenta)}</span>
            <span className="admin-ingresos-stat-label">Promedio por Pedido</span>
          </div>
        </div>

        <div className="admin-ingresos-stat-card">
          <div className="admin-ingresos-stat-icon">
            <FiCreditCard />
          </div>
          <div className="admin-ingresos-stat-info">
            <span className="admin-ingresos-stat-value">
              {stats.pagosTarjeta} / {stats.pagosEfectivo}
            </span>
            <span className="admin-ingresos-stat-label">Tarjeta / Efectivo</span>
          </div>
        </div>
      </div>

      {/* Tabla de Ingresos */}
      <div className="admin-ingresos-tabla-container">
        <div className="admin-ingresos-tabla-header">
          <h2>Detalle de Ingresos</h2>
          <button className="admin-ingresos-btn-secondary" onClick={handleGenerarPDF}>
            <FiDownload /> Exportar a PDF
          </button>
        </div>

        <table className="admin-ingresos-tabla">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Método de Pago</th>
              <th>Estado Pago</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {datosFiltrados.pedidos.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-ingresos-no-data">
                  No se encontraron pedidos en este periodo
                </td>
              </tr>
            ) : (
              datosFiltrados.pedidos.map(pedido => {
                const pagosPedido = datosFiltrados.pagos.filter(p => p.idPedido?.id === pedido.id);
                const pago = pagosPedido[0]; // Tomamos el primer pago

                return (
                  <tr key={pedido.id}>
                    <td className="admin-ingresos-id">#{pedido.id}</td>
                    <td>{formatearFecha(pedido.fechaCreacion)}</td>
                    <td>{obtenerNombreCliente(pedido)}</td>
                    <td>
                      {pago ? (
                        <span className={`admin-ingresos-badge metodo-${pago.metodoPago?.toLowerCase()}`}>
                          {obtenerNombreMetodoPago(pago.metodoPago)}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {pago ? (
                        <span className={`admin-ingresos-badge estado-${pago.estadoPago?.toLowerCase()}`}>
                          {obtenerNombreEstadoPago(pago.estadoPago)}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="admin-ingresos-monto">
                      {pago ? formatearMoneda(pago.monto) : '$0.00'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IngresosComponent;

