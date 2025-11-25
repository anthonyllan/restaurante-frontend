import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiLogOut, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { MdPeople, MdAttachMoney, MdPersonAdd, MdAssignment, MdTrendingUp, MdBarChart } from 'react-icons/md';
import { obtenerPerfilEmpleado, obtenerUrlImagen, cargarImagenPerfil } from '../../services/Empleado/PerfilService';
import { logout } from '../../services/AuthService';
import { getEmpleadoId } from '../../utils/authUtils';
import './HeaderAdministradorComponent.css'; 
import iconoRestaurante from '../../images/icono_restaurante.png';

const HeaderAdministradorComponent = () => {
  const [isRecursosHumanosOpen, setIsRecursosHumanosOpen] = useState(false);
  const [isIngresosOpen, setIsIngresosOpen] = useState(false);
  const [empleado, setEmpleado] = useState(null);
  const [imagenPerfil, setImagenPerfil] = useState(iconoRestaurante);
  const location = useLocation();

  const toggleRecursosHumanos = () => setIsRecursosHumanosOpen(!isRecursosHumanosOpen);
  const toggleIngresos = () => setIsIngresosOpen(!isIngresosOpen);
  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de cerrar sesión?')) {
      logout();
    }
  };
  const isActiveRoute = (path) => location.pathname === path;

  // Cargar datos del empleado (administrador)
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
    <div className="admin-sidebar">
      <Link to="/administrador/perfil" className="admin-sidebar-header" style={{textDecoration: 'none', cursor: 'pointer'}}>
        <div className="admin-profile-icon">
          <img 
            src={imagenPerfil} 
            alt="Foto de perfil" 
            className="admin-profile-image"
            onError={(e) => { e.target.src = iconoRestaurante; }}
          />
        </div>
        <div className="admin-profile-info">
          <span className="admin-profile-name">{empleado ? `${empleado.nombre} ${empleado.apellidos}` : 'Cargando...'}</span>
          <span className="admin-profile-rol">Administrador</span>
        </div>
      </Link>

      <nav className="admin-sidebar-nav">
        <ul className="admin-nav-list">
          {/* Módulo: Recursos Humanos */}
          <li className="admin-nav-item">
            <div 
              className={`admin-nav-link ${isRecursosHumanosOpen ? 'admin-active' : ''}`}
              onClick={toggleRecursosHumanos}
            >
              <MdPeople />
              <span> Recursos Humanos</span>
              {isRecursosHumanosOpen ? <FiChevronDown className="admin-arrow" /> : <FiChevronRight className="admin-arrow" />}
            </div>
            
            <ul className={`admin-submenu ${isRecursosHumanosOpen ? 'admin-open' : ''}`}>
              <li className="admin-submenu-item">
                <Link 
                  to="/administrador/empleados" 
                  className={`admin-submenu-link ${isActiveRoute('/administrador/empleados') ? 'admin-active-route' : ''}`}
                >
                  <MdPersonAdd />
                  <span> Gestionar Empleados</span>
                </Link>
              </li>
            </ul>
          </li>

          {/* Módulo: Gestión de Ingresos */}
          <li className="admin-nav-item">
            <div 
              className={`admin-nav-link ${isIngresosOpen ? 'admin-active' : ''}`}
              onClick={toggleIngresos}
            >
              <MdAttachMoney />
              <span> Gestión de Ingresos</span>
              {isIngresosOpen ? <FiChevronDown className="admin-arrow" /> : <FiChevronRight className="admin-arrow" />}
            </div>
            
            <ul className={`admin-submenu ${isIngresosOpen ? 'admin-open' : ''}`}>
              <li className="admin-submenu-item">
                <Link 
                  to="/administrador/ingresos" 
                  className={`admin-submenu-link ${isActiveRoute('/administrador/ingresos') ? 'admin-active-route' : ''}`}
                >
                  <MdTrendingUp />
                  <span> Ingresos</span>
                </Link>
              </li>
              <li className="admin-submenu-item">
                <Link 
                  to="/administrador/reportes" 
                  className={`admin-submenu-link ${isActiveRoute('/administrador/reportes') ? 'admin-active-route' : ''}`}
                >
                  <MdBarChart />
                  <span> Reportes</span>
                </Link>
              </li>
            </ul>
          </li>

          <li className="admin-nav-separator"></li>

          {/* Salir */}
          <li className="admin-nav-item">
            <div 
              className="admin-nav-link admin-logout-link"
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

export default HeaderAdministradorComponent;
