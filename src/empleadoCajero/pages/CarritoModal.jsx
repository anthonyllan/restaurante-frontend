import React, { useState } from 'react';
import { useCarrito } from '../../context/CarritoContext.jsx';
import { registrarPedido } from '../../services/Cajero/PedidoCajeroService.js';
import { registrarDetallesPedido } from '../../services/Cajero/DetallePedidoCajeroService.js';
import { registrarPago } from '../../services/Cajero/PagoCajeroService.js';
import { cambiarEstadoPedido } from '../../services/Cajero/PedidoCajeroService.js';
import { getEmpleadoId } from '../../utils/authUtils'; // ✅ Obtener ID del cajero
// 🔄 IMPORT CORREGIDO - FiBuild no existe, uso FiSend
import { FiShoppingCart, FiTrash2, FiClock, FiCheck, FiPrinter, FiX, FiCreditCard, FiDollarSign, FiSmartphone, FiSend } from 'react-icons/fi';
import { MdRestaurant, MdDateRange, MdAccessTime, MdInfo } from 'react-icons/md';
import { BsTicket } from 'react-icons/bs';
import './CarritoModal.css';

const CarritoModal = ({ onClose }) => {
  const {
    items,
    total,
    cantidad,
    actualizarCantidad,
    removerItem,
    limpiarCarrito
  } = useCarrito();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [pagoCreado, setPagoCreado] = useState(null);
  const [datosPedidoTemporal, setDatosPedidoTemporal] = useState(null);

  const [datosPago, setDatosPago] = useState({
    metodoPago: 'EFECTIVO',
    referenciaPago: '',
    monto: 0,
    estadoPago: 'PENDIENTE'
  });

  const crearLocalDateTimeParaJava = () => {
    const ahora = new Date();
    const fechaMexico = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
    
    const año = fechaMexico.getFullYear();
    const mes = fechaMexico.getMonth() + 1;
    const dia = fechaMexico.getDate();
    const hora = fechaMexico.getHours();
    const minuto = fechaMexico.getMinutes();
    const segundo = fechaMexico.getSeconds();
    
    const localDateTimeArray = [año, mes, dia, hora, minuto, segundo];
    return localDateTimeArray;
  };

  const obtenerFechaHoraLocal = () => {
    const ahora = new Date();
    
    const opciones = {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    
    const fechaHoraMexico = new Intl.DateTimeFormat('sv-SE', opciones).format(ahora);
    return fechaHoraMexico;
  };

  const obtenerFechaLocal = () => {
    const fechaHora = obtenerFechaHoraLocal();
    const soloFecha = fechaHora.split(' ')[0];
    return soloFecha;
  };

  const calcularTiempoEstimado = () => {
    if (items.length === 0) return 0;
    
    const tiempos = items.map(item => {
      const tiempo = item.tiempoPreparacion;
      return typeof tiempo === 'number' && tiempo > 0 ? tiempo : 15;
    });
    
    const tiempoMaximo = Math.max(...tiempos);
    return tiempoMaximo;
  };

  const construirUrlCompleta = (imagen) => {
    if (!imagen) return '';
    if (imagen.startsWith('http')) return imagen;
    if (imagen.startsWith('/uploads/')) {
      return `http://localhost:2001${imagen}`;
    }
    return imagen;
  };

  const generarReferenciaPago = (metodoPago) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    switch (metodoPago) {
      case 'EFECTIVO':
        return `EFE-${timestamp.toString().slice(-6)}-${random}`;
      case 'TARJETA':
        return `TDC-${timestamp.toString().slice(-6)}-${random}`;
      case 'MERCADO_PAGO':
        return `MP-${timestamp.toString().slice(-6)}-${random}`;
      case 'TRANSFERENCIA':
        return `TRF-${timestamp.toString().slice(-6)}-${random}`;
      default:
        return `PAY-${timestamp.toString().slice(-6)}-${random}`;
    }
  };

  const confirmarOrden = async () => {
    try {
      setLoading(true);
      setError('');

      // ✅ Obtener ID del cajero que está tomando la orden
      const empleadoId = getEmpleadoId();
      
      if (!empleadoId) {
        setError('No se pudo obtener el ID del cajero. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      console.log('🛒 [CarritoModal] Cajero ID:', empleadoId, 'creando pedido para mostrador');

      const localDateTime = crearLocalDateTimeParaJava();

      // ✅ Cliente de mostrador SIEMPRE es ID=1 (creado automáticamente en el backend)
      const pedidoTemporal = {
        idCliente: 1, // ✅ ID estático del cliente de mostrador (PICKUP EN MOSTRADOR)
        idEmpleado: empleadoId, // ✅ ID del cajero que toma la orden
        fechaCreacion: localDateTime,
        estadoPedido: 'PAGADO',
        tipoEntrega: 'PICKUP_EN_MOSTRADOR',
        enLinea: false,
        calle: 'Zaragoza',
        numeroExterior: '6',
        numeroInterior: '',
        colonia: 'Centro',
        ciudad: 'Chilpancingo',
        estadoDireccion: 'Guerrero',
        codigoPostal: '39000',
        referenciasEntrega: ''
      };

      setDatosPedidoTemporal(pedidoTemporal);

      setDatosPago(prev => ({
        ...prev,
        monto: total,
        referenciaPago: generarReferenciaPago(prev.metodoPago)
      }));

      setSuccess('Orden preparada correctamente');
      setStep(2);

    } catch (error) {
      setError('Error al preparar el pedido: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const procesarPago = async () => {
    try {
      setLoading(true);
      setError('');

      const responsePedido = await registrarPedido(datosPedidoTemporal);
      const pedidoRegistrado = responsePedido.data;

      const pedidoConReferencia = {
        ...pedidoRegistrado,
        referenciasEntrega: `Cliente en el restaurante con el identificador: ${pedidoRegistrado.id}`
      };

      const detallesPedido = items.map(item => ({
        idPedido: {
          id: pedidoRegistrado.id
        },
        idProducto: item.id,
        cantidad: item.cantidad
      }));

      await registrarDetallesPedido(detallesPedido);

      const localDateTime = crearLocalDateTimeParaJava();

      const pagoDto = {
        idPedido: {
          id: pedidoRegistrado.id
        },
        fechaPago: localDateTime,
        metodoPago: datosPago.metodoPago,
        estadoPago: 'APROBADO',
        referenciaPago: datosPago.referenciaPago,
        monto: datosPago.monto
      };

      const responsePago = await registrarPago(pagoDto);
      const pagoRegistrado = responsePago.data;

      setPedidoCreado(pedidoConReferencia);
      setPagoCreado(pagoRegistrado);

      setSuccess(`Transacción completada - Orden #${pedidoRegistrado.id} - Referencia: ${pagoDto.referenciaPago}`);
      setStep(3);

    } catch (error) {
      setError('Error al procesar la transacción: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMetodoPagoChange = (nuevoMetodo) => {
    const nuevaReferencia = generarReferenciaPago(nuevoMetodo);
    setDatosPago(prev => ({
      ...prev,
      metodoPago: nuevoMetodo,
      referenciaPago: nuevaReferencia
    }));
  };

  const imprimirTicket = () => {
    const ticket = generarTicketHTML();
    
    const ventanaImpresion = window.open('', 'PRINT', 'height=600,width=400');
    
    ventanaImpresion.document.write(ticket);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    
    ventanaImpresion.print();
    
    ventanaImpresion.addEventListener('afterprint', () => {
      ventanaImpresion.close();
    });
  };

  const generarTicketHTML = () => {
    const fechaHoraMexico = obtenerFechaHoraLocal();
    const [fechaParte, horaParte] = fechaHoraMexico.split(' ');
    
    const fechaFormateada = new Date(fechaParte + 'T00:00:00').toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const horaFormateada = horaParte ? horaParte.substring(0, 5) : '00:00';
    const tiempoEstimado = calcularTiempoEstimado();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket - Orden #${pedidoCreado?.id}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            width: 300px;
            background: white;
            color: black;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .restaurante {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .direccion {
            font-size: 10px;
            margin-bottom: 5px;
          }
          .orden-info {
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .orden-numero {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
          }
          .fecha-hora {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
          }
          .productos {
            margin-bottom: 15px;
          }
          .producto {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 3px;
          }
          .producto-info {
            flex: 1;
          }
          .producto-nombre {
            font-weight: bold;
            font-size: 11px;
          }
          .producto-cantidad {
            font-size: 10px;
            color: #666;
          }
          .producto-precio {
            font-weight: bold;
            margin-left: 10px;
          }
          .pago-section {
            margin: 15px 0;
            padding: 10px;
            border: 1px solid #000;
            background: #f0f0f0;
          }
          .pago-title {
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
          }
          .pago-info {
            font-size: 10px;
            margin-bottom: 3px;
          }
          .estado-section {
            margin: 10px 0;
            padding: 8px;
            border: 1px dashed #000;
            text-align: center;
            background: #e8f5e8;
          }
          .total-section {
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 15px;
          }
          .total {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            border-top: 1px dashed #000;
            padding-top: 10px;
            font-size: 10px;
          }
          .mensaje {
            margin-top: 10px;
            font-style: italic;
          }
          @media print {
            body { width: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurante">RESTAURANTE</div>
          <div class="direccion">Zaragoza #6, Centro</div>
          <div class="direccion">Chilpancingo, Guerrero 39000</div>
        </div>
        
        <div class="orden-info">
          <div class="orden-numero">ORDEN #${pedidoCreado?.id}</div>
          <div class="fecha-hora">
            <span>${fechaFormateada}</span>
            <span>${horaFormateada}</span>
          </div>
        </div>
        
        ${pedidoCreado?.estadoPedido === 'PAGADO' ? `
        <div class="estado-section">
          <div style="font-weight: bold; color: #16a34a;">PEDIDO PAGADO</div>
          <div style="font-size: 9px; margin-top: 3px;">Listo para preparar</div>
        </div>
        ` : ''}
        
        <div class="productos">
          <div style="font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;">
            PRODUCTOS ORDENADOS:
          </div>
          ${items.map(item => `
            <div class="producto">
              <div class="producto-info">
                <div class="producto-nombre">${item.nombre}</div>
                <div class="producto-cantidad">${item.cantidad} x $${item.precio.toFixed(2)}</div>
              </div>
              <div class="producto-precio">$${(item.precio * item.cantidad).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
        
        ${pagoCreado ? `
        <div class="pago-section">
          <div class="pago-title">INFORMACIÓN DE PAGO</div>
          <div class="pago-info">Método: ${pagoCreado.metodoPago.replace('_', ' ')}</div>
          <div class="pago-info">Referencia: ${pagoCreado.referenciaPago}</div>
          <div class="pago-info">Estado: ${pagoCreado.estadoPago}</div>
          <div class="pago-info">Monto: $${pagoCreado.monto.toFixed(2)}</div>
        </div>
        ` : ''}
        
        <div class="total-section">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Productos (${cantidad}):</span>
            <span>$${total.toFixed(2)}</span>
          </div>
          <div class="total">
            <span>TOTAL PAGADO:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div style="font-weight: bold;">TICKET DE ORDEN</div>
          <div style="margin-top: 5px;">Presente este ticket para recoger su orden</div>
          <div class="mensaje">
            ¡Gracias por su preferencia!<br>
            Tiempo estimado: ${tiempoEstimado} minutos<br>
            Hora del pedido: ${horaFormateada}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const finalizarOrden = () => {
    limpiarCarrito();
    onClose();
  };

  const renderCarrito = () => (
    <div className="carrito-content">
      <h3>Carrito de Compras</h3>
      
      {items.length === 0 ? (
        <div className="carrito-empty">
          <p>El carrito está vacío</p>
          <p>Agrega productos para continuar</p>
        </div>
      ) : (
        <>
          <div className="carrito-items">
            {items.map((item) => (
              <div key={item.id} className="carrito-item">
                <div className="carrito-item-image">
                  {item.imagen ? (
                    <img src={construirUrlCompleta(item.imagen)} alt={item.nombre} />
                  ) : (
                    <div className="carrito-item-placeholder">IMG</div>
                  )}
                </div>
                
                <div className="carrito-item-info">
                  <h4>{item.nombre}</h4>
                  <p className="carrito-item-descripcion">{item.descripcion}</p>
                  <span className="carrito-item-precio">${item.precio}</span>
                </div>
                
                <div className="carrito-item-controls">
                  <div className="carrito-cantidad-controls">
                    <button 
                      className="carrito-btn-cantidad"
                      onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                      disabled={item.cantidad <= 1}
                    >
                      -
                    </button>
                    <span className="carrito-cantidad">{item.cantidad}</span>
                    <button 
                      className="carrito-btn-cantidad"
                      onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    className="carrito-btn-remover"
                    onClick={() => removerItem(item.id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
                
                <div className="carrito-item-subtotal">
                  ${(item.precio * item.cantidad).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="carrito-summary">
            <div className="carrito-total">
              <span>Total: ${total.toFixed(2)}</span>
              <span>({cantidad} productos)</span>
            </div>
            
            <div className="carrito-actions">
              <button 
                className="carrito-btn carrito-btn-secondary"
                onClick={limpiarCarrito}
              >
                Limpiar Carrito
              </button>
              <button 
                className="carrito-btn carrito-btn-primary"
                onClick={confirmarOrden}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Confirmar Orden'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderConfirmacion = () => {
    const fechaHoraMexico = obtenerFechaHoraLocal();
    const [fechaParte, horaParte] = fechaHoraMexico.split(' ');
    
    const fechaFormateada = new Date(fechaParte + 'T00:00:00').toLocaleDateString('es-MX');
    const horaFormateada = horaParte ? horaParte.substring(0, 5) : '00:00';

    return (
      <div className="carrito-content">
        <h3><BsTicket /> Revisar Orden</h3>
        
        <div className="carrito-confirmacion">
          <div className="carrito-orden-preview">
            <div className="carrito-orden-numero">
              <BsTicket /> Orden a generar
            </div>
            <div className="carrito-orden-fecha">
              <MdDateRange /> {fechaFormateada} - {horaFormateada}
            </div>
          </div>
          
          <div className="carrito-resumen-items">
            <h4>Productos a ordenar:</h4>
            {items.map((item) => (
              <div key={item.id} className="carrito-resumen-item">
                <span>{item.cantidad}x {item.nombre}</span>
                <span>${(item.precio * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="carrito-resumen-total">
            <h4>Total: ${total.toFixed(2)}</h4>
          </div>

          <div className="carrito-tiempo-estimado">
            <FiClock /> Tiempo estimado: {calcularTiempoEstimado()} minutos
          </div>

          <div className="carrito-info-importante">
            <MdInfo /> <strong>Nota:</strong> La orden se registrará como PAGADA cuando confirmes el pago
          </div>
        </div>
        
        {error && (
          <div className="carrito-alert carrito-alert-error">
            {error}
          </div>
        )}
        
        {success && (
          <div className="carrito-alert carrito-alert-success">
            {success}
          </div>
        )}
        
        <div className="carrito-actions">
          <button 
            className="carrito-btn carrito-btn-secondary"
            onClick={() => setStep(1)}
          >
            ← Regresar al Carrito
          </button>
          <button 
            className="carrito-btn carrito-btn-primary"
            onClick={() => setStep(3)}
          >
            Proceder al Pago →
          </button>
        </div>
      </div>
    );
  };

  const renderPago = () => (
    <div className="carrito-content">
      <h3><FiDollarSign /> Procesar Pago</h3>
      
      <div className="pago-container">
        <div className="pago-resumen">
          <div className="pago-order-info">
            <h4>Orden a registrar como PAGADA</h4>
            <p><strong>Total a cobrar: ${total.toFixed(2)}</strong></p>
            <p>Productos: {cantidad} items</p>
          </div>
        </div>

        <div className="pago-form">
          <div className="pago-form-group">
            <label>Método de Pago</label>
            <div className="pago-metodos">
              <button 
                className={`pago-metodo-btn ${datosPago.metodoPago === 'EFECTIVO' ? 'active' : ''}`}
                onClick={() => handleMetodoPagoChange('EFECTIVO')}
              >
                <FiDollarSign /> Efectivo
              </button>
              <button 
                className={`pago-metodo-btn ${datosPago.metodoPago === 'TARJETA' ? 'active' : ''}`}
                onClick={() => handleMetodoPagoChange('TARJETA')}
              >
                <FiCreditCard /> Tarjeta
              </button>
              <button 
                className={`pago-metodo-btn ${datosPago.metodoPago === 'MERCADO_PAGO' ? 'active' : ''}`}
                onClick={() => handleMetodoPagoChange('MERCADO_PAGO')}
              >
                <FiSmartphone /> Mercado Pago
              </button>
              <button 
                className={`pago-metodo-btn ${datosPago.metodoPago === 'TRANSFERENCIA' ? 'active' : ''}`}
                onClick={() => handleMetodoPagoChange('TRANSFERENCIA')}
              >
                <FiSend /> Transferencia
              </button>
            </div>
          </div>

          <div className="pago-form-group">
            <label>Monto</label>
            <input
              type="number"
              step="0.01"
              value={datosPago.monto}
              onChange={(e) => setDatosPago(prev => ({...prev, monto: parseFloat(e.target.value) || 0}))}
              className="pago-input"
              min="0"
            />
          </div>

          <div className="pago-form-group">
            <label>Referencia de Pago</label>
            <input
              type="text"
              value={datosPago.referenciaPago}
              onChange={(e) => setDatosPago(prev => ({...prev, referenciaPago: e.target.value}))}
              className="pago-input"
              placeholder="Referencia automática generada"
            />
          </div>

          {datosPago.metodoPago === 'EFECTIVO' && (
            <div className="pago-info-metodo">
              <div className="pago-info-card efectivo">
                <h5><FiDollarSign /> Pago en Efectivo</h5>
                <p>• El pago se aprobará automáticamente</p>
                <p>• Asegúrate de tener el cambio necesario</p>
                <p>• El pedido se registrará como: <strong>PAGADO</strong></p>
                <p>• <strong>Cocina podrá empezar a preparar</strong></p>
              </div>
            </div>
          )}

          {datosPago.metodoPago === 'MERCADO_PAGO' && (
            <div className="pago-info-metodo">
              <div className="pago-info-card mercadopago">
                <h5><FiSmartphone /> Mercado Pago</h5>
                <p>• Usa la terminal Point Blue del restaurante</p>
                <p>• Ingresa el monto en la terminal</p>
                <p>• Cliente paga con QR o tarjeta</p>
                <p>• Confirma cuando se apruebe en terminal</p>
                <p>• <strong>El pedido se registrará como PAGADO</strong></p>
              </div>
            </div>
          )}

          {datosPago.metodoPago === 'TARJETA' && (
            <div className="pago-info-metodo">
              <div className="pago-info-card tarjeta">
                <h5><FiCreditCard /> Pago con Tarjeta</h5>
                <p>• Inserta o pasa la tarjeta en la terminal</p>
                <p>• Espera la autorización bancaria</p>
                <p>• <strong>El pedido se registrará como PAGADO</strong></p>
              </div>
            </div>
          )}

          {datosPago.metodoPago === 'TRANSFERENCIA' && (
            <div className="pago-info-metodo">
              <div className="pago-info-card transferencia">
                <h5><FiSend /> Transferencia Bancaria</h5>
                <p>• Proporciona los datos bancarios al cliente</p>
                <p>• Confirma la transferencia manualmente</p>
                <p>• <strong>El pedido se registrará como PAGADO</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="carrito-alert carrito-alert-error">
          {error}
        </div>
      )}
      
      <div className="carrito-actions">
        <button 
          className="carrito-btn carrito-btn-secondary"
          onClick={() => setStep(2)}
          disabled={loading}
        >
          ← Regresar
        </button>
        <button 
          className="carrito-btn carrito-btn-primary"
          onClick={procesarPago}
          disabled={loading || datosPago.monto <= 0}
        >
          {loading ? 'Registrando como PAGADO...' : `Confirmar Pago y Registrar ($${datosPago.monto.toFixed(2)})`}
        </button>
      </div>
    </div>
  );

  const renderConfirmacionFinal = () => (
    <div className="carrito-content">
      <h3><FiCheck /> ¡Pedido Registrado y Pagado!</h3>
      
      <div className="carrito-confirmacion">
        <div className="pago-exitoso">
          <div className="pago-exitoso-icon"><FiCheck /></div>
          <h4>Orden Registrada como PAGADO</h4>
          <p>Orden #{pedidoCreado?.id} - ${total.toFixed(2)}</p>
          {pedidoCreado?.estadoPedido === 'PAGADO' && (
            <div className="pedido-pagado-badge">
              <FiDollarSign /> PEDIDO PAGADO - Cocina puede preparar
            </div>
          )}
        </div>

        <div className="pago-detalles">
          <h5>Detalles del Pago:</h5>
          <div className="pago-detalle-item">
            <span>Método:</span>
            <span>{pagoCreado?.metodoPago.replace('_', ' ')}</span>
          </div>
          <div className="pago-detalle-item">
            <span>Referencia:</span>
            <span>{pagoCreado?.referenciaPago}</span>
          </div>
          <div className="pago-detalle-item">
            <span>Estado del Pago:</span>
            <span className={`pago-estado ${pagoCreado?.estadoPago.toLowerCase()}`}>
              {pagoCreado?.estadoPago}
            </span>
          </div>
          <div className="pago-detalle-item">
            <span>Estado del Pedido:</span>
            <span className={`pedido-estado ${pedidoCreado?.estadoPedido.toLowerCase()}`}>
              {pedidoCreado?.estadoPedido}
            </span>
          </div>
          <div className="pago-detalle-item">
            <span>Monto:</span>
            <span><strong>${pagoCreado?.monto.toFixed(2)}</strong></span>
          </div>
        </div>

        <div className="carrito-tiempo-estimado">
          <FiClock /> Tiempo estimado de preparación: {calcularTiempoEstimado()} minutos
        </div>
      </div>
      
      {success && (
        <div className="carrito-alert carrito-alert-success">
          {success}
        </div>
      )}
      
      <div className="carrito-actions">
        <button 
          className="carrito-btn carrito-btn-secondary"
          onClick={imprimirTicket}
        >
          <FiPrinter /> Imprimir Ticket
        </button>
        <button 
          className="carrito-btn carrito-btn-primary"
          onClick={finalizarOrden}
        >
          <FiCheck /> Finalizar y Nueva Orden
        </button>
      </div>
    </div>
  );

  return (
    <div className="carrito-overlay">
      <div className="carrito-modal">
        <div className="carrito-header">
          <h2>
            {step === 1 && 'Carrito'}
            {step === 2 && 'Revisar Orden'}
            {step === 3 && 'Confirmar Pago'}
          </h2>
          <button className="carrito-close" onClick={onClose}><FiX /></button>
        </div>
        
        <div className="carrito-steps">
          <div className={`carrito-step ${step >= 1 ? 'active' : ''}`}>1. Carrito</div>
          <div className={`carrito-step ${step >= 2 ? 'active' : ''}`}>2. Revisar</div>
          <div className={`carrito-step ${step >= 3 ? 'active' : ''}`}>3. Pagar</div>
        </div>
        
        {step === 1 && renderCarrito()}
        {step === 2 && renderConfirmacion()}
        {step === 3 && !pagoCreado && renderPago()}
        {step === 3 && pagoCreado && renderConfirmacionFinal()}
      </div>
    </div>
  );
};

export default CarritoModal;