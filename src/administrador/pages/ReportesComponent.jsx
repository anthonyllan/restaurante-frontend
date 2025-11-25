import React, { useState, useEffect } from 'react';
import {
  FiFileText, FiCalendar, FiDownload, FiRefreshCw,
  FiAlertCircle, FiCheckCircle, FiTrendingUp, FiDollarSign,
  FiShoppingCart, FiClock, FiPieChart, FiCreditCard
} from 'react-icons/fi';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  obtenerTodosPedidos,
  obtenerTodosPagos,
  obtenerTodasVentas,
  formatearMoneda,
  filtrarPorPeriodo
} from '../../services/Administrador/IngresosService';
import { generarReporteCompletoConAnalisis } from '../../services/Administrador/PDFService';
import './ReportesComponent.css';

const ReportesComponent = () => {
  // Estados
  const [pedidos, setPedidos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtros
  const [periodo, setPeriodo] = useState('mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // Cargar datos
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [pedidosRes, pagosRes, ventasRes] = await Promise.all([
        obtenerTodosPedidos(),
        obtenerTodosPagos(),
        obtenerTodasVentas()
      ]);

      setPedidos(pedidosRes.data || []);
      setPagos(pagosRes.data || []);
      setVentas(ventasRes.data || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar datos por periodo
  const obtenerDatosFiltrados = () => {
    const pedidosFiltrados = filtrarPorPeriodo(pedidos, periodo, fechaInicio, fechaFin);
    const idsPedidos = pedidosFiltrados.map(p => p.id);
    const pagosFiltrados = pagos.filter(p => idsPedidos.includes(p.idPedido?.id));
    
    return {
      pedidos: pedidosFiltrados,
      pagos: pagosFiltrados,
      ventas
    };
  };

  // ========== ANÁLISIS Y KPIs ==========

  // 1. Calcular estadísticas básicas
  const calcularEstadisticas = () => {
    const datosFiltrados = obtenerDatosFiltrados();
    
    const totalIngresos = datosFiltrados.pagos
      .filter(p => p.estadoPago === 'APROBADO')
      .reduce((sum, p) => sum + (p.monto || 0), 0);
    
    const totalPedidos = datosFiltrados.pedidos.length;
    const pagosTarjeta = datosFiltrados.pagos.filter(p => p.metodoPago === 'TARJETA').length;
    const pagosEfectivo = datosFiltrados.pagos.filter(p => p.metodoPago === 'EFECTIVO').length;
    const ticketPromedio = totalPedidos > 0 ? totalIngresos / totalPedidos : 0;

    // Pedidos por tipo de entrega
    const pedidosDomicilio = datosFiltrados.pedidos.filter(p => p.tipoEntrega === 'DOMICILIO').length;
    const pedidosParaLlevar = datosFiltrados.pedidos.filter(p => p.tipoEntrega === 'PARA_LLEVAR').length;
    const pedidosLocal = datosFiltrados.pedidos.filter(p => p.tipoEntrega === 'PICKUP_EN_MOSTRADOR').length;

    return {
      totalIngresos,
      totalPedidos,
      pagosTarjeta,
      pagosEfectivo,
      ticketPromedio,
      pedidosDomicilio,
      pedidosParaLlevar,
      pedidosLocal
    };
  };

  // 2. Tendencia de ingresos por día (últimos 7 días)
  const obtenerTendenciaIngresos = () => {
    const datosFiltrados = obtenerDatosFiltrados();
    const ingresosPorDia = {};

    datosFiltrados.pagos
      .filter(p => p.estadoPago === 'APROBADO')
      .forEach(pago => {
        const fecha = extraerFecha(pago.fechaPago);
        if (!ingresosPorDia[fecha]) {
          ingresosPorDia[fecha] = 0;
        }
        ingresosPorDia[fecha] += pago.monto || 0;
      });

    return Object.keys(ingresosPorDia)
      .sort()
      .slice(-7)
      .map(fecha => ({
        fecha: formatearFechaCorta(fecha),
        ingresos: ingresosPorDia[fecha]
      }));
  };

  // 3. Distribución de tipos de entrega
  const obtenerDistribucionEntrega = () => {
    const stats = calcularEstadisticas();
    return [
      { name: 'Domicilio', value: stats.pedidosDomicilio, color: '#722f37' },
      { name: 'Para Llevar', value: stats.pedidosParaLlevar, color: '#4a90e2' },
      { name: 'Local', value: stats.pedidosLocal, color: '#50c878' }
    ].filter(item => item.value > 0);
  };

  // 4. Métodos de pago
  const obtenerDistribucionPagos = () => {
    const stats = calcularEstadisticas();
    return [
      { name: 'Tarjeta', value: stats.pagosTarjeta, color: '#4a90e2' },
      { name: 'Efectivo', value: stats.pagosEfectivo, color: '#50c878' }
    ].filter(item => item.value > 0);
  };

  // 5. Pedidos por hora del día
  const obtenerPedidosPorHora = () => {
    const datosFiltrados = obtenerDatosFiltrados();
    const pedidosPorHora = {};

    datosFiltrados.pedidos.forEach(pedido => {
      const hora = extraerHora(pedido.fechaCreacion);
      if (!pedidosPorHora[hora]) {
        pedidosPorHora[hora] = 0;
      }
      pedidosPorHora[hora]++;
    });

    return Object.keys(pedidosPorHora)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(hora => ({
        hora: `${hora}:00`,
        pedidos: pedidosPorHora[hora]
      }));
  };

  // ========== UTILIDADES ==========

  const extraerFecha = (fecha) => {
    if (!fecha) return new Date().toISOString().split('T')[0];
    
    if (Array.isArray(fecha)) {
      const [year, month, day] = fecha;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    return new Date(fecha).toISOString().split('T')[0];
  };

  const extraerHora = (fecha) => {
    if (!fecha) return '0';
    
    if (Array.isArray(fecha) && fecha.length >= 4) {
      return String(fecha[3]);
    }
    
    return String(new Date(fecha).getHours());
  };

  const formatearFechaCorta = (fechaISO) => {
    const [year, month, day] = fechaISO.split('-');
    return `${day}/${month}`;
  };

  // ========== GENERACIÓN DE PDFs ==========

  const handleGenerarReporteCompleto = async () => {
    try {
      setGenerandoPDF(true);
      setError('');
      
      const datosFiltrados = obtenerDatosFiltrados();
      const resultado = generarReporteCompletoConAnalisis(datosFiltrados, periodo, fechaInicio, fechaFin);
      
      setSuccess(`Reporte completo generado: ${resultado.nombreArchivo}`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error al generar reporte completo:', err);
      setError('Error al generar el reporte completo');
    } finally {
      setGenerandoPDF(false);
    }
  };


  // ========== DATOS PARA GRÁFICAS ==========

  const stats = calcularEstadisticas();
  const tendenciaIngresos = obtenerTendenciaIngresos();
  const distribucionEntrega = obtenerDistribucionEntrega();
  const distribucionPagos = obtenerDistribucionPagos();
  const pedidosPorHora = obtenerPedidosPorHora();

  // ========== RENDER ==========

  if (loading) {
    return (
      <div className="admin-reportes-loading">
        <div className="admin-reportes-spinner"></div>
        <p>Cargando datos para análisis...</p>
      </div>
    );
  }

  return (
    <div className="admin-reportes-container">
      {/* Header */}
      <div className="admin-reportes-header">
        <div className="admin-reportes-title-section">
          <h1><FiPieChart /> Análisis y Reportes</h1>
          <p>Visualiza KPIs, tendencias y genera reportes en PDF</p>
        </div>
        <button className="admin-reportes-btn-refresh" onClick={cargarDatos}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="admin-reportes-alert admin-reportes-alert-error">
          <FiAlertCircle /> {error}
        </div>
      )}
      
      {success && (
        <div className="admin-reportes-alert admin-reportes-alert-success">
          <FiCheckCircle /> {success}
        </div>
      )}

      {/* Filtros de Periodo */}
      <div className="admin-reportes-filtros">
        <h3><FiCalendar /> Seleccionar Periodo de Análisis</h3>
        <div className="admin-reportes-periodo-btns">
          <button 
            className={`admin-reportes-periodo-btn ${periodo === 'hoy' ? 'active' : ''}`}
            onClick={() => setPeriodo('hoy')}
          >
            Hoy
          </button>
          <button 
            className={`admin-reportes-periodo-btn ${periodo === 'semana' ? 'active' : ''}`}
            onClick={() => setPeriodo('semana')}
          >
            Esta Semana
          </button>
          <button 
            className={`admin-reportes-periodo-btn ${periodo === 'mes' ? 'active' : ''}`}
            onClick={() => setPeriodo('mes')}
          >
            Este Mes
          </button>
          <button 
            className={`admin-reportes-periodo-btn ${periodo === 'personalizado' ? 'active' : ''}`}
            onClick={() => setPeriodo('personalizado')}
          >
            Personalizado
          </button>
        </div>

        {periodo === 'personalizado' && (
          <div className="admin-reportes-fecha-inputs">
            <div className="admin-reportes-fecha-group">
              <label>Fecha Inicio:</label>
              <input 
                type="date" 
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="admin-reportes-fecha-group">
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

      {/* KPIs Principales */}
      <div className="admin-reportes-kpis">
        <h3><FiTrendingUp /> Indicadores Clave de Desempeño (KPIs)</h3>
        <div className="admin-reportes-stats">
          <div className="admin-reportes-stat-card">
            <div className="admin-reportes-stat-icon" style={{background: 'linear-gradient(135deg, #722f37, #8a3a44)'}}>
              <FiDollarSign />
            </div>
            <div className="admin-reportes-stat-content">
              <span className="admin-reportes-stat-value">{formatearMoneda(stats.totalIngresos)}</span>
              <span className="admin-reportes-stat-label">Total Ingresos</span>
            </div>
          </div>

          <div className="admin-reportes-stat-card">
            <div className="admin-reportes-stat-icon" style={{background: 'linear-gradient(135deg, #4a90e2, #357abd)'}}>
              <FiShoppingCart />
            </div>
            <div className="admin-reportes-stat-content">
              <span className="admin-reportes-stat-value">{stats.totalPedidos}</span>
              <span className="admin-reportes-stat-label">Total Pedidos</span>
            </div>
          </div>

          <div className="admin-reportes-stat-card">
            <div className="admin-reportes-stat-icon" style={{background: 'linear-gradient(135deg, #50c878, #3da660)'}}>
              <FiTrendingUp />
            </div>
            <div className="admin-reportes-stat-content">
              <span className="admin-reportes-stat-value">{formatearMoneda(stats.ticketPromedio)}</span>
              <span className="admin-reportes-stat-label">Ticket Promedio</span>
            </div>
          </div>

          <div className="admin-reportes-stat-card">
            <div className="admin-reportes-stat-icon" style={{background: 'linear-gradient(135deg, #f39c12, #d68910)'}}>
              <FiClock />
            </div>
            <div className="admin-reportes-stat-content">
              <span className="admin-reportes-stat-value">{stats.pagosTarjeta + stats.pagosEfectivo}</span>
              <span className="admin-reportes-stat-label">Total Transacciones</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas de Análisis */}
      <div className="admin-reportes-graficas">
        <h3><FiPieChart /> Análisis Visual</h3>
        
        <div className="admin-reportes-graficas-grid">
          {/* Tendencia de Ingresos */}
          {tendenciaIngresos.length > 0 && (
            <div className="admin-reportes-grafica-card">
              <h4><FiTrendingUp style={{color: '#722f37', marginRight: '8px'}} /> Tendencia de Ingresos (Últimos 7 días)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={tendenciaIngresos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatearMoneda(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="ingresos" stroke="#722f37" strokeWidth={2} name="Ingresos" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pedidos por Hora */}
          {pedidosPorHora.length > 0 && (
            <div className="admin-reportes-grafica-card">
              <h4><FiClock style={{color: '#4a90e2', marginRight: '8px'}} /> Horarios Pico de Pedidos</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pedidosPorHora}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pedidos" fill="#4a90e2" name="Pedidos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Distribución de Entregas */}
          {distribucionEntrega.length > 0 && (
            <div className="admin-reportes-grafica-card">
              <h4><FiShoppingCart style={{color: '#50c878', marginRight: '8px'}} /> Tipos de Entrega</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={distribucionEntrega}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribucionEntrega.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Distribución de Pagos */}
          {distribucionPagos.length > 0 && (
            <div className="admin-reportes-grafica-card">
              <h4><FiCreditCard style={{color: '#f39c12', marginRight: '8px'}} /> Métodos de Pago</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={distribucionPagos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribucionPagos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Opciones de Exportación */}
      <div className="admin-reportes-opciones">
        <h3><FiDownload /> Exportar Reportes en PDF</h3>
        
        <div className="admin-reportes-cards-container">
          {/* Reporte Completo */}
          <div className="admin-reportes-card">
            <div className="admin-reportes-card-icon">
              <FiFileText />
            </div>
            <h4>Reporte Completo con Análisis</h4>
            <p>Genera un reporte profesional de 2+ páginas con análisis detallado, estadísticas completas y tablas del periodo seleccionado.</p>
            <ul className="admin-reportes-card-features">
              <li><FiCheckCircle style={{color: '#50c878', marginRight: '6px'}} /> KPIs completos con porcentajes</li>
              <li><FiCheckCircle style={{color: '#50c878', marginRight: '6px'}} /> Análisis por tipo de entrega</li>
              <li><FiCheckCircle style={{color: '#50c878', marginRight: '6px'}} /> Análisis por estado de pedido</li>
              <li><FiCheckCircle style={{color: '#50c878', marginRight: '6px'}} /> Tabla detallada de ingresos</li>
              <li><FiCheckCircle style={{color: '#50c878', marginRight: '6px'}} /> Totales y promedios calculados</li>
            </ul>
            <button 
              className="admin-reportes-btn-generate" 
              onClick={handleGenerarReporteCompleto}
              disabled={generandoPDF}
            >
              {generandoPDF ? (
                <>
                  <div className="admin-reportes-spinner-small"></div> Generando PDF...
                </>
              ) : (
                <>
                  <FiDownload /> Descargar Reporte PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info adicional */}
      <div className="admin-reportes-info">
        <FiAlertCircle />
        <p>Las gráficas y KPIs se actualizan automáticamente según el periodo seleccionado. Los reportes PDF incluyen toda la información detallada para análisis offline.</p>
      </div>
    </div>
  );
};

export default ReportesComponent;
