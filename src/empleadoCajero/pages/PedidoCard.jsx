import React, { useState } from 'react';
import { obtenerDetallesPorPedido } from '../../services/Cajero/DetallePedidoCajeroService';
import { FiUser, FiHome, FiShoppingBag, FiPackage, FiChevronDown, FiLoader, FiDollarSign, FiTool, FiClock, FiAlertTriangle, FiCheck, FiPhone } from 'react-icons/fi';
import { MdDateRange, MdAccessTime, MdEdit } from 'react-icons/md';
import { BsClipboardCheck } from 'react-icons/bs';
import './PedidoCard.css';

const PedidoCard = ({ pedido, onCambiarEstado, esLocal }) => {
    const [mostrarDetalles, setMostrarDetalles] = useState(false);
    const [detallesProductos, setDetallesProductos] = useState([]);
    const [cargandoDetalles, setCargandoDetalles] = useState(false);

    const esPedidoDomicilio = !esLocal && pedido.tipoEntrega === 'DOMICILIO';
    const esPedidoParaLlevar = !esLocal && pedido.tipoEntrega === 'PARA_LLEVAR';

    const metodoPagoDetectado = pedido.metodoPagoDetectado?.toUpperCase?.() ||
        pedido.metodoPago?.toUpperCase?.() ||
        null;

    const estadoPagoDetectado = pedido.estadoPagoDetectado?.toUpperCase?.() ||
        pedido.estadoPago?.toUpperCase?.() ||
        null;

    const usaFlujoTarjetaParaLlevar =
        esPedidoParaLlevar &&
        (
            metodoPagoDetectado === 'TARJETA' ||
            estadoPagoDetectado === 'APROBADO'
        );

    const usaFlujoEfectivoParaLlevar =
        esPedidoParaLlevar &&
        !usaFlujoTarjetaParaLlevar;

    const obtenerEstadosDisponibles = () => {
        if (esLocal) {
            return [
                { valor: 'REGISTRADO', label: 'Registrado', color: '#9ca3af' },
                { valor: 'PAGADO', label: 'Pagado - Puede Preparar', color: '#059669' },
                { valor: 'PREPARANDO', label: 'Preparando', color: '#f59e0b' },
                { valor: 'LISTO', label: 'Listo para Entregar', color: '#16a34a' },
                { valor: 'ENTREGADO', label: 'Entregado', color: '#2563eb' }
            ];
        }

        if (esPedidoDomicilio) {
            return [
                { valor: 'REGISTRADO', label: 'Registrado - Sin pago', color: '#9ca3af' },
                { valor: 'PAGADO', label: 'Pagado', color: '#059669' },
                { valor: 'PREPARANDO', label: 'Preparando', color: '#f59e0b' },
                { valor: 'LISTO', label: 'Listo', color: '#16a34a' },
                { valor: 'EN_CAMINO', label: 'En Camino', color: '#0ea5e9' },
                { valor: 'ENTREGADO', label: 'Entregado', color: '#2563eb' }
            ];
        }

        if (usaFlujoTarjetaParaLlevar) {
            return [
                { valor: 'REGISTRADO', label: 'Registrado', color: '#9ca3af' },
                { valor: 'PAGADO', label: 'Pagado', color: '#059669' },
                { valor: 'PREPARANDO', label: 'Preparando', color: '#f59e0b' },
                { valor: 'LISTO', label: 'Listo', color: '#16a34a' },
                { valor: 'ENTREGADO', label: 'Entregado', color: '#2563eb' }
            ];
        }

        if (usaFlujoEfectivoParaLlevar) {
            return [
                { valor: 'REGISTRADO', label: 'Registrado', color: '#9ca3af' },
                { valor: 'PREPARANDO', label: 'Preparando', color: '#f59e0b' },
                { valor: 'LISTO', label: 'Listo', color: '#16a34a' },
                { valor: 'PAGADO', label: 'Pagado', color: '#059669' },
                { valor: 'ENTREGADO', label: 'Entregado', color: '#2563eb' }
            ];
        }

        return [
            { valor: 'REGISTRADO', label: 'Registrado', color: '#9ca3af' },
            { valor: 'PAGADO', label: 'Pagado', color: '#059669' },
            { valor: 'PREPARANDO', label: 'Preparando', color: '#f59e0b' },
            { valor: 'LISTO', label: 'Listo', color: '#16a34a' },
            { valor: 'ENTREGADO', label: 'Entregado', color: '#2563eb' }
        ];
    };

    const estadosDisponibles = obtenerEstadosDisponibles();

    const obtenerSiguienteEstado = () => {
        if (esLocal) {
            switch (pedido.estadoPedido) {
                case 'REGISTRADO':
                    return { valor: 'PAGADO', label: 'Marcar como Pagado', color: '#059669' };
                case 'PAGADO':
                    return { valor: 'PREPARANDO', label: 'Iniciar Preparación', color: '#f59e0b' };
                case 'PREPARANDO':
                    return { valor: 'LISTO', label: 'Marcar como Listo', color: '#16a34a' };
                case 'LISTO':
                    return { valor: 'ENTREGADO', label: 'Marcar como Entregado', color: '#2563eb' };
                default:
                    return null;
            }
        }

        if (esPedidoDomicilio) {
            switch (pedido.estadoPedido) {
                case 'REGISTRADO':
                    return { valor: 'PAGADO', label: 'Marcar como Pagado', color: '#059669' };
                case 'PAGADO':
                    return { valor: 'PREPARANDO', label: 'Iniciar Preparación', color: '#f59e0b' };
                case 'PREPARANDO':
                    return { valor: 'LISTO', label: 'Marcar como Listo', color: '#16a34a' };
                case 'LISTO':
                    return { valor: 'EN_CAMINO', label: 'Enviar a Domicilio', color: '#0ea5e9' };
                case 'EN_CAMINO':
                    return { valor: 'ENTREGADO', label: 'Marcar como Entregado', color: '#2563eb' };
                default:
                    return null;
            }
        }

        if (esPedidoParaLlevar) {
            if (usaFlujoTarjetaParaLlevar) {
                switch (pedido.estadoPedido) {
                    case 'REGISTRADO':
                        return { valor: 'PAGADO', label: 'Marcar como Pagado', color: '#059669' };
                    case 'PAGADO':
                        return { valor: 'PREPARANDO', label: 'Iniciar Preparación', color: '#f59e0b' };
                    case 'PREPARANDO':
                        return { valor: 'LISTO', label: 'Marcar como Listo', color: '#16a34a' };
                    case 'LISTO':
                        return { valor: 'ENTREGADO', label: 'Marcar como Entregado', color: '#2563eb' };
                    default:
                        return null;
                }
            }

            if (usaFlujoEfectivoParaLlevar) {
                switch (pedido.estadoPedido) {
                    case 'REGISTRADO':
                        return { valor: 'PREPARANDO', label: 'Iniciar Preparación', color: '#f59e0b' };
                    case 'PREPARANDO':
                        return { valor: 'LISTO', label: 'Marcar como Listo', color: '#16a34a' };
                    case 'LISTO':
                        return { valor: 'PAGADO', label: 'Marcar como Pagado', color: '#059669' };
                    case 'PAGADO':
                        return { valor: 'ENTREGADO', label: 'Marcar como Entregado', color: '#2563eb' };
                    default:
                        return null;
                }
            }
        }

        return null;
    };

    const estadoActual = estadosDisponibles.find(e => e.valor === pedido.estadoPedido) ||
        { valor: pedido.estadoPedido, label: pedido.estadoPedido, color: '#6b7280' };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatearHora = (fecha) => {
        return new Date(fecha).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calcularTiempoTranscurrido = (fechaCreacion) => {
        const ahora = new Date();
        const fechaPedido = new Date(fechaCreacion);
        const diferencia = ahora - fechaPedido;

        const minutos = Math.floor(diferencia / (1000 * 60));
        const horas = Math.floor(minutos / 60);

        if (horas > 0) {
            return `${horas}h ${minutos % 60}m`;
        }
        return `${minutos}m`;
    };

    const handleCambiarEstado = (nuevoEstado) => {
        const estadoLabel = nuevoEstado === 'ENTREGADO' ? 'Entregado' :
                           nuevoEstado === 'PREPARANDO' ? 'Preparando' :
                           nuevoEstado === 'LISTO' ? 'Listo' : nuevoEstado;
        if (window.confirm(`¿Cambiar estado del pedido #${pedido.id} a "${estadoLabel}"?`)) {
            onCambiarEstado(pedido.id, nuevoEstado);
        }
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
            setDetallesProductos([]);
            setMostrarDetalles(true);
        } finally {
            setCargandoDetalles(false);
        }
    };

    const calcularTotalReal = () => {
        if (detallesProductos && detallesProductos.length > 0) {
            const totalCalculado = detallesProductos.reduce((total, detalle) => {
                const precio = parseFloat(detalle.precio) || 0;
                const cantidad = parseInt(detalle.cantidad) || 0;

                if (precio > 0 && cantidad > 0) {
                    return total + (precio * cantidad);
                }
                return total;
            }, 0);

            if (totalCalculado > 0) {
                return totalCalculado.toFixed(2);
            }
        }

        if (pedido.detalles && pedido.detalles.length > 0) {
            const totalCalculado = pedido.detalles.reduce((total, detalle) => {
                const precio = parseFloat(detalle.precio) || 0;
                const cantidad = parseInt(detalle.cantidad) || 0;
                return total + (precio * cantidad);
            }, 0);

            if (totalCalculado > 0) {
                return totalCalculado.toFixed(2);
            }
        }

        return null;
    };

    const siguienteEstado = obtenerSiguienteEstado();
    const totalReal = calcularTotalReal();

    return (
        <div className={`pedido-card ${pedido.estadoPedido.toLowerCase()}`}>
            <div className="pedido-card-header">
                <div className="pedido-info-principal">
                    <div className="pedido-numero">
                        <span className="pedido-id">#{pedido.id}</span>
                        <span className="pedido-tipo">
                            {esLocal ? <FiHome /> : <FiShoppingBag />} {pedido.tipoEntrega?.replace('_', ' ')}
                        </span>
                    </div>
                    <div className="pedido-tiempo">
                        <span className="pedido-fecha"><MdDateRange /> {formatearFecha(pedido.fechaCreacion)}</span>
                        <span className="pedido-hora"><MdAccessTime /> {formatearHora(pedido.fechaCreacion)}</span>
                        <span className="pedido-transcurrido">
                            <FiClock /> {calcularTiempoTranscurrido(pedido.fechaCreacion)} transcurridos
                        </span>
                    </div>
                </div>

                <div className="pedido-estado-section">
                    <div
                        className="pedido-estado-badge"
                        style={{ backgroundColor: estadoActual.color }}
                    >
                        {estadoActual.label}
                    </div>
                </div>
            </div>

            <div className="pedido-cliente-info">
                {esLocal ? (
                    <div className="pedido-cliente-local">
                        <span className="pedido-cliente-icono"><FiUser /></span>
                        <span className="pedido-cliente-nombre">Cliente en mostrador</span>
                    </div>
                ) : (
                    <div className="pedido-cliente-entrega">
                        <span className="pedido-direccion-icono">
                            {pedido.tipoEntrega === 'DOMICILIO' ? <FiHome /> : <FiShoppingBag />}
                        </span>
                        <div className="pedido-direccion-info">
                            {pedido.nombreCliente && (
                                <span className="pedido-cliente-nombreOnline">
                                    <FiUser /> {pedido.nombreCliente}
                                </span>
                            )}
                            {pedido.numeroTelefono && (
                                <span className="pedido-telefono">
                                    <FiPhone /> {pedido.numeroTelefono}
                                </span>
                            )}
                            <span className="pedido-direccion">
                                {pedido.calle} {pedido.numeroExterior}, {pedido.colonia}
                            </span>
                            <span className="pedido-ciudad">
                                {pedido.ciudad}, {pedido.estadoDireccion} {pedido.codigoPostal}
                            </span>
                            {pedido.referenciasEntrega && (
                                <span className="pedido-referencias">
                                    <MdEdit /> {pedido.referenciasEntrega}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="pedido-productos-resumen">
                <button
                    className="pedido-productos-toggle"
                    onClick={cargarDetallesProductos}
                    disabled={cargandoDetalles}
                >
                    <span><FiPackage /> Ver productos ({pedido.detalles?.length || 0})</span>
                    <span className={`pedido-toggle-icon ${mostrarDetalles ? 'rotated' : ''}`}>
                        {cargandoDetalles ? <FiLoader /> : <FiChevronDown />}
                    </span>
                </button>

                {mostrarDetalles && (
                    <div className="pedido-productos-detalles">
                        {detallesProductos.length > 0 ? (
                            detallesProductos.map((detalle, index) => (
                                <div key={index} className="pedido-producto-item-simple">
                                    <span className="pedido-producto-cantidad">{detalle.cantidad}x</span>
                                    <span className="pedido-producto-nombre">
                                        {detalle.nombreProducto}
                                    </span>
                                    {detalle.precio && detalle.precio > 0 && (
                                        <span className="pedido-producto-precio">
                                            ${parseFloat(detalle.precio).toFixed(2)} c/u
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="pedido-sin-productos">
                                <span>No se encontraron detalles de productos</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="pedido-total">
                <span className="pedido-total-label">Total del pedido:</span>
                <span className="pedido-total-valor">
                    {totalReal ? `$${totalReal}` :
                     (detallesProductos.length > 0 ? 'Sin precios disponibles' : 'Haz clic en "Ver productos"')}
                </span>
            </div>

            <div className="pedido-acciones">
                {siguienteEstado && pedido.estadoPedido !== 'ENTREGADO' && (
                    <button
                        className="pedido-btn pedido-btn-siguiente"
                        onClick={() => handleCambiarEstado(siguienteEstado.valor)}
                        style={{ backgroundColor: siguienteEstado.color }}
                    >
                        <FiTool /> {siguienteEstado.label}
                    </button>
                )}

                {pedido.estadoPedido !== 'ENTREGADO' && (
                    <div className="pedido-estado-dropdown">
                        <select
                            value={pedido.estadoPedido}
                            onChange={(e) => handleCambiarEstado(e.target.value)}
                            className="pedido-estado-select"
                        >
                            {estadosDisponibles
                                .filter(estado => {
                                    const estadoActualPedido = pedido.estadoPedido;
                                    const indiceActual = estadosDisponibles.findIndex(e => e.valor === estadoActualPedido);
                                    const indiceEstado = estadosDisponibles.findIndex(e => e.valor === estado.valor);

                                    return indiceEstado >= indiceActual;
                                })
                                .map((estado) => (
                                    <option
                                        key={estado.valor}
                                        value={estado.valor}
                                        disabled={estado.valor === pedido.estadoPedido}
                                    >
                                        {estado.label}
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                )}

                {pedido.estadoPedido === 'ENTREGADO' && (
                    <div className="pedido-completado-mensaje">
                        <FiCheck /> Este pedido ya fue entregado al cliente
                    </div>
                )}
            </div>

            {pedido.estadoPedido === 'REGISTRADO' && (
            <div className="pedido-registrado-especial">
                <FiClock /> Pedido registrado — en espera de pago
            </div>
            )}

            {pedido.estadoPedido === 'PAGADO' && (
                <div className="pedido-pagado-especial">
                    <FiDollarSign /> PEDIDO PAGADO - Cocina puede empezar a preparar
                </div>
            )}

            {pedido.estadoPedido === 'PREPARANDO' && (
                <div className="pedido-preparando-especial">
                    <FiTool /> COCINA PREPARANDO - Pronto estará listo
                </div>
            )}

            {pedido.estadoPedido === 'LISTO' && (
                <div className="pedido-listo-especial">
                    <FiCheck /> PEDIDO LISTO - {pedido.tipoEntrega === 'DOMICILIO' ? 'Puede enviarse' : 'Puede entregarse'}
                </div>
            )}

            {pedido.estadoPedido === 'EN_CAMINO' && (
                <div className="pedido-encamino-especial">
                    <FiShoppingBag /> EN CAMINO - Repartidor llevando el pedido
                </div>
            )}

            {calcularTiempoTranscurrido(pedido.fechaCreacion).includes('h') &&
             pedido.estadoPedido !== 'ENTREGADO' && (
                <div className="pedido-urgencia">
                    <FiAlertTriangle /> Pedido con más de 1 hora
                </div>
            )}

            {pedido.estadoPedido === 'ENTREGADO' && (
                <div className="pedido-completado">
                    <BsClipboardCheck /> PEDIDO ENTREGADO
                </div>
            )}
        </div>
    );
};

export default PedidoCard;