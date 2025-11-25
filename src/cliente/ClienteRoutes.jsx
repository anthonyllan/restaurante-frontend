import React from 'react';
import { Routes, Route } from 'react-router-dom';

//  Importar el CarritoProvider
import { CarritoProvider } from '../context/CarritoClienteContext.jsx';

// Importa tus páginas
import MenuCajeroComponent from './pages/MenuClienteComponent';
import SeguimientoClienteComponent from './pages/SeguimientoClienteComponent.jsx';
import HistorialPedidosClienteComponent from './pages/HistorialPedidosClienteComponent.jsx';
import PerfilClienteComponent from './pages/PerfilClienteComponent';
//import SeguimientoPedidoComponent from './pages/SeguimientoPedidoCajeroComponent.jsx';
//import VentaCajeroComponent from './pages/VentaCajeroComponent.jsx';

//  Quitar CarritoModal de las rutas, ya que es un modal, no una página independiente

// Importa header y footer
import HeaderClienteComponent from './components/HeaderClienteComponent';
import FooterClienteComponent from './components/FooterClienteComponent';

// Estilos globales
import '../App.css';

const ClienteRoutes = () => {
  return (
    <CarritoProvider> {/* 🆕 Envolver todo en CarritoProvider */}
      <div className="cliente-app">
        <HeaderClienteComponent />

        <main className="cliente-main-content">
          <div className="cliente-content-wrapper">
            <Routes>
              <Route path="/menu" element={<MenuCajeroComponent />} />
              <Route path="/seguimiento-pedido" element={<SeguimientoClienteComponent />} />
              <Route path="/historial" element={<HistorialPedidosClienteComponent />} />
              <Route path="/perfil" element={<PerfilClienteComponent />} />
              {/*  Agrega aquí más rutas de cliente si las necesitas */}
              
            </Routes>
          </div>
        </main>

        <FooterClienteComponent />
      </div>
    </CarritoProvider>
  );
};

export default ClienteRoutes;