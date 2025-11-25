import React from 'react';
import './FooterAdministradorComponent.css';
import logoRestaurante from '../../images/icono_restaurante.png';

const FooterAdministradorComponent = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="admin-footer">
      <div className="admin-footer-content">
        <div className="admin-footer-logo">
          <img 
            src={logoRestaurante} 
            alt="Logo Restaurante" 
            className="admin-logo-image"
          />
        </div>
        
        <div className="admin-footer-info">
          <p className="admin-version-text">Sistema de Gestión v1.0.0</p>
          <p className="admin-copyright">
            © {currentYear} Restaurante. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterAdministradorComponent;
