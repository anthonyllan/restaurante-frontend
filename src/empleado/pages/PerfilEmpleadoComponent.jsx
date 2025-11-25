import React, { useState, useEffect } from 'react';
import { 
  FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiX, 
  FiCamera, FiTrash2, FiAlertCircle, FiCheck 
} from 'react-icons/fi';
import {
  obtenerPerfilEmpleado,
  actualizarPerfilEmpleado,
  subirImagenPerfil,
  eliminarImagenPerfil,
  obtenerUrlImagen,
  cargarImagenPerfil
} from '../../services/Empleado/PerfilService';
import { getEmpleadoId } from '../../utils/authUtils';
import './PerfilEmpleadoComponent.css';
import iconoRestaurante from '../../images/icono_restaurante.png';

const PerfilEmpleadoComponent = () => {
  const [empleadoId, setEmpleadoId] = useState(null);

  // Estados
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    usuario: {
      correo: '',
      contrasena: ''
    }
  });

  // Estados para imagen
  const [imagenPreview, setImagenPreview] = useState(null);
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Cargar perfil al montar
  useEffect(() => {
    const id = getEmpleadoId();
    if (id) {
      setEmpleadoId(id);
      cargarPerfil(id);
    } else {
      setError('No se pudo obtener el ID del empleado');
      setLoading(false);
    }
  }, []);

  // Limpiar blob URLs cuando cambie la imagen o al desmontar
  useEffect(() => {
    return () => {
      if (imagenPreview && imagenPreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagenPreview);
      }
    };
  }, [imagenPreview]);

  const cargarPerfil = async (id) => {
    try {
      setLoading(true);
      setError('');
      const response = await obtenerPerfilEmpleado(id);
      setPerfil(response.data);
      
      // Inicializar formulario con datos actuales
      setFormData({
        nombre: response.data.nombre || '',
        apellidos: response.data.apellidos || '',
        telefono: response.data.telefono || '',
        usuario: {
          correo: response.data.usuario?.correo || '',
          contrasena: ''
        }
      });

      // Cargar imagen si existe
      if (response.data.imagen) {
        try {
          // Intentar cargar con autenticación primero
          const imagenUrl = await cargarImagenPerfil(response.data.imagen);
          setImagenPreview(imagenUrl);
        } catch (error) {
          // Si falla, usar URL directa
          const imagenUrl = obtenerUrlImagen(response.data.imagen);
          setImagenPreview(imagenUrl);
        }
      } else {
        setImagenPreview(null);
      }
    } catch (err) {
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'correo' || name === 'contrasena') {
      setFormData(prev => ({
        ...prev,
        usuario: {
          ...prev.usuario,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona una imagen válida');
        return;
      }

      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar 5MB');
        return;
      }

      setNuevaImagen(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubirImagen = async () => {
    if (!nuevaImagen || !empleadoId) return;

    try {
      setSubiendoImagen(true);
      setError('');
      
      const response = await subirImagenPerfil(empleadoId, nuevaImagen);
      setPerfil(response.data);
      setNuevaImagen(null);
      setSuccess('Imagen actualizada exitosamente');
      
      // Disparar evento para actualizar el header
      window.dispatchEvent(new CustomEvent('perfilActualizado'));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleEliminarImagen = async () => {
    if (!window.confirm('¿Estás seguro de eliminar tu foto de perfil?') || !empleadoId) return;

    try {
      setSubiendoImagen(true);
      setError('');
      
      const response = await eliminarImagenPerfil(empleadoId);
      setPerfil(response.data);
      setImagenPreview(null);
      setNuevaImagen(null);
      setSuccess('Imagen eliminada exitosamente');
      
      // Disparar evento para actualizar el header
      window.dispatchEvent(new CustomEvent('perfilActualizado'));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al eliminar la imagen');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleGuardarCambios = async () => {
    if (!empleadoId) {
      setError('No se pudo obtener el ID del empleado');
      return;
    }

    try {
      setGuardando(true);
      setError('');

      // Validaciones básicas
      if (!formData.nombre || !formData.apellidos) {
        setError('Nombre y apellidos son obligatorios');
        return;
      }

      // Si hay nueva imagen, subirla primero
      if (nuevaImagen) {
        await handleSubirImagen();
      }

      // Preparar datos para enviar
      const datosActualizados = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        usuario: {
          correo: formData.usuario.correo,
          // Solo enviar contraseña si se proporcionó
          ...(formData.usuario.contrasena && { contrasena: formData.usuario.contrasena })
        }
      };

      const response = await actualizarPerfilEmpleado(empleadoId, datosActualizados);
      setPerfil(response.data);
      setModoEdicion(false);
      setSuccess('Perfil actualizado exitosamente');
      
      // Limpiar campo de contraseña
      setFormData(prev => ({
        ...prev,
        usuario: {
          ...prev.usuario,
          contrasena: ''
        }
      }));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    setModoEdicion(false);
    setNuevaImagen(null);
    
    // Restaurar datos originales
    if (perfil) {
      setFormData({
        nombre: perfil.nombre || '',
        apellidos: perfil.apellidos || '',
        telefono: perfil.telefono || '',
        usuario: {
          correo: perfil.usuario?.correo || '',
          contrasena: ''
        }
      });

      // Restaurar imagen original
      if (perfil.imagen) {
        setImagenPreview(obtenerUrlImagen(perfil.imagen));
      } else {
        setImagenPreview(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="emp-perfil-loading">
        <div className="emp-perfil-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="emp-perfil-container">
      {/* Header */}
      <div className="emp-perfil-header">
        <div className="emp-perfil-header-content">
          <h1><FiUser /> Perfil</h1>
          <p>Información personal</p>
        </div>
        {!modoEdicion && (
          <button 
            className="emp-perfil-btn-primary"
            onClick={() => setModoEdicion(true)}
          >
            <FiEdit2 /> Editar Perfil
          </button>
        )}
      </div>

      {/* Alertas */}
      {error && (
        <div className="emp-perfil-alert error">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={() => setError('')}><FiX /></button>
        </div>
      )}

      {success && (
        <div className="emp-perfil-alert success">
          <FiCheck />
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><FiX /></button>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="emp-perfil-content">
        {/* Sección de Imagen */}
        <div className="emp-perfil-card emp-perfil-imagen-section">
          <h2>Foto de Perfil</h2>
          
          <div className="emp-perfil-imagen-container">
            {imagenPreview ? (
              <img 
                src={imagenPreview} 
                alt="Perfil" 
                className="emp-perfil-imagen"
                onError={(e) => {
                  e.target.src = iconoRestaurante;
                }}
              />
            ) : (
              <div className="emp-perfil-imagen-placeholder">
                <FiUser />
              </div>
            )}
          </div>

          {modoEdicion && (
            <div className="emp-perfil-imagen-controles">
              <label className="emp-perfil-btn-secondary">
                <FiCamera /> Seleccionar Imagen
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  style={{ display: 'none' }}
                />
              </label>

              {nuevaImagen && (
                <button
                  className="emp-perfil-btn-primary"
                  onClick={handleSubirImagen}
                  disabled={subiendoImagen}
                >
                  {subiendoImagen ? 'Subiendo...' : 'Subir Imagen'}
                </button>
              )}

              {(imagenPreview && perfil?.imagen) && (
                <button
                  className="emp-perfil-btn-danger"
                  onClick={handleEliminarImagen}
                  disabled={subiendoImagen}
                >
                  <FiTrash2 /> Eliminar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sección de Información */}
        <div className="emp-perfil-card emp-perfil-info-section">
          <h2>Información Personal</h2>

          <div className="emp-perfil-form">
            {/* Nombre */}
            <div className="emp-perfil-form-group">
              <label>
                <FiUser /> Nombre
              </label>
              {modoEdicion ? (
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Tu nombre"
                  required
                />
              ) : (
                <p className="emp-perfil-value">{perfil?.nombre}</p>
              )}
            </div>

            {/* Apellidos */}
            <div className="emp-perfil-form-group">
              <label>
                <FiUser /> Apellidos
              </label>
              {modoEdicion ? (
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  placeholder="Tus apellidos"
                  required
                />
              ) : (
                <p className="emp-perfil-value">{perfil?.apellidos}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="emp-perfil-form-group">
              <label>
                <FiPhone /> Teléfono
              </label>
              {modoEdicion ? (
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Tu teléfono"
                />
              ) : (
                <p className="emp-perfil-value">{perfil?.telefono || 'No registrado'}</p>
              )}
            </div>

            {/* Correo */}
            <div className="emp-perfil-form-group">
              <label>
                <FiMail /> Correo Electrónico
              </label>
              {modoEdicion ? (
                <input
                  type="email"
                  name="correo"
                  value={formData.usuario.correo}
                  onChange={handleInputChange}
                  placeholder="tu@correo.com"
                  required
                />
              ) : (
                <p className="emp-perfil-value">{perfil?.usuario?.correo}</p>
              )}
            </div>

            {/* Contraseña (solo en modo edición) */}
            {modoEdicion && (
              <div className="emp-perfil-form-group">
                <label>
                  Cambiar Contraseña (opcional)
                </label>
                <input
                  type="password"
                  name="contrasena"
                  value={formData.usuario.contrasena}
                  onChange={handleInputChange}
                  placeholder="Dejar vacío para no cambiar"
                />
                <small className="emp-perfil-hint">
                  Solo completa este campo si deseas cambiar tu contraseña
                </small>
              </div>
            )}

            {/* Botones de acción (modo edición) */}
            {modoEdicion && (
              <div className="emp-perfil-actions">
                <button
                  className="emp-perfil-btn-secondary"
                  onClick={handleCancelar}
                  disabled={guardando}
                >
                  <FiX /> Cancelar
                </button>
                <button
                  className="emp-perfil-btn-primary"
                  onClick={handleGuardarCambios}
                  disabled={guardando}
                >
                  {guardando ? (
                    'Guardando...'
                  ) : (
                    <><FiSave /> Guardar Cambios</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilEmpleadoComponent;

