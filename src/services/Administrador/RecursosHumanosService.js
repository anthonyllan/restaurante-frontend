import axios from 'axios';

const BASE_URL_EMPLEADOS = `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/empleados`;
const BASE_URL_ROLES = `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/roles`;
const BASE_URL_EMPLEADO_ROLES = `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/empleado-roles`;

/**
 * Servicio de Recursos Humanos para Administrador
 * Gestiona empleados y sus roles
 */

// ==================== EMPLEADOS ====================

/**
 * Registrar nuevo empleado
 */
export const registrarEmpleado = async (empleadoData) => {
  try {
    const response = await axios.post(BASE_URL_EMPLEADOS, empleadoData);
    return {
      success: true,
      data: response.data,
      message: 'Empleado registrado exitosamente'
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || 'Error al registrar empleado'
    };
  }
};

/**
 * Obtener todos los empleados
 */
export const obtenerTodosEmpleados = async () => {
  try {
    const response = await axios.get(BASE_URL_EMPLEADOS);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar empleados'
    };
  }
};

/**
 * Obtener empleado por ID
 */
export const obtenerEmpleadoPorId = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL_EMPLEADOS}/${id}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar empleado'
    };
  }
};

/**
 * Actualizar empleado
 */
export const actualizarEmpleado = async (id, empleadoData) => {
  try {
    const response = await axios.put(`${BASE_URL_EMPLEADOS}/${id}`, empleadoData);
    return {
      success: true,
      data: response.data,
      message: 'Empleado actualizado exitosamente'
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al actualizar empleado'
    };
  }
};

/**
 * Eliminar empleado
 */
export const eliminarEmpleado = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL_EMPLEADOS}/${id}`);
    return {
      success: true,
      data: response.data,
      message: 'Empleado eliminado exitosamente'
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al eliminar empleado'
    };
  }
};

// ==================== ROLES ====================

/**
 * Obtener todos los roles
 */
export const obtenerTodosRoles = async () => {
  try {
    const response = await axios.get(BASE_URL_ROLES);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar roles'
    };
  }
};

/**
 * Obtener rol por ID
 */
export const obtenerRolPorId = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL_ROLES}/${id}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar rol'
    };
  }
};

// ==================== EMPLEADO-ROLES ====================

/**
 * Asignar rol a empleado
 */
export const asignarRolEmpleado = async (empleadoRolData) => {
  try {
    const response = await axios.post(BASE_URL_EMPLEADO_ROLES, empleadoRolData);
    return {
      success: true,
      data: response.data,
      message: 'Rol asignado exitosamente'
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al asignar rol'
    };
  }
};

/**
 * Obtener roles de un empleado
 */
export const obtenerRolesPorEmpleado = async (empleadoId) => {
  try {
    const response = await axios.get(`${BASE_URL_EMPLEADO_ROLES}/empleado/${empleadoId}/roles`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar roles del empleado'
    };
  }
};

/**
 * Obtener empleados por rol
 */
export const obtenerEmpleadosPorRol = async (rolId) => {
  try {
    const response = await axios.get(`${BASE_URL_EMPLEADO_ROLES}/rol/${rolId}/empleados`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al cargar empleados por rol'
    };
  }
};

// ==================== UTILIDADES ====================

/**
 * Obtener nombre legible del rol
 */
export const obtenerNombreRol = (nombreRol) => {
  const roles = {
    'r_admin': 'Administrador',
    'r_gerente': 'Gerente',
    'r_cajero': 'Cajero'
  };
  return roles[nombreRol] || nombreRol;
};

/**
 * Obtener color del rol para badges
 */
export const obtenerColorRol = (nombreRol) => {
  const colores = {
    'r_admin': '#991b1b',    // Rojo oscuro
    'r_gerente': '#722f37',  // Vino
    'r_cajero': '#1e40af'    // Azul
  };
  return colores[nombreRol] || '#6b7280';
};
