import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, 
  FiAlertCircle, FiRefreshCw, FiPackage, FiFilter 
} from 'react-icons/fi';
import { MdBusiness } from 'react-icons/md';
import {
  obtenerTodosProveedores,
  crearProveedor,
  actualizarProveedor,
  darDeBajaProveedor,
  reactivarProveedor,
  eliminarProveedor
} from '../../../services/GestionarProveedor/ProveedorService';
import { getEmpleadoId } from '../../../utils/authUtils';
import './ProveedorGerenteComponent.css';

const ProveedorGerenteComponent = () => {
  // Estados principales
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de búsqueda y filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // TODOS, ACTIVOS, INACTIVOS

  // Estados del formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [proveedorActual, setProveedorActual] = useState(null);

  // Estados del modal de confirmación
  const [mostrarModalConfirm, setMostrarModalConfirm] = useState(false);
  const [accionConfirm, setAccionConfirm] = useState(null);

  // Obtener ID del gerente logeado dinámicamente
  const empleadoId = getEmpleadoId();

  // Formulario
  const [formData, setFormData] = useState({
    folioInterno: '',
    folioFiscal: '',
    nombre: '',
    rfc: '',
    telefono: '',
    direccion: '',
    activo: true,
    empleado: { id: empleadoId || 1 } // ID dinámico del gerente
  });

  // Cargar proveedores
  const cargarProveedores = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await obtenerTodosProveedores();
      setProveedores(response.data || []);
    } catch (err) {
      setError('Error al cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  // Filtrar y buscar proveedores
  const proveedoresFiltrados = proveedores.filter((proveedor) => {
    // Filtro por estado
    if (filtroEstado === 'ACTIVOS' && !proveedor.activo) return false;
    if (filtroEstado === 'INACTIVOS' && proveedor.activo) return false;

    // Búsqueda
    if (busqueda) {
      const searchTerm = busqueda.toLowerCase();
      return (
        proveedor.nombre?.toLowerCase().includes(searchTerm) ||
        proveedor.rfc?.toLowerCase().includes(searchTerm) ||
        proveedor.folioInterno?.toLowerCase().includes(searchTerm) ||
        proveedor.telefono?.includes(searchTerm)
      );
    }

    return true;
  });

  // Estadísticas
  const stats = {
    total: proveedores.length,
    activos: proveedores.filter(p => p.activo).length,
    inactivos: proveedores.filter(p => !p.activo).length
  };

  // Manejadores del formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetFormulario = () => {
    setFormData({
      folioInterno: '',
      folioFiscal: '',
      nombre: '',
      rfc: '',
      telefono: '',
      direccion: '',
      activo: true,
      empleado: { id: empleadoId || 1 } // ✅ ID dinámico
    });
    setModoEdicion(false);
    setProveedorActual(null);
    setMostrarFormulario(false);
  };

  const abrirFormularioNuevo = () => {
    resetFormulario();
    setMostrarFormulario(true);
  };

  const abrirFormularioEditar = (proveedor) => {
    setFormData({
      folioInterno: proveedor.folioInterno || '',
      folioFiscal: proveedor.folioFiscal || '',
      nombre: proveedor.nombre || '',
      rfc: proveedor.rfc || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || '',
      activo: proveedor.activo,
      empleado: proveedor.empleado
    });
    setProveedorActual(proveedor);
    setModoEdicion(true);
    setMostrarFormulario(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar ID del empleado
    if (!empleadoId) {
      setError('No se pudo obtener el ID del empleado. Por favor, inicia sesión nuevamente.');
      return;
    }
    
    // Validaciones básicas
    if (!formData.nombre || !formData.rfc || !formData.telefono) {
      setError('Por favor complete los campos obligatorios (Nombre, RFC, Teléfono)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('💾 [ProveedorGerente] Guardando proveedor con empleadoId:', empleadoId);

      if (modoEdicion && proveedorActual) {
        // Actualizar proveedor existente
        await actualizarProveedor(proveedorActual.id, formData);
        setSuccess('Proveedor actualizado exitosamente');
        console.log('✅ [ProveedorGerente] Proveedor actualizado');
      } else {
        // Crear nuevo proveedor
        await crearProveedor(formData);
        setSuccess('Proveedor registrado exitosamente');
        console.log('✅ [ProveedorGerente] Proveedor creado');
      }

      resetFormulario();
      await cargarProveedores();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ [ProveedorGerente] Error al guardar proveedor:', err);
      setError(err.message || 'Error al guardar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  // Acciones con confirmación
  const confirmarAccion = (accion, proveedor) => {
    setAccionConfirm({ tipo: accion, proveedor });
    setMostrarModalConfirm(true);
  };

  const ejecutarAccion = async () => {
    if (!accionConfirm) return;

    const { tipo, proveedor } = accionConfirm;

    try {
      setLoading(true);
      setError('');

      switch (tipo) {
        case 'baja':
          await darDeBajaProveedor(proveedor.id);
          setSuccess('Proveedor dado de baja exitosamente');
          break;
        case 'reactivar':
          await reactivarProveedor(proveedor.id);
          setSuccess('Proveedor reactivado exitosamente');
          break;
        case 'eliminar':
          await eliminarProveedor(proveedor.id);
          setSuccess('Proveedor eliminado exitosamente');
          break;
        default:
          break;
      }

      await cargarProveedores();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al ejecutar acción:', err);
      setError(err.message || 'Error al procesar la acción');
    } finally {
      setLoading(false);
      setMostrarModalConfirm(false);
      setAccionConfirm(null);
    }
  };

  // Formato de fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    
    // Si es un array (formato Java LocalDateTime)
    if (Array.isArray(fecha)) {
      const [año, mes, dia, hora, minuto] = fecha;
      return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${año} ${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
    }
    
    // Si es un string (formato MySQL DateTime: "2025-10-25 16:58:22.907930")
    if (typeof fecha === 'string') {
      try {
        const fechaObj = new Date(fecha);
        const dia = fechaObj.getDate();
        const mes = fechaObj.getMonth() + 1;
        const año = fechaObj.getFullYear();
        const hora = fechaObj.getHours();
        const minuto = fechaObj.getMinutes();
        return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${año} ${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
      } catch (error) {
        console.error('Error al formatear fecha:', error);
        return 'Fecha inválida';
      }
    }
    
    return 'N/A';
  };

  // Obtener mensaje de confirmación
  const obtenerMensajeConfirmacion = (accion) => {
    if (!accion) return '';
    
    if (accion.tipo === 'baja') {
      return `¿Deseas dar de baja al proveedor "${accion.proveedor.nombre}"?`;
    }
    if (accion.tipo === 'reactivar') {
      return `¿Deseas reactivar al proveedor "${accion.proveedor.nombre}"?`;
    }
    if (accion.tipo === 'eliminar') {
      return `¿Deseas eliminar permanentemente al proveedor "${accion.proveedor.nombre}"? Esta acción no se puede deshacer.`;
    }
    return '';
  };

  return (
    <div className="emp-gerente-prov-container">
      {/* Header */}
      <div className="emp-gerente-prov-header">
        <div className="emp-gerente-prov-header-content">
          <h1><MdBusiness /> Gestión de Proveedores</h1>
          <p>Administra la información de tus proveedores</p>
        </div>
        <button 
          className="emp-gerente-prov-btn-primary"
          onClick={abrirFormularioNuevo}
        >
          <FiPlus /> Nuevo Proveedor
        </button>
      </div>

      {/* Estadísticas */}
      <div className="emp-gerente-prov-stats">
        <div className="emp-gerente-prov-stat-card total">
          <div className="emp-gerente-prov-stat-icon">
            <FiPackage />
          </div>
          <div className="emp-gerente-prov-stat-info">
            <span className="emp-gerente-prov-stat-value">{stats.total}</span>
            <span className="emp-gerente-prov-stat-label">Total</span>
          </div>
        </div>

        <div className="emp-gerente-prov-stat-card activos">
          <div className="emp-gerente-prov-stat-icon">
            <FiCheck />
          </div>
          <div className="emp-gerente-prov-stat-info">
            <span className="emp-gerente-prov-stat-value">{stats.activos}</span>
            <span className="emp-gerente-prov-stat-label">Activos</span>
          </div>
        </div>

        <div className="emp-gerente-prov-stat-card inactivos">
          <div className="emp-gerente-prov-stat-icon">
            <FiX />
          </div>
          <div className="emp-gerente-prov-stat-info">
            <span className="emp-gerente-prov-stat-value">{stats.inactivos}</span>
            <span className="emp-gerente-prov-stat-label">Inactivos</span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="emp-gerente-prov-alert error">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={() => setError('')}><FiX /></button>
        </div>
      )}

      {success && (
        <div className="emp-gerente-prov-alert success">
          <FiCheck />
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><FiX /></button>
        </div>
      )}

      {/* Controles de búsqueda y filtros */}
      <div className="emp-gerente-prov-controls">
        <div className="emp-gerente-prov-search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Buscar por nombre, RFC, folio o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button 
              className="emp-gerente-prov-clear-search"
              onClick={() => setBusqueda('')}
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="emp-gerente-prov-filters">
          <div className="emp-gerente-prov-filter-group">
            <FiFilter />
            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVOS">Activos</option>
              <option value="INACTIVOS">Inactivos</option>
            </select>
          </div>

          <button 
            className="emp-gerente-prov-btn-refresh"
            onClick={cargarProveedores}
          >
            <FiRefreshCw /> Actualizar
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && !mostrarFormulario && (
        <div className="emp-gerente-prov-loading">
          <div className="emp-gerente-prov-spinner"></div>
          <p>Cargando proveedores...</p>
        </div>
      )}

      {/* Tabla de proveedores */}
      {!loading && proveedoresFiltrados.length === 0 && (
        <div className="emp-gerente-prov-empty">
          <FiPackage />
          <h3>No se encontraron proveedores</h3>
          <p>
            {busqueda || filtroEstado !== 'TODOS'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza registrando tu primer proveedor'}
          </p>
        </div>
      )}

      {!loading && proveedoresFiltrados.length > 0 && (
        <div className="emp-gerente-prov-table-container">
          <table className="emp-gerente-prov-table">
            <thead>
              <tr>
                <th>Folio Interno</th>
                <th>Nombre</th>
                <th>RFC</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Fecha Registro</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedoresFiltrados.map((proveedor) => (
                <tr key={proveedor.id} className={!proveedor.activo ? 'inactivo' : ''}>
                  <td>
                    <span className="emp-gerente-prov-folio">{proveedor.folioInterno}</span>
                  </td>
                  <td>
                    <strong>{proveedor.nombre}</strong>
                  </td>
                  <td>{proveedor.rfc}</td>
                  <td>{proveedor.telefono}</td>
                  <td className="emp-gerente-prov-direccion">{proveedor.direccion}</td>
                  <td>{formatearFecha(proveedor.fechaRegistro)}</td>
                  <td>
                    <span className={`emp-gerente-prov-badge ${proveedor.activo ? 'activo' : 'inactivo'}`}>
                      {proveedor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="emp-gerente-prov-actions">
                      <button
                        className="emp-gerente-prov-btn-action edit"
                        onClick={() => abrirFormularioEditar(proveedor)}
                        title="Editar"
                      >
                        <FiEdit2 />
                      </button>
                      
                      {proveedor.activo && (
                        <button
                          className="emp-gerente-prov-btn-action deactivate"
                          onClick={() => confirmarAccion('baja', proveedor)}
                          title="Dar de baja"
                        >
                          <FiX />
                        </button>
                      )}
                      {!proveedor.activo && (
                        <button
                          className="emp-gerente-prov-btn-action activate"
                          onClick={() => confirmarAccion('reactivar', proveedor)}
                          title="Reactivar"
                        >
                          <FiCheck />
                        </button>
                      )}
                      
                      <button
                        className="emp-gerente-prov-btn-action delete"
                        onClick={() => confirmarAccion('eliminar', proveedor)}
                        title="Eliminar"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <div className="emp-gerente-prov-modal-overlay" onClick={resetFormulario}>
          <div className="emp-gerente-prov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-gerente-prov-modal-header">
              <h2>
                {modoEdicion ? <FiEdit2 /> : <FiPlus />}
                {modoEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <button 
                className="emp-gerente-prov-modal-close"
                onClick={resetFormulario}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="emp-gerente-prov-form">
              <div className="emp-gerente-prov-form-grid">
                <div className="emp-gerente-prov-form-group">
                  <label>Folio Interno *</label>
                  <input
                    type="text"
                    name="folioInterno"
                    value={formData.folioInterno}
                    onChange={handleInputChange}
                    placeholder="Ej: PROV-001"
                    required
                  />
                </div>

                <div className="emp-gerente-prov-form-group">
                  <label>Folio Fiscal</label>
                  <input
                    type="text"
                    name="folioFiscal"
                    value={formData.folioFiscal}
                    onChange={handleInputChange}
                    placeholder="Folio fiscal (opcional)"
                  />
                </div>

                <div className="emp-gerente-prov-form-group full-width">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Nombre del proveedor"
                    required
                  />
                </div>

                <div className="emp-gerente-prov-form-group">
                  <label>RFC *</label>
                  <input
                    type="text"
                    name="rfc"
                    value={formData.rfc}
                    onChange={handleInputChange}
                    placeholder="RFC del proveedor"
                    required
                  />
                </div>

                <div className="emp-gerente-prov-form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Teléfono de contacto"
                    required
                  />
                </div>

                <div className="emp-gerente-prov-form-group full-width">
                  <label>Dirección</label>
                  <textarea
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    placeholder="Dirección completa del proveedor"
                    rows="3"
                  />
                </div>

                <div className="emp-gerente-prov-form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleInputChange}
                    />
                    <span>Proveedor activo</span>
                  </label>
                </div>
              </div>

              <div className="emp-gerente-prov-form-actions">
                <button
                  type="button"
                  className="emp-gerente-prov-btn-secondary"
                  onClick={resetFormulario}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="emp-gerente-prov-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : modoEdicion ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {mostrarModalConfirm && accionConfirm && (
        <div className="emp-gerente-prov-modal-overlay" onClick={() => setMostrarModalConfirm(false)}>
          <div className="emp-gerente-prov-modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="emp-gerente-prov-modal-confirm-icon">
              <FiAlertCircle />
            </div>
            <h3>¿Estás seguro?</h3>
            <p>{obtenerMensajeConfirmacion(accionConfirm)}</p>
            <div className="emp-gerente-prov-modal-confirm-actions">
              <button
                className="emp-gerente-prov-btn-secondary"
                onClick={() => setMostrarModalConfirm(false)}
              >
                Cancelar
              </button>
              <button
                className={`emp-gerente-prov-btn-primary ${accionConfirm.tipo === 'eliminar' ? 'danger' : ''}`}
                onClick={ejecutarAccion}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedorGerenteComponent;
