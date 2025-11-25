import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Estado inicial del carrito
const estadoInicial = {
    items: [],
    total: 0,
    cantidad: 0,
    cliente: {
        idCliente: 1, // Por defecto para cajero
        nombre: '',
        telefono: ''
    },
    tipoEntrega: 'PICKUP_EN_MOSTRADOR',
    direccion: {
        calle: '',
        numeroExterior: '',
        numeroInterior: '',
        colonia: '',
        ciudad: '',
        estadoDireccion: '',
        codigoPostal: '',
        referenciasEntrega: ''
    }
};

// Tipos de acciones
const TIPOS_ACCION = {
    AGREGAR_ITEM: 'AGREGAR_ITEM',
    REMOVER_ITEM: 'REMOVER_ITEM',
    ACTUALIZAR_CANTIDAD: 'ACTUALIZAR_CANTIDAD',
    LIMPIAR_CARRITO: 'LIMPIAR_CARRITO',
    ACTUALIZAR_CLIENTE: 'ACTUALIZAR_CLIENTE',
    ACTUALIZAR_TIPO_ENTREGA: 'ACTUALIZAR_TIPO_ENTREGA',
    ACTUALIZAR_DIRECCION: 'ACTUALIZAR_DIRECCION',
    CARGAR_CARRITO: 'CARGAR_CARRITO'
};

// Reducer del carrito
const carritoReducer = (state, action) => {
    switch (action.type) {
        case TIPOS_ACCION.AGREGAR_ITEM: {
            const productoExistente = state.items.find(item => item.id === action.payload.id);
            
            let nuevosItems;
            if (productoExistente) {
                nuevosItems = state.items.map(item =>
                    item.id === action.payload.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            } else {
                nuevosItems = [...state.items, { ...action.payload, cantidad: 1 }];
            }
            
            const nuevoEstado = {
                ...state,
                items: nuevosItems,
                total: calcularTotal(nuevosItems),
                cantidad: calcularCantidadTotal(nuevosItems)
            };
            
            guardarEnLocalStorage(nuevoEstado);
            return nuevoEstado;
        }
        
        case TIPOS_ACCION.REMOVER_ITEM: {
            const nuevosItems = state.items.filter(item => item.id !== action.payload);
            const nuevoEstado = {
                ...state,
                items: nuevosItems,
                total: calcularTotal(nuevosItems),
                cantidad: calcularCantidadTotal(nuevosItems)
            };
            
            guardarEnLocalStorage(nuevoEstado);
            return nuevoEstado;
        }
        
        case TIPOS_ACCION.ACTUALIZAR_CANTIDAD: {
            const { id, cantidad } = action.payload;
            
            if (cantidad <= 0) {
                return carritoReducer(state, { type: TIPOS_ACCION.REMOVER_ITEM, payload: id });
            }
            
            const nuevosItems = state.items.map(item =>
                item.id === id ? { ...item, cantidad } : item
            );
            
            const nuevoEstado = {
                ...state,
                items: nuevosItems,
                total: calcularTotal(nuevosItems),
                cantidad: calcularCantidadTotal(nuevosItems)
            };
            
            guardarEnLocalStorage(nuevoEstado);
            return nuevoEstado;
        }
        
        case TIPOS_ACCION.LIMPIAR_CARRITO: {
            const nuevoEstado = {
                ...estadoInicial,
                cliente: state.cliente // Mantener info del cliente
            };
            
            guardarEnLocalStorage(nuevoEstado);
            return nuevoEstado;
        }
        
        case TIPOS_ACCION.ACTUALIZAR_CLIENTE: {
            const nuevoEstado = {
                ...state,
                cliente: { ...state.cliente, ...action.payload }
            };
            
            guardarEnLocalStorage(nuevoEstado);
            return nuevoEstado;
        }
        
        case TIPOS_ACCION.ACTUALIZAR_TIPO_ENTREGA: {
            const nuevoEstado = {
                ...state,
                tipoEntrega: action.payload
            };
            
            guardarEnLocalStorage(nuevoEstado);
            return nuevoEstado;
        }
        
        case TIPOS_ACCION.ACTUALIZAR_DIRECCION: {
            const nuevoEstado = {
                ...state,
                direccion: { ...state.direccion, ...action.payload }
            };
            
            guardarEnLocalStorage(nuevoEstado);
            return nuevoEstado;
        }
        
        case TIPOS_ACCION.CARGAR_CARRITO: {
            return action.payload;
        }
        
        default:
            return state;
    }
};

// Funciones auxiliares
const calcularTotal = (items) => {
    return items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
};

const calcularCantidadTotal = (items) => {
    return items.reduce((total, item) => total + item.cantidad, 0);
};

const guardarEnLocalStorage = (estado) => {
    try {
        localStorage.setItem('carritoRistorante', JSON.stringify(estado));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
    }
};

const cargarDeLocalStorage = () => {
    try {
        const carritoGuardado = localStorage.getItem('carritoRistorante');
        return carritoGuardado ? JSON.parse(carritoGuardado) : estadoInicial;
    } catch (error) {
        console.error('Error al cargar de localStorage:', error);
        return estadoInicial;
    }
};

// Context
const CarritoContext = createContext();

// Provider del contexto
export const CarritoProvider = ({ children }) => {
    const [state, dispatch] = useReducer(carritoReducer, estadoInicial);

    // Cargar carrito del localStorage al inicializar
    useEffect(() => {
        const carritoGuardado = cargarDeLocalStorage();
        dispatch({ type: TIPOS_ACCION.CARGAR_CARRITO, payload: carritoGuardado });
    }, []);

    // Acciones del carrito
    const agregarItem = (producto) => {
        dispatch({ type: TIPOS_ACCION.AGREGAR_ITEM, payload: producto });
    };

    const removerItem = (idProducto) => {
        dispatch({ type: TIPOS_ACCION.REMOVER_ITEM, payload: idProducto });
    };

    const actualizarCantidad = (idProducto, cantidad) => {
        dispatch({ type: TIPOS_ACCION.ACTUALIZAR_CANTIDAD, payload: { id: idProducto, cantidad } });
    };

    const limpiarCarrito = () => {
        dispatch({ type: TIPOS_ACCION.LIMPIAR_CARRITO });
    };

    const actualizarCliente = (datosCliente) => {
        dispatch({ type: TIPOS_ACCION.ACTUALIZAR_CLIENTE, payload: datosCliente });
    };

    const actualizarTipoEntrega = (tipo) => {
        dispatch({ type: TIPOS_ACCION.ACTUALIZAR_TIPO_ENTREGA, payload: tipo });
    };

    const actualizarDireccion = (direccion) => {
        dispatch({ type: TIPOS_ACCION.ACTUALIZAR_DIRECCION, payload: direccion });
    };

    const value = {
        ...state,
        agregarItem,
        removerItem,
        actualizarCantidad,
        limpiarCarrito,
        actualizarCliente,
        actualizarTipoEntrega,
        actualizarDireccion
    };

    return (
        <CarritoContext.Provider value={value}>
            {children}
        </CarritoContext.Provider>
    );
};

// Hook personalizado para usar el contexto
export const useCarrito = () => {
    const context = useContext(CarritoContext);
    if (!context) {
        throw new Error('useCarrito debe ser usado dentro de CarritoProvider');
    }
    return context;
};

export default CarritoContext;