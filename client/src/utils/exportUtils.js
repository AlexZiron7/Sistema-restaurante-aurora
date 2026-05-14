import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = (data, titulo, columnas) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(titulo, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Período: ${data.desde} - ${data.hasta}`, 14, 30);
  
  const tableData = data[columnas.dataKey].map(row => 
    columnas.headers.map(header => row[header.key])
  );
  
  autoTable(doc, {
    head: [columnas.headers.map(h => h.label)],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] }
  });
  
  if (data.resumen) {
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Resumen', 14, finalY);
    doc.setFontSize(10);
    
    const resumenLines = [];
    if (data.resumen.total_ventas !== undefined) {
      resumenLines.push(`Total Ventas: $${data.resumen.total_ventas.toFixed(2)}`);
    }
    if (data.resumen.total_propinas !== undefined) {
      resumenLines.push(`Total Propinas: $${data.resumen.total_propinas.toFixed(2)}`);
    }
    if (data.resumen.total_general !== undefined) {
      resumenLines.push(`Total General: $${data.resumen.total_general.toFixed(2)}`);
    }
    if (data.resumen.cantidad_pedidos !== undefined) {
      resumenLines.push(`Cantidad Pedidos: ${data.resumen.cantidad_pedidos}`);
    }
    
    doc.text(resumenLines, 14, finalY + 7);
  }
  
  doc.save(`${titulo.replace(/\s+/g, '_')}_${data.desde}_${data.hasta}.pdf`);
};

export const exportToExcel = (data, titulo, columnas) => {
  const wsData = [];
  
  wsData.push([titulo]);
  wsData.push([`Período: ${data.desde} - ${data.hasta}`]);
  wsData.push([]);
  
  wsData.push(columnas.headers.map(h => h.label));
  
  data[columnas.dataKey].forEach(row => {
    wsData.push(columnas.headers.map(header => row[header.key]));
  });
  
  if (data.resumen) {
    wsData.push([]);
    wsData.push(['Resumen']);
    Object.entries(data.resumen).forEach(([key, value]) => {
      wsData.push([key.replace(/_/g, ' ').toUpperCase(), typeof value === 'number' ? value.toFixed(2) : value]);
    });
  }
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
  XLSX.writeFile(wb, `${titulo.replace(/\s+/g, '_')}_${data.desde}_${data.hasta}.xlsx`);
};

export const exportToCSV = (data, titulo, columnas) => {
  let csv = '';
  
  csv += `${titulo}\n`;
  csv += `Período: ${data.desde} - ${data.hasta}\n`;
  csv += '\n';
  
  csv += columnas.headers.map(h => h.label).join(',') + '\n';
  
  data[columnas.dataKey].forEach(row => {
    csv += columnas.headers.map(header => {
      const val = row[header.key];
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
    }).join(',') + '\n';
  });
  
  if (data.resumen) {
    csv += '\nResumen\n';
    Object.entries(data.resumen).forEach(([key, value]) => {
      csv += `${key.replace(/_/g, ' ')},${typeof value === 'number' ? value.toFixed(2) : value}\n`;
    });
  }
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${titulo.replace(/\s+/g, '_')}_${data.desde}_${data.hasta}.csv`;
  link.click();
};
