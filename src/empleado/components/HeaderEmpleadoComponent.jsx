import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiLogOut, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { MdRestaurant, MdCalendarToday, MdCategory, MdInventory, MdLocalShipping, MdBusiness } from 'react-icons/md';
import { obtenerPerfilEmpleado, obtenerUrlImagen, cargarImagenPerfil } from '../../services/Empleado/PerfilService';
import { logout } from '../../services/AuthService';
import { getEmpleadoId } from '../../utils/authUtils';
import './HeaderEmpleadoComponent.css'; 
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

  // Cargar datos del empleado
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
      <Link to="/empleado/perfil" className="emp-sidebar-header" style={{textDecoration: 'none', cursor: 'pointer'}}>
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
          <span className="emp-profile-rol">Gerente</span>
        </div>
      </Link>

      <nav className="emp-sidebar-nav">
        <ul className="emp-nav-list">
          <li className="emp-nav-item">
            <div 
              className={`emp-nav-link ${isMenuOpen ? 'emp-active' : ''}`}
              onClick={toggleMenu}
            >
              <MdRestaurant />
              <span> Gestión de Menú</span>
              {isMenuOpen ? <FiChevronDown className="emp-arrow" /> : <FiChevronRight className="emp-arrow" />}
            </div>
            
            <ul className={`emp-submenu ${isMenuOpen ? 'emp-open' : ''}`}>
              <li className="emp-submenu-item">
                <Link 
                  to="/empleado/dias-laborables" 
                  className={`emp-submenu-link ${isActiveRoute('/empleado/dias-laborables') ? 'emp-active-route' : ''}`}
                >
                  <MdCalendarToday />
                  <span> Días Laborables</span>
                </Link>
              </li>
              <li className="emp-submenu-item">
                <Link 
                  to="/empleado/categorias" 
                  className={`emp-submenu-link ${isActiveRoute('/empleado/categorias') ? 'emp-active-route' : ''}`}
                >
                  <MdCategory />
                  <span> Categorías</span>
                </Link>
              </li>
              <li className="emp-submenu-item">
                <Link 
                  to="/empleado/productos" 
                  className={`emp-submenu-link ${isActiveRoute('/empleado/productos') ? 'emp-active-route' : ''}`}
                >
                  <MdInventory />
                  <span> Productos</span>
                </Link>
              </li>
            </ul>
          </li>

          <li className="emp-nav-item">
            <div 
              className={`emp-nav-link ${isProveedoresOpen ? 'emp-active' : ''}`}
              onClick={toggleProveedores}
            >
              <MdLocalShipping />
              <span> Gestión de Proveedores</span>
              {isProveedoresOpen ? <FiChevronDown className="emp-arrow" /> : <FiChevronRight className="emp-arrow" />}
            </div>
            
            <ul className={`emp-submenu ${isProveedoresOpen ? 'emp-open' : ''}`}>
              <li className="emp-submenu-item">
                <Link 
                  to="/empleado/proveedores" 
                  className={`emp-submenu-link ${isActiveRoute('/empleado/proveedores') ? 'emp-active-route' : ''}`}
                >
                  <MdBusiness />
                  <span> Proveedores</span>
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