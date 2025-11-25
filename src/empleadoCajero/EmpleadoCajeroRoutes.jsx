import React from 'react';
import { Routes, Route } from 'react-router-dom';

//  Importar el CarritoProvider
import { CarritoProvider } from '../context/CarritoContext.jsx';

// Importa tus páginas
import MenuCajeroComponent from './pages/MenuCajeroComponent';
import SeguimientoPedidoComponent from './pages/SeguimientoPedidoCajeroComponent.jsx';
import VentaCajeroComponent from './pages/VentaCajeroComponent.jsx';
import PerfilCajeroComponent from './pages/PerfilCajeroComponent';

//  Quitar CarritoModal de las rutas, ya que es un modal, no una página independiente

// Importa header y footer
import HeaderCajeroComponent from './components/HeaderCajeroComponent';
import FooterCajeroComponent from './components/FooterCajeroComponent';

// Estilos globales
import '../App.css';

const EmpleadoCajeroRoutes = () => {
  return (
    <CarritoProvider> {/* 🆕 Envolver todo en CarritoProvider */}
      <div className="empleadocajero-app">
        <HeaderCajeroComponent />

        <main className="empleadocajero-main-content">
          <div className="empleadocajero-content-wrapper">
            <Routes>
              <Route path="/perfil" element={<PerfilCajeroComponent />} />
              <Route path="/menu" element={<MenuCajeroComponent />} />
              <Route path="/venta" element={<VentaCajeroComponent />} />
              <Route path="/seguimiento-pedidos" element={<SeguimientoPedidoComponent />} />
              {/*  Agrega aquí más rutas de empleado cajero si las necesitas */}
              
            </Routes>
          </div>
        </main>

        <FooterCajeroComponent />
      </div>
    </CarritoProvider>
  );
};

export default EmpleadoCajeroRoutes;