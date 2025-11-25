import React, { useState, useEffect } from 'react';
import { 
  listDiasSemana, 
  cambiarEstadoDia,
  verificarConexion
} from '../../../services/GestionarMenu/DiaSemanaService';
import './DiaSemanaComponent.css';

const DiaSemanaComponent = () => {
  const [diasSemana, setDiasSemana] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    cargarDiasSemana();
    verificarConectividad();
  }, []);

  const verificarConectividad = async () => {
    const resultado = await verificarConexion();
    if (!resultado.success) {
      setError(`Problema de conexión: ${resultado.message}`);
    }
  };

  const cargarDiasSemana = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await listDiasSemana();
      
      const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const diasOrdenados = (response.data || []).sort((a, b) => {
        return ordenDias.indexOf(a.nombre) - ordenDias.indexOf(b.nombre);
      });
      
      setDiasSemana(diasOrdenados);

      if (diasOrdenados.length === 0) {
        setError('No hay días de la semana configurados en el sistema');
      }
    } catch (error) {
      console.error('Error al cargar días:', error);
      setError(error.message || 'Error al cargar los días');
      setDiasSemana([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (dia) => {
    const nuevoEstado = !dia.habilitado;
    const accion = nuevoEstado ? 'habilitar' : 'deshabilitar';
    
    if (window.confirm(`¿Desea ${accion} el día ${dia.nombre}?`)) {
      try {
        setUpdating(prev => ({ ...prev, [dia.id]: true }));
        setError('');
        await cambiarEstadoDia(dia.id, nuevoEstado);
        setDiasSemana(prev => prev.map(d => d.id === dia.id ? { ...d, habilitado: nuevoEstado } : d));
        setSuccess(`Día ${dia.nombre} ${nuevoEstado ? 'habilitado' : 'deshabilitado'} correctamente`);
      } catch (error) {
        console.error('Error al cambiar estado:', error);
        setError(error.message || 'Error al cambiar estado del día');
      } finally {
        setUpdating(prev => ({ ...prev, [dia.id]: false }));
      }
    }
  };

  if (loading) {
    return (
      <div className="emp-loading-container">
        <div className="emp-spinner"></div>
        <p>Cargando configuración de días laborables...</p>
      </div>
    );
  }

  const diasHabilitados = diasSemana.filter(d => d.habilitado).length;
  const diasDeshabilitados = diasSemana.length - diasHabilitados;

  return (
    <div className="emp-dia-semana-container">
      {/* Header */}
      <div className="emp-header-section">
        <div className="emp-header-content">
          <h1>Configuración de Días Laborables</h1>
          <p>Habilita o deshabilita los días de operación del restaurante</p>
        </div>
        <button className="emp-btn emp-btn-secondary" onClick={cargarDiasSemana}>Actualizar</button>
      </div>

      {/* Mensajes */}
      {error && <div className="emp-alert emp-alert-error">{error}</div>}
      {success && <div className="emp-alert emp-alert-success">{success}</div>}

      {/* Estadísticas */}
      <div className="emp-stats-section">
        <div className="emp-stat-card success">
          <h3>{diasHabilitados}</h3>
          <p>Días habilitados</p>
        </div>
        <div className="emp-stat-card warning">
          <h3>{diasDeshabilitados}</h3>
          <p>Días deshabilitados</p>
        </div>
        <div className="emp-stat-card info">
          <h3>{diasSemana.length}</h3>
          <p>Total de días</p>
        </div>
      </div>

      {/* Días */}
      <div className="emp-dias-grid">
        {diasSemana.map((dia) => (
          <div key={dia.id} className={`emp-dia-card ${dia.habilitado ? 'habilitado' : 'deshabilitado'}`}>
            <div className="emp-dia-header">
              <h3>{dia.nombre}</h3>
              <span className={`emp-status ${dia.habilitado ? 'activo' : 'inactivo'}`}>
                {dia.habilitado ? 'HABILITADO' : 'DESHABILITADO'}
              </span>
            </div>
            <p className="emp-dia-desc">
              {dia.habilitado 
                ? 'El restaurante opera normalmente este día'
                : 'El restaurante permanece cerrado este día'}
            </p>
            <button
              className={`emp-btn-toggle ${dia.habilitado ? 'emp-btn-disable' : 'emp-btn-enable'}`}
              onClick={() => handleCambiarEstado(dia)}
              disabled={updating[dia.id]}
            >
              {updating[dia.id] ? 'Cambiando...' : (dia.habilitado ? 'Deshabilitar' : 'Habilitar')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiaSemanaComponent;
