import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importa header y footer
import HeaderAdministradorComponent from './components/HeaderAdministradorComponent';
import FooterAdministradorComponent from './components/FooterAdministradorComponent';

// Importa páginas
import GestionarEmpleadosComponent from './pages/GestionarEmpleadosComponent';
import IngresosComponent from './pages/IngresosComponent';
import ReportesComponent from './pages/ReportesComponent';
import PerfilAdministradorComponent from './pages/PerfilAdministradorComponent';

// Estilos globales
import '../App.css';

const AdministradorRoutes = () => {
  return (
    <div className="administrador-app">
      <HeaderAdministradorComponent />

      <main className="administrador-main-content">
        <div className="administrador-content-wrapper">
          <Routes>
            {/* Perfil */}
            <Route path="/perfil" element={<PerfilAdministradorComponent />} />
            
            {/* Recursos Humanos */}
            <Route path="/empleados" element={<GestionarEmpleadosComponent />} />
            
            {/* Gestión de Ingresos */}
            <Route path="/ingresos" element={<IngresosComponent />} />
            <Route path="/reportes" element={<ReportesComponent />} />
            
            {/* Ruta por defecto */}
            <Route path="/" element={<div style={{padding: '40px', textAlign: 'center'}}><h2>Bienvenido al Panel de Administrador</h2><p>Selecciona una opción del menú lateral</p></div>} />
          </Routes>
        </div>
      </main>

      <FooterAdministradorComponent />
    </div>
  );
};

export default AdministradorRoutes;


