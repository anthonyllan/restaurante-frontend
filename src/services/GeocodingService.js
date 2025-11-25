import axios from 'axios';

const externalAxios = axios.create();

// API principal que funciona correctamente para Chilpancingo
const API_PRINCIPAL = {
  name: 'CodigosPostalesMX_Libre',
  url: 'https://api.zippopotam.us/mx',
  timeout: 8000,
  parseResponse: async (data, codigoPostal) => {
    try {
      const response = await externalAxios.get(`https://api.zippopotam.us/mx/${codigoPostal}`, {
        timeout: 8000
      });
      
      if (response.data && response.data.places) {
        const resultados = response.data.places.filter(place =>
          place['place name']?.toLowerCase().includes('chilpancingo') ||
          place.state?.toLowerCase().includes('guerrero')
        );
        
        if (resultados.length > 0) {
          return {
            ciudad: response.data['place name'] || 'Chilpancingo de los Bravo',
            estado: response.data.state || 'Guerrero',
            colonias: resultados.map((place, index) => ({
              id: (index + 1).toString(),
              nombre: place['place name'],
              tipo: 'Colonia',
              zona: 'Urbana'
            }))
          };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
};

// API de respaldo (SEPOMEX)
const API_RESPALDO = {
  name: 'SEPOMEX_Directo',
  url: 'https://api-sepomex.hckdrk.mx/query/info_cp',
  timeout: 10000,
  parseResponse: (data) => {
    if (!data || data.length === 0) return null;
    
    const resultados = data.filter(item => {
      const municipio = (item.response?.municipio || item.municipio || '').toLowerCase();
      const estado = (item.response?.estado || item.estado || '').toLowerCase();
      return municipio.includes('chilpancingo') && estado.includes('guerrero');
    });
    
    if (resultados.length === 0) {
      throw new Error('Este código postal no pertenece a Chilpancingo de los Bravo, Guerrero');
    }
    
    return {
      ciudad: resultados[0].response?.municipio || resultados[0].municipio,
      estado: resultados[0].response?.estado || resultados[0].estado,
      colonias: resultados.map((item, index) => ({
        id: (index + 1).toString(),
        nombre: item.response?.d_asenta || item.d_asenta,
        tipo: item.response?.d_tipo_asenta || item.d_tipo_asenta || 'Colonia',
        zona: item.response?.d_zona || item.d_zona || 'Urbana'
      })).filter(col => col.nombre && col.nombre.trim() !== '')
    };
  }
};

const validarCodigoPostalChilpancingo = (cp) => {
  if (!cp) return false;
  const cpString = cp.toString().trim();
  
  if (!/^\d{5}$/.test(cpString)) return false;
  
  const numero = parseInt(cpString);
  return numero >= 39000 && numero <= 39099;
};

export const obtenerInfoPorCodigoPostal = async (codigoPostal) => {
  if (!codigoPostal || !/^\d{5}$/.test(codigoPostal.toString())) {
    throw new Error('El código postal debe tener exactamente 5 dígitos');
  }

  if (!validarCodigoPostalChilpancingo(codigoPostal)) {
    throw new Error(`El código postal ${codigoPostal} no está en el rango de Chilpancingo de los Bravo, Guerrero (39000-39099). Nuestro servicio solo está disponible en este municipio.`);
  }

  // Intentar con API principal (zippopotam.us)
  try {
    const parsedData = await API_PRINCIPAL.parseResponse(null, codigoPostal);
    
    if (parsedData && parsedData.colonias && parsedData.colonias.length > 0) {
      return {
        success: true,
        data: {
          codigoPostal: codigoPostal,
          ciudad: parsedData.ciudad,
          estado: parsedData.estado,
          colonias: parsedData.colonias
        },
        message: `${parsedData.colonias.length} colonias encontradas en Chilpancingo`,
        source: 'zippopotam'
      };
    }
  } catch (error) {
    // Si falla la API principal, intentar con SEPOMEX como respaldo
  }

  // Intentar con API de respaldo (SEPOMEX)
  try {
    const response = await externalAxios.get(`${API_RESPALDO.url}/${codigoPostal}`, {
      timeout: API_RESPALDO.timeout
    });
    
    const parsedData = API_RESPALDO.parseResponse(response.data);
    
    if (parsedData && parsedData.colonias && parsedData.colonias.length > 0) {
      return {
        success: true,
        data: {
          codigoPostal: codigoPostal,
          ciudad: parsedData.ciudad,
          estado: parsedData.estado,
          colonias: parsedData.colonias
        },
        message: `${parsedData.colonias.length} colonias encontradas en Chilpancingo`,
        source: 'sepomex'
      };
    }
  } catch (error) {
    if (error.message.includes('no pertenece a Chilpancingo')) {
      throw error;
    }
  }

  throw new Error(`No se pudieron obtener las colonias del código postal ${codigoPostal}. 

Las posibles causas son:
1. El código postal no existe en Chilpancingo de los Bravo
2. Las APIs están temporalmente no disponibles  
3. El código postal es muy reciente

Intenta con otro código postal o contacta al administrador.`);
};

export const validarCodigoPostalMexicano = (cp) => {
  return validarCodigoPostalChilpancingo(cp);
};

export const obtenerColoniasUnicas = (colonias) => {
  const coloniasUnicas = [];
  const nombresVistos = new Set();

  colonias.forEach(colonia => {
    const nombre = colonia.nombre?.toLowerCase().trim();
    if (nombre && !nombresVistos.has(nombre)) {
      nombresVistos.add(nombre);
      coloniasUnicas.push(colonia);
    }
  });

  return coloniasUnicas.sort((a, b) => a.nombre.localeCompare(b.nombre));
};

export default {
  obtenerInfoPorCodigoPostal,
  validarCodigoPostalMexicano,
  obtenerColoniasUnicas
};