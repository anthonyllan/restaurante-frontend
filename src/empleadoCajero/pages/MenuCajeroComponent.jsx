import React, { useState, useEffect } from 'react';
import { 
  listCategorias
} from '../../services/GestionarMenu/CategoriaService';
import { 
  listProductos
} from '../../services/GestionarMenu/ProductoService';
import { 
  getProductoDiasByProducto
} from '../../services/GestionarMenu/ProductoDiaService';
import { useCarrito } from '../../context/CarritoContext.jsx';
import { getImageUrl } from '../../config/api';
import CarritoModal from './CarritoModal';
import { FiRefreshCw, FiShoppingCart, FiCalendar, FiPlus, FiClock, FiX } from 'react-icons/fi';
import { MdRestaurant, MdToday } from 'react-icons/md';
import { BsCheckCircle } from 'react-icons/bs';
import './MenuCajeroComponent.css';

const MenuCajeroComponent = () => {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productosDisponiblesHoy, setProductosDisponiblesHoy] = useState([]);
  const [diaActual, setDiaActual] = useState('');
  const [fechaActual, setFechaActual] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCarrito, setShowCarrito] = useState(false);

  const { agregarItem, items, cantidad, total } = useCarrito();

  const obtenerDiaActual = () => {
    const diasSemana = [
      'Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'
    ];
    const fecha = new Date();
    const diaIndex = fecha.getDay();
    return diasSemana[diaIndex];
  };

  const obtenerDiaParaMostrar = () => {
    const diasSemana = [
      'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
    ];
    const fecha = new Date();
    const diaIndex = fecha.getDay();
    return diasSemana[diaIndex];
  };

  const obtenerFechaActual = () => {
    const fecha = new Date();
    const opciones = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return fecha.toLocaleDateString('es-ES', opciones);
  };


  const verificarDisponibilidadHoy = async (producto) => {
    try {
      if (!producto.disponible) {
        return false;
      }

      const response = await getProductoDiasByProducto(producto.id);
      const diasDisponibles = response.data.map(pd => {
        return pd.dia.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      });
      
      const disponible = diasDisponibles.includes(diaActual);
      return disponible;
    } catch (error) {
      return false;
    }
  };

  const filtrarProductosDisponiblesHoy = async (todosLosProductos) => {
    try {
      const verificaciones = await Promise.all(
        todosLosProductos.map(async (producto) => {
          const disponible = await verificarDisponibilidadHoy(producto);
          return { producto, disponible };
        })
      );

      const productosHoy = verificaciones
        .filter(({ disponible }) => disponible)
        .map(({ producto }) => producto);

      setProductosDisponiblesHoy(productosHoy);
    } catch (error) {
      setProductosDisponiblesHoy([]);
    }
  };

  useEffect(() => {
    const dia = obtenerDiaActual();
    const fecha = obtenerFechaActual();
    setDiaActual(dia);
    setFechaActual(fecha);
  }, []);

  useEffect(() => {
    if (diaActual) {
      cargarDatos();
    }
  }, [diaActual]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [categoriasResponse, productosResponse] = await Promise.all([
        listCategorias(),
        listProductos()
      ]);

      const categoriasData = categoriasResponse.data || [];
      const productosData = productosResponse.data || [];

      setCategorias(categoriasData);
      setProductos(productosData);

      if (productosData.length > 0 && diaActual) {
        await filtrarProductosDisponiblesHoy(productosData);
      }
    } catch (error) {
      setError('Error al cargar el menú: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const refrescarMenu = () => {
    const nuevoDia = obtenerDiaActual();
    const nuevaFecha = obtenerFechaActual();
    
    if (nuevoDia !== diaActual) {
      setDiaActual(nuevoDia);
      setFechaActual(nuevaFecha);
    } else {
      cargarDatos();
    }
  };

  const agruparProductosPorCategoria = () => {
    const grupos = {};

    categorias.forEach(categoria => {
      const productosDeCategoria = productosDisponiblesHoy.filter(producto => {
        const productoCategoriaId = producto.categoria?.id;
        return productoCategoriaId === categoria.id;
      });

      if (productosDeCategoria.length > 0) {
        grupos[categoria.id] = {
          categoria,
          productos: productosDeCategoria
        };
      }
    });

    return grupos;
  };

  const handleAgregarAlCarrito = (producto) => {
    agregarItem({
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen: producto.imagen,
      tiempoPreparacion: producto.tiempoPreparacion
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const nuevoDia = obtenerDiaActual();
      if (nuevoDia !== diaActual) {
        refrescarMenu();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [diaActual]);

  if (loading) {
    return (
      <div className="cajero-loadingContainer">
        <div className="cajero-spinner"></div>
        <p>Cargando menú del día...</p>
      </div>
    );
  }

  const gruposProductos = agruparProductosPorCategoria();
  const totalProductosHoy = productosDisponiblesHoy.length;
  const diaParaMostrar = obtenerDiaParaMostrar();

  return (
    <div className="cajero-menuContainer">
      <div className="cajero-headerSection">
        <div className="cajero-headerContent">
          <h1><MdRestaurant /> Menú de Hoy</h1>
          <p className="cajero-headerDescription">
            {fechaActual}
          </p>
          <div className="cajero-infoDay">
            <span className="cajero-dayBadge"><MdToday /> Día: {diaParaMostrar}</span>
            <span className="cajero-productCount">{totalProductosHoy} productos disponibles</span>
          </div>
        </div>
        
        <div className="cajero-headerActions">
          <button 
            className="cajero-refreshBtn"
            onClick={refrescarMenu}
            title="Actualizar menú"
          >
            <FiRefreshCw /> Actualizar
          </button>
          
          <button 
            className="cajero-carritoBtn"
            onClick={() => setShowCarrito(true)}
            title="Ver carrito"
          >
            <FiShoppingCart /> Carrito
            {cantidad > 0 && (
              <span className="cajero-carritoBadge">{cantidad}</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="cajero-alert cajero-alertError">
          <span>{error}</span>
          <button className="cajero-alertClose" onClick={() => setError('')}>
            <FiX />
          </button>
        </div>
      )}

      {totalProductosHoy === 0 ? (
        <div className="cajero-noProductosHoy">
          <div className="cajero-noProductosIcon"><FiCalendar /></div>
          <h3>No hay productos disponibles para hoy</h3>
          <p>El menú de {diaParaMostrar} no tiene productos configurados.</p>
          <p className="cajero-debugInfo">
            <small>Debug: Buscando productos para "{diaActual}" en la base de datos</small>
          </p>
          <button className="cajero-btn cajero-btnPrimary" onClick={refrescarMenu}>
            <FiRefreshCw /> Verificar nuevamente
          </button>
        </div>
      ) : (
        <div className="cajero-categoriasGrid">
          {Object.values(gruposProductos).map(({ categoria, productos: productosCategoria }) => (
            <div key={categoria.id} className="cajero-categoriaSection">
              <div className="cajero-categoriaHeader">
                <div className="cajero-categoriaInfo">
                  <h2>{categoria.nombre}</h2>
                  <p>{categoria.descripcion}</p>
                </div>
                <div className="cajero-categoriaStats">
                  <span className="productosCount">{productosCategoria.length} disponibles hoy</span>
                </div>
              </div>

              <div className="cajero-productosGrid">
                {productosCategoria.map((producto) => (
                  <div key={producto.id} className="cajero-productoCard">
                    <div className="cajero-productoImagen">
                      {producto.imagen ? (
                        <img 
                          src={getImageUrl(producto.imagen)} 
                          alt={producto.nombre}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="cajero-imagenPlaceholder" style={{display: producto.imagen ? 'none' : 'flex'}}>
                        <span>IMG</span>
                      </div>
                      
                      <div className="cajero-badgeDisponibleHoy">
                        <BsCheckCircle /> Disponible hoy
                      </div>
                    </div>

                    <div className="cajero-productoInfo">
                      <h3>{producto.nombre}</h3>
                      <p className="cajero-productoDescripcion">{producto.descripcion}</p>
                      
                      <div className="cajero-productoDetalles">
                        <div className="cajero-precioTiempo">
                          <span className="cajero-precio">
                            ${producto.precio}
                          </span>
                          <span className="cajero-tiempo">
                            <FiClock /> {producto.tiempoPreparacion || 'N/A'} min
                          </span>
                        </div>
                        
                        <div className="cajero-disponibilidad">
                          <span className="cajero-estado cajero-disponible">
                            <BsCheckCircle /> Disponible {diaParaMostrar}
                          </span>
                        </div>
                      </div>

                      <button 
                        className="cajero-btnAgregarCarrito"
                        onClick={() => handleAgregarAlCarrito(producto)}
                      >
                        <FiPlus /> Agregar al carrito
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCarrito && (
        <CarritoModal 
          onClose={() => setShowCarrito(false)} 
        />
      )}
    </div>
  );
};

export default MenuCajeroComponent;