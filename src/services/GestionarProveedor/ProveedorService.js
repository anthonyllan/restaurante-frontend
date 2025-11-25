import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/proveedores`;

/**
 * Crear un nuevo proveedor
 */
export const crearProveedor = async (proveedorDto) => {
    try {
        const response = await axios.post(BASE_URL, proveedorDto);
        return {
            success: true,
            data: response.data,
            message: 'Proveedor registrado exitosamente'
        };
    } catch (error) {
        console.error('❌ Error al crear proveedor:', error);
        throw {
            success: false,
            error: error.response?.data || error.message,
            message: error.response?.data?.message || 'Error al registrar el proveedor'
        };
    }
};

/**
 * Buscar proveedor por ID
 */
export const buscarProveedorPorId = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error(`❌ Error al buscar proveedor con ID ${id}:`, error);
        throw {
            success: false,
            error: error.response?.data || error.message,
            message: 'Proveedor no encontrado'
        };
    }
};

/**
 * Obtener todos los proveedores
 */
export const obtenerTodosProveedores = async () => {
    try {
        const response = await axios.get(BASE_URL);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('❌ Error al obtener proveedores:', error);
        throw {
            success: false,
            error: error.response?.data || error.message,
            message: 'Error al cargar los proveedores'
        };
    }
};

/**
 * Obtener solo proveedores activos
 */
export const obtenerProveedoresActivos = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/activos`);
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('❌ Error al obtener proveedores activos:', error);
        throw {
            success: false,
            error: error.response?.data || error.message,
            message: 'Error al cargar los proveedores activos'
        };
    }
};

/**
 * Actualizar proveedor existente
 */
export const actualizarProveedor = async (id, proveedorDto) => {
    try {
        const response = await axios.put(`${BASE_URL}/${id}`, proveedorDto);
        return {
            success: true,
            data: response.data,
            message: 'Proveedor actualizado exitosamente'
        };
    } catch (error) {
        console.error(`❌ Error al actualizar proveedor ${id}:`, error);
        throw {
            success: false,
            error: error.response?.data || error.message,
            message: 'Error al actualizar el proveedor'
        };
    }
};

/**
 * Eliminar proveedor
 */
export const eliminarProveedor = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/${id}`);
        return {
            success: true,
            message: response.data || 'Proveedor eliminado exitosamente'
        };
    } catch (error) {
        console.error(`❌ Error al eliminar proveedor ${id}:`, error);
        throw {
            success: false,
            error: error.response?.data || error.message,
            message: 'Error al eliminar el proveedor'
        };
    }
};

/**
 * Dar de baja (desactivar) un proveedor
 */
export const darDeBajaProveedor = async (id) => {
    try {
        // Obtener proveedor actual
        const proveedorActual = await buscarProveedorPorId(id);
        
        // Actualizar solo el campo activo
        const response = await axios.put(`${BASE_URL}/${id}`, {
            ...proveedorActual.data,
            activo: false
        });
        
        return {
            success: true,
            data: response.data,
            message: 'Proveedor dado de baja exitosamente'
        };
    } catch (error) {
        console.error(`❌ Error al dar de baja proveedor ${id}:`, error);
        throw {
            success: false,
            error: error.response?.data || error.message,
            message: 'Error al dar de baja el proveedor'
        };
    }
};

/**
 * Reactivar un proveedor
 */
export const reactivarProveedor = async (id) => {
    try {
        // Obtener proveedor actual
        const proveedorActual = await buscarProveedorPorId(id);
        
        // Actualizar solo el campo activo
        const response = await axios.put(`${BASE_URL}/${id}`, {
            ...proveedorActual.data,
            activo: true
        });
        
        return {
            success: true,
            data: response.data,
            message: 'Proveedor reactivado exitosamente'
        };
    } catch (error) {
        console.error(`❌ Error al reactivar proveedor ${id}:`, error);
        throw {
            success: false,
            error: error.response?.data || error.message,
            message: 'Error al reactivar el proveedor'
        };
    }
};

