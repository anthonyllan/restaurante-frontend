import React, { useState, useEffect } from 'react';
import { 
  listCategorias, 
  guardarCategoria, 
  actualizarCategoria, 
  eliminarCategoria,
  getCategoriaById,
  verificarConexion,
  formatearNombre,
  truncarDescripcion,
  subirImagen
} from '../../../services/GestionarMenu/CategoriaService';
import { getImageUrl } from '../../../config/api';
import './CategoriaComponent.css';

const CategoriaComponent = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategoria, setCurrentCategoria] = useState({ 
    id: null, 
    nombre: '', 
    descripcion: '',
    imagen: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);


  const validarImagen = (file) => {
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    if (!tiposPermitidos.includes(file.type)) throw new Error('Tipo de archivo no permitido');
    if (file.size > maxSize) throw new Error('El archivo es muy grande. Máximo 5MB');
    return true;
  };

  useEffect(() => {
    cargarCategorias();
    verificarConexion();
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const response = await listCategorias();
      setCategorias(response.data || []);
    } catch (error) {
      setError('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = async (categoria = null) => {
    setError('');
    setSuccess('');
    if (categoria && categoria.id) {
      setEditMode(true);
      setCurrentCategoria({ ...categoria });
      if (categoria.imagen) setPreviewUrl(getImageUrl(categoria.imagen));
    } else {
      setEditMode(false);
      setCurrentCategoria({ id: null, nombre: '', descripcion: '', imagen: '' });
      setPreviewUrl('');
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setCurrentCategoria({ id: null, nombre: '', descripcion: '', imagen: '' });
    setEditMode(false);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategoria(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    try {
      if (file) {
        validarImagen(file);
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let imagenUrl = currentCategoria.imagen;

      // Upload image first if a new file is selected
      if (selectedFile) {
        setUploadingImage(true);
        const uploadResponse = await subirImagen(selectedFile);
        imagenUrl = uploadResponse.data.rutaImagen;
        setUploadingImage(false);
      }

      // Save category with the image path
      const categoriaToSave = {
        ...currentCategoria,
        imagen: imagenUrl
      };

      if (editMode) {
        await actualizarCategoria(currentCategoria.id, categoriaToSave);
      } else {
        await guardarCategoria(categoriaToSave);
      }
      
      await cargarCategorias();
      setSuccess(editMode ? 'Actualizado correctamente' : 'Guardado correctamente');
      cerrarModal();
    } catch (error) {
      setError('Error al guardar la categoría');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const handleEliminar = async (categoria) => {
    if (window.confirm(`¿Eliminar categoría "${categoria.nombre}"?`)) {
      try {
        await eliminarCategoria(categoria.id);
        await cargarCategorias();
      } catch {
        setError('Error al eliminar');
      }
    }
  };

  if (loading) return <div className="emp-loading">Cargando...</div>;

  return (
    <div className="emp-categoria-container">
      <div className="emp-header-section">
        <div className="emp-header-content">
          <h1>Gestión de Categorías</h1>
          <p>Administra las categorías de productos del restaurante</p>
        </div>
        <button 
          className="emp-btn emp-btn-primary"
          onClick={() => abrirModal()}
          disabled={submitting}
        >
          Agregar Categoría
        </button>
      </div>

      {error && <div className="emp-alert emp-alert-error">{error}</div>}
      {success && <div className="emp-alert emp-alert-success">{success}</div>}

      <div className="emp-table-container">
        <table className="emp-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length > 0 ? (
              categorias.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    {c.imagen ? (
                      <img src={getImageUrl(c.imagen)} alt={c.nombre} className="emp-imagen" />
                    ) : (
                      <div className="emp-imagen-placeholder">Sin imagen</div>
                    )}
                  </td>
                  <td>{c.nombre}</td>
                  <td>{c.descripcion}</td>
                  <td>
                    <button className="emp-btn emp-btn-edit" onClick={() => abrirModal(c)}>Editar</button>
                    <button className="emp-btn emp-btn-delete" onClick={() => handleEliminar(c)}>Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="emp-no-data">No hay categorías registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="emp-modal-overlay" onClick={(e) => e.target === e.currentTarget && cerrarModal()}>
          <div className="emp-modal">
            <div className="emp-modal-header">
              <h2>{editMode ? 'Editar Categoría' : 'Agregar Categoría'}</h2>
              <button className="emp-btn-close" onClick={cerrarModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="emp-modal-body">
                <label>Nombre</label>
                <input type="text" name="nombre" value={currentCategoria.nombre} onChange={handleInputChange} required />
                <label>Descripción</label>
                <textarea name="descripcion" value={currentCategoria.descripcion} onChange={handleInputChange} required />
                <label>Imagen</label>
                <input type="file" onChange={handleFileChange} />
                {previewUrl && <img src={previewUrl} alt="Preview" className="emp-preview-img" />}
                {uploadingImage && (
                  <div className="emp-upload-progress">
                    <p>Subiendo imagen...</p>
                  </div>
                )}
              </div>
              <div className="emp-modal-footer">
                <button type="button" className="emp-btn emp-btn-secondary" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="emp-btn emp-btn-primary" disabled={submitting || uploadingImage}>
                  {submitting ? 'Guardando...' : uploadingImage ? 'Subiendo imagen...' : (editMode ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriaComponent;
