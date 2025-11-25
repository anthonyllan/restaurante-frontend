import React from 'react';
import { Link } from 'react-router-dom';
import { MdRestaurant } from 'react-icons/md';
import { FiLogIn, FiUserPlus } from 'react-icons/fi';
import { BsFacebook } from 'react-icons/bs';
import './FooterGeneralSinLog.css';
import logoRestaurante from '../../images/logo-restaurante.png';

const FooterGeneralSinLog = () => {
  return (
    <footer className="sin-log-footer">
      <div className="sin-log-footer-content">
        {/* Logo - Lado izquierdo más grande */}
        <div className="sin-log-footer-logo">
          <img 
            src={logoRestaurante} 
            alt="Gastro Santer" 
            className="sin-log-logo-image"
          />
          <div className="sin-log-logo-text">
            <h3>Gastro Santer</h3>
            <span>Restaurante</span>
          </div>
        </div>

        {/* Sección central - Opciones y Síguenos lado a lado */}
        <div className="sin-log-footer-center">
          {/* Opciones con iconos alineadas a la izquierda */}
          <div className="sin-log-footer-nav-section">
            <h4 className="sin-log-footer-nav-title">Opciones</h4>
            <nav className="sin-log-footer-nav">
              <Link to="/" className="sin-log-footer-link">
                <MdRestaurant />
                <span>Menú</span>
              </Link>
              <Link to="/login" className="sin-log-footer-link">
                <FiLogIn />
                <span>Iniciar Sesión</span>
              </Link>
              <Link to="/registro" className="sin-log-footer-link">
                <FiUserPlus />
                <span>Registrarse</span>
              </Link>
            </nav>
          </div>

          {/* Síguenos - Al lado de las opciones */}
          <div className="sin-log-footer-social">
            <h4 className="sin-log-footer-social-title">Síguenos</h4>
            <a 
              href="https://www.facebook.com/profile.php?id=61574168833553" 
              target="_blank" 
              rel="noopener noreferrer"
              className="sin-log-footer-social-link"
            >
              <BsFacebook />
              <span>Facebook</span>
            </a>
          </div>
        </div>

        {/* Acerca de nosotros - Lado derecho con frases icónicas */}
        <div className="sin-log-footer-about">
          <h4 className="sin-log-footer-about-title">Acerca de Nosotros</h4>
          <div className="sin-log-footer-about-content">
            <p className="sin-log-footer-about-text">
              Con 2 años de experiencia, Gastro Santer ofrece comida casera de calidad.
            </p>
            <div className="sin-log-footer-phrases">
              <p className="sin-log-footer-phrase">"Para llevar, para recordar."</p>
              <p className="sin-log-footer-phrase">"Sabor 100% casero"</p>
            </div>
          </div>
          <div className="sin-log-footer-copyright">
            <p>@2025 Todos los derechos reservados</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterGeneralSinLog;
