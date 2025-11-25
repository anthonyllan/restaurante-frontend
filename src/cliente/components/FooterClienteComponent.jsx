import React from 'react';
import { Link } from 'react-router-dom';
import { MdRestaurant, MdBarChart } from 'react-icons/md';
import { BsClipboardCheck, BsFacebook } from 'react-icons/bs';
import '../../cliente/components/FooterClienteComponent.css'; 
import logoRestaurante from '../../images/logo-restaurante.png';

const FooterClienteComponent = () => {
  return (
    <footer className="cli-footer">
      <div className="cli-footer-content">
        {/* Logo - Lado izquierdo más grande */}
        <div className="cli-footer-logo">
          <img 
            src={logoRestaurante} 
            alt="Gastro Santer" 
            className="cli-logo-image"
          />
          <div className="cli-logo-text">
            <h3>Gastro Santer</h3>
            <span>Restaurante</span>
          </div>
        </div>

        {/* Sección central - Opciones y Síguenos lado a lado */}
        <div className="cli-footer-center">
          {/* Opciones con iconos alineadas a la izquierda */}
          <div className="cli-footer-nav-section">
            <h4 className="cli-footer-nav-title">Opciones</h4>
            <nav className="cli-footer-nav">
              <Link to="/cliente/menu" className="cli-footer-link">
                <MdRestaurant />
                <span>Menú</span>
              </Link>
              <Link to="/cliente/seguimiento" className="cli-footer-link">
                <BsClipboardCheck />
                <span>Seguimiento</span>
              </Link>
              <Link to="/cliente/historial" className="cli-footer-link">
                <MdBarChart />
                <span>Historial</span>
              </Link>
            </nav>
          </div>

          {/* Síguenos - Al lado de las opciones */}
          <div className="cli-footer-social">
            <h4 className="cli-footer-social-title">Síguenos</h4>
            <a 
              href="https://www.facebook.com/profile.php?id=61574168833553" 
              target="_blank" 
              rel="noopener noreferrer"
              className="cli-footer-social-link"
            >
              <BsFacebook />
              <span>Facebook</span>
            </a>
          </div>
        </div>

        {/* Acerca de nosotros - Lado derecho con frases icónicas */}
        <div className="cli-footer-about">
          <h4 className="cli-footer-about-title">Acerca de Nosotros</h4>
          <div className="cli-footer-about-content">
            <p className="cli-footer-about-text">
              Con 2 años de experiencia, Gastro Santer ofrece comida casera de calidad.
            </p>
            <div className="cli-footer-phrases">
              <p className="cli-footer-phrase">"Para llevar, para recordar."</p>
              <p className="cli-footer-phrase">"Sabor 100% casero"</p>
            </div>
          </div>
          <div className="cli-footer-copyright">
            <p>@2025 Todos los derechos reservados</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterClienteComponent;