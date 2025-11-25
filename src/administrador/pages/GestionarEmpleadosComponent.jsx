import React, { useState, useEffect } from 'react';
import {
  FiUsers, FiUserPlus, FiEdit2, FiTrash2, FiX, FiSave,
  FiSearch, FiRefreshCw, FiAlertCircle, FiCheck, FiMail,
  FiPhone, FiUser, FiShield
} from 'react-icons/fi';
import {
  registrarEmpleado,
  obtenerTodosEmpleados,
  actualizarEmpleado,
  eliminarEmpleado,
  obtenerTodosRoles,
  asignarRolEmpleado,
  obtenerRolesPorEmpleado,
  obtenerNombreRol,
  obtenerColorRol
} from '../../services/Administrador/RecursosHumanosService';
import './GestionarEmpleadosComponent.css';

const GestionarEmpleadosComponent = () => {
  // Estados principales
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [empleadosConRoles, setEmpleadosConRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalAsignarRol, setModalAsignarRol] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

  // Estados de formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    correo: '',
    contrasena: ''
  });

  // Estados de rol
  const [rolSeleccionado, setRolSeleccionado] = useState('');

  // Estados de búsqueda y filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  // Cargar datos al montar
  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 30000); // Refresh cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar empleados y roles en paralelo
      const [empleadosRes, rolesRes] = await Promise.all([
        obtenerTodosEmpleados(),
        obtenerTodosRoles()
      ]);

      setEmpleados(empleadosRes.data);
      // Filtrar solo roles de empleados (excluir admin)
      const rolesEmpleados = rolesRes.data.filter(
        rol => rol.nombre === 'r_gerente' || rol.nombre === 'r_cajero'
      );
      setRoles(rolesEmpleados);

      // Cargar roles de cada empleado
      const empleadosConRolesPromises = empleadosRes.data.map(async (emp) => {
        try {
          const rolesEmp = await obtenerRolesPorEmpleado(emp.id);
          return {
            ...emp,
            roles: rolesEmp.data || []
          };
        } catch (err) {
          return {
            ...emp,
            roles: []
          };
        }
      });

      const empleadosConRolesData = await Promise.all(empleadosConRolesPromises);
      setEmpleadosConRoles(empleadosConRolesData);

    } catch (err) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      telefono: '',
      correo: '',
      contrasena: ''
    });
    setRolSeleccionado('');
  };

  const abrirModalCrear = () => {
    resetForm();
    setModalCrear(true);
  };

  const abrirModalEditar = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setFormData({
      nombre: empleado.nombre,
      apellidos: empleado.apellidos,
      telefono: empleado.telefono || '',
      correo: empleado.usuario?.correo || '',
      contrasena: ''
    });
    setModalEditar(true);
  };

  const abrirModalAsignarRol = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setRolSeleccionado('');
    setModalAsignarRol(true);
  };

  const abrirModalEliminar = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setModalEliminar(true);
  };

  const handleCrearEmpleado = async () => {
    try {
      setError('');

      // Validaciones
      if (!formData.nombre || !formData.apellidos || !formData.correo || !formData.contrasena) {
        setError('Todos los campos obligatorios deben estar completos');
        return;
      }

      if (!rolSeleccionado) {
        setError('Debe seleccionar un rol para el empleado');
        return;
      }

      // Crear empleado
      const empleadoData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        usuario: {
          correo: formData.correo,
          contrasena: formData.contrasena
        }
      };

      const responseEmpleado = await registrarEmpleado(empleadoData);

      // Asignar rol
      const empleadoRolData = {
        empleado: {
          id: responseEmpleado.data.id
        },
        rol: {
          id: parseInt(rolSeleccionado)
        }
      };

      await asignarRolEmpleado(empleadoRolData);

      setSuccess('Empleado creado y rol asignado exitosamente');
      setModalCrear(false);
      resetForm();
      cargarDatos();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al crear empleado:', err);
      setError(err.message || 'Error al crear empleado');
    }
  };

  const handleActualizarEmpleado = async () => {
    try {
      setError('');

      if (!formData.nombre || !formData.apellidos) {
        setError('Nombre y apellidos son obligatorios');
        return;
      }

      const empleadoData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        usuario: {
          correo: formData.correo,
          ...(formData.contrasena && { contrasena: formData.contrasena })
        }
      };

      await actualizarEmpleado(empleadoSeleccionado.id, empleadoData);

      setSuccess('Empleado actualizado exitosamente');
      setModalEditar(false);
      setEmpleadoSeleccionado(null);
      resetForm();
      cargarDatos();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al actualizar empleado:', err);
      setError(err.message || 'Error al actualizar empleado');
    }
  };

  const handleAsignarRol = async () => {
    try {
      setError('');

      if (!rolSeleccionado) {
        setError('Debe seleccionar un rol');
        return;
      }

      const empleadoRolData = {
        empleado: {
          id: empleadoSeleccionado.id
        },
        rol: {
          id: parseInt(rolSeleccionado)
        }
      };

      await asignarRolEmpleado(empleadoRolData);

      setSuccess('Rol asignado exitosamente');
      setModalAsignarRol(false);
      setEmpleadoSeleccionado(null);
      setRolSeleccionado('');
      cargarDatos();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al asignar rol:', err);
      setError(err.message || 'Error al asignar rol');
    }
  };

  const handleEliminarEmpleado = async () => {
    try {
      setError('');

      await eliminarEmpleado(empleadoSeleccionado.id);

      setSuccess(`Empleado "${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellidos}" eliminado exitosamente`);
      setModalEliminar(false);
      setEmpleadoSeleccionado(null);
      cargarDatos();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al eliminar empleado:', err);
      setError(err.message || 'Error al eliminar empleado');
      setModalEliminar(false);
    }
  };

  const empleadosFiltrados = empleadosConRoles.filter(emp => {
    const cumpleBusqueda = emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          emp.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
                          emp.usuario?.correo.toLowerCase().includes(busqueda.toLowerCase());

    const cumpleRol = !filtroRol || emp.roles.some(rol => rol.id === parseInt(filtroRol));

    return cumpleBusqueda && cumpleRol;
  });

  if (loading) {
    return (
      <div className="admin-rrhh-loading">
        <div className="admin-rrhh-spinner"></div>
        <p>Cargando empleados...</p>
      </div>
    );
  }

  return (
    <div className="admin-rrhh-container">
      {/* Header */}
      <div className="admin-rrhh-header">
        <div className="admin-rrhh-header-content">
          <h1><FiUsers /> Gestionar Empleados</h1>
          <p>Administra los empleados y sus roles</p>
        </div>
        <button className="admin-rrhh-btn-primary" onClick={abrirModalCrear}>
          <FiUserPlus /> Nuevo Empleado
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="admin-rrhh-alert error">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={() => setError('')}><FiX /></button>
        </div>
      )}

      {success && (
        <div className="admin-rrhh-alert success">
          <FiCheck />
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><FiX /></button>
        </div>
      )}

      {/* Estadísticas */}
      <div className="admin-rrhh-stats">
        <div className="admin-rrhh-stat-card total">
          <div className="admin-rrhh-stat-icon"><FiUsers /></div>
          <div className="admin-rrhh-stat-info">
            <span className="admin-rrhh-stat-value">{empleados.length}</span>
            <span className="admin-rrhh-stat-label">Total Empleados</span>
          </div>
        </div>

        {roles.map(rol => {
          const empleadosConRol = empleadosConRoles.filter(emp =>
            emp.roles.some(r => r.id === rol.id)
          ).length;

          return (
            <div key={rol.id} className="admin-rrhh-stat-card" style={{ borderColor: obtenerColorRol(rol.nombre) }}>
              <div className="admin-rrhh-stat-icon" style={{ color: obtenerColorRol(rol.nombre) }}>
                <FiShield />
              </div>
              <div className="admin-rrhh-stat-info">
                <span className="admin-rrhh-stat-value">{empleadosConRol}</span>
                <span className="admin-rrhh-stat-label">{obtenerNombreRol(rol.nombre)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles */}
      <div className="admin-rrhh-controls">
        <div className="admin-rrhh-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          className="admin-rrhh-select"
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
        >
          <option value="">Todos los roles</option>
          {roles.map(rol => (
            <option key={rol.id} value={rol.id}>
              {obtenerNombreRol(rol.nombre)}
            </option>
          ))}
        </select>

        <button className="admin-rrhh-btn-refresh" onClick={cargarDatos}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      {/* Tabla */}
      <div className="admin-rrhh-table-container">
        <table className="admin-rrhh-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Completo</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Roles</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-rrhh-no-data">
                  No se encontraron empleados
                </td>
              </tr>
            ) : (
              empleadosFiltrados.map(empleado => (
                <tr key={empleado.id}>
                  <td>{empleado.id}</td>
                  <td className="admin-rrhh-nombre">
                    {empleado.nombre} {empleado.apellidos}
                  </td>
                  <td>{empleado.usuario?.correo}</td>
                  <td>{empleado.telefono || 'N/A'}</td>
                  <td>
                    <div className="admin-rrhh-roles">
                      {empleado.roles.length === 0 ? (
                        <span className="admin-rrhh-badge sin-rol">Sin rol</span>
                      ) : (
                        empleado.roles.map(rol => (
                          <span
                            key={rol.id}
                            className="admin-rrhh-badge"
                            style={{ backgroundColor: obtenerColorRol(rol.nombre) }}
                          >
                            {obtenerNombreRol(rol.nombre)}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="admin-rrhh-actions">
                      <button
                        className="admin-rrhh-btn-action edit"
                        onClick={() => abrirModalEditar(empleado)}
                        title="Editar empleado"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="admin-rrhh-btn-action assign"
                        onClick={() => abrirModalAsignarRol(empleado)}
                        title="Asignar rol"
                      >
                        <FiShield />
                      </button>
                      <button
                        className="admin-rrhh-btn-action delete"
                        onClick={() => abrirModalEliminar(empleado)}
                        title="Eliminar empleado"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Empleado */}
      {modalCrear && (
        <div className="admin-rrhh-modal-overlay" onClick={() => setModalCrear(false)}>
          <div className="admin-rrhh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-rrhh-modal-header">
              <h2><FiUserPlus /> Nuevo Empleado</h2>
              <button onClick={() => setModalCrear(false)}><FiX /></button>
            </div>

            <div className="admin-rrhh-modal-body">
              <div className="admin-rrhh-form-row">
                <div className="admin-rrhh-form-group">
                  <label><FiUser /> Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Nombre del empleado"
                    required
                  />
                </div>

                <div className="admin-rrhh-form-group">
                  <label><FiUser /> Apellidos *</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleInputChange}
                    placeholder="Apellidos del empleado"
                    required
                  />
                </div>
              </div>

              <div className="admin-rrhh-form-row">
                <div className="admin-rrhh-form-group">
                  <label><FiMail /> Correo Electrónico *</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleInputChange}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>

                <div className="admin-rrhh-form-group">
                  <label><FiPhone /> Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="7441234567"
                  />
                </div>
              </div>

              <div className="admin-rrhh-form-group">
                <label>Contraseña *</label>
                <input
                  type="password"
                  name="contrasena"
                  value={formData.contrasena}
                  onChange={handleInputChange}
                  placeholder="Contraseña del empleado"
                  required
                />
              </div>

              <div className="admin-rrhh-form-group">
                <label><FiShield /> Rol *</label>
                <select
                  value={rolSeleccionado}
                  onChange={(e) => setRolSeleccionado(e.target.value)}
                  required
                >
                  <option value="">Seleccionar rol...</option>
                  {roles.map(rol => (
                    <option key={rol.id} value={rol.id}>
                      {obtenerNombreRol(rol.nombre)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-rrhh-modal-footer">
              <button
                className="admin-rrhh-btn-secondary"
                onClick={() => setModalCrear(false)}
              >
                <FiX /> Cancelar
              </button>
              <button
                className="admin-rrhh-btn-primary"
                onClick={handleCrearEmpleado}
              >
                <FiSave /> Crear Empleado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Empleado */}
      {modalEditar && (
        <div className="admin-rrhh-modal-overlay" onClick={() => setModalEditar(false)}>
          <div className="admin-rrhh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-rrhh-modal-header">
              <h2><FiEdit2 /> Editar Empleado</h2>
              <button onClick={() => setModalEditar(false)}><FiX /></button>
            </div>

            <div className="admin-rrhh-modal-body">
              <div className="admin-rrhh-form-row">
                <div className="admin-rrhh-form-group">
                  <label><FiUser /> Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="admin-rrhh-form-group">
                  <label><FiUser /> Apellidos *</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="admin-rrhh-form-row">
                <div className="admin-rrhh-form-group">
                  <label><FiMail /> Correo Electrónico *</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="admin-rrhh-form-group">
                  <label><FiPhone /> Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="admin-rrhh-form-group">
                <label>Nueva Contraseña (opcional)</label>
                <input
                  type="password"
                  name="contrasena"
                  value={formData.contrasena}
                  onChange={handleInputChange}
                  placeholder="Dejar vacío para no cambiar"
                />
              </div>
            </div>

            <div className="admin-rrhh-modal-footer">
              <button
                className="admin-rrhh-btn-secondary"
                onClick={() => setModalEditar(false)}
              >
                <FiX /> Cancelar
              </button>
              <button
                className="admin-rrhh-btn-primary"
                onClick={handleActualizarEmpleado}
              >
                <FiSave /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Rol */}
      {modalAsignarRol && (
        <div className="admin-rrhh-modal-overlay" onClick={() => setModalAsignarRol(false)}>
          <div className="admin-rrhh-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="admin-rrhh-modal-header">
              <h2><FiShield /> Asignar Rol</h2>
              <button onClick={() => setModalAsignarRol(false)}><FiX /></button>
            </div>

            <div className="admin-rrhh-modal-body">
              <p className="admin-rrhh-modal-info">
                Empleado: <strong>{empleadoSeleccionado?.nombre} {empleadoSeleccionado?.apellidos}</strong>
              </p>

              <div className="admin-rrhh-form-group">
                <label><FiShield /> Seleccionar Rol</label>
                <select
                  value={rolSeleccionado}
                  onChange={(e) => setRolSeleccionado(e.target.value)}
                  required
                >
                  <option value="">Seleccionar rol...</option>
                  {roles.map(rol => (
                    <option key={rol.id} value={rol.id}>
                      {obtenerNombreRol(rol.nombre)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-rrhh-modal-footer">
              <button
                className="admin-rrhh-btn-secondary"
                onClick={() => setModalAsignarRol(false)}
              >
                <FiX /> Cancelar
              </button>
              <button
                className="admin-rrhh-btn-primary"
                onClick={handleAsignarRol}
              >
                <FiSave /> Asignar Rol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Empleado */}
      {modalEliminar && (
        <div className="admin-rrhh-modal-overlay" onClick={() => setModalEliminar(false)}>
          <div className="admin-rrhh-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="admin-rrhh-modal-header">
              <h2><FiTrash2 /> Eliminar Empleado</h2>
              <button onClick={() => setModalEliminar(false)}><FiX /></button>
            </div>

            <div className="admin-rrhh-modal-body">
              <div className="admin-rrhh-modal-warning">
                <FiAlertCircle />
                <div>
                  <p><strong>¿Estás seguro de que deseas eliminar este empleado?</strong></p>
                  <p className="admin-rrhh-modal-warning-text">
                    Empleado: <strong>{empleadoSeleccionado?.nombre} {empleadoSeleccionado?.apellidos}</strong>
                  </p>
                  <p className="admin-rrhh-modal-warning-text">
                    Correo: <strong>{empleadoSeleccionado?.usuario?.correo}</strong>
                  </p>
                  <p className="admin-rrhh-modal-warning-note">
                    Esta acción eliminará al empleado y todos sus roles asignados. <strong>Esta acción no se puede deshacer.</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-rrhh-modal-footer">
              <button
                className="admin-rrhh-btn-secondary"
                onClick={() => setModalEliminar(false)}
              >
                <FiX /> Cancelar
              </button>
              <button
                className="admin-rrhh-btn-danger"
                onClick={handleEliminarEmpleado}
              >
                <FiTrash2 /> Eliminar Empleado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionarEmpleadosComponent;

