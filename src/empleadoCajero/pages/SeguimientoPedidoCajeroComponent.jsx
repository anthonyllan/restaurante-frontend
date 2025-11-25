import React, { useState, useEffect } from 'react';
import { 
    obtenerPedidosLocales, 
    obtenerPedidosEnLinea,
    cambiarEstadoPedido 
} from '../../services/Cajero/SeguimientoPedidoCajeroService';
import { obtenerDetallesPorPedido } from '../../services/Cajero/DetallePedidoCajeroService';
import PedidoCard from './PedidoCard';
import { FiRefreshCw, FiSearch, FiHome, FiGlobe, FiX } from 'react-icons/fi';
import { MdRestaurant } from 'react-icons/md';
import { BsClipboardCheck } from 'react-icons/bs';
import './SeguimientoPedidoCajeroComponent.css';
import { obtenerPerfilCliente } from '../../services/Cliente/PerfilClienteService';
import { obtenerPagosPorPedido } from '../../services/Cajero/PagoCajeroService';

const SeguimientoPedidoCajeroComponent = () => {
    const [vistaActiva, setVistaActiva] = useState('local');
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actualizando, setActualizando] = useState(false);

    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [busqueda, setBusqueda] = useState('');
    const [clienteCache, setClienteCache] = useState({});
    const [pagoCache, setPagoCache] = useState({});

    useEffect(() => {
        cargarPedidos();
        // Resetear filtros al cambiar de vista
        setFiltroEstado('TODOS');
        setBusqueda('');
    }, [vistaActiva]);

    useEffect(() => {
        const interval = setInterval(() => {
            cargarPedidos(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [vistaActiva]);

    const cargarPedidos = async (silencioso = false) => {
        try {
            if (!silencioso) {
                setLoading(true);
            } else {
                setActualizando(true);
            }
            setError('');

            let response;
            if (vistaActiva === 'local') {
                response = await obtenerPedidosLocales();
            } else {
                response = await obtenerPedidosEnLinea();
            }

            const pedidosConDetalles = await Promise.all(
                response.data.map(async (pedido) => {
                    try {
                        const detallesResponse = await obtenerDetallesPorPedido(pedido.id);
                        return {
                            ...pedido,
                            detalles: detallesResponse.data || []
                        };
                    } catch (error) {
                        return {
                            ...pedido,
                            detalles: []
                        };
                    }
                })
            );

            const nuevosPagosDetectados = {};

            const pedidosConPagos = await Promise.all(
                pedidosConDetalles.map(async (pedido) => {
                    const cachePago = pagoCache[pedido.id];
                    if (cachePago) {
                        return {
                            ...pedido,
                            ...cachePago
                        };
                    }

                    try {
                        const responsePagos = await obtenerPagosPorPedido(pedido.id);
                        const pagos = responsePagos.data || [];

                        if (pagos.length > 0) {
                            const pagoTarjeta = pagos.find(p => p.metodoPago?.toUpperCase() === 'TARJETA');
                            const pagoEfectivo = pagos.find(p => p.metodoPago?.toUpperCase() === 'EFECTIVO');
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
                                nuevosPagosDetectados[pedido.id] = infoPago;
                                return {
                                    ...pedido,
                                    ...infoPago
                                };
                            }
                        }
                    } catch (error) {
                        // Ignorar y continuar sin información de pago
                    }

                    return { ...pedido };
                })
            );

            if (Object.keys(nuevosPagosDetectados).length > 0) {
                setPagoCache(prev => ({
                    ...prev,
                    ...nuevosPagosDetectados
                }));
            }

            let pedidosEnriquecidos = pedidosConPagos;
            if (vistaActiva === 'enlinea') {
                const idsClientes = [...new Set(pedidosConPagos.map((pedido) => pedido.idCliente).filter(Boolean))];
                if (idsClientes.length > 0) {
                    const cacheActualizado = { ...clienteCache };
                    let cacheModificado = false;
                    const idsPorBuscar = idsClientes.filter((id) => !cacheActualizado[id]);
                    if (idsPorBuscar.length > 0) {
                        await Promise.all(
                            idsPorBuscar.map(async (clienteId) => {
                                try {
                                    const responseCliente = await obtenerPerfilCliente(clienteId);
                                    const datosCliente = responseCliente.data;
                                    const nombreCompleto = [datosCliente?.nombre, datosCliente?.apellidos]
                                        .filter(Boolean)
                                        .join(' ')
                                        .trim();
                                    cacheActualizado[clienteId] = nombreCompleto || datosCliente?.nombre || 'Cliente';
                                } catch (error) {
                                    cacheActualizado[clienteId] = 'Cliente';
                                }
                                cacheModificado = true;
                            })
                        );
                    }
                    pedidosEnriquecidos = pedidosConPagos.map((pedido) => ({
                        ...pedido,
                        nombreCliente: cacheActualizado[pedido.idCliente] || pedido.nombreCliente || '',
                    }));
                    if (cacheModificado) {
                        setClienteCache(cacheActualizado);
                    }
                }
            }
            const pedidosOrdenados = pedidosEnriquecidos.sort((a, b) => {
                if (a.estadoPedido === 'ENTREGADO' && b.estadoPedido !== 'ENTREGADO') {
                    return 1;
                }
                if (a.estadoPedido !== 'ENTREGADO' && b.estadoPedido === 'ENTREGADO') {
                    return -1;
                }
                
                return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
            });

            setPedidos(pedidosOrdenados);

        } catch (error) {
            setError('Error al cargar los pedidos: ' + error.message);
        } finally {
            setLoading(false);
            setActualizando(false);
        }
    };

    const handleCambiarEstado = async (idPedido, nuevoEstado) => {
        try {
            setActualizando(true);
            await cambiarEstadoPedido(idPedido, nuevoEstado);
            
            setPedidos(prevPedidos => 
                prevPedidos.map(pedido => 
                    pedido.id === idPedido 
                        ? { ...pedido, estadoPedido: nuevoEstado }
                        : pedido
                )
            );

            setPedidos(prevPedidos => {
                const pedidosReordenados = [...prevPedidos].sort((a, b) => {
                    if (a.estadoPedido === 'ENTREGADO' && b.estadoPedido !== 'ENTREGADO') {
                        return 1;
                    }
                    if (a.estadoPedido !== 'ENTREGADO' && b.estadoPedido === 'ENTREGADO') {
                        return -1;
                    }
                    return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
                });
                return pedidosReordenados;
            });

        } catch (error) {
            setError('Error al actualizar el estado del pedido');
        } finally {
            setActualizando(false);
        }
    };

    const pedidosFiltrados = pedidos.filter(pedido => {
        const coincideBusqueda =
            busqueda === '' ||
            pedido.id.toString().includes(busqueda) ||
            pedido.referenciasEntrega?.toLowerCase().includes(busqueda.toLowerCase()) ||
            pedido.nombreCliente?.toLowerCase().includes(busqueda.toLowerCase());
        
        const coincideEstado = filtroEstado === 'TODOS' || 
            pedido.estadoPedido === filtroEstado;

        return coincideBusqueda && coincideEstado;
    });

    // Contadores según el tipo de vista
    const contadores = {
        total: pedidos.length,
        registrado: pedidos.filter(p => p.estadoPedido === 'REGISTRADO').length,
        pagado: pedidos.filter(p => p.estadoPedido === 'PAGADO').length,
        preparando: pedidos.filter(p => p.estadoPedido === 'PREPARANDO').length,
        listo: pedidos.filter(p => p.estadoPedido === 'LISTO').length,
        enCamino: pedidos.filter(p => p.estadoPedido === 'EN_CAMINO').length,
        entregado: pedidos.filter(p => p.estadoPedido === 'ENTREGADO').length
    };

    const pedidosActivos = pedidosFiltrados.filter(p => p.estadoPedido !== 'ENTREGADO');
    const pedidosCompletados = pedidosFiltrados.filter(p => p.estadoPedido === 'ENTREGADO');

    if (loading) {
        return (
            <div className="seguimiento-loadingContainer">
                <div className="seguimiento-spinner"></div>
                <p>Cargando pedidos...</p>
            </div>
        );
    }

    return (
        <div className="seguimiento-container">
            <div className="seguimiento-header">
                <div className="seguimiento-headerContent">
                    <h1><BsClipboardCheck /> Seguimiento de Pedidos</h1>
                    <p className="seguimiento-headerDescription">
                        Pedidos locales: solo tus pedidos de mostrador | Pedidos en línea: todos los pedidos de clientes
                    </p>
                </div>

                {actualizando && (
                    <div className="seguimiento-refreshIndicator">
                        <div className="seguimiento-refreshSpinner"></div>
                        <span>Actualizando...</span>
                    </div>
                )}
            </div>

            <div className="seguimiento-tabs">
                <button 
                    className={`seguimiento-tab ${vistaActiva === 'local' ? 'active' : ''}`}
                    onClick={() => setVistaActiva('local')}
                >
                    <FiHome /> Pedidos Locales
                    {contadores.total > 0 && vistaActiva === 'local' && (
                        <span className="seguimiento-tabBadge">{contadores.total}</span>
                    )}
                </button>
                <button 
                    className={`seguimiento-tab ${vistaActiva === 'enlinea' ? 'active' : ''}`}
                    onClick={() => setVistaActiva('enlinea')}
                >
                    <FiGlobe /> Pedidos En Línea
                    {contadores.total > 0 && vistaActiva === 'enlinea' && (
                        <span className="seguimiento-tabBadge">{contadores.total}</span>
                    )}
                </button>
            </div>

            {error && (
                <div className="seguimiento-alert seguimiento-alertError">
                    <span>{error}</span>
                    <button className="seguimiento-alertClose" onClick={() => setError('')}>
                        <FiX />
                    </button>
                </div>
            )}

            <div className="seguimiento-controls">
                <div className="seguimiento-search">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por ID de pedido..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="seguimiento-searchInput"
                    />
                </div>

                <div className="seguimiento-filters">
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="seguimiento-filterSelect"
                    >
                        <option value="TODOS">Todos los estados</option>
                        {/* Estados para pedidos locales: PAGADO → PREPARANDO → LISTO → ENTREGADO */}
                        {vistaActiva === 'local' && (
                            <>
                                <option value="PAGADO">Pagado</option>
                                <option value="PREPARANDO">Preparando</option>
                                <option value="LISTO">Listo</option>
                                <option value="ENTREGADO">Entregado</option>
                            </>
                        )}
                        {/* Estados para pedidos en línea: incluye REGISTRADO y EN_CAMINO */}
                        {vistaActiva === 'enlinea' && (
                            <>
                                <option value="REGISTRADO">Registrado</option>
                                <option value="PAGADO">Pagado</option>
                                <option value="PREPARANDO">Preparando</option>
                                <option value="LISTO">Listo</option>
                                <option value="EN_CAMINO">En Camino</option>
                                <option value="ENTREGADO">Entregado</option>
                            </>
                        )}
                    </select>
                </div>

                <button 
                    className="seguimiento-refreshBtn"
                    onClick={() => cargarPedidos()}
                    disabled={actualizando}
                >
                    <FiRefreshCw /> Actualizar
                </button>
            </div>

            <div className="seguimiento-stats">
                <div className="seguimiento-statCard">
                    <span className="seguimiento-statNumber">{contadores.total}</span>
                    <span className="seguimiento-statLabel">Total</span>
                </div>
                
                {/* Estadísticas para PEDIDOS LOCALES: PAGADO → PREPARANDO → LISTO → ENTREGADO */}
                {vistaActiva === 'local' && (
                    <>
                        <div className="seguimiento-statCard pagado">
                            <span className="seguimiento-statNumber">{contadores.pagado}</span>
                            <span className="seguimiento-statLabel">Pagados</span>
                        </div>
                        <div className="seguimiento-statCard preparado">
                            <span className="seguimiento-statNumber">{contadores.preparando}</span>
                            <span className="seguimiento-statLabel">Preparando</span>
                        </div>
                        <div className="seguimiento-statCard listo">
                            <span className="seguimiento-statNumber">{contadores.listo}</span>
                            <span className="seguimiento-statLabel">Listos</span>
                        </div>
                        <div className="seguimiento-statCard completado">
                            <span className="seguimiento-statNumber">{contadores.entregado}</span>
                            <span className="seguimiento-statLabel">Entregados</span>
                        </div>
                    </>
                )}

                {/* Estadísticas para PEDIDOS EN LÍNEA: Incluye REGISTRADO y EN_CAMINO */}
                {vistaActiva === 'enlinea' && (
                    <>
                        <div className="seguimiento-statCard registrado">
                            <span className="seguimiento-statNumber">{contadores.registrado}</span>
                            <span className="seguimiento-statLabel">Registrados</span>
                        </div>
                        <div className="seguimiento-statCard pagado">
                            <span className="seguimiento-statNumber">{contadores.pagado}</span>
                            <span className="seguimiento-statLabel">Pagados</span>
                        </div>
                        <div className="seguimiento-statCard preparado">
                            <span className="seguimiento-statNumber">{contadores.preparando}</span>
                            <span className="seguimiento-statLabel">Preparando</span>
                        </div>
                        <div className="seguimiento-statCard listo">
                            <span className="seguimiento-statNumber">{contadores.listo}</span>
                            <span className="seguimiento-statLabel">Listos</span>
                        </div>
                        <div className="seguimiento-statCard encamino">
                            <span className="seguimiento-statNumber">{contadores.enCamino}</span>
                            <span className="seguimiento-statLabel">En Camino</span>
                        </div>
                        <div className="seguimiento-statCard completado">
                            <span className="seguimiento-statNumber">{contadores.entregado}</span>
                            <span className="seguimiento-statLabel">Entregados</span>
                        </div>
                    </>
                )}
            </div>

            <div className="seguimiento-content">
                {pedidosFiltrados.length === 0 ? (
                    <div className="seguimiento-empty">
                        <div className="seguimiento-emptyIcon">
                            {vistaActiva === 'local' ? <FiHome /> : <FiGlobe />}
                        </div>
                        <h3>No hay pedidos {vistaActiva === 'local' ? 'locales' : 'en línea'}</h3>
                        <p>
                            {filtroEstado !== 'TODOS' 
                                ? `No hay pedidos con estado "${filtroEstado === 'ENTREGADO' ? 'Completado' : filtroEstado}"`
                                : `Los pedidos ${vistaActiva === 'local' ? 'del mostrador' : 'en línea'} aparecerán aquí`
                            }
                        </p>
                        <button 
                            className="seguimiento-btn seguimiento-btnPrimary"
                            onClick={() => cargarPedidos()}
                        >
                            <FiRefreshCw /> Actualizar
                        </button>
                    </div>
                ) : (
                    <div className="seguimiento-pedidosGrid">
                        {pedidosActivos.map((pedido) => (
                            <PedidoCard 
                                key={pedido.id}
                                pedido={pedido}
                                onCambiarEstado={handleCambiarEstado}
                                esLocal={vistaActiva === 'local'}
                            />
                        ))}

                        {pedidosCompletados.length > 0 && filtroEstado === 'TODOS' && pedidosActivos.length > 0 && (
                            <div className="seguimiento-separador-completados">
                                <div className="separador-linea"></div>
                                <span className="separador-texto">
                                    <MdRestaurant /> Pedidos Completados ({pedidosCompletados.length})
                                </span>
                                <div className="separador-linea"></div>
                            </div>
                        )}

                        {pedidosCompletados.map((pedido) => (
                            <PedidoCard 
                                key={pedido.id}
                                pedido={pedido}
                                onCambiarEstado={handleCambiarEstado}
                                esLocal={vistaActiva === 'local'}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeguimientoPedidoCajeroComponent;