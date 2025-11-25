import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importar componentes
import MenuGeneralSinLog from './pages/MenuGeneralSinLog';
import HeaderGeneralSinLog from './components/HeaderGeneralSinLog';
import FooterGeneralSinLog from './components/FooterGeneralSinLog';

// Estilos globales
import '../App.css';

const ClienteSinSesionRoutes = () => {
  return (
    <div className="sin-sesion-app">
      <HeaderGeneralSinLog />

      <main className="sin-sesion-main-content">
        <Routes>
          <Route path="/" element={<MenuGeneralSinLog />} />
        </Routes>
      </main>

      <FooterGeneralSinLog />
    </div>
  );
};

export default ClienteSinSesionRoutes;

