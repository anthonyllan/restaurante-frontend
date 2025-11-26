import React, { useState, useEffect } from 'react';
import { 
  listCategorias,
  verificarConexion as verificarConexionCategoria
} from '../../../services/GestionarMenu/CategoriaService';
import { 
  listProductos, 
  guardarProducto, 
  guardarProductoConDias,
  actualizarProducto, 
  eliminarProducto,
  getProductoById,
  subirImagen
} from '../../../services/GestionarMenu/ProductoService';
import { 
  listDiasHabilitados
} from '../../../services/GestionarMenu/DiaSemanaService';
import { 
  getProductoDiasByProducto,
  actualizarDiasProducto
} from '../../../services/GestionarMenu/ProductoDiaService';
import { getImageUrl } from '../../../config/api';
import { FiPlus, FiEdit, FiTrash2, FiX, FiImage, FiSave, FiUpload, FiClock, FiDollarSign, FiCalendar, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { MdInventory, MdCategory, MdDescription, MdAccessTime } from 'react-icons/md';
import { BsCardImage } from 'react-icons/bs';
import './ProductoComponent.css';

const ProductoComponent = () => {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [diasHabilitados, setDiasHabilitados] = useState([]);
  const [diasPorProducto, setDiasPorProducto] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProducto, setCurrentProducto] = useState({
    id: null,
    nombre: '',
    descripcion: '',
    precio: '',
    disponible: true,
    imagen: '',
    tiempoPreparacion: '',
    idCategoria: '',
    diasDisponibles: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);


  const cargarDiasTodosProductos = async (productosData) => {
    try {
      const diasPromises = productosData.map(async (producto) => {
        try {
          const response = await getProductoDiasByProducto(producto.id);
          const diasNombres = response.data.map(pd => pd.dia.nombre);
          return { [producto.id]: diasNombres };
        } catch (error) {
          return { [producto.id]: [] };
        }
      });

      const diasResults = await Promise.all(diasPromises);
      const diasMap = diasResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      
      setDiasPorProducto(diasMap);
    } catch (error) {
      // Error manejado silenciosamente
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [categoriasResponse, productosResponse, diasResponse] = await Promise.all([
        listCategorias(),
        listProductos(),
        listDiasHabilitados()
      ]);

      const categoriasData = categoriasResponse.data || [];
      const productosData = productosResponse.data || [];
      const diasData = diasResponse.data || [];

      setCategorias(categoriasData);
      setProductos(productosData);
      setDiasHabilitados(diasData);

      if (productosData.length > 0) {
        await cargarDiasTodosProductos(productosData);
      }
    } catch (error) {
      setError('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const agruparProductosPorCategoria = () => {
    const grupos = {};

    categorias.forEach(categoria => {
      const productosDeCategoria = productos.filter(producto => {
        const productoCategoriaId = producto.categoria?.id;
        return productoCategoriaId === categoria.id;
      });

      grupos[categoria.id] = {
        categoria,
        productos: productosDeCategoria
      };
    });

    return grupos;
  };

  const cargarDiasDisponibles = async (productoId) => {
    try {
      const response = await getProductoDiasByProducto(productoId);
      return response.data.map(pd => pd.dia.id);
    } catch (error) {
      return [];
    }
  };

  const abrirModal = async (idCategoria, producto = null) => {
    setShowModal(true);
    setEditMode(!!producto);

    if (producto) {
      const diasDisponibles = await cargarDiasDisponibles(producto.id);
      
      setCurrentProducto({
        ...producto,
        idCategoria: producto.categoria?.id,
        diasDisponibles: diasDisponibles
      });
      setPreviewUrl(getImageUrl(producto.imagen));
    } else {
      setCurrentProducto({
        id: null,
        nombre: '',
        descripcion: '',
        precio: '',
        disponible: true,
        imagen: '',
        tiempoPreparacion: '',
        idCategoria: idCategoria || '',
        diasDisponibles: []
      });
      setPreviewUrl('');
    }
    setSelectedFile(null);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setCurrentProducto({
      id: null,
      nombre: '',
      descripcion: '',
      precio: '',
      disponible: true,
      imagen: '',
      tiempoPreparacion: '',
      idCategoria: '',
      diasDisponibles: []
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError('');

      let imagenUrl = currentProducto.imagen;

      if (selectedFile) {
        setUploadingImage(true);
        
        const response = await subirImagen(selectedFile);
        imagenUrl = response.data.url;
        
        setUploadingImage(false);
      }

      const productoToSave = {
        ...currentProducto,
        imagen: imagenUrl,
        precio: parseFloat(currentProducto.precio),
        tiempoPreparacion: parseInt(currentProducto.tiempoPreparacion, 10) || 0,
        idCategoria: parseInt(currentProducto.idCategoria, 10)
      };

      if (editMode) {
        await actualizarProducto(currentProducto.id, productoToSave);
        await actualizarDiasProducto(currentProducto.id, currentProducto.diasDisponibles);
        setSuccess('Producto actualizado correctamente.');
      } else {
        const productoConDias = {
          ...productoToSave,
          diasDisponibles: currentProducto.diasDisponibles
        };
        
        await guardarProductoConDias(productoConDias);
        setSuccess('Producto guardado correctamente.');
      }

      await cargarDatos();
      cerrarModal();
    } catch (error) {
      setError('Error al guardar el producto: ' + error.message);
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const handleEliminar = async (producto) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${producto.nombre}"?`)) {
      return;
    }

    try {
      await eliminarProducto(producto.id);
      setSuccess('Producto eliminado correctamente');
      cargarDatos();
    } catch (error) {
      setError('Error al eliminar el producto: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="emp-loadingContainer">
        <div className="emp-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  const gruposProductos = agruparProductosPorCategoria();

  return (
    <div className="emp-productoContainer">
      <div className="emp-headerSection">
        <div className="emp-headerContent">
          <h1><MdInventory /> Gestión de Productos</h1>
          <p className="emp-headerDescription">
            Administra los productos disponibles en el restaurante organizados por categorías
          </p>
        </div>
      </div>

      {error && (
        <div className="emp-alert emp-alertError">
          <span>{error}</span>
          <button className="emp-alertClose" onClick={() => setError('')}>
            <FiX />
          </button>
        </div>
      )}

      {success && (
        <div className="emp-alert emp-alertSuccess">
          <span>{success}</span>
          <button className="emp-alertClose" onClick={() => setSuccess('')}>
            <FiX />
          </button>
        </div>
      )}

      <div className="emp-categoriasGrid">
        {Object.values(gruposProductos).map(({ categoria, productos: productosCategoria }) => {
          return (
            <div key={categoria.id} className="emp-categoriaSection">
              <div className="emp-categoriaHeader">
                <div className="emp-categoriaInfo">
                  <h2><MdCategory /> {categoria.nombre}</h2>
                  <p>{categoria.descripcion}</p>
                </div>
                <div className="emp-categoriaStats">
                  <span className="productosCount">{productosCategoria.length} productos</span>
                </div>
              </div>

              <div className="emp-productosGrid">
                <div 
                  className="emp-productoCard emp-addCard" 
                  onClick={() => abrirModal(categoria.id)}
                >
                  <div className="emp-addIcon">
                    <FiPlus />
                  </div>
                  <p>Agregar Producto</p>
                </div>

                {productosCategoria.length === 0 ? (
                  <p>No hay productos en esta categoría.</p>
                ) : (
                  productosCategoria.map((producto) => (
                    <div key={producto.id} className="emp-productoCard">
                      <div className="emp-productoImagen">
                        {producto.imagen ? (
                          <img 
                            src={getImageUrl(producto.imagen)} 
                            alt={producto.nombre}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="emp-imagenPlaceholder" style={{display: producto.imagen ? 'none' : 'flex'}}>
                          <BsCardImage />
                          <span>IMG</span>
                        </div>
                      </div>

                      <div className="emp-productoInfo">
                        <h3>{producto.nombre}</h3>
                        <p className="emp-productoDescripcion">{producto.descripcion}</p>
                        
                        <div className="emp-productoDetalles">
                          <div className="emp-precioTiempo">
                            <span className="emp-precio">
                              ${producto.precio}
                            </span>
                            <span className="emp-tiempo">
                              <FiClock /> {producto.tiempoPreparacion || 'N/A'} min
                            </span>
                          </div>
                          
                          <div className="emp-disponibilidad">
                            <span className={`emp-estado ${producto.disponible ? 'emp-disponible' : 'emp-noDisponible'}`}>
                              {producto.disponible ? (
                                <>
                                  <FiCheck /> Disponible
                                </>
                              ) : (
                                <>
                                  <FiAlertCircle /> No disponible
                                </>
                              )}
                            </span>
                          </div>

                          <div className="emp-diasCard">
                            <span className="emp-diasLabel">
                              <FiCalendar /> Disponible:
                            </span>
                            <div className="emp-diasContainer">
                              {diasPorProducto[producto.id] && diasPorProducto[producto.id].length > 0 ? (
                                diasPorProducto[producto.id].map((dia, index) => (
                                  <span key={index} className="emp-diaBadge">
                                    {dia}
                                  </span>
                                ))
                              ) : (
                                <span className="emp-sinDias">Sin días configurados</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="emp-productoActions">
                        <button
                          className="emp-btn emp-btnEdit"
                          onClick={() => abrirModal(categoria.id, producto)}
                        >
                          <FiEdit /> Editar
                        </button>
                        <button
                          className="emp-btn emp-btnDelete"
                          onClick={() => handleEliminar(producto)}
                        >
                          <FiTrash2 /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="emp-modalOverlay">
          <div className="emp-modal">
            <div className="emp-modalHeader">
              <h2>
                <MdInventory /> {editMode ? 'Editar Producto' : 'Agregar Producto'}
              </h2>
              <button className="emp-btnClose" onClick={cerrarModal}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="emp-formGroup">
                <label>
                  <MdInventory /> Nombre
                </label>
                <input
                  type="text"
                  className="emp-formInput"
                  value={currentProducto.nombre}
                  onChange={(e) => setCurrentProducto({ ...currentProducto, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="emp-formGroup">
                <label>
                  <MdDescription /> Descripción
                </label>
                <textarea
                  className="emp-formTextarea"
                  value={currentProducto.descripcion}
                  onChange={(e) => setCurrentProducto({ ...currentProducto, descripcion: e.target.value })}
                  required
                />
              </div>
              <div className="emp-formGroup">
                <label>
                  <FiDollarSign /> Precio
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="emp-formInput"
                  value={currentProducto.precio}
                  onChange={(e) => setCurrentProducto({ ...currentProducto, precio: e.target.value })}
                  required
                />
              </div>
              <div className="emp-formGroup">
                <label>
                  <MdAccessTime /> Tiempo de Preparación (min)
                </label>
                <input
                  type="number"
                  min="0"
                  className="emp-formInput"
                  value={currentProducto.tiempoPreparacion}
                  onChange={(e) => setCurrentProducto({ ...currentProducto, tiempoPreparacion: e.target.value })}
                />
              </div>
              <div className="emp-formGroup">
                <label>
                  <FiCheck /> Disponible
                </label>
                <select
                  className="emp-formSelect"
                  value={currentProducto.disponible}
                  onChange={(e) => setCurrentProducto({ ...currentProducto, disponible: e.target.value === 'true' })}
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="emp-formGroup">
                <label>
                  <FiImage /> Imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="emp-formFileInput"
                  onChange={handleFileChange}
                />
                {previewUrl && (
                  <div className="emp-previewImagen">
                    <img src={previewUrl} alt="Vista previa" />
                  </div>
                )}
                {uploadingImage && (
                  <div className="emp-uploadProgress">
                    <FiUpload /> <p>Subiendo imagen...</p>
                  </div>
                )}
              </div>
              <div className="emp-formGroup">
                <label>
                  <FiCalendar /> Días Disponibles
                </label>
                <div className="emp-diasDisponibles">
                  {diasHabilitados.map((dia) => (
                    <label key={dia.id} className="emp-diaOption">
                      <input
                        type="checkbox"
                        checked={currentProducto.diasDisponibles.includes(dia.id)}
                        onChange={(e) => {
                          const diasDisponibles = [...currentProducto.diasDisponibles];
                          if (e.target.checked) {
                            diasDisponibles.push(dia.id);
                          } else {
                            const index = diasDisponibles.indexOf(dia.id);
                            diasDisponibles.splice(index, 1);
                          }
                          setCurrentProducto({ ...currentProducto, diasDisponibles });
                        }}
                      />
                      {dia.nombre}
                    </label>
                  ))}
                </div>
              </div>
              <div className="emp-modalActions">
                <button 
                  type="button" 
                  className="emp-btn emp-btnSecondary" 
                  onClick={cerrarModal}
                  disabled={submitting}
                >
                  <FiX /> Cancelar
                </button>
                <button 
                  type="submit" 
                  className="emp-btn emp-btnPrimary" 
                  disabled={submitting || uploadingImage}
                >
                  <FiSave /> {submitting ? 'Guardando...' : uploadingImage ? 'Subiendo imagen...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductoComponent;