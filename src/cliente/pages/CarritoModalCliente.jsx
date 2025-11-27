import React, { useState } from 'react';
import { useCarrito } from '../../context/CarritoClienteContext.jsx';
import { registrarPedido } from '../../services/Cliente/PedidoClienteService.js';
import { registrarDetallesPedido } from '../../services/Cliente/DetallePedidoClienteService.js';
import { registrarPago } from '../../services/Cliente/PagoClienteService.js';
import { obtenerInfoPorCodigoPostal, validarCodigoPostalMexicano, obtenerColoniasUnicas } from '../../services/GeocodingService.js';
import { getClienteId } from '../../utils/authUtils';
import { getImageUrl } from '../../config/api';
import { FiShoppingCart, FiTrash2, FiClock, FiCheck, FiX, FiCreditCard, FiDollarSign, FiArrowLeft, FiArrowRight, FiTruck, FiPhone, FiInfo } from 'react-icons/fi';
import { MdRestaurant, MdLocationOn, MdHome } from 'react-icons/md';
import './CarritoModalCliente.css';
import StripePayment from '../StripePayment';

const CarritoModalCliente = ({ onClose }) => {
  const {
    items,
    total,
    cantidad,
    actualizarCantidad,
    removerItem,
    limpiarCarrito,
    tipoEntrega,
    actualizarTipoEntrega,
    direccion,
    actualizarDireccion
  } = useCarrito();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [pagoCreado, setPagoCreado] = useState(null);
  const [datosPedidoTemporal, setDatosPedidoTemporal] = useState(null);

  const [codigoPostalInfo, setCodigoPostalInfo] = useState(null);
  const [buscandoCP, setBuscandoCP] = useState(false);
  const [colonias, setColonias] = useState([]);

  const [direccionForm, setDireccionForm] = useState({
    codigoPostal: '',
    calle: '',
    numeroExterior: '',
    numeroInterior: '',
    colonia: '',
    ciudad: 'Chilpancingo',
    estadoDireccion: 'Guerrero',
    referenciasEntrega: '',
    numeroTelefono: ''
  });

  const [datosPago, setDatosPago] = useState({
    metodoPago: 'TARJETA',
    referenciaPago: '',
    monto: 0,
    estadoPago: 'PENDIENTE'
  });

  const datosRestaurante = {
    calle: 'Zaragoza',
    numeroExterior: '6',
    numeroInterior: '',
    colonia: 'Centro',
    ciudad: 'Chilpancingo',
    estadoDireccion: 'Guerrero',
    codigoPostal: '39020',
    referenciasEntrega: 'Para recoger en el restaurante',
    numeroTelefono: ''
  };

  // Calcular comisión y total final
  const calcularComisionStripe = (monto) => {
    return (monto * 0.033) + 10;
  };

  const calcularTotalConComision = () => {
    if (datosPago.metodoPago === 'TARJETA') {
      const comision = calcularComisionStripe(total);
      return total + comision;
    }
    return total;
  };


  
const crearLocalDateTimeParaJava = () => {
  const ahora = new Date();
  const fechaMexico = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));

  const año = fechaMexico.getFullYear();
  const mes = fechaMexico.getMonth() + 1;
  const dia = fechaMexico.getDate();
  const hora = fechaMexico.getHours();
  const minuto = fechaMexico.getMinutes();
  const segundo = fechaMexico.getSeconds();

  return [año, mes, dia, hora, minuto, segundo];
};


  const calcularTiempoEstimado = () => {
    if (items.length === 0) return 0;
    const tiempos = items.map(item => {
      const tiempo = item.tiempoPreparacion;
      return typeof tiempo === 'number' && tiempo > 0 ? tiempo : 15;
    });
    return Math.max(...tiempos);
  };

  const generarReferenciaPago = (metodoPago) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    switch (metodoPago) {
      case 'EFECTIVO':
        return `EFE-${timestamp.toString().slice(-6)}-${random}`;
      case 'TARJETA':
        return `TDC-${timestamp.toString().slice(-6)}-${random}`;
      default:
        return `PAY-${timestamp.toString().slice(-6)}-${random}`;
    }
  };

  const validarTelefono = (telefono) => {
    const telefonoLimpio = telefono.replace(/\D/g, '');
    if (telefonoLimpio.length !== 10) return false;
    const primerDigito = telefonoLimpio[0];
    return ['2', '3', '4', '5', '6', '7', '8', '9'].includes(primerDigito);
  };

  const formatearTelefono = (telefono) => {
    const telefonoLimpio = telefono.replace(/\D/g, '');
    if (telefonoLimpio.length === 10) {
      return `${telefonoLimpio.slice(0, 3)}-${telefonoLimpio.slice(3, 6)}-${telefonoLimpio.slice(6)}`;
    }
    return telefono;
  };

  const buscarInfoCodigoPostal = async (codigoPostal) => {
    if (!validarCodigoPostalMexicano(codigoPostal)) {
      setError('Ingresa un código postal válido de Chilpancingo de los Bravo, Guerrero (39000-39099)');
      return;
    }

    setBuscandoCP(true);
    setError('');

    try {
      const resultado = await obtenerInfoPorCodigoPostal(codigoPostal);
      setCodigoPostalInfo(resultado.data);
      setColonias(obtenerColoniasUnicas(resultado.data.colonias));
      
      setDireccionForm(prev => ({
        ...prev,
        codigoPostal: codigoPostal,
        ciudad: resultado.data.ciudad,
        estadoDireccion: resultado.data.estado,
        colonia: ''
      }));

      setSuccess('Código postal válido');
    } catch (error) {
      if (error.message.includes('no pertenece a Chilpancingo')) {
        setError(error.message + ' Nuestro servicio de entrega está disponible únicamente en Chilpancingo de los Bravo.');
        setCodigoPostalInfo(null);
        setColonias([]);
      } else {
        setError(`No se pudo verificar el código postal ${codigoPostal}. Por favor verifica que sea correcto.`);
        
        if (codigoPostal >= '39000' && codigoPostal <= '39099') {
          setDireccionForm(prev => ({
            ...prev,
            codigoPostal: codigoPostal,
            ciudad: 'Chilpancingo de los Bravo',
            estadoDireccion: 'Guerrero'
          }));
          
          setColonias([
            { id: '1', nombre: 'Centro', tipo: 'Colonia', zona: 'Urbana' },
            { id: '2', nombre: 'Otra colonia', tipo: 'Colonia', zona: 'Urbana' }
          ]);
          
          setCodigoPostalInfo({
            codigoPostal: codigoPostal,
            ciudad: 'Chilpancingo de los Bravo',
            estado: 'Guerrero',
            colonias: [
              { id: '1', nombre: 'Centro', tipo: 'Colonia', zona: 'Urbana' },
              { id: '2', nombre: 'Otra colonia', tipo: 'Colonia', zona: 'Urbana' }
            ]
          });
        }
      }
    } finally {
      setBuscandoCP(false);
    }
  };

  const handleCodigoPostalChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '').slice(0, 5);
    setDireccionForm(prev => ({...prev, codigoPostal: valor}));
    
    if (valor.length === 5) {
      buscarInfoCodigoPostal(valor);
    } else {
      setCodigoPostalInfo(null);
      setColonias([]);
      setSuccess('');
    }
  };

  const handleTelefonoChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '').slice(0, 10);
    setDireccionForm(prev => ({...prev, numeroTelefono: valor}));
  };

  const confirmarTipoEntrega = () => {
    if (!tipoEntrega) {
      setError('Por favor selecciona un tipo de entrega');
      return;
    }
    
    // Establecer método de pago por defecto según tipo de entrega
    // Por el momento, solo efectivo está disponible (tarjeta deshabilitada temporalmente)
    setDatosPago(prev => ({...prev, metodoPago: 'EFECTIVO'}));
    
    setStep(2);
    setError('');
  };

  const confirmarDireccionDomicilio = () => {
    if (!direccionForm.numeroTelefono) {
      setError('El número de teléfono es requerido');
      return;
    }

    if (!validarTelefono(direccionForm.numeroTelefono)) {
      setError('Ingresa un número de teléfono válido de 10 dígitos');
      return;
    }

    if (tipoEntrega === 'DOMICILIO') {
      if (!direccionForm.calle || !direccionForm.numeroExterior || 
          !direccionForm.colonia || !direccionForm.codigoPostal) {
        setError('Por favor completa todos los campos requeridos');
        return;
      }
    }
    
    if (tipoEntrega === 'PARA_LLEVAR') {
      actualizarDireccion({
        ...datosRestaurante,
        numeroTelefono: direccionForm.numeroTelefono
      });
    } else {
      actualizarDireccion(direccionForm);
    }
    
    setError('');
    setStep(3);
  };

  const confirmarOrden = async () => {
    try {
      setLoading(true);
      setError('');
  
      // ✅ Obtener ID del cliente desde localStorage
      const clienteId = getClienteId();
      
      if (!clienteId) {
        throw new Error('No se pudo obtener el ID del cliente. Por favor, inicia sesión nuevamente.');
      }

      const localDateTime = crearLocalDateTimeParaJava();
  
      // ✅ El pedido siempre inicia como REGISTRADO; se actualizará a PAGADO tras un pago exitoso con tarjeta
      const estadoInicial = 'REGISTRADO';
  
      const pedidoTemporal = {
        idCliente: clienteId, // ✅ DINÁMICO desde localStorage
        fechaCreacion: localDateTime,
        estadoPedido: estadoInicial,
        tipoEntrega: tipoEntrega === 'PARA_LLEVAR' ? 'PARA_LLEVAR' : 'DOMICILIO',
        enLinea: true,
        calle: direccion.calle || '',
        numeroExterior: direccion.numeroExterior || '',
        numeroInterior: direccion.numeroInterior || '',
        colonia: direccion.colonia || '',
        ciudad: direccion.ciudad || 'Chilpancingo',
        estadoDireccion: direccion.estadoDireccion || 'Guerrero',
        codigoPostal: direccion.codigoPostal || '',
        referenciasEntrega: direccion.referenciasEntrega || '',
        numeroTelefono: direccion.numeroTelefono || ''
      };
  
      if (!pedidoTemporal.numeroTelefono || pedidoTemporal.numeroTelefono.length !== 10) {
        throw new Error('El número de teléfono debe tener exactamente 10 dígitos');
      }
  
      if (!pedidoTemporal.calle || pedidoTemporal.calle.trim() === '') {
        throw new Error('La calle es obligatoria');
      }
  
      if (!pedidoTemporal.colonia || pedidoTemporal.colonia.trim() === '') {
        throw new Error('La colonia es obligatoria');
      }
  
      const responsePedido = await registrarPedido(pedidoTemporal);
      const pedidoRegistrado = responsePedido.data;
  
      const referenciasEntrega = tipoEntrega === 'PARA_LLEVAR' 
        ? `Cliente en el restaurante con el identificador: ${pedidoRegistrado.id}`
        : `Entrega a domicilio - ${direccion.calle} ${direccion.numeroExterior}, ${direccion.colonia}`;
  
      const pedidoConReferencia = {
        ...pedidoRegistrado,
        referenciasEntrega
      };
  
      const detallesPedido = items.map(item => ({
        idPedido: { id: pedidoRegistrado.id },
        idProducto: item.id,
        cantidad: item.cantidad
      }));
  
      await registrarDetallesPedido(detallesPedido);
  
      setPedidoCreado(pedidoConReferencia);
      setDatosPedidoTemporal(pedidoRegistrado);
  
      setDatosPago(prev => ({
        ...prev,
        monto: calcularTotalConComision(),
        referenciaPago: generarReferenciaPago(prev.metodoPago)
      }));
  
      setSuccess(`Pedido #${pedidoRegistrado.id} registrado correctamente`);
      setStep(4);
  
    } catch (error) {
      let mensajeError = 'Error desconocido';
      if (error.response?.data?.mensaje) mensajeError = error.response.data.mensaje;
      else if (error.response?.data?.error) mensajeError = error.response.data.error;
      else if (error.message) mensajeError = error.message;
  
      setError('Error al registrar el pedido: ' + mensajeError);
    } finally {
      setLoading(false);
    }
  };
  

  const actualizarEstadoPedido = async (idPedido, nuevoEstado) => {
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:2002'}/api/pedidos/${idPedido}/estado`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!response.ok) {
        // Intentar leer el mensaje de error del backend
        let errorMessage = `Error actualizando estado del pedido (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      throw error;
    }
  };

  const handleMetodoPagoChange = (nuevoMetodo) => {
    const nuevaReferencia = generarReferenciaPago(nuevoMetodo);
    setDatosPago(prev => ({
      ...prev,
      metodoPago: nuevoMetodo,
      referenciaPago: nuevaReferencia,
      monto: nuevoMetodo === 'TARJETA' ? calcularTotalConComision() : total
    }));
  };

  const finalizarOrden = () => {
    limpiarCarrito();
    onClose();
  };

  const renderCarrito = () => (
    <div className="cli-carrito-content">
      <h3><FiShoppingCart /> Carrito de Compras</h3>
      
      {items.length === 0 ? (
        <div className="cli-carrito-empty">
          <p>El carrito está vacío</p>
          <p>Agrega productos para continuar</p>
        </div>
      ) : (
        <>
          <div className="cli-carrito-items">
            {items.map((item) => (
              <div key={item.id} className="cli-carrito-item">
                <div className="cli-carrito-item-image">
                  {item.imagen ? (
                    <img src={getImageUrl(item.imagen)} alt={item.nombre} />
                  ) : (
                    <div className="cli-carrito-item-placeholder">IMG</div>
                  )}
                </div>
                
                <div className="cli-carrito-item-info">
                  <h4>{item.nombre}</h4>
                  <p className="cli-carrito-item-descripcion">{item.descripcion}</p>
                  <span className="cli-carrito-item-precio">${item.precio}</span>
                </div>
                
                <div className="cli-carrito-item-controls">
                  <div className="cli-carrito-cantidad-controls">
                    <button 
                      className="cli-carrito-btn-cantidad"
                      onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                      disabled={item.cantidad <= 1}
                    >
                      -
                    </button>
                    <span className="cli-carrito-cantidad">{item.cantidad}</span>
                    <button 
                      className="cli-carrito-btn-cantidad"
                      onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    className="cli-carrito-btn-remover"
                    onClick={() => removerItem(item.id)}
                    title="Eliminar producto"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                
                <div className="cli-carrito-item-subtotal">
                  ${(item.precio * item.cantidad).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="cli-carrito-summary">
            <div className="cli-carrito-total">
              <span>Total: ${total.toFixed(2)}</span>
              <span>({cantidad} productos)</span>
            </div>
            
            <div className="cli-tipo-entrega-section">
              <h4><FiTruck /> Selecciona el tipo de entrega</h4>
              
              <div className="cli-tipo-entrega-opciones">
                <button 
                  className={`cli-tipo-entrega-btn ${tipoEntrega === 'PARA_LLEVAR' ? 'active' : ''}`}
                  onClick={() => actualizarTipoEntrega('PARA_LLEVAR')}
                >
                  <div className="cli-tipo-entrega-icono">
                    <MdRestaurant />
                  </div>
                  <div className="cli-tipo-entrega-info">
                    <h5>Para llevar</h5>
                    <p>Recoge tu pedido en el restaurante</p>
                    <p><small>Pago: Efectivo o Tarjeta</small></p>
                  </div>
                </button>
                
                <button 
                  className={`cli-tipo-entrega-btn disabled`}
                  onClick={() => actualizarTipoEntrega('DOMICILIO')}
                  disabled={true}
                  title="Deshabilitado temporalmente"
                >
                  <div className="cli-tipo-entrega-icono">
                    <FiTruck />
                  </div>
                  <div className="cli-tipo-entrega-info">
                    <h5>A domicilio</h5>
                    <p>Entregamos en tu ubicación</p>
                    <p><small style={{color: '#9ca3af', fontStyle: 'italic'}}>Deshabilitado temporalmente</small></p>
                  </div>
                </button>
              </div>
              
              {error && (
                <div className="cli-carrito-alert cli-carrito-alert-error">
                  <FiX /> {error}
                </div>
              )}
            </div>
            
            <div className="cli-carrito-actions">
              <button 
                className="cli-carrito-btn cli-carrito-btn-secondary"
                onClick={limpiarCarrito}
              >
                <FiTrash2 /> Limpiar Carrito
              </button>
              <button 
                className="cli-carrito-btn cli-carrito-btn-primary"
                onClick={confirmarTipoEntrega}
                disabled={loading || !tipoEntrega}
              >
                {tipoEntrega ? (
                  <>Continuar <FiArrowRight /></>
                ) : (
                  'Selecciona tipo de entrega'
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderDireccionDomicilio = () => (
    <div className="cli-carrito-content">
      <h3>
        {tipoEntrega === 'PARA_LLEVAR' ? (
          <><FiPhone /> Datos de Contacto</>
        ) : (
          <><MdHome /> Dirección de Entrega</>
        )}
      </h3>
      
      <div className="cli-direccion-form">
        <div className="cli-direccion-info">
          <p>
            <strong>
              {tipoEntrega === 'PARA_LLEVAR' 
                ? 'Ingresa tu número de teléfono de contacto' 
                : 'Ingresa los datos de entrega a domicilio'
              }
            </strong>
          </p>
          <p>Total del pedido: <strong>${total.toFixed(2)}</strong></p>
        </div>
        
        <div className="cli-form-grid">
          <div className="cli-form-group cli-form-group-full">
            <label htmlFor="numeroTelefono">
              <FiPhone /> Número de Teléfono
              <span className="cli-form-help">10 dígitos sin espacios</span>
            </label>
            <input
              type="tel"
              id="numeroTelefono"
              value={direccionForm.numeroTelefono}
              onChange={handleTelefonoChange}
              placeholder="Ej: 7441234567"
              className="cli-form-input"
              maxLength="10"
              required
            />
            {direccionForm.numeroTelefono && direccionForm.numeroTelefono.length === 10 && (
              <div className="cli-telefono-preview">
                {formatearTelefono(direccionForm.numeroTelefono)}
              </div>
            )}
          </div>

          {tipoEntrega === 'DOMICILIO' && (
            <>
              <div className="cli-form-group cli-form-group-full">
                <label htmlFor="codigoPostal">
                  Código Postal
                  <span className="cli-form-help">Código postal de Chilpancingo (39000-39099)</span>
                </label>
                <div className="cli-cp-input-container">
                  <input
                    type="text"
                    id="codigoPostal"
                    value={direccionForm.codigoPostal}
                    onChange={handleCodigoPostalChange}
                    placeholder="Ej: 39000"
                    className={`cli-form-input ${buscandoCP ? 'cli-form-input-loading' : ''}`}
                    maxLength="5"
                    required
                  />
                  {buscandoCP && (
                    <div className="cli-cp-loading">
                      <div className="cli-spinner-small"></div>
                      <span>Verificando...</span>
                    </div>
                  )}
                </div>
              </div>

              {colonias.length > 0 && (
                <div className="cli-form-group cli-form-group-full">
                  <label htmlFor="colonia">Selecciona tu Colonia</label>
                  <select
                    id="colonia"
                    value={direccionForm.colonia}
                    onChange={(e) => setDireccionForm(prev => ({...prev, colonia: e.target.value}))}
                    className="cli-form-select"
                    required
                  >
                    <option value="">-- Selecciona una colonia --</option>
                    {colonias.map((colonia) => (
                      <option key={colonia.id} value={colonia.nombre}>
                        {colonia.nombre} {colonia.tipo !== 'Colonia' && `(${colonia.tipo})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {direccionForm.colonia && (
                <>
                  <div className="cli-form-group">
                    <label htmlFor="calle">Calle</label>
                    <input
                      type="text"
                      id="calle"
                      value={direccionForm.calle}
                      onChange={(e) => setDireccionForm(prev => ({...prev, calle: e.target.value}))}
                      placeholder="Ej: Av. Insurgentes"
                      className="cli-form-input"
                      required
                    />
                  </div>
                  
                  <div className="cli-form-group">
                    <label htmlFor="numeroExterior">Número Exterior</label>
                    <input
                      type="text"
                      id="numeroExterior"
                      value={direccionForm.numeroExterior}
                      onChange={(e) => setDireccionForm(prev => ({...prev, numeroExterior: e.target.value}))}
                      placeholder="Ej: 123"
                      className="cli-form-input"
                      required
                    />
                  </div>
                  
                  <div className="cli-form-group">
                    <label htmlFor="numeroInterior">Número Interior</label>
                    <input
                      type="text"
                      id="numeroInterior"
                      value={direccionForm.numeroInterior}
                      onChange={(e) => setDireccionForm(prev => ({...prev, numeroInterior: e.target.value}))}
                      placeholder="Ej: Depto 4, Local B (opcional)"
                      className="cli-form-input"
                    />
                  </div>
                  
                  <div className="cli-form-group">
                    <label htmlFor="ciudad">Ciudad</label>
                    <input
                      type="text"
                      id="ciudad"
                      value={direccionForm.ciudad}
                      className="cli-form-input"
                      readOnly
                    />
                  </div>
                  
                  <div className="cli-form-group">
                    <label htmlFor="estadoDireccion">Estado</label>
                    <input
                      type="text"
                      id="estadoDireccion"
                      value={direccionForm.estadoDireccion}
                      className="cli-form-input"
                      readOnly
                    />
                  </div>
                  
                  <div className="cli-form-group cli-form-group-full">
                    <label htmlFor="referenciasEntrega">Referencias de Entrega</label>
                    <textarea
                      id="referenciasEntrega"
                      value={direccionForm.referenciasEntrega}
                      onChange={(e) => setDireccionForm(prev => ({...prev, referenciasEntrega: e.target.value}))}
                      placeholder="Ej: Casa color azul, portón negro, entre calle X y Y"
                      className="cli-form-textarea"
                      rows="3"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
        
        {error && (
          <div className="cli-carrito-alert cli-carrito-alert-error">
            <FiX /> {error}
          </div>
        )}

        {success && (
          <div className="cli-carrito-alert cli-carrito-alert-success">
            <FiCheck /> {success}
          </div>
        )}
      </div>
      
      <div className="cli-carrito-actions">
        <button 
          className="cli-carrito-btn cli-carrito-btn-secondary"
          onClick={() => setStep(1)}
        >
          <FiArrowLeft /> Regresar
        </button>
        <button 
          className="cli-carrito-btn cli-carrito-btn-primary"
          onClick={confirmarDireccionDomicilio}
          disabled={
            loading || 
            !direccionForm.numeroTelefono || 
            (tipoEntrega === 'DOMICILIO' && (!direccionForm.calle || !direccionForm.numeroExterior || !direccionForm.colonia))
          }
        >
          Continuar <FiArrowRight />
        </button>
      </div>
    </div>
  );

  const renderDireccionConfirmacion = () => (
    <div className="cli-carrito-content">
      <h3><MdLocationOn /> Confirmar {tipoEntrega === 'PARA_LLEVAR' ? 'Datos' : 'Dirección de Entrega'}</h3>
      
      <div className="cli-direccion-confirmacion">
        <div className="cli-tipo-entrega-seleccionado">
          <div className="cli-tipo-entrega-badge">
            {tipoEntrega === 'PARA_LLEVAR' ? (
              <>
                <MdRestaurant /> Para llevar
              </>
            ) : (
              <>
                <FiTruck /> A domicilio
              </>
            )}
          </div>
        </div>
        
        <div className="cli-direccion-card">
          <h4>
            {tipoEntrega === 'PARA_LLEVAR' ? (
              <><MdRestaurant /> Ubicación del Restaurante</>
            ) : (
              <><MdHome /> Dirección de Entrega</>
            )}
          </h4>
          
          <div className="cli-direccion-detalles">
            <p><strong>Teléfono de contacto:</strong> {formatearTelefono(direccion.numeroTelefono)}</p>
            <p><strong>Calle:</strong> {direccion.calle}</p>
            <p><strong>Número:</strong> {direccion.numeroExterior} {direccion.numeroInterior && `, Int. ${direccion.numeroInterior}`}</p>
            <p><strong>Colonia:</strong> {direccion.colonia}</p>
            <p><strong>Ciudad:</strong> {direccion.ciudad}, {direccion.estadoDireccion}</p>
            <p><strong>Código Postal:</strong> {direccion.codigoPostal}</p>
            {direccion.referenciasEntrega && (
              <p><strong>Referencias:</strong> {direccion.referenciasEntrega}</p>
            )}
          </div>
        </div>
        
        <div className="cli-pedido-resumen">
          <h4>Resumen del Pedido</h4>
          <div className="cli-pedido-items">
            {items.map((item) => (
              <div key={item.id} className="cli-pedido-resumen-item">
                <span>{item.cantidad}x {item.nombre}</span>
                <span>${(item.precio * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="cli-pedido-subtotal">
            <span>Subtotal: ${total.toFixed(2)}</span>
          </div>
          <div className="cli-pedido-total">
            <strong>Total: ${total.toFixed(2)}</strong>
          </div>
        </div>
        
        <div className="cli-carrito-tiempo-estimado">
          <FiClock /> Tiempo estimado: {calcularTiempoEstimado()} minutos
        </div>
      </div>
      
      {error && (
        <div className="cli-carrito-alert cli-carrito-alert-error">
          <FiX /> {error}
        </div>
      )}
      
      {success && (
        <div className="cli-carrito-alert cli-carrito-alert-success">
          <FiCheck /> {success}
        </div>
      )}
      
      <div className="cli-carrito-actions">
        <button 
          className="cli-carrito-btn cli-carrito-btn-secondary"
          onClick={() => setStep(2)}
        >
          <FiArrowLeft /> Modificar {tipoEntrega === 'PARA_LLEVAR' ? 'Datos' : 'Dirección'}
        </button>
        <button 
          className="cli-carrito-btn cli-carrito-btn-primary"
          onClick={confirmarOrden}
          disabled={loading}
        >
          {loading ? 'Registrando pedido...' : 'Confirmar Orden'} <FiArrowRight />
        </button>
      </div>
    </div>
  );

  const renderPago = () => (
    <div className="cli-carrito-content">
      <h3><FiDollarSign /> Procesar Pago</h3>
      
      <div className="cli-pago-container">
        <div className="cli-pago-resumen-minimalista">
          <div className="cli-pago-order-info-left">
            <h4>Pedido #{pedidoCreado?.id}</h4>
            <div className="cli-pago-desglose">
              <div className="cli-pago-item">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)} MXN</span>
              </div>
              {datosPago.metodoPago === 'TARJETA' && (
                <div className="cli-pago-item cli-pago-comision">
                  <span>Comisión de procesamiento:</span>
                  <span>${calcularComisionStripe(total).toFixed(2)} MXN</span>
                </div>
              )}
              <div className="cli-pago-item cli-pago-total">
                <span>Total a pagar:</span>
                <span>${(datosPago.metodoPago === 'TARJETA' ? calcularTotalConComision() : total).toFixed(2)} MXN</span>
              </div>
            </div>
            <div className="cli-pago-info">
              <p>{cantidad} productos | {formatearTelefono(direccion.numeroTelefono)}</p>
            </div>
          </div>
        </div>
  
        <div className="cli-pago-form">
          <div className="cli-pago-form-group">
            <h4>Método de pago para {tipoEntrega === 'PARA_LLEVAR' ? 'recogida' : 'domicilio'}</h4>
            <div className="cli-pago-metodos-left">
              {/* Cash payment option - only available for PARA_LLEVAR */}
              {tipoEntrega === 'PARA_LLEVAR' && (
                <button 
                  className={`cli-pago-metodo-btn-left ${datosPago.metodoPago === 'EFECTIVO' ? 'active' : ''}`}
                  onClick={() => handleMetodoPagoChange('EFECTIVO')}
                >
                  <div className="cli-pago-metodo-icon">
                    <FiDollarSign />
                  </div>
                  <div className="cli-pago-metodo-content">
                    <strong>Pago en Efectivo</strong>
                    <small>Paga al recoger tu pedido en el restaurante</small>
                  </div>
                </button>
              )}
              
              <button 
                className={`cli-pago-metodo-btn-left ${datosPago.metodoPago === 'TARJETA' ? 'active' : ''}`}
                onClick={() => handleMetodoPagoChange('TARJETA')}
                disabled={true}
                title="Pago con tarjeta temporalmente deshabilitado"
              >
                <div className="cli-pago-metodo-icon">
                  <FiCreditCard />
                </div>
                <div className="cli-pago-metodo-content">
                  <strong>Pago con Tarjeta</strong>
                  <small>Pago inmediato y seguro en línea</small>
                  <small className="cli-comision-texto" style={{color: '#9ca3af', fontStyle: 'italic'}}>
                    Temporalmente no disponible
                  </small>
                </div>
              </button>
            </div>
          </div>
  
          {datosPago.metodoPago === 'TARJETA' && (
            <div className="cli-info-section">
              <div className="cli-info-card-left">
                <FiInfo />
                <div>
                  <strong>Comisión de procesamiento</strong>
                  <p>Se aplica una comisión de 3.3% + $10 MXN por pagos con tarjeta para cubrir los costos del procesador de pagos.</p>
                </div>
              </div>
            </div>
          )}
  
          <div className="cli-pago-section">
            {datosPago.metodoPago === 'TARJETA' ? (
          <StripePayment
                amount={calcularTotalConComision()}
                orderId={pedidoCreado?.id}
            requirePostalCode={tipoEntrega === 'DOMICILIO'}
                onSuccess={async (paymentIntent) => {
                  try {
                    setLoading(true);

                    // ✅ Actualizar el estado del pedido a PAGADO tras un pago exitoso con tarjeta
                    await actualizarEstadoPedido(pedidoCreado.id, 'PAGADO');

                    // 2. Registrar el pago en la base de datos
                    const pagoDto = {
                      idPedido: pedidoCreado.id,
                      metodoPago: 'TARJETA',
                      estadoPago: 'APROBADO',
                      referenciaPago: paymentIntent.id,
                      monto: calcularTotalConComision()
                    };
                    
                    const responsePago = await registrarPago(pagoDto);
                    
                    const pagoExitoso = {
                      id: responsePago.data.id,
                      monto: calcularTotalConComision(),
                      metodoPago: 'TARJETA',
                      estado: 'APROBADO',
                      stripePaymentIntentId: paymentIntent.id
                    };
                    
                    setPagoCreado(pagoExitoso);
                    setSuccess(`Pago procesado exitosamente - Pedido #${pedidoCreado.id} PAGADO`);
                    setStep(5);
                    
                  } catch (error) {
                    setError('Pago exitoso pero error al registrar: ' + (error.message || 'Error desconocido'));
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={(error) => {
                  setError(`Error en el pago con tarjeta: ${error}`);
                }}
              />
            ) : (
              <div className="cli-pago-efectivo-section">
                <div className="cli-pago-efectivo-info">
                  <h4><FiDollarSign /> Confirmar Pago en Efectivo</h4>
                  <div className="cli-efectivo-detalles">
                    <p>Tu pedido quedará registrado como <strong>PENDIENTE DE PAGO</strong></p>
                    <p>
                      Pagarás <strong>${total.toFixed(2)} MXN</strong>{' '}
                      al recoger tu pedido en el restaurante
                    </p>
                    <p><MdRestaurant /> Ubicación: Zaragoza #6, Centro, Chilpancingo</p>
                  </div>
                </div>
                
                <button 
                  className="cli-carrito-btn cli-carrito-btn-primary"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError('');
                      
                      // Registrar el pago en efectivo con estado PENDIENTE
                      const pagoDto = {
                        idPedido: pedidoCreado.id,
                        metodoPago: 'EFECTIVO',
                        estadoPago: 'PENDIENTE',
                        referenciaPago: generarReferenciaPago('EFECTIVO'),
                        monto: total
                      };
                      
                      const responsePago = await registrarPago(pagoDto);
                      
                      const pagoEfectivo = { 
                        id: responsePago.data.id,
                        monto: total,
                        metodoPago: 'EFECTIVO',
                        estado: 'PENDIENTE',
                        referenciaPago: responsePago.data.referenciaPago
                      };
                      
                      setPagoCreado(pagoEfectivo);
                      setSuccess(`Pedido #${pedidoCreado.id} confirmado - Pago en efectivo registrado (PENDIENTE)`);
                      setStep(5);
                      
                    } catch (error) {
                      console.error('Error registrando pago en efectivo:', error);
                      setError('Error al registrar el pago: ' + (error.message || 'Error desconocido'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : <><FiCheck /> Confirmar Pedido en Efectivo</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="cli-carrito-alert cli-carrito-alert-error">
          <FiX /> {error}
        </div>
      )}
      
      <div className="cli-carrito-actions">
        <button 
          className="cli-carrito-btn cli-carrito-btn-secondary"
          onClick={() => setStep(3)}
          disabled={loading}
        >
          <FiArrowLeft /> Regresar
        </button>
      </div>
    </div>
  );

  const renderConfirmacionFinal = () => (
    <div className="cli-carrito-content">
      <h3><FiCheck /> Pedido Completado</h3>
      
      <div className="cli-carrito-confirmacion">
        <div className="cli-pago-exitoso">
          <div className="cli-pago-exitoso-icon"><FiCheck /></div>
          <h4>Pedido #{pedidoCreado?.id} Completado</h4>
          <p><strong>Monto:</strong> ${pagoCreado?.monto?.toFixed(2) || total.toFixed(2)} MXN</p>
          <p><strong>Método de Pago:</strong> {pagoCreado?.metodoPago === 'TARJETA' ? 'Tarjeta (En línea)' : 'Efectivo'}</p>
          <p><strong>Estado del Pago:</strong> {pagoCreado?.estado === 'APROBADO' ? '✓ Pagado' : '⏳ Pendiente de pago en restaurante'}</p>
          <p><strong>Tipo de Entrega:</strong> {tipoEntrega === 'PARA_LLEVAR' ? 'Para llevar' : 'A domicilio'}</p>
        </div>

        <div className="cli-seguimiento-info">
          <div className="cli-info-card">
            <FiInfo />
            <div>
              <p><strong>¿Cómo hacer seguimiento?</strong></p>
              <p>Presentate en el restaurante para obtener tu pedido y presenta esta captura como comprobante!.</p>
              <p>Podrás ver el estado de tu pedido en tiempo real en la sección "Mis Pedidos" de la aplicación.</p>
              <p>Tu número de pedido es: <strong>#{pedidoCreado?.id}</strong></p>
              <br />
              {pagoCreado?.metodoPago === 'EFECTIVO' && (
                <p className="cli-nota-efectivo"><strong>Nota:</strong> Recuerda pagar en efectivo al recoger tu pedido en el restaurante.</p>
              )}
            </div>
          </div>
        </div>

        <div className="cli-carrito-tiempo-estimado">
          <FiClock /> Tiempo estimado de preparación: {calcularTiempoEstimado()} minutos
        </div>
      </div>
      
      {success && (
        <div className="cli-carrito-alert cli-carrito-alert-success">
          <FiCheck /> {success}
        </div>
      )}
      
      <div className="cli-carrito-actions">
        <button 
          className="cli-carrito-btn cli-carrito-btn-primary"
          onClick={finalizarOrden}
        >
          <FiCheck /> Finalizar y Nueva Orden
        </button>
      </div>
    </div>
  );

  return (
    <div className="cli-carrito-overlay">
      <div className="cli-carrito-modal">
        <div className="cli-carrito-header">
          <h2>
            {step === 1 && 'Carrito'}
            {step === 2 && (tipoEntrega === 'PARA_LLEVAR' ? 'Datos de Contacto' : 'Dirección de Entrega')}
            {step === 3 && 'Confirmar Pedido'}
            {step === 4 && 'Procesar Pago'}
            {step === 5 && 'Pedido Completado'}
          </h2>
          <button className="cli-carrito-close" onClick={onClose} title="Cerrar carrito">
            <FiX />
          </button>
        </div>
        
        <div className="cli-carrito-steps">
          <div className={`cli-carrito-step ${step >= 1 ? 'active' : ''}`}>
            <FiShoppingCart /> Carrito
          </div>
          <div className={`cli-carrito-step ${step >= 2 ? 'active' : ''}`}>
            {tipoEntrega === 'PARA_LLEVAR' ? (
              <><FiPhone /> Contacto</>
            ) : (
              <><MdHome /> Dirección</>
            )}
          </div>
          <div className={`cli-carrito-step ${step >= 3 ? 'active' : ''}`}>
            <FiCheck /> Confirmar
          </div>
          <div className={`cli-carrito-step ${step >= 4 ? 'active' : ''}`}>
            <FiDollarSign /> Pagar
          </div>
        </div>
        
        {step === 1 && renderCarrito()}
        {step === 2 && renderDireccionDomicilio()}
        {step === 3 && renderDireccionConfirmacion()}
        {step === 4 && !pagoCreado && renderPago()}
        {(step === 4 && pagoCreado) || step === 5 ? renderConfirmacionFinal() : null}
      </div>
    </div>
  );
};

export default CarritoModalCliente;