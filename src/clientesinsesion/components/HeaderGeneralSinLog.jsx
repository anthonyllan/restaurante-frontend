import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiLogIn, FiUserPlus } from 'react-icons/fi';
import { MdRestaurant } from 'react-icons/md';
import './HeaderGeneralSinLog.css';
import logoRestaurante from '../../images/logo-restaurante.png';

const HeaderGeneralSinLog = () => {
  const location = useLocation();
  const isActiveRoute = (path) => location.pathname === path;

  return (
    <header className="sin-log-header">
      <div className="sin-log-header-content">
        {/* Logo + Nombre del Restaurante - Centrado y Elegante */}
        <Link to="/" className="sin-log-brand">
          <img
            src={logoRestaurante}
            alt="GastroSánter"
            className="sin-log-brand-logo"
          />
          <div className="sin-log-brand-text">
            <h1 className="sin-log-brand-name">Gastro Santer</h1>
                <span className="sin-log-brand-tagline">Sabor 100% casero</span>
            </div>
            </Link>

        {/* Navegación Minimalista */}
        <nav className="sin-log-nav">
          <Link
            to="/"
            className={`sin-log-nav-link ${isActiveRoute('/') ? 'sin-log-nav-link-active' : ''}`}
          >
            <MdRestaurant />
            <span>Menú</span>
          </Link>

          <div className="sin-log-nav-divider"></div>

          <Link to="/login" className="sin-log-nav-link sin-log-nav-link-secondary">
            <FiLogIn />
            <span>Iniciar Sesión</span>
          </Link>

          <Link to="/registro" className="sin-log-nav-link sin-log-nav-link-primary">
            <FiUserPlus />
            <span>Registrarse</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default HeaderGeneralSinLog;
