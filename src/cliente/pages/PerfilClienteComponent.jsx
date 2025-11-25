import React, { useState, useEffect } from 'react';
import { 
  FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiX, 
  FiCamera, FiTrash2, FiAlertCircle, FiCheck 
} from 'react-icons/fi';
import {
  obtenerPerfilCliente,
  actualizarPerfilCliente,
  subirImagenPerfilCliente,
  eliminarImagenPerfilCliente,
  obtenerUrlImagenCliente,
  cargarImagenPerfilCliente
} from '../../services/Cliente/PerfilClienteService';
import './PerfilClienteComponent.css';
import iconoRestaurante from '../../images/icono_restaurante.png';

const PerfilClienteComponent = () => {
  // Obtener ID del cliente desde localStorage (guardado en el login)
  const getClienteId = () => {
    // Primero intentar con 'usuario' (nombre correcto usado en AuthService)
    let userStr = localStorage.getItem('usuario');
    
    // Si no existe, intentar con 'user' (por compatibilidad)
    if (!userStr) {
      userStr = localStorage.getItem('user');
    }
    
    // También podemos obtenerlo directamente de 'userId'
    const directUserId = localStorage.getItem('userId');
    if (directUserId) {
      return parseInt(directUserId, 10);
    }
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch (error) {
        return null;
      }
    }
    
    return null;
  };

  const CLIENTE_ID = getClienteId();

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
    if (CLIENTE_ID) {
      cargarPerfil();
    } else {
      setError('No se pudo obtener el ID del cliente. Por favor, inicia sesión nuevamente.');
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

  const cargarPerfil = async () => {
    if (!CLIENTE_ID) {
      setError('ID de cliente no válido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await obtenerPerfilCliente(CLIENTE_ID);
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
          const imagenUrl = await cargarImagenPerfilCliente(response.data.imagen);
          setImagenPreview(imagenUrl);
        } catch (error) {
          // Si falla, usar URL directa
          const imagenUrl = obtenerUrlImagenCliente(response.data.imagen);
          setImagenPreview(imagenUrl);
        }
      } else {
        setImagenPreview(null);
      }
    } catch (err) {
      const errorMsg = err.message || 'Error al cargar el perfil. Por favor, intenta nuevamente.';
      setError(errorMsg);
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
    if (!nuevaImagen) return;

    try {
      setSubiendoImagen(true);
      setError('');
      
      const response = await subirImagenPerfilCliente(CLIENTE_ID, nuevaImagen);
      setPerfil(response.data);
      setNuevaImagen(null);
      setSuccess('Imagen actualizada exitosamente');
      
      // Disparar evento para actualizar el header
      window.dispatchEvent(new CustomEvent('perfilActualizado'));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al subir imagen:', err);
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleEliminarImagen = async () => {
    if (!window.confirm('¿Estás seguro de eliminar tu foto de perfil?')) return;

    try {
      setSubiendoImagen(true);
      setError('');
      
      const response = await eliminarImagenPerfilCliente(CLIENTE_ID);
      setPerfil(response.data);
      setImagenPreview(null);
      setNuevaImagen(null);
      setSuccess('Imagen eliminada exitosamente');
      
      // Disparar evento para actualizar el header
      window.dispatchEvent(new CustomEvent('perfilActualizado'));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
      setError(err.message || 'Error al eliminar la imagen');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleGuardarCambios = async () => {
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

      // Preparar datos para actualizar
      const datosActualizados = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        usuario: {
          correo: formData.usuario.correo
        }
      };

      // Solo incluir contraseña si se proporcionó una nueva
      if (formData.usuario.contrasena) {
        datosActualizados.usuario.contrasena = formData.usuario.contrasena;
      }

      const response = await actualizarPerfilCliente(CLIENTE_ID, datosActualizados);
      setPerfil(response.data);
      setSuccess('Perfil actualizado exitosamente');
      setModoEdicion(false);
      
      // Disparar evento para actualizar el header
      window.dispatchEvent(new CustomEvent('perfilActualizado'));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelarEdicion = async () => {
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
      
      if (perfil.imagen) {
        try {
          const imagenUrl = await cargarImagenPerfilCliente(perfil.imagen);
          setImagenPreview(imagenUrl);
        } catch (error) {
          const imagenUrl = obtenerUrlImagenCliente(perfil.imagen);
          setImagenPreview(imagenUrl);
        }
      }
    }
    setNuevaImagen(null);
    setModoEdicion(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="cli-perfil-loading">
        <div className="cli-perfil-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="cli-perfil-container">
      {/* Header */}
      <div className="cli-perfil-header">
        <div className="cli-perfil-header-content">
          <h1><FiUser /> Mi Perfil</h1>
          <p>Información personal</p>
        </div>
        {!modoEdicion && (
          <button 
            className="cli-perfil-btn-primary"
            onClick={() => setModoEdicion(true)}
          >
            <FiEdit2 /> Editar Perfil
          </button>
        )}
      </div>

      {/* Alertas */}
      {error && (
        <div className="cli-perfil-alert error">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={() => setError('')}><FiX /></button>
        </div>
      )}

      {success && (
        <div className="cli-perfil-alert success">
          <FiCheck />
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><FiX /></button>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="cli-perfil-content">
        {/* Sección de Imagen */}
        <div className="cli-perfil-card cli-perfil-imagen-section">
          <h2>Foto de Perfil</h2>
          
          <div className="cli-perfil-imagen-container">
            {imagenPreview ? (
              <img 
                src={imagenPreview} 
                alt="Perfil" 
                className="cli-perfil-imagen"
                onError={(e) => {
                  e.target.src = iconoRestaurante;
                }}
              />
            ) : (
              <div className="cli-perfil-imagen-placeholder">
                <FiUser size={60} />
              </div>
            )}
          </div>

          {modoEdicion && (
            <div className="cli-perfil-imagen-actions">
              <label className="cli-perfil-btn-secondary">
                <FiCamera /> Cambiar Foto
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImagenChange}
                  style={{display: 'none'}}
                />
              </label>
              
              {(imagenPreview || perfil?.imagen) && (
                <button 
                  className="cli-perfil-btn-danger"
                  onClick={handleEliminarImagen}
                  disabled={subiendoImagen}
                >
                  <FiTrash2 /> Eliminar
                </button>
              )}
            </div>
          )}

          {nuevaImagen && (
            <button 
              className="cli-perfil-btn-primary"
              onClick={handleSubirImagen}
              disabled={subiendoImagen}
              style={{marginTop: '12px', width: '100%'}}
            >
              {subiendoImagen ? 'Subiendo...' : 'Guardar Imagen'}
            </button>
          )}
        </div>

        {/* Información Personal */}
        <div className="cli-perfil-card">
          <h2>Información Personal</h2>
          
          <div className="cli-perfil-grid">
            <div className="cli-perfil-field">
              <label><FiUser /> Nombre</label>
              {modoEdicion ? (
                <input 
                  type="text" 
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Tu nombre"
                />
              ) : (
                <p>{perfil?.nombre || 'No especificado'}</p>
              )}
            </div>

            <div className="cli-perfil-field">
              <label><FiUser /> Apellidos</label>
              {modoEdicion ? (
                <input 
                  type="text" 
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  placeholder="Tus apellidos"
                />
              ) : (
                <p>{perfil?.apellidos || 'No especificado'}</p>
              )}
            </div>

            <div className="cli-perfil-field">
              <label><FiPhone /> Teléfono</label>
              {modoEdicion ? (
                <input 
                  type="tel" 
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Tu teléfono"
                />
              ) : (
                <p>{perfil?.telefono || 'No especificado'}</p>
              )}
            </div>

            <div className="cli-perfil-field">
              <label><FiMail /> Correo Electrónico</label>
              {modoEdicion ? (
                <input 
                  type="email" 
                  name="correo"
                  value={formData.usuario.correo}
                  onChange={handleInputChange}
                  placeholder="Tu correo"
                />
              ) : (
                <p>{perfil?.usuario?.correo || 'No especificado'}</p>
              )}
            </div>
          </div>

          {modoEdicion && (
            <div className="cli-perfil-field" style={{marginTop: '20px'}}>
              <label>Nueva Contraseña (opcional)</label>
              <input 
                type="password" 
                name="contrasena"
                value={formData.usuario.contrasena}
                onChange={handleInputChange}
                placeholder="Dejar en blanco para mantener la actual"
              />
              <small>Solo completa este campo si deseas cambiar tu contraseña</small>
            </div>
          )}

          {modoEdicion && (
            <div className="cli-perfil-actions">
              <button 
                className="cli-perfil-btn-primary"
                onClick={handleGuardarCambios}
                disabled={guardando}
              >
                {guardando ? (
                  <>Guardando...</>
                ) : (
                  <><FiSave /> Guardar Cambios</>
                )}
              </button>
              <button 
                className="cli-perfil-btn-secondary"
                onClick={handleCancelarEdicion}
                disabled={guardando}
              >
                <FiX /> Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilClienteComponent;

