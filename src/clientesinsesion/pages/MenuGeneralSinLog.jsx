/*Menu general sin logearse - SOLO VISUALIZACIÓN*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  listCategorias
} from '../../services/GestionarMenu/CategoriaService';
import { 
  listProductos
} from '../../services/GestionarMenu/ProductoService';
import { 
  getProductoDiasByProducto
} from '../../services/GestionarMenu/ProductoDiaService';

import { FiRefreshCw, FiShoppingCart, FiCalendar, FiClock, FiX, FiLock } from 'react-icons/fi';
import { MdRestaurant, MdToday } from 'react-icons/md';
import { BsCheckCircle } from 'react-icons/bs';
import '../pages/MenuGeneralSinLog.css';

const MenuGeneralSinLog = () => {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productosDisponiblesHoy, setProductosDisponiblesHoy] = useState([]);
  const [diaActual, setDiaActual] = useState('');
  const [fechaActual, setFechaActual] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const construirUrlCompleta = (imagen) => {
    if (!imagen) return '';
    if (imagen.startsWith('http')) return imagen;
    if (imagen.startsWith('/uploads/')) {
      return `http://localhost:2001${imagen}`;
    }
    return imagen;
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

  const handleOrdenarClick = () => {
    navigate('/login');
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
      <div className="sin-log-loadingContainer">
        <div className="sin-log-spinner"></div>
        <p>Cargando menú del día...</p>
      </div>
    );
  }

  const gruposProductos = agruparProductosPorCategoria();
  const totalProductosHoy = productosDisponiblesHoy.length;
  const diaParaMostrar = obtenerDiaParaMostrar();

  return (
    <div className="sin-log-menuContainer">
      <div className="sin-log-headerSection">
        <div className="sin-log-headerContent">
          <h1><MdRestaurant /> Menú de Hoy</h1>
          <p className="sin-log-headerDescription">
            {fechaActual}
          </p>
          <div className="sin-log-infoDay">
            <span className="sin-log-dayBadge"><MdToday /> Día: {diaParaMostrar}</span>
            <span className="sin-log-productCount">{totalProductosHoy} productos disponibles</span>
          </div>
        </div>
        
        <div className="sin-log-headerActions">
          <button 
            className="sin-log-refreshBtn"
            onClick={refrescarMenu}
            title="Actualizar menú"
          >
            <FiRefreshCw /> Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="sin-log-alert sin-log-alertError">
          <span>{error}</span>
          <button className="sin-log-alertClose" onClick={() => setError('')}>
            <FiX />
          </button>
        </div>
      )}

      {/* Banner informativo para iniciar sesión */}
      <div className="sin-log-banner">
        <FiLock />
        <p>Para realizar pedidos, por favor <strong onClick={handleOrdenarClick} style={{cursor: 'pointer', textDecoration: 'underline'}}>inicia sesión</strong> o <strong onClick={() => navigate('/registro')} style={{cursor: 'pointer', textDecoration: 'underline'}}>regístrate</strong></p>
      </div>

      {totalProductosHoy === 0 ? (
        <div className="sin-log-noProductosHoy">
          <div className="sin-log-noProductosIcon"><FiCalendar /></div>
          <h3>No hay productos disponibles para hoy</h3>
          <p>El menú de {diaParaMostrar} no tiene productos configurados.</p>
          <button className="sin-log-btn sin-log-btnPrimary" onClick={refrescarMenu}>
            <FiRefreshCw /> Verificar nuevamente
          </button>
        </div>
      ) : (
        <div className="sin-log-categoriasGrid">
          {Object.values(gruposProductos).map(({ categoria, productos: productosCategoria }) => (
            <div key={categoria.id} className="sin-log-categoriaSection">
              <div className="sin-log-categoriaHeader">
                <div className="sin-log-categoriaInfo">
                  <h2>{categoria.nombre}</h2>
                  <p>{categoria.descripcion}</p>
                </div>
                <div className="sin-log-categoriaStats">
                  <span className="sin-log-productosCount">{productosCategoria.length} disponibles hoy</span>
                </div>
              </div>

              <div className="sin-log-productosGrid">
                {productosCategoria.map((producto) => (
                  <div key={producto.id} className="sin-log-productoCard">
                    <div className="sin-log-productoImagen">
                      {producto.imagen ? (
                        <img 
                          src={construirUrlCompleta(producto.imagen)} 
                          alt={producto.nombre}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="sin-log-imagenPlaceholder" style={{display: producto.imagen ? 'none' : 'flex'}}>
                        <span>IMG</span>
                      </div>
                      
                      <div className="sin-log-badgeDisponibleHoy">
                        <BsCheckCircle /> Disponible hoy
                      </div>
                    </div>

                    <div className="sin-log-productoInfo">
                      <h3>{producto.nombre}</h3>
                      <p className="sin-log-productoDescripcion">{producto.descripcion}</p>
                      
                      <div className="sin-log-productoDetalles">
                        <div className="sin-log-precioTiempo">
                          <span className="sin-log-precio">
                            ${producto.precio}
                          </span>
                          <span className="sin-log-tiempo">
                            <FiClock /> {producto.tiempoPreparacion || 'N/A'} min
                          </span>
                        </div>
                        
                        <div className="sin-log-disponibilidad">
                          <span className="sin-log-estado sin-log-disponible">
                            <BsCheckCircle /> Disponible {diaParaMostrar}
                          </span>
                        </div>
                      </div>

                      <button 
                        className="sin-log-btnOrdenar"
                        onClick={handleOrdenarClick}
                        title="Inicia sesión para ordenar"
                      >
                        <FiLock /> Ordenar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuGeneralSinLog;
