import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { login, getRedirectPath } from '../services/AuthService';
import './LoginComponent.css';
import logoRestaurante from '../images/logo-restaurante.png';

const LoginComponent = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    correo: '',
    contrasena: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.correo || !formData.contrasena) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await login(formData.correo, formData.contrasena);
      
      if (response.success) {
        // El login service ya guardó los datos en localStorage
        // Obtener el tipo desde localStorage (ya procesado y normalizado)
        const tipoUsuario = localStorage.getItem('tipo') || response.data.tipo;
        
        // Redirigir según el tipo de usuario
        const redirectPath = getRedirectPath(tipoUsuario);
        
        // Usar window.location.href para forzar recarga completa si es necesario
        if (redirectPath && redirectPath !== '/login') {
          navigate(redirectPath, { replace: true });
          // Forzar recarga si la navegación no funciona
          setTimeout(() => {
            if (window.location.pathname === '/login') {
              window.location.href = redirectPath;
            }
          }, 100);
        } else {
          setError('Error al determinar la ruta de acceso. Por favor, contacta al administrador.');
        }
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      
      <div className="auth-content">
        <div className="auth-card">
          {/* Logo y Título */}
          <div className="auth-header">
            <img src={logoRestaurante} alt="Logo" className="auth-logo" />
            <h1>Bienvenido</h1>
            <p>Inicia sesión para continuar</p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="auth-alert error">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
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
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            <button 
              type="submit" 
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Link a Registro */}
          <div className="auth-footer">
            <p>
              ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;

