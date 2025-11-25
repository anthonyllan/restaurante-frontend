import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003'}/api/clientes`;

/**
 * Servicio de Perfil de Cliente
 * Gestiona la información del perfil del cliente
 */

/**
 * Obtener perfil del cliente por ID
 */
export const obtenerPerfilCliente = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || 'Error al cargar el perfil del cliente'
    };
  }
};

/**
 * Actualizar datos del perfil
 */
export const actualizarPerfilCliente = async (id, datosActualizados) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, datosActualizados);
    return {
      success: true,
      data: response.data,
      message: 'Perfil actualizado exitosamente'
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || 'Error al actualizar el perfil'
    };
  }
};

/**
 * Subir imagen de perfil
 */
export const subirImagenPerfilCliente = async (id, imagen) => {
  try {
    const formData = new FormData();
    formData.append('imagen', imagen);

    const response = await axios.post(`${BASE_URL}/${id}/imagen`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      success: true,
      data: response.data,
      message: 'Imagen actualizada exitosamente'
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al subir la imagen'
    };
  }
};

/**
 * Eliminar imagen de perfil
 */
export const eliminarImagenPerfilCliente = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}/imagen`);
    return {
      success: true,
      data: response.data,
      message: 'Imagen eliminada exitosamente'
    };
  } catch (error) {
    throw {
      success: false,
      error: error.response?.data || error.message,
      message: 'Error al eliminar la imagen'
    };
  }
};

/**
 * Obtener URL completa de la imagen
 */
export const obtenerUrlImagenCliente = (nombreImagen) => {
  if (!nombreImagen) return null;
  const baseUrl = import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003';
  return `${baseUrl}/uploads/clientes/${nombreImagen}`;
};

/**
 * Cargar imagen de perfil con autenticación (para casos donde las imágenes están protegidas)
 */
export const cargarImagenPerfilCliente = async (nombreImagen) => {
  if (!nombreImagen) return null;
  
  try {
    const baseUrl = import.meta.env.VITE_API_USUARIO_URL || 'http://localhost:2003';
    const imageUrl = `${baseUrl}/uploads/clientes/${nombreImagen}`;
    
    // Intentar cargar la imagen con autenticación
    const response = await axios.get(imageUrl, {
      responseType: 'blob',
      headers: {
        'Accept': 'image/*'
      }
    });
    
    // Crear una URL local para la imagen
    const blobUrl = URL.createObjectURL(response.data);
    return blobUrl;
  } catch (error) {
    // Si falla, devolver la URL directa (para casos donde las imágenes son públicas)
    return obtenerUrlImagenCliente(nombreImagen);
  }
};

