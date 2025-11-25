import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiChevronDown, FiChevronRight, FiLogOut } from 'react-icons/fi';
import { MdRestaurant, MdDashboard, MdBarChart } from 'react-icons/md';
import { BsClipboardCheck } from 'react-icons/bs';
import { obtenerPerfilEmpleado, obtenerUrlImagen, cargarImagenPerfil } from '../../services/Empleado/PerfilService';
import { logout } from '../../services/AuthService';
import { getEmpleadoId } from '../../utils/authUtils';
import '../../empleado/components/HeaderEmpleadoComponent.css'; 
import iconoRestaurante from '../../images/icono_restaurante.png';

const HeaderEmpleadoComponent = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProveedoresOpen, setIsProveedoresOpen] = useState(false);
  const [empleado, setEmpleado] = useState(null);
  const [imagenPerfil, setImagenPerfil] = useState(iconoRestaurante);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleProveedores = () => setIsProveedoresOpen(!isProveedoresOpen);
  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de cerrar sesión?')) {
      logout();
    }
  };
  const isActiveRoute = (path) => location.pathname === path;

  // Cargar datos del empleado (cajero)
  useEffect(() => {
    cargarEmpleado();
    
    // Escuchar evento de actualización de perfil
    const handlePerfilActualizado = () => {
      cargarEmpleado();
    };
    
    window.addEventListener('perfilActualizado', handlePerfilActualizado);
    
    return () => {
      window.removeEventListener('perfilActualizado', handlePerfilActualizado);
    };
  }, []);

  // Limpiar blob URLs cuando cambie la imagen
  useEffect(() => {
    return () => {
      if (imagenPerfil && imagenPerfil.startsWith('blob:')) {
        URL.revokeObjectURL(imagenPerfil);
      }
    };
  }, [imagenPerfil]);

  const cargarEmpleado = async () => {
    try {
      const idEmpleado = getEmpleadoId();
      
      if (!idEmpleado) {
        return;
      }

      const response = await obtenerPerfilEmpleado(idEmpleado);
      setEmpleado(response.data);
      
      // Si tiene imagen, usar la del servidor; si no, usar icono por defecto
      if (response.data.imagen) {
        try {
          // Intentar cargar con autenticación primero
          const imagenUrl = await cargarImagenPerfil(response.data.imagen);
          setImagenPerfil(imagenUrl);
        } catch (error) {
          // Si falla, usar URL directa
          const imagenUrl = obtenerUrlImagen(response.data.imagen);
          setImagenPerfil(imagenUrl);
        }
      } else {
        setImagenPerfil(iconoRestaurante);
      }
    } catch (error) {
      // Error al cargar empleado
    }
  };

  return (
    <div className="emp-sidebar">
      <Link to="/empleado-cajero/perfil" className="emp-sidebar-header" style={{textDecoration: 'none', cursor: 'pointer'}}>
        <div className="emp-profile-icon">
          <img 
            src={imagenPerfil} 
            alt="Foto de perfil" 
            className="emp-profile-image"
            onError={(e) => { e.target.src = iconoRestaurante; }}
          />
        </div>
        <div className="emp-profile-info">
          <span className="emp-profile-name">{empleado ? `${empleado.nombre} ${empleado.apellidos}` : 'Cargando...'}</span>
          <span className="emp-profile-rol">Cajero</span>
        </div>
      </Link>

      <nav className="emp-sidebar-nav">
        <ul className="emp-nav-list">
          <li className="emp-nav-item">
            <div 
              className={`emp-nav-link ${isMenuOpen ? 'emp-active' : ''}`}
              onClick={toggleMenu}
            >
              <FiShoppingCart />
              <span> Pedidos</span>
              {isMenuOpen ? <FiChevronDown className="emp-arrow" /> : <FiChevronRight className="emp-arrow" />}
            </div>
            
            <ul className={`emp-submenu ${isMenuOpen ? 'emp-open' : ''}`}>
              <li className="emp-submenu-item">
                <Link 
                  to="/empleado-cajero/menu" 
                  className={`emp-submenu-link ${isActiveRoute('/empleado-cajero/menu') ? 'emp-active-route' : ''}`}
                >
                  <MdRestaurant />
                  <span> Menú</span>
                </Link>
              </li>
              <li className="emp-submenu-item">
                <Link 
                  to="/empleado-cajero/seguimiento-pedidos" 
                  className={`emp-submenu-link ${isActiveRoute('/empleado-cajero/seguimiento-pedidos') ? 'emp-active-route' : ''}`}
                >
                  <BsClipboardCheck />
                  <span> Seguimiento</span>
                </Link>
              </li>
              <li className="emp-submenu-item">
                <Link 
                  to="/empleado-cajero/venta" 
                  className={`emp-submenu-link ${isActiveRoute('/empleado-cajero/venta') ? 'emp-active-route' : ''}`}
                >
                  <MdBarChart />
                  <span> Ventas</span>
                </Link>
              </li>
            </ul>
          </li>

          <li className="emp-nav-separator"></li>

          <li className="emp-nav-item">
            <div 
              className="emp-nav-link emp-logout-link"
              onClick={handleLogout}
            >
              <FiLogOut />
              <span> Salir</span>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default HeaderEmpleadoComponent;