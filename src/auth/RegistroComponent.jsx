import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiPhone, FiAlertCircle, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';
import { registrarCliente } from '../services/AuthService';
import './LoginComponent.css';
import logoRestaurante from '../images/logo-restaurante.png';

const RegistroComponent = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.nombre || !formData.apellidos || !formData.telefono || 
        !formData.correo || !formData.contrasena || !formData.confirmarContrasena) {
      setError('Por favor completa todos los campos');
      return false;
    }

    if (formData.telefono.length < 10) {
      setError('El teléfono debe tener al menos 10 dígitos');
      return false;
    }

    if (formData.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.contrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      const datosRegistro = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        correo: formData.correo,
        contrasena: formData.contrasena
      };

      const response = await registrarCliente(datosRegistro);
      
      if (response.success) {
        setSuccess(response.message);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      
      <div className="auth-content auth-content-registro">
        <div className="auth-card">
          {/* Logo y Título */}
          <div className="auth-header">
            <img src={logoRestaurante} alt="Logo" className="auth-logo" />
            <h1>Crear Cuenta</h1>
            <p>Regístrate para hacer pedidos</p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="auth-alert error">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {/* Alerta de Éxito */}
          {success && (
            <div className="auth-alert success">
              <FiCheck />
              <span>{success}</span>
            </div>
          )}

          {/* Formulario con Grid 2 Columnas */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-grid">
              {/* Nombre */}
              <div className="auth-form-group">
                <label htmlFor="nombre">
                  <FiUser /> Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  autoComplete="given-name"
                />
              </div>

              {/* Apellidos */}
              <div className="auth-form-group">
                <label htmlFor="apellidos">
                  <FiUser /> Apellidos
                </label>
                <input
                  type="text"
                  id="apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  placeholder="Tus apellidos"
                  autoComplete="family-name"
                />
              </div>

              {/* Teléfono */}
              <div className="auth-form-group">
                <label htmlFor="telefono">
                  <FiPhone /> Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="10 dígitos"
                  autoComplete="tel"
                />
              </div>

              {/* Correo - Ancho completo */}
              <div className="auth-form-group full-width">
                <label htmlFor="correo">
                  <FiMail /> Correo Electrónico
                </label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                />
              </div>

              {/* Contraseña */}
              <div className="auth-form-group">
                <label htmlFor="contrasena">
                  <FiLock /> Contraseña
                </label>
                <div className="auth-password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="contrasena"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="auth-form-group">
                <label htmlFor="confirmarContrasena">
                  <FiLock /> Confirmar Contraseña
                </label>
                <div className="auth-password-input">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmarContrasena"
                    name="confirmarContrasena"
                    value={formData.confirmarContrasena}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            </div>

            {/* Botón de Submit */}
            <button 
              type="submit" 
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          {/* Link a Login */}
          <div className="auth-footer">
            <p>
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroComponent;

