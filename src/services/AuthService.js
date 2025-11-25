import axios from 'axios';
import { obtenerPerfilEmpleado } from './Empleado/PerfilService';
import { API_USUARIO_URL } from '../config/api.js';

const BASE_URL = `${API_USUARIO_URL}/api/auth`;

/**
 * Decodificar JWT token sin verificación (solo para leer el payload)
 */
const decodeJWT = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

/**
 * Obtener el rol específico del empleado desde el backend
 * @param {number} empleadoId - ID del empleado (no del usuario)
 */
const obtenerRolEmpleado = async (empleadoId) => {
  try {
    // Intentar obtener el empleado directamente por ID (este ES el ID del empleado)
    try {
      const response = await obtenerPerfilEmpleado(empleadoId);
      
      if (response.success && response.data) {
        const empleado = response.data;
        
        // Buscar roles en diferentes estructuras posibles
        if (empleado.roles && Array.isArray(empleado.roles) && empleado.roles.length > 0) {
          const roles = empleado.roles;
          
          const rolEspecifico = roles.find(r => {
            const nombreRol = typeof r === 'string' ? r : (r.nombre || r.rol);
            return nombreRol === 'r_cajero' || nombreRol === 'r_gerente' || nombreRol === 'r_admin';
          });
          
          if (rolEspecifico) {
            const nombreRol = typeof rolEspecifico === 'string' ? rolEspecifico : (rolEspecifico.nombre || rolEspecifico.rol);
            if (nombreRol === 'r_cajero') return 'CAJERO';
            if (nombreRol === 'r_gerente') return 'GERENTE';
            if (nombreRol === 'r_admin') return 'ADMIN';
          }
          
          // Si no encontramos uno específico, usar el primero
          const primerRol = roles[0];
          const nombrePrimerRol = typeof primerRol === 'string' ? primerRol : (primerRol.nombre || primerRol.rol || '');
          if (nombrePrimerRol.includes('cajero') || nombrePrimerRol === 'r_cajero') return 'CAJERO';
          if (nombrePrimerRol.includes('gerente') || nombrePrimerRol === 'r_gerente') return 'GERENTE';
          if (nombrePrimerRol.includes('admin') || nombrePrimerRol === 'r_admin') return 'ADMIN';
        }
        
        // Si hay un campo rol directo
        if (empleado.rol) {
          const rol = empleado.rol.toUpperCase();
          if (rol.includes('CAJERO')) return 'CAJERO';
          if (rol.includes('GERENTE')) return 'GERENTE';
          if (rol.includes('ADMIN')) return 'ADMIN';
        }
        
        // Buscar en empleadoRoles (tabla relacionada)
        if (empleado.empleadoRoles && Array.isArray(empleado.empleadoRoles) && empleado.empleadoRoles.length > 0) {
          const empleadoRoles = empleado.empleadoRoles;
          for (const empRol of empleadoRoles) {
            const rol = empRol.rol || empRol;
            const nombreRol = rol?.nombre || rol;
            if (nombreRol === 'r_cajero') return 'CAJERO';
            if (nombreRol === 'r_gerente') return 'GERENTE';
            if (nombreRol === 'r_admin') return 'ADMIN';
          }
        }
        
        // Buscar en rolesEmpleado (otra posible estructura)
        if (empleado.rolesEmpleado && Array.isArray(empleado.rolesEmpleado) && empleado.rolesEmpleado.length > 0) {
          const rolesEmpleado = empleado.rolesEmpleado;
          for (const empRol of rolesEmpleado) {
            const rol = empRol.rol || empRol;
            const nombreRol = rol?.nombre || rol;
            if (nombreRol === 'r_cajero') return 'CAJERO';
            if (nombreRol === 'r_gerente') return 'GERENTE';
            if (nombreRol === 'r_admin') return 'ADMIN';
          }
        }
        
        // Buscar dentro de usuario.roles
        if (empleado.usuario && empleado.usuario.roles && Array.isArray(empleado.usuario.roles) && empleado.usuario.roles.length > 0) {
          const roles = empleado.usuario.roles;
          for (const rol of roles) {
            const nombreRol = typeof rol === 'string' ? rol : (rol.nombre || rol);
            if (nombreRol === 'r_cajero') return 'CAJERO';
            if (nombreRol === 'r_gerente') return 'GERENTE';
            if (nombreRol === 'r_admin') return 'ADMIN';
          }
        }
        
        // Si no encontramos roles en la respuesta, consultar directamente los roles del empleado
        const empleadoIdLocal = empleado.id;
        if (empleadoIdLocal) {
          // Intentar diferentes endpoints posibles para obtener roles
          const endpointsPosibles = [
            `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/empleados/${empleadoIdLocal}/roles`,
            `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/roles/empleado/${empleadoIdLocal}`,
            `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/empleadorol/empleado/${empleadoIdLocal}`,
            `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/empleadorol/empleado/${empleadoIdLocal}/roles`,
            `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/empleadorol?empleado=${empleadoIdLocal}`
          ];
          
          for (const endpoint of endpointsPosibles) {
            try {
              const rolesResponse = await axios.get(endpoint);
              
              if (rolesResponse.data) {
                const rolesData = Array.isArray(rolesResponse.data) ? rolesResponse.data : [rolesResponse.data];
                
                for (const rolData of rolesData) {
                  // Buscar el nombre del rol en diferentes estructuras
                  let nombreRol = null;
                  
                  if (typeof rolData === 'string') {
                    nombreRol = rolData;
                  } else if (rolData.nombre) {
                    nombreRol = rolData.nombre;
                  } else if (rolData.rol?.nombre) {
                    nombreRol = rolData.rol.nombre;
                  } else if (rolData.rol) {
                    nombreRol = typeof rolData.rol === 'string' ? rolData.rol : rolData.rol.nombre;
                  }
                  
                  if (nombreRol) {
                    if (nombreRol === 'r_cajero') {
                      return 'CAJERO';
                    }
                    if (nombreRol === 'r_gerente') {
                      return 'GERENTE';
                    }
                    if (nombreRol === 'r_admin') {
                      return 'ADMIN';
                    }
                  }
                }
              }
            } catch (errorEndpoint) {
              // Continuar con el siguiente endpoint
            }
          }
        }
      }
    } catch (error) {
      // Si falla, intentar buscar por usuario
    }
    
    // Si el empleado no se encontró por ID directo, intentar buscar en la lista de empleados
    // Último recurso: obtener todos los empleados y buscar el que tenga ese empleadoId
    try {
      const todosEmpleadosUrl = `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/empleados`;
      
      const response = await axios.get(todosEmpleadosUrl);
      if (response.data && Array.isArray(response.data)) {
        // Buscar por ID del empleado directamente (ya que el login devuelve el ID del empleado)
        const empleadoEncontrado = response.data.find(emp => emp.id === empleadoId);
        
        if (empleadoEncontrado) {
          if (empleadoEncontrado.roles && Array.isArray(empleadoEncontrado.roles) && empleadoEncontrado.roles.length > 0) {
            const roles = empleadoEncontrado.roles;
            const rolEspecifico = roles.find(r => {
              const nombreRol = typeof r === 'string' ? r : (r.nombre || r.rol);
              return nombreRol === 'r_cajero' || nombreRol === 'r_gerente' || nombreRol === 'r_admin';
            });
            
            if (rolEspecifico) {
              const nombreRol = typeof rolEspecifico === 'string' ? rolEspecifico : (rolEspecifico.nombre || rolEspecifico.rol);
              if (nombreRol === 'r_cajero') return 'CAJERO';
              if (nombreRol === 'r_gerente') return 'GERENTE';
              if (nombreRol === 'r_admin') return 'ADMIN';
            }
          }
          
          // Buscar en empleadoRoles
          if (empleadoEncontrado.empleadoRoles && Array.isArray(empleadoEncontrado.empleadoRoles) && empleadoEncontrado.empleadoRoles.length > 0) {
            const empleadoRoles = empleadoEncontrado.empleadoRoles;
            for (const empRol of empleadoRoles) {
              const rol = empRol.rol || empRol;
              const nombreRol = rol?.nombre || rol;
              if (nombreRol === 'r_cajero') return 'CAJERO';
              if (nombreRol === 'r_gerente') return 'GERENTE';
              if (nombreRol === 'r_admin') return 'ADMIN';
            }
          }
          
          // Buscar en rolesEmpleado
          if (empleadoEncontrado.rolesEmpleado && Array.isArray(empleadoEncontrado.rolesEmpleado) && empleadoEncontrado.rolesEmpleado.length > 0) {
            const rolesEmpleado = empleadoEncontrado.rolesEmpleado;
            for (const empRol of rolesEmpleado) {
              const rol = empRol.rol || empRol;
              const nombreRol = rol?.nombre || rol;
              if (nombreRol === 'r_cajero') return 'CAJERO';
              if (nombreRol === 'r_gerente') return 'GERENTE';
              if (nombreRol === 'r_admin') return 'ADMIN';
            }
          }
          
          // Buscar dentro de usuario.roles
          if (empleadoEncontrado.usuario && empleadoEncontrado.usuario.roles && Array.isArray(empleadoEncontrado.usuario.roles) && empleadoEncontrado.usuario.roles.length > 0) {
            const roles = empleadoEncontrado.usuario.roles;
            for (const rol of roles) {
              const nombreRol = typeof rol === 'string' ? rol : (rol.nombre || rol);
              if (nombreRol === 'r_cajero') return 'CAJERO';
              if (nombreRol === 'r_gerente') return 'GERENTE';
              if (nombreRol === 'r_admin') return 'ADMIN';
            }
          }
          
          // Si encontramos el empleado pero no tiene roles, consultar directamente
          const empleadoIdEncontrado = empleadoEncontrado.id;
          if (empleadoIdEncontrado) {
            const endpointsPosibles = [
              `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/empleados/${empleadoIdEncontrado}/roles`,
              `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/roles/empleado/${empleadoIdEncontrado}`,
              `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/empleadorol/empleado/${empleadoIdEncontrado}`,
              `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/empleadorol/empleado/${empleadoIdEncontrado}/roles`,
              `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/empleadorol?empleado=${empleadoIdEncontrado}`
            ];
            
            for (const endpoint of endpointsPosibles) {
              try {
                const rolesResponse = await axios.get(endpoint);
                
                if (rolesResponse.data) {
                  const rolesData = Array.isArray(rolesResponse.data) ? rolesResponse.data : [rolesResponse.data];
                  
                  for (const rolData of rolesData) {
                    let nombreRol = null;
                    if (typeof rolData === 'string') {
                      nombreRol = rolData;
                    } else if (rolData.nombre) {
                      nombreRol = rolData.nombre;
                    } else if (rolData.rol?.nombre) {
                      nombreRol = rolData.rol.nombre;
                    } else if (rolData.rol) {
                      nombreRol = typeof rolData.rol === 'string' ? rolData.rol : rolData.rol.nombre;
                    }
                    
                    if (nombreRol) {
                      if (nombreRol === 'r_cajero') {
                        return 'CAJERO';
                      }
                      if (nombreRol === 'r_gerente') {
                        return 'GERENTE';
                      }
                      if (nombreRol === 'r_admin') {
                        return 'ADMIN';
                      }
                    }
                  }
                }
              } catch (errorEndpoint) {
                // Continuar con el siguiente endpoint
              }
            }
          }
        }
      }
    } catch (error3) {
      // Error al listar empleados
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Servicio de Autenticación
 * Gestiona login, registro y tokens
 */

/**
 * Iniciar sesión
 */
export const login = async (correo, contrasena) => {
  try {
    const response = await axios.post(`${BASE_URL}/login`, {
      correo,
      contrasena
    });

    // Guardar datos en localStorage
    if (response.data) {
      localStorage.setItem('usuario', JSON.stringify(response.data));
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.id);
      
      // Determinar el tipo/rol específico del usuario
      let tipoUsuario = response.data.tipo;
      
      // Si es EMPLEADO, buscar el rol específico en la respuesta
      if (tipoUsuario === 'EMPLEADO' || tipoUsuario === 'EMPLOYEE') {
        // Buscar rol en diferentes posibles campos
        if (response.data.rol) {
          tipoUsuario = response.data.rol.toUpperCase();
        } else if (response.data.roles && Array.isArray(response.data.roles) && response.data.roles.length > 0) {
          // Si hay múltiples roles, tomar el primero o buscar CAJERO/GERENTE
          const roles = response.data.roles;
          const rolEspecifico = roles.find(r => r.nombre === 'r_cajero' || r.nombre === 'r_gerente' || r.nombre === 'r_admin');
          if (rolEspecifico) {
            if (rolEspecifico.nombre === 'r_cajero') {
              tipoUsuario = 'CAJERO';
            } else if (rolEspecifico.nombre === 'r_gerente') {
              tipoUsuario = 'GERENTE';
            } else if (rolEspecifico.nombre === 'r_admin') {
              tipoUsuario = 'ADMIN';
            }
          } else if (roles.length > 0) {
            // Mapear el nombre del rol
            const primerRol = roles[0].nombre || roles[0];
            if (primerRol.includes('cajero') || primerRol === 'r_cajero') {
              tipoUsuario = 'CAJERO';
            } else if (primerRol.includes('gerente') || primerRol === 'r_gerente') {
              tipoUsuario = 'GERENTE';
            } else if (primerRol.includes('admin') || primerRol === 'r_admin') {
              tipoUsuario = 'ADMIN';
            }
          }
        } else if (response.data.empleado?.rol) {
          tipoUsuario = response.data.empleado.rol.toUpperCase();
        } else if (response.data.empleado?.roles) {
          const roles = response.data.empleado.roles;
          if (Array.isArray(roles)) {
            const rolEspecifico = roles.find(r => r.nombre === 'r_cajero' || r.nombre === 'r_gerente' || r.nombre === 'r_admin');
            if (rolEspecifico) {
              if (rolEspecifico.nombre === 'r_cajero') tipoUsuario = 'CAJERO';
              else if (rolEspecifico.nombre === 'r_gerente') tipoUsuario = 'GERENTE';
              else if (rolEspecifico.nombre === 'r_admin') tipoUsuario = 'ADMIN';
            }
          }
        }
        
        // Si aún no se encontró el rol, intentar decodificar el JWT token
        if (tipoUsuario === 'EMPLEADO' || tipoUsuario === 'EMPLOYEE') {
          const token = response.data.token;
          if (token) {
            const decoded = decodeJWT(token);
            if (decoded) {
              if (decoded.tipo) {
                const tipoJWT = decoded.tipo.toUpperCase();
                if (tipoJWT === 'CAJERO' || tipoJWT === 'GERENTE' || tipoJWT === 'ADMIN') {
                  tipoUsuario = tipoJWT;
                }
              }
            }
          }
          
          // Si aún no se encontró, hacer llamada al backend para obtener el perfil
          if (tipoUsuario === 'EMPLEADO' || tipoUsuario === 'EMPLOYEE') {
            const empleadoId = response.data.id;
            const correo = response.data.correo;
            
            // Intentar obtener rol desde el backend primero (SOLUCIÓN CORRECTA)
            // Si el backend ya incluye el rol en la respuesta, usarlo directamente
            if (response.data.rol) {
              tipoUsuario = response.data.rol.toUpperCase();
            } else {
              // Si no está en la respuesta, intentar obtenerlo consultando el backend
              try {
                const rolObtenido = await obtenerRolEmpleado(empleadoId);
                
                if (rolObtenido) {
                  tipoUsuario = rolObtenido;
                } else {
                  // SOLUCIÓN TEMPORAL: Fallback a mapeo por correo si el backend no responde
                  if (correo) {
                    const correoLower = correo.toLowerCase();
                    
                    // Mapeo temporal por palabras clave en el correo
                    if (correoLower.includes('cajero')) {
                      tipoUsuario = 'CAJERO';
                    } else if (correoLower.includes('gerente')) {
                      tipoUsuario = 'GERENTE';
                    } else if (correoLower.includes('admin')) {
                      tipoUsuario = 'ADMIN';
                    }
                  }
                }
              } catch (error) {
                // Error al obtener rol desde backend
              }
            }
          }
        }
      }
      
      localStorage.setItem('tipo', tipoUsuario);
    }

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Credenciales incorrectas'
    };
  }
};

/**
 * Registrar nuevo cliente
 */
export const registrarCliente = async (datosRegistro) => {
  try {
    const response = await axios.post(`${BASE_URL}/registro`, datosRegistro);
    return {
      success: true,
      data: response.data,
      message: 'Registro exitoso. Ya puedes iniciar sesión.'
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || 'Error al registrarse'
    };
  }
};

/**
 * Cerrar sesión
 */
export const logout = () => {
  // Limpiar TODOS los datos del localStorage
  localStorage.removeItem('usuario');
  localStorage.removeItem('token');
  localStorage.removeItem('tipo');
  localStorage.removeItem('userId');
  
  // Limpiar también cualquier clave residual
  localStorage.clear();
  
  window.location.href = '/login';
};

/**
 * Obtener usuario actual
 */
export const getCurrentUser = () => {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
};

/**
 * Obtener token actual
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Obtener tipo de usuario
 */
export const getUserType = () => {
  return localStorage.getItem('tipo');
};

/**
 * Obtener ID de usuario
 */
export const getUserId = () => {
  return localStorage.getItem('userId');
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Obtener ruta inicial según tipo de usuario
 */
export const getRedirectPath = (tipo) => {
  // Normalizar el tipo a mayúsculas
  const tipoNormalizado = tipo?.toUpperCase();
  
  let path = '/login'; // Default
  
  switch (tipoNormalizado) {
    case 'ADMIN':
    case 'ADMINISTRADOR':
      path = '/administrador/empleados';
      break;
    case 'GERENTE':
      path = '/empleado/menu';
      break;
    case 'CAJERO':
      path = '/empleado-cajero/venta';
      break;
    case 'CLIENTE':
      path = '/cliente/menu';
      break;
    case 'EMPLEADO':
    case 'EMPLOYEE':
      // Si aún es genérico, intentar obtener el tipo desde localStorage
      const tipoGuardado = localStorage.getItem('tipo');
      if (tipoGuardado && tipoGuardado !== 'EMPLEADO' && tipoGuardado !== 'EMPLOYEE') {
        return getRedirectPath(tipoGuardado);
      }
      path = '/login';
      break;
    default:
      path = '/login';
  }
  
  return path;
};
