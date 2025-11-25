import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { MdRestaurant, MdBarChart } from 'react-icons/md';
import { BsClipboardCheck } from 'react-icons/bs';
import { obtenerPerfilCliente, obtenerUrlImagenCliente, cargarImagenPerfilCliente } from '../../services/Cliente/PerfilClienteService';
import { logout } from '../../services/AuthService';
import '../../cliente/components/HeaderClienteComponent.css'; 
import iconoRestaurante from '../../images/icono_restaurante.png';

const HeaderClienteComponent = () => {
  const [cliente, setCliente] = useState(null);
  const [imagenPerfil, setImagenPerfil] = useState(iconoRestaurante);
  const location = useLocation();
  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de cerrar sesión?')) {
      logout();
    }
  };
  const isActiveRoute = (path) => location.pathname === path;

  // Cargar datos del cliente
  useEffect(() => {
    cargarCliente();
    
    // Escuchar evento de actualización de perfil
    const handlePerfilActualizado = () => {
      cargarCliente();
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

  const cargarCliente = async () => {
    try {
      // Obtener ID del cliente desde localStorage
      const getClienteId = () => {
        // Primero intentar con 'userId' directo
        const directUserId = localStorage.getItem('userId');
        if (directUserId) {
          return parseInt(directUserId, 10);
        }
        
        // Intentar con 'usuario'
        let userStr = localStorage.getItem('usuario');
        
        // Fallback a 'user'
        if (!userStr) {
          userStr = localStorage.getItem('user');
        }
        
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            return user.id;
          } catch (error) {
            return null;
          }
        }
        
        return null;
      };

      const idCliente = getClienteId();
      
      if (!idCliente) {
        return;
      }

      const response = await obtenerPerfilCliente(idCliente);
      setCliente(response.data);
      
      if (response.data.imagen) {
        try {
          // Intentar cargar con autenticación primero
          const imagenUrl = await cargarImagenPerfilCliente(response.data.imagen);
          setImagenPerfil(imagenUrl);
        } catch (error) {
          // Si falla, usar URL directa
          const imagenUrl = obtenerUrlImagenCliente(response.data.imagen);
          setImagenPerfil(imagenUrl);
        }
      } else {
        setImagenPerfil(iconoRestaurante);
      }
    } catch (error) {
      // En caso de error, mantener la imagen por defecto
      setImagenPerfil(iconoRestaurante);
    }
  };

  return (
    <header className="cli-header">
      <div className="cli-header-content">
        {/* Sección de Perfil */}
        <Link to="/cliente/perfil" className="cli-profile-section">
          <div className="cli-profile-icon">
            <img 
              src={imagenPerfil} 
              alt="Perfil" 
              className="cli-profile-image"
              onError={(e) => { e.target.src = iconoRestaurante; }}
            />
          </div>
          <div className="cli-profile-info">
            <span className="cli-profile-name">
              {cliente ? `${cliente.nombre} ${cliente.apellidos}` : 'Cargando...'}
            </span>
            <span className="cli-profile-role">Cliente</span>
          </div>
        </Link>

        {/* Navegación Principal */}
        <nav className="cli-navbar">
          <ul className="cli-nav-list">
            <li className="cli-nav-item">
              <Link 
                to="/cliente/menu" 
                className={`cli-nav-link ${isActiveRoute('/cliente/menu') ? 'cli-active-route' : ''}`}
              >
                <MdRestaurant />
                <span>Menú</span>
              </Link>
            </li>

            <li className="cli-nav-item">
              <Link 
                to="/cliente/seguimiento-pedido" 
                className={`cli-nav-link ${isActiveRoute('/cliente/seguimiento-pedido') ? 'cli-active-route' : ''}`}
              >
                <BsClipboardCheck />
                <span>Seguir pedido</span>
              </Link>
            </li>

            <li className="cli-nav-item">
              <Link 
                to="/cliente/historial" 
                className={`cli-nav-link ${isActiveRoute('/cliente/historial') ? 'cli-active-route' : ''}`}
              >
                <MdBarChart />
                <span>Historial</span>
              </Link>
            </li>

            <li className="cli-nav-separator"></li>

            <li className="cli-nav-item">
              <button 
                className="cli-nav-link cli-logout-link"
                onClick={handleLogout}
              >
                <FiLogOut />
                <span>Salir</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default HeaderClienteComponent;