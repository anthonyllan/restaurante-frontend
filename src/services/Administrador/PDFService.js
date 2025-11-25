import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Servicio de Generación de Reportes PDF
 * Genera reportes de ingresos, ventas y pagos
 */

/**
 * Generar reporte de ingresos en PDF
 */
export const generarReporteIngresosPDF = (datos, periodo, fechaInicio = null, fechaFin = null, clienteCache = {}) => {
  const doc = new jsPDF();
  const fechaActual = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // ============ ENCABEZADO ============
  
  // Logo y título
  doc.setFillColor(114, 47, 55); // Color vino
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE INGRESOS', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión de Restaurante', 105, 28, { align: 'center' });
  
  // ============ INFORMACIÓN DEL REPORTE ============
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPosition = 50;
  
  doc.text(`Fecha de generación: ${fechaActual}`, 14, yPosition);
  yPosition += 7;
  
  // Periodo
  let textoPeriodo = '';
  switch (periodo) {
    case 'hoy':
      textoPeriodo = 'Hoy';
      break;
    case 'semana':
      textoPeriodo = 'Esta Semana';
      break;
    case 'mes':
      textoPeriodo = 'Este Mes';
      break;
    case 'personalizado':
      if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio).toLocaleDateString('es-MX');
        const fin = new Date(fechaFin).toLocaleDateString('es-MX');
        textoPeriodo = `Del ${inicio} al ${fin}`;
      } else {
        textoPeriodo = 'Todos los registros';
      }
      break;
    default:
      textoPeriodo = 'Todos los registros';
  }
  
  doc.text(`Periodo: ${textoPeriodo}`, 14, yPosition);
  yPosition += 10;

  // ============ ESTADÍSTICAS ============
  
  const totalPedidos = datos.pedidos.length;
  const totalIngresos = datos.pagos
    .filter(p => p.estadoPago === 'APROBADO')
    .reduce((sum, p) => sum + (p.monto || 0), 0);
  const pagosTarjeta = datos.pagos.filter(p => p.metodoPago === 'TARJETA').length;
  const pagosEfectivo = datos.pagos.filter(p => p.metodoPago === 'EFECTIVO').length;
  const promedioVenta = totalPedidos > 0 ? totalIngresos / totalPedidos : 0;

  // Cuadro de estadísticas
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(14, yPosition, 182, 35, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN EJECUTIVO', 105, yPosition + 7, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const stats = [
    { label: 'Total de Pedidos:', value: totalPedidos.toString() },
    { label: 'Ingresos Totales:', value: formatearMoneda(totalIngresos) },
    { label: 'Promedio por Pedido:', value: formatearMoneda(promedioVenta) },
    { label: 'Pagos (Tarjeta/Efectivo):', value: `${pagosTarjeta} / ${pagosEfectivo}` }
  ];

  let statsY = yPosition + 15;
  const col1X = 20;
  const col2X = 110;
  
  stats.forEach((stat, index) => {
    const x = index < 2 ? col1X : col2X;
    const y = statsY + ((index % 2) * 8);
    
    doc.setFont('helvetica', 'bold');
    doc.text(stat.label, x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.value, x + 45, y);
  });

  yPosition += 45;

  // ============ TABLA DE INGRESOS ============
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE INGRESOS', 14, yPosition);
  yPosition += 5;

  // Preparar datos de la tabla
  const tableData = datos.pedidos.map(pedido => {
    const pago = datos.pagos.find(p => p.idPedido?.id === pedido.id);

    return [
      `#${pedido.id}`,
      formatearFechaPDF(pedido.fechaCreacion),
      obtenerNombreClienteDesdeCache(pedido, clienteCache),
      pago ? obtenerNombreMetodoPago(pago.metodoPago) : 'N/A',
      pago ? obtenerNombreEstadoPago(pago.estadoPago) : 'N/A',
      pago ? formatearMoneda(pago.monto) : '$0.00'
    ];
  });

  // Configuración de la tabla
  autoTable(doc, {
    startY: yPosition,
    head: [['ID Pedido', 'Fecha', 'Cliente', 'Método', 'Estado', 'Monto']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [114, 47, 55], // Color vino
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 4
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'left', cellWidth: 28 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Pie de página en cada página
      const pageCount = doc.internal.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        pageSize.width / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      
      doc.text(
        'Sistema de Gestión de Restaurante v1.0.0',
        14,
        pageHeight - 10
      );
    }
  });

  // ============ TOTAL FINAL ============
  
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFillColor(114, 47, 55);
  doc.roundedRect(120, finalY, 76, 12, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL INGRESOS:', 125, finalY + 8);
  doc.text(formatearMoneda(totalIngresos), 188, finalY + 8, { align: 'right' });

  // ============ GUARDAR PDF ============
  
  const nombreArchivo = `Reporte_Ingresos_${periodo}_${Date.now()}.pdf`;
  doc.save(nombreArchivo);
  
  return {
    success: true,
    message: 'Reporte generado exitosamente',
    nombreArchivo
  };
};

// ============ UTILIDADES ============

const obtenerNombreClienteDesdeCache = (pedido, cache = {}) => {
  if (pedido?.idCliente == null) {
    return 'Cliente mostrador';
  }

  const nombreEnCache = cache?.[pedido.idCliente];
  if (nombreEnCache) return nombreEnCache;

  return `Cliente #${pedido.idCliente}`;
};

const formatearMoneda = (monto) => {
  if (monto === null || monto === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(monto);
};

const formatearFechaPDF = (fecha) => {
  if (!fecha) return 'N/A';
  
  try {
    if (Array.isArray(fecha)) {
      const [year, month, day, hour = 0, minute = 0] = fecha;
      const date = new Date(year, month - 1, day, hour, minute);
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

const obtenerNombreMetodoPago = (metodo) => {
  const metodos = {
    'TARJETA': 'Tarjeta',
    'EFECTIVO': 'Efectivo'
  };
  return metodos[metodo] || metodo;
};

const obtenerNombreEstadoPago = (estado) => {
  const estados = {
    'PENDIENTE': 'Pendiente',
    'APROBADO': 'Aprobado',
    'RECHAZADO': 'Rechazado',
    'CANCELADO': 'Cancelado'
  };
  return estados[estado] || estado;
};

/**
 * Generar reporte completo con análisis detallado
 */
export const generarReporteCompletoConAnalisis = (datos, periodo, fechaInicio = null, fechaFin = null, clienteCache = {}) => {
  const doc = new jsPDF();
  const fechaActual = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // ============ PÁGINA 1: PORTADA Y KPIs ============
  
  // Encabezado
  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE COMPLETO', 105, 25, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Análisis Detallado de Ingresos y Ventas', 105, 38, { align: 'center' });
  
  let yPos = 60;
  
  // Información del reporte
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Generado: ${fechaActual}`, 14, yPos);
  yPos += 6;
  
  let textoPeriodo = '';
  switch (periodo) {
    case 'hoy':
      textoPeriodo = 'Hoy';
      break;
    case 'semana':
      textoPeriodo = 'Esta Semana';
      break;
    case 'mes':
      textoPeriodo = 'Este Mes';
      break;
    case 'personalizado':
      if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio).toLocaleDateString('es-MX');
        const fin = new Date(fechaFin).toLocaleDateString('es-MX');
        textoPeriodo = `Del ${inicio} al ${fin}`;
      } else {
        textoPeriodo = 'Todos los registros';
      }
      break;
    default:
      textoPeriodo = 'Todos los registros';
  }
  
  doc.text(`Periodo: ${textoPeriodo}`, 14, yPos);
  yPos += 15;

  // ============ KPIs PRINCIPALES ============
  
  const totalPedidos = datos.pedidos.length;
  const totalIngresos = datos.pagos
    .filter(p => p.estadoPago === 'APROBADO')
    .reduce((sum, p) => sum + (p.monto || 0), 0);
  const ticketPromedio = totalPedidos > 0 ? totalIngresos / totalPedidos : 0;
  const pagosTarjeta = datos.pagos.filter(p => p.metodoPago === 'TARJETA').length;
  const pagosEfectivo = datos.pagos.filter(p => p.metodoPago === 'EFECTIVO').length;

  doc.setFillColor(240, 240, 240);
  doc.roundedRect(14, yPos, 182, 60, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INDICADORES CLAVE DE DESEMPEÑO (KPIs)', 105, yPos + 10, { align: 'center' });
  
  // KPIs en cuadrícula
  doc.setFontSize(10);
  
  // Fila 1
  doc.setFont('helvetica', 'bold');
  doc.text('Total Ingresos:', 20, yPos + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(formatearMoneda(totalIngresos), 60, yPos + 25);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Pedidos:', 110, yPos + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(totalPedidos.toString(), 150, yPos + 25);
  
  // Fila 2
  doc.setFont('helvetica', 'bold');
  doc.text('Ticket Promedio:', 20, yPos + 35);
  doc.setFont('helvetica', 'normal');
  doc.text(formatearMoneda(ticketPromedio), 60, yPos + 35);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Transacciones:', 110, yPos + 35);
  doc.setFont('helvetica', 'normal');
  doc.text(`${pagosTarjeta + pagosEfectivo}`, 150, yPos + 35);
  
  // Fila 3
  doc.setFont('helvetica', 'bold');
  doc.text('Pagos Tarjeta:', 20, yPos + 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`${pagosTarjeta} (${totalPedidos > 0 ? ((pagosTarjeta / totalPedidos) * 100).toFixed(1) : 0}%)`, 60, yPos + 45);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Pagos Efectivo:', 110, yPos + 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`${pagosEfectivo} (${totalPedidos > 0 ? ((pagosEfectivo / totalPedidos) * 100).toFixed(1) : 0}%)`, 150, yPos + 45);
  
  yPos += 70;

  // ============ ANÁLISIS POR TIPO DE ENTREGA ============
  
  const pedidosDomicilio = datos.pedidos.filter(p => p.tipoEntrega === 'DOMICILIO').length;
  const pedidosParaLlevar = datos.pedidos.filter(p => p.tipoEntrega === 'PARA_LLEVAR').length;
  const pedidosLocal = datos.pedidos.filter(p => p.tipoEntrega === 'PICKUP_EN_MOSTRADOR').length;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISIS POR TIPO DE ENTREGA', 14, yPos);
  yPos += 8;

  const dataEntrega = [
    ['Tipo de Entrega', 'Cantidad', 'Porcentaje'],
    ['Domicilio', pedidosDomicilio, `${totalPedidos > 0 ? ((pedidosDomicilio / totalPedidos) * 100).toFixed(1) : 0}%`],
    ['Para Llevar', pedidosParaLlevar, `${totalPedidos > 0 ? ((pedidosParaLlevar / totalPedidos) * 100).toFixed(1) : 0}%`],
    ['Local (Mostrador)', pedidosLocal, `${totalPedidos > 0 ? ((pedidosLocal / totalPedidos) * 100).toFixed(1) : 0}%`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [dataEntrega[0]],
    body: dataEntrega.slice(1),
    theme: 'striped',
    headStyles: {
      fillColor: [114, 47, 55],
      textColor: [255, 255, 255],
      fontSize: 9
    },
    margin: { left: 14, right: 14 }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ============ ANÁLISIS POR ESTADO DE PEDIDO ============
  
  const estadosPedidos = {};
  datos.pedidos.forEach(p => {
    const estado = p.estadoPedido || 'DESCONOCIDO';
    estadosPedidos[estado] = (estadosPedidos[estado] || 0) + 1;
  });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISIS POR ESTADO DE PEDIDO', 14, yPos);
  yPos += 8;

  const dataEstados = [
    ['Estado', 'Cantidad', 'Porcentaje'],
    ...Object.keys(estadosPedidos).map(estado => [
      estado,
      estadosPedidos[estado],
      `${totalPedidos > 0 ? ((estadosPedidos[estado] / totalPedidos) * 100).toFixed(1) : 0}%`
    ])
  ];

  autoTable(doc, {
    startY: yPos,
    head: [dataEstados[0]],
    body: dataEstados.slice(1),
    theme: 'striped',
    headStyles: {
      fillColor: [114, 47, 55],
      textColor: [255, 255, 255],
      fontSize: 9
    },
    margin: { left: 14, right: 14 }
  });

  // ============ NUEVA PÁGINA: TABLA DE INGRESOS ============
  
  doc.addPage();
  yPos = 20;

  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE INGRESOS', 105, 15, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  yPos = 35;

  // Preparar datos de la tabla
  const tableData = datos.pedidos.map(pedido => {
    const pago = datos.pagos.find(p => p.idPedido?.id === pedido.id);

    return [
      `#${pedido.id}`,
      formatearFechaPDF(pedido.fechaCreacion),
      obtenerNombreClienteDesdeCache(pedido, clienteCache),
      pago ? obtenerNombreMetodoPago(pago.metodoPago) : 'N/A',
      pago ? obtenerNombreEstadoPago(pago.estadoPago) : 'N/A',
      pago ? formatearMoneda(pago.monto) : '$0.00'
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['ID', 'Fecha', 'Cliente', 'Método', 'Estado', 'Monto']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [114, 47, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'left', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        pageSize.width / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      
      doc.text(
        'Sistema de Gestión de Restaurante v1.0.0',
        14,
        pageHeight - 10
      );
    }
  });

  // ============ TOTAL FINAL ============
  
  const finalY = doc.lastAutoTable.finalY + 10;
  
  if (finalY + 20 < 280) {
    doc.setFillColor(114, 47, 55);
    doc.roundedRect(120, finalY, 76, 12, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL INGRESOS:', 125, finalY + 8);
    doc.text(formatearMoneda(totalIngresos), 188, finalY + 8, { align: 'right' });
  }

  // ============ GUARDAR PDF ============
  
  const nombreArchivo = `Reporte_Completo_Analisis_${periodo}_${Date.now()}.pdf`;
  doc.save(nombreArchivo);
  
  return {
    success: true,
    message: 'Reporte completo generado exitosamente',
    nombreArchivo
  };
};

/**
 * Generar reporte resumen (más compacto)
 */
export const generarReporteResumenPDF = (datos, periodo) => {
  const doc = new jsPDF();
  
  // Similar al reporte completo pero más compacto
  // Solo estadísticas principales
  
  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DE INGRESOS', 105, 22, { align: 'center' });
  
  const totalIngresos = datos.pagos
    .filter(p => p.estadoPago === 'APROBADO')
    .reduce((sum, p) => sum + (p.monto || 0), 0);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(36);
  doc.text(formatearMoneda(totalIngresos), 105, 70, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Total de Pedidos: ${datos.pedidos.length}`, 105, 85, { align: 'center' });
  
  const nombreArchivo = `Resumen_Ingresos_${periodo}_${Date.now()}.pdf`;
  doc.save(nombreArchivo);
  
  return {
    success: true,
    message: 'Resumen generado exitosamente',
    nombreArchivo
  };
};

