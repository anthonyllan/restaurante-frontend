import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importa tus páginas
import DiaSemanaComponent from './pages/GestionarMenu/DiaSemanaComponent';
import CategoriaComponent from './pages/GestionarMenu/CategoriaComponent';
import ProductoComponent from './pages/GestionarMenu/ProductoComponent';
import ProveedorGerenteComponent from './pages/GestionProveedores/ProveedorGerenteComponent';
import PerfilEmpleadoComponent from './pages/PerfilEmpleadoComponent';

// Importa header y footer
import HeaderEmpleadoComponent from './components/HeaderEmpleadoComponent';
import FooterEmpleadoComponent from './components/FooterEmpleadoComponent';

// Estilos globales
import '../App.css';

const EmpleadoRoutes = () => {
  return (
    <div className="empleado-app">
      <HeaderEmpleadoComponent />

      <main className="empleado-main-content">
        <div className="empleado-content-wrapper">
          <Routes>
            <Route path="/dias-laborables" element={<DiaSemanaComponent />} />
            <Route path="/categorias" element={<CategoriaComponent />} />
            <Route path="/productos" element={<ProductoComponent />} />
            <Route path="/proveedores" element={<ProveedorGerenteComponent />} />
            <Route path="/perfil" element={<PerfilEmpleadoComponent />} />
            {/* Agrega aquí más rutas de empleado si las necesitas */}
          </Routes>
        </div>
      </main>

      <FooterEmpleadoComponent />
    </div>
  );
};

export default EmpleadoRoutes;
