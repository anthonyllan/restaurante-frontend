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
import { useCarrito } from '../../context/CarritoClienteContext.jsx';
import { getImageUrl } from '../../config/api';
import CarritoModalCliente from './CarritoModalCliente';
import { FiRefreshCw, FiShoppingCart, FiCalendar, FiPlus, FiClock, FiDollarSign, FiX } from 'react-icons/fi';
import { MdRestaurant, MdToday } from 'react-icons/md';
import { BsCheckCircle } from 'react-icons/bs';
import './MenuClienteComponent.css';

const MenuClienteComponent = () => {
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
      <div className="cli-loadingContainer">
        <div className="cli-spinner"></div>
        <p>Cargando menú del día...</p>
      </div>
    );
  }

  const gruposProductos = agruparProductosPorCategoria();
  const totalProductosHoy = productosDisponiblesHoy.length;
  const diaParaMostrar = obtenerDiaParaMostrar();

  return (
    <div className="cli-menuContainer">
      <div className="cli-headerSection">
        <div className="cli-headerContent">
          <h1><MdRestaurant /> Menú de Hoy</h1>
          <p className="cli-headerDescription">
            {fechaActual}
          </p>
          <div className="cli-infoDay">
            <span className="cli-dayBadge"><MdToday /> Día: {diaParaMostrar}</span>
            <span className="cli-productCount">{totalProductosHoy} productos disponibles</span>
          </div>
        </div>
        
        <div className="cli-headerActions">
          <button 
            className="cli-refreshBtn"
            onClick={refrescarMenu}
            title="Actualizar menú"
          >
            <FiRefreshCw /> Actualizar
          </button>
          
          <button 
            className="cli-carritoBtn"
            onClick={() => setShowCarrito(true)}
            title="Ver carrito"
          >
            <FiShoppingCart /> Carrito
            {cantidad > 0 && (
              <span className="cli-carritoBadge">{cantidad}</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="cli-alert cli-alertError">
          <span>{error}</span>
          <button className="cli-alertClose" onClick={() => setError('')}>
            <FiX />
          </button>
        </div>
      )}

      {totalProductosHoy === 0 ? (
        <div className="cli-noProductosHoy">
          <div className="cli-noProductosIcon"><FiCalendar /></div>
          <h3>No hay productos disponibles para hoy</h3>
          <p>El menú de {diaParaMostrar} no tiene productos configurados.</p>
          <p className="cli-debugInfo">
            <small>Debug: Buscando productos para "{diaActual}" en la base de datos</small>
          </p>
          <button className="cli-btn cli-btnPrimary" onClick={refrescarMenu}>
            <FiRefreshCw /> Verificar nuevamente
          </button>
        </div>
      ) : (
        <div className="cli-categoriasGrid">
          {Object.values(gruposProductos).map(({ categoria, productos: productosCategoria }) => (
            <div key={categoria.id} className="cli-categoriaSection">
              <div className="cli-categoriaHeader">
                <div className="cli-categoriaInfo">
                  <h2>{categoria.nombre}</h2>
                  <p>{categoria.descripcion}</p>
                </div>
                <div className="cli-categoriaStats">
                  <span className="cli-productosCount">{productosCategoria.length} disponibles hoy</span>
                </div>
              </div>

              <div className="cli-productosGrid">
                {productosCategoria.map((producto) => (
                  <div key={producto.id} className="cli-productoCard">
                    <div className="cli-productoImagen">
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
                      <div className="cli-imagenPlaceholder" style={{display: producto.imagen ? 'none' : 'flex'}}>
                        <span>IMG</span>
                      </div>
                      
                      <div className="cli-badgeDisponibleHoy">
                        <BsCheckCircle /> Disponible hoy
                      </div>
                    </div>

                    <div className="cli-productoInfo">
                      <h3>{producto.nombre}</h3>
                      <p className="cli-productoDescripcion">{producto.descripcion}</p>
                      
                      <div className="cli-productoDetalles">
                        <div className="cli-precioTiempo">
                          <span className="cli-precio">
                            ${producto.precio}
                          </span>
                          <span className="cli-tiempo">
                            <FiClock /> {producto.tiempoPreparacion || 'N/A'} min
                          </span>
                        </div>
                        
                        <div className="cli-disponibilidad">
                          <span className="cli-estado cli-disponible">
                            <BsCheckCircle /> Disponible {diaParaMostrar}
                          </span>
                        </div>
                      </div>

                      <button 
                        className="cli-btnAgregarCarrito"
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
        <CarritoModalCliente 
          onClose={() => setShowCarrito(false)} 
        />
      )}
    </div>
  );
};

export default MenuClienteComponent;