import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Componentes de Autenticación
import LoginComponent from './auth/LoginComponent';
import RegistroComponent from './auth/RegistroComponent';
import ProtectedRoute from './components/ProtectedRoute';

// Módulo del empleado
import EmpleadoRoutes from './empleado/EmpleadoRoutes';
// Módulo del empleado cajero
import EmpleadoCajeroRoutes from './empleadoCajero/EmpleadoCajeroRoutes';
//Módulo de cliente
import ClienteRoutes from './cliente/ClienteRoutes';
// Módulo de administrador
import AdministradorRoutes from './administrador/AdministradorRoutes';
// Módulo de cliente sin sesión (público)
import ClienteSinSesionRoutes from './clientesinsesion/ClienteSinSesionRoutes';

import './App.css';

function AppContent() {
  const location = useLocation();

  // RUTAS PÚBLICAS (sin autenticación)
  const isPublicRoute = location.pathname === '/login' || 
                        location.pathname === '/registro' ||
                        location.pathname === '/';

  // Ruta pública principal (menú sin sesión)
  if (location.pathname === '/') {
    return (
      <div className="App" data-route={location.pathname}>
        <ClienteSinSesionRoutes />
      </div>
    );
  }

  // Las otras rutas públicas (login y registro)
  if (isPublicRoute) {
    return (
      <div className="App" data-route={location.pathname}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/registro" element={<RegistroComponent />} />
        </Routes>
      </div>
    );
  }

  // DETERMINAR CORRECTAMENTE EL TIPO DE RUTA
  const isCajeroRoute = location.pathname.startsWith('/empleado-cajero');
  const isClienteRoute = location.pathname.startsWith('/cliente');
  const isAdministradorRoute = location.pathname.startsWith('/administrador');

  // Cliente tiene su propio layout completo
  if (isClienteRoute) {
    return (
      <div className="App" data-route={location.pathname}>
        <Routes>
          <Route 
            path="/cliente/*" 
            element={
              <ProtectedRoute allowedTypes={['CLIENTE']}>
                <ClienteRoutes />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    );
  }

  // Administrador tiene su propio layout completo
  if (isAdministradorRoute) {
    return (
      <div className="App" data-route={location.pathname}>
        <Routes>
          <Route 
            path="/administrador/*" 
            element={
              <ProtectedRoute allowedTypes={['ADMIN']}>
                <AdministradorRoutes />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    );
  }

  // DETERMINAR LA CLASE CSS CORRECTA PARA EMPLEADO Y CAJERO
  const getMainClass = () => {
    if (isCajeroRoute) return "cajero-main-content";
    return "main-content"; // Para empleados
  };

  const getWrapperClass = () => {
    if (isCajeroRoute) return "cajero-content-wrapper";
    return "content-wrapper"; // Para empleados
  };

  return (
    <div className="App" data-route={location.pathname}>
      <main className={getMainClass()}>
        <div className={getWrapperClass()}>
          <Routes>
            {/* Módulo Empleado (Gerente) */}
            <Route 
              path="/empleado/*" 
              element={
                <ProtectedRoute allowedTypes={['GERENTE', 'ADMIN']}>
                  <EmpleadoRoutes />
                </ProtectedRoute>
              } 
            />

            {/* Módulo Empleado Cajero */}
            <Route 
              path="/empleado-cajero/*" 
              element={
                <ProtectedRoute allowedTypes={['GERENTE', 'CAJERO', 'ADMIN']}>
                  <EmpleadoCajeroRoutes />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;