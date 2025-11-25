import React from 'react';

const IngresosAdministradorComponent = () => {
  return (
    <div style={{ 
      padding: '40px',
      textAlign: 'center',
      background: 'var(--neutral-50)',
      borderRadius: '16px',
      margin: '20px'
    }}>
      <h2 style={{ 
        color: 'var(--secondary-wine)',
        marginBottom: '16px',
        fontSize: '2rem'
      }}>
        📊 Gestión de Ingresos
      </h2>
      <p style={{ 
        color: 'var(--neutral-600)',
        fontSize: '1.1rem'
      }}>
        Módulo en desarrollo...
      </p>
      <p style={{ 
        color: 'var(--neutral-500)',
        fontSize: '0.9rem',
        marginTop: '20px'
      }}>
        Aquí podrás visualizar reportes, estadísticas y gestionar los ingresos del restaurante.
      </p>
    </div>
  );
};

export default IngresosAdministradorComponent;

