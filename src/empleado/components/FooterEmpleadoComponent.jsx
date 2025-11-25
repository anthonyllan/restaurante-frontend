// src/components/FooterEmpleadoComponent/index.jsx
import React from 'react';
import './FooterEmpleadoComponent.css'; 
import logoRestaurante from '../../images/logo-restaurante.png';

const FooterEmpleadoComponent = () => {
  return (
    <footer className="emp-footer"> {/* ✅ Prefijo emp- */}
      <div className="emp-footer-content">
        <div className="emp-footer-logo">
          <img 
            src={logoRestaurante} 
            alt="Logo del Restaurante" 
            className="emp-logo-image"
          />
        </div>
        <div className="emp-footer-info">
          <p className="emp-version-text">Versión 1.0</p>
          <p className="emp-copyright">© 2025 Sistema de Gestión de Restaurante</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterEmpleadoComponent;