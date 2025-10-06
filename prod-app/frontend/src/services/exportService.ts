// Servicio para exportar datos a PDF y Excel
// Nota: Para implementación completa necesitarías instalar librerías como:
// - jspdf y jspdf-autotable para PDF
// - xlsx para Excel

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';

export interface ExportData {
  headers: string[];
  rows: any[][];
  title: string;
}

export const exportToPDF = async (data: ExportData) => {
  const doc = new jsPDF();
  
  // Título del documento
  doc.setFontSize(18);
  doc.text(data.title, 14, 22);
  
  // Tabla de datos
  const tableData = [data.headers, ...data.rows];
  
  (doc as any).autoTable({
    head: [data.headers],
    body: data.rows,
    startY: 30,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });
  
  // Guardar el PDF
  doc.save(`${data.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportToExcel = async (data: ExportData) => {
  // Crear workbook y worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
  
  // Agregar el worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, data.title);
  
  // Generar el archivo Excel
  XLSX.writeFile(wb, `${data.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const formatCobrosForExport = (cobros: any[]) => {
  const headers = [
    "ID",
    "Paciente",
    "Conceptos",
    "Monto Total",
    "Fecha",
    "Método de Pago",
    "¿Pidió Factura?",
    "Estado"
  ];

  const rows = cobros.map(cobro => [
    cobro.id,
    `${cobro.paciente?.nombre || ""} ${cobro.paciente?.apellido || ""}`,
    cobro.conceptos && cobro.conceptos.length > 0
      ? cobro.conceptos.map((con: any) => `${con.cantidad} ${con.servicio?.nombre || ''}`).join(', ')
      : '-',
    `$${cobro.monto_total || 0}`,
    cobro.fecha_cobro?.slice(0, 10) || "",
    Array.isArray(cobro.metodos_pago) && cobro.metodos_pago.length > 0 
      ? cobro.metodos_pago.map((mp: any) => mp.metodo_pago).join(', ')
      : "",
    cobro.notas?.toLowerCase().includes("factura") ? "Sí" : "No",
    cobro.estado || ""
  ]);

  return {
    headers,
    rows,
    title: "Reporte de Cobros"
  };
}; 