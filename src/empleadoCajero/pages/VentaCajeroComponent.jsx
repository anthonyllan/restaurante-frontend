import React, { useState, useEffect } from 'react';
import { 
    obtenerTodasVentas,
    obtenerVentasPorEmpleado 
} from '../../services/Cajero/VentaCajero';
import { obtenerDetallesPorPedido } from '../../services/Cajero/DetallePedidoCajeroService';
import { getEmpleadoId } from '../../utils/authUtils'; // ✅ Obtener ID del cajero logeado
import { FiRefreshCw, FiSearch, FiEye, FiX, FiTrendingUp, FiDollarSign, FiCalendar, FiTarget, FiUser } from 'react-icons/fi';
import { MdDateRange } from 'react-icons/md';
import { BsBarChart } from 'react-icons/bs';
import './VentaCajeroComponent.css';

const VentaCajeroComponent = () => {
    const [ventas, setVentas] = useState([]);
    const [ventasFiltradas, setVentasFiltradas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actualizando, setActualizando] = useState(false);

    // Estados para filtros (SIN EMPLEADOS)
    const [filtroFecha, setFiltroFecha] = useState('');
    const [filtroFechaFin, setFiltroFechaFin] = useState('');
    const [busqueda, setBusqueda] = useState('');

    // Estados para estadísticas
    const [estadisticas, setEstadisticas] = useState({
        totalVentas: 0,
        totalMonto: 0,
        ventasHoy: 0,
        montoHoy: 0
    });

    // Estados para vista de detalles
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [detallesVenta, setDetallesVenta] = useState([]);
    const [mostrandoDetalles, setMostrandoDetalles] = useState(false);

    // Cache para montos calculados
    const [montosCalculados, setMontosCalculados] = useState({});

    useEffect(() => {
        cargarVentas();
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [ventas, filtroFecha, filtroFechaFin, busqueda]); // ✅ SIN filtroEmpleado

    useEffect(() => {
        calcularEstadisticas();
    }, [ventasFiltradas, montosCalculados]);

    // Auto-refresh cada 2 minutos
    useEffect(() => {
        const interval = setInterval(() => {
            cargarVentas(true);
        }, 120000);

        return () => clearInterval(interval);
    }, []);

    const cargarVentas = async (silencioso = false) => {
        try {
            if (!silencioso) {
                setLoading(true);
            } else {
                setActualizando(true);
            }
            setError('');

            // ✅ Obtener ID del empleado (cajero) logeado dinámicamente
            const empleadoId = getEmpleadoId();
            
            if (!empleadoId) {
                setError('No se pudo obtener el ID del cajero. Por favor, inicia sesión nuevamente.');
                setLoading(false);
                setActualizando(false);
                return;
            }

            // ✅ Obtener solo las ventas del cajero logeado
            const response = await obtenerVentasPorEmpleado(empleadoId);
            const ventasData = response.data || [];

            setVentas(ventasData);

            await cargarMontosReales(ventasData);

        } catch (error) {
            setError('Error al cargar las ventas: ' + error.message);
        } finally {
            setLoading(false);
            setActualizando(false);
        }
    };

    const cargarMontosReales = async (ventasData) => {
        try {
            const montosPromises = ventasData.map(async (venta) => {
                try {
                    const detallesResponse = await obtenerDetallesPorPedido(venta.idPedido.id);
                    const detalles = detallesResponse.data || [];
                    
                    const montoReal = detalles.reduce((total, detalle) => {
                        const precio = parseFloat(detalle.precio) || 0;
                        const cantidad = parseInt(detalle.cantidad) || 0;
                        return total + (precio * cantidad);
                    }, 0);

                    return {
                        idVenta: venta.id,
                        monto: montoReal
                    };
                } catch (error) {
                    return {
                        idVenta: venta.id,
                        monto: 0
                    };
                }
            });

            const montosResultados = await Promise.all(montosPromises);
            
            const montosCache = {};
            montosResultados.forEach(({ idVenta, monto }) => {
                montosCache[idVenta] = monto;
            });

            setMontosCalculados(montosCache);

        } catch (error) {
            // Error manejado silenciosamente
        }
    };

    // ✅ FILTROS SIN EMPLEADOS
    const aplicarFiltros = () => {
        let ventasFiltradas = [...ventas];

        if (filtroFecha) {
            ventasFiltradas = ventasFiltradas.filter(venta => {
                const fechaVenta = new Date(venta.fechaVenta).toISOString().split('T')[0];
                return fechaVenta >= filtroFecha;
            });
        }

        if (filtroFechaFin) {
            ventasFiltradas = ventasFiltradas.filter(venta => {
                const fechaVenta = new Date(venta.fechaVenta).toISOString().split('T')[0];
                return fechaVenta <= filtroFechaFin;
            });
        }

        // Búsqueda exacta
        if (busqueda.trim()) {
            ventasFiltradas = ventasFiltradas.filter(venta => {
                const idVenta = venta.id?.toString();
                const idPedido = venta.idPedido?.id?.toString();
                const terminoBusqueda = busqueda.trim();
                
                return idVenta === terminoBusqueda || idPedido === terminoBusqueda;
            });
        }

        setVentasFiltradas(ventasFiltradas);
    };

    const calcularEstadisticas = () => {
        const hoy = new Date().toISOString().split('T')[0];
        
        const stats = {
            totalVentas: ventasFiltradas.length,
            totalMonto: 0,
            ventasHoy: 0,
            montoHoy: 0
        };

        ventasFiltradas.forEach(venta => {
            const montoVenta = montosCalculados[venta.id] || 0;
            stats.totalMonto += montoVenta;

            const fechaVenta = new Date(venta.fechaVenta).toISOString().split('T')[0];
            if (fechaVenta === hoy) {
                stats.ventasHoy++;
                stats.montoHoy += montoVenta;
            }
        });

        setEstadisticas(stats);
    };

    const obtenerMontoVenta = (venta) => {
        return montosCalculados[venta.id] || 0;
    };

    const calcularTotalDetalles = (detalles) => {
        return detalles.reduce((total, detalle) => {
            const precio = parseFloat(detalle.precio) || 0;
            const cantidad = parseInt(detalle.cantidad) || 0;
            return total + (precio * cantidad);
        }, 0);
    };

    const verDetallesVenta = async (venta) => {
        try {
            setMostrandoDetalles(true);
            setVentaSeleccionada(venta);
            
            const detallesResponse = await obtenerDetallesPorPedido(venta.idPedido.id);
            setDetallesVenta(detallesResponse.data || []);
            
        } catch (error) {
            setDetallesVenta([]);
        }
    };

    const cerrarDetalles = () => {
        setMostrandoDetalles(false);
        setVentaSeleccionada(null);
        setDetallesVenta([]);
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatearHora = (fecha) => {
        return new Date(fecha).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ✅ FUNCIÓN PARA LIMPIAR FILTROS (SIN EMPLEADOS)
    const limpiarFiltros = () => {
        setFiltroFecha('');
        setFiltroFechaFin('');
        setBusqueda('');
    };

    if (loading) {
        return (
            <div className="ventas-loadingContainer">
                <div className="ventas-spinner"></div>
                <p>Cargando ventas y calculando montos reales...</p>
            </div>
        );
    }

    return (
        <div className="ventas-container">
            {/* ✅ HEADER ESTILO RESTAURANTE */}
            <div className="ventas-header">
                <div className="ventas-headerContent">
                    <h1><BsBarChart /> Mis Ventas</h1>
                    <p className="ventas-headerDescription">
                        Consulta y gestiona tus ventas realizadas
                    </p>
                </div>

                <div className="ventas-infoStats">
                    <div className="ventas-statBadge">
                        <FiCalendar /> {new Date().toLocaleDateString('es-MX', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                        })}
                    </div>
                    <div className="ventas-totalBadge">
                        <FiTrendingUp /> {estadisticas.totalVentas} ventas registradas
                    </div>
                </div>

                {actualizando && (
                    <div className="ventas-refreshIndicator">
                        <div className="ventas-refreshSpinner"></div>
                        <span>Actualizando...</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="ventas-alert ventas-alertError">
                    <span>{error}</span>
                    <button className="ventas-alertClose" onClick={() => setError('')}>
                        <FiX />
                    </button>
                </div>
            )}

            <div className="ventas-estadisticas">
                <div className="ventas-statCard">
                    <div className="ventas-statIcon"><FiTrendingUp /></div>
                    <div className="ventas-statContent">
                        <span className="ventas-statNumber">{estadisticas.totalVentas}</span>
                        <span className="ventas-statLabel">Total Ventas</span>
                    </div>
                </div>
                <div className="ventas-statCard">
                    <div className="ventas-statIcon"><FiDollarSign /></div>
                    <div className="ventas-statContent">
                        <span className="ventas-statNumber">${estadisticas.totalMonto.toFixed(2)}</span>
                        <span className="ventas-statLabel">Monto Total</span>
                    </div>
                </div>
                <div className="ventas-statCard">
                    <div className="ventas-statIcon"><FiCalendar /></div>
                    <div className="ventas-statContent">
                        <span className="ventas-statNumber">{estadisticas.ventasHoy}</span>
                        <span className="ventas-statLabel">Ventas Hoy</span>
                    </div>
                </div>
                <div className="ventas-statCard">
                    <div className="ventas-statIcon"><FiTarget /></div>
                    <div className="ventas-statContent">
                        <span className="ventas-statNumber">${estadisticas.montoHoy.toFixed(2)}</span>
                        <span className="ventas-statLabel">Ingresos Hoy</span>
                    </div>
                </div>
            </div>

            {/* ✅ CONTROLES SIN FILTRO DE EMPLEADOS */}
            <div className="ventas-controls">
                <div className="ventas-searchRow">
                    <div className="ventas-search">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por ID exacto de venta o pedido (ej: 1, 25, 100)..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="ventas-searchInput"
                        />
                    </div>
                </div>

                <div className="ventas-filtersRow">
                    {/* ✅ SOLO FILTROS DE FECHAS */}
                    <div className="ventas-dateGroup">
                        <label className="ventas-dateLabel">
                            <FiCalendar /> Desde:
                        </label>
                        <input
                            type="date"
                            value={filtroFecha}
                            onChange={(e) => setFiltroFecha(e.target.value)}
                            className="ventas-filterDate"
                        />
                    </div>

                    <div className="ventas-dateGroup">
                        <label className="ventas-dateLabel">
                            <FiCalendar /> Hasta:
                        </label>
                        <input
                            type="date"
                            value={filtroFechaFin}
                            onChange={(e) => setFiltroFechaFin(e.target.value)}
                            className="ventas-filterDate"
                        />
                    </div>

                    <div className="ventas-actionButtons">
                        <button 
                            className="ventas-clearBtn"
                            onClick={limpiarFiltros}
                        >
                            <FiX /> Limpiar
                        </button>
                        
                        <button 
                            className="ventas-refreshBtn"
                            onClick={() => cargarVentas()}
                            disabled={actualizando}
                        >
                            <FiRefreshCw /> Actualizar
                        </button>
                    </div>
                </div>
            </div>

            <div className="ventas-content">
                {ventasFiltradas.length === 0 ? (
                    <div className="ventas-empty">
                        <div className="ventas-emptyIcon"><BsBarChart /></div>
                        <h3>No hay ventas registradas</h3>
                        <p>
                            {busqueda ? 
                                `No se encontraron ventas con ID exacto "${busqueda}"` : 
                                'No se encontraron ventas con los filtros aplicados'
                            }
                        </p>
                        <button 
                            className="ventas-btn ventas-btnPrimary"
                            onClick={() => cargarVentas()}
                        >
                            <FiRefreshCw /> Actualizar
                        </button>
                    </div>
                ) : (
                    <div className="ventas-table">
                        <div className="ventas-tableHeader">
                            <span>Número de venta</span>
                            <span>Número de pedido</span>
                            <span>Fecha</span>
                            <span>Estado Pedido</span>
                            <span>Monto</span>
                            <span>Acciones</span>
                        </div>

                        {ventasFiltradas.map((venta) => (
                            <div key={venta.id} className="ventas-tableRow">
                                <span className="ventas-ventaId">#{venta.id}</span>
                                <span className="ventas-pedidoId">#{venta.idPedido?.id}</span>
                                <span className="ventas-fecha">
                                    <MdDateRange /> {formatearFecha(venta.fechaVenta)}
                                </span>
                                <span className={`ventas-estado ventas-estado-${venta.idPedido?.estadoPedido?.toLowerCase()}`}>
                                    {venta.idPedido?.estadoPedido || 'N/A'}
                                </span>
                                <span className="ventas-monto">
                                    ${obtenerMontoVenta(venta).toFixed(2)}
                                </span>
                                <span className="ventas-acciones">
                                    <button 
                                        className="ventas-btn ventas-btnSecondary"
                                        onClick={() => verDetallesVenta(venta)}
                                    >
                                        <FiEye /> Ver Detalles
                                    </button>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {mostrandoDetalles && ventaSeleccionada && (
                <div className="ventas-modal">
                    <div className="ventas-modalContent">
                        <div className="ventas-modalHeader">
                            <h3>Detalles de Venta #{ventaSeleccionada.id}</h3>
                            <button 
                                className="ventas-modalClose" 
                                onClick={cerrarDetalles}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="ventas-modalBody">
                            <div className="ventas-ventaInfo">
                                <div className="ventas-infoSection">
                                    <h4>Información de la Venta</h4>
                                    <p><strong>ID Venta:</strong> #{ventaSeleccionada.id}</p>
                                    <p><strong>ID Pedido:</strong> #{ventaSeleccionada.idPedido?.id}</p>
                                    <p><strong>Fecha:</strong> {formatearFecha(ventaSeleccionada.fechaVenta)}</p>
                                    <p><strong>Estado del Pedido:</strong> {ventaSeleccionada.idPedido?.estadoPedido}</p>
                                    <p><strong>Total de la Venta:</strong> 
                                        <span style={{ color: 'var(--secondary-wine)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                            ${calcularTotalDetalles(detallesVenta).toFixed(2)}
                                        </span>
                                    </p>
                                </div>

                                <div className="ventas-infoSection">
                                    <h4>Productos Vendidos</h4>
                                    {detallesVenta.length > 0 ? (
                                        <>
                                            <div className="ventas-productos">
                                                {detallesVenta.map((detalle, index) => (
                                                    <div key={index} className="ventas-producto">
                                                        <span className="ventas-productoCantidad">
                                                            {detalle.cantidad}x
                                                        </span>
                                                        <span className="ventas-productoNombre">
                                                            {detalle.nombreProducto}
                                                        </span>
                                                        {detalle.precio && (
                                                            <span className="ventas-productoPrecio">
                                                                ${parseFloat(detalle.precio).toFixed(2)} c/u
                                                            </span>
                                                        )}
                                                        {detalle.precio && detalle.cantidad && (
                                                            <span className="ventas-productoSubtotal">
                                                                = ${(parseFloat(detalle.precio) * parseInt(detalle.cantidad)).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="ventas-totalModal">
                                                <strong>Total: ${calcularTotalDetalles(detallesVenta).toFixed(2)}</strong>
                                            </div>
                                        </>
                                    ) : (
                                        <p>No se pudieron cargar los detalles de productos</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VentaCajeroComponent;