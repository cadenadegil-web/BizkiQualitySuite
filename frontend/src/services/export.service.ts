import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";

import { Finding } from "../types/finding";
import { CatalogItem } from "./catalogs.service";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function toRows(findings: Finding[]) {
  return findings.map((f) => ({
    Proceso: f.process,
    Tipo: f.finding_type,
    Descripción: f.description,
    Área: f.area?.name ?? "—",
    Clasificación: f.classification?.name ?? "—",
    Estado: f.status?.name ?? "—",
    Responsable: f.responsible,
    "Fecha de registro": formatDate(f.created_at),
    Activo: f.active ? "Sí" : "No",
  }));
}

const COLUMNS = [
  "Proceso",
  "Tipo",
  "Descripción",
  "Área",
  "Clasificación",
  "Estado",
  "Responsable",
  "Fecha de registro",
  "Activo",
] as const;

type RowKey = (typeof COLUMNS)[number];

// ─── PDF ────────────────────────────────────────────────────────────────────

export function exportFindingsToPDF(findings: Finding[]): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Encabezado azul
  doc.setFillColor(25, 118, 210);
  doc.rect(0, 0, pageWidth, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Reporte de Hallazgos BPM", 14, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const now = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
  doc.text(`Generado: ${now}`, pageWidth - 14, 14, { align: "right" });

  // Tabla de datos
  const rows = toRows(findings);
  autoTable(doc, {
    startY: 28,
    head: [Array.from(COLUMNS)],
    body: rows.map((r) => COLUMNS.map((c) => r[c as RowKey])),
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 246, 255],
    },
    columnStyles: {
      2: { cellWidth: 55 }, // Descripción
    },
  });

  // Pie de página con número de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );
  }

  doc.save(`hallazgos_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Excel ──────────────────────────────────────────────────────────────────

export function exportFindingsToExcel(findings: Finding[]): void {
  const rows = toRows(findings);

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: Array.from(COLUMNS),
  });

  // Anchos de columna
  worksheet["!cols"] = [
    { wch: 20 }, // Proceso
    { wch: 16 }, // Tipo
    { wch: 40 }, // Descripción
    { wch: 14 }, // Área
    { wch: 16 }, // Clasificación
    { wch: 14 }, // Estado
    { wch: 20 }, // Responsable
    { wch: 18 }, // Fecha de registro
    { wch: 8 },  // Activo
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Hallazgos");

  XLSX.writeFile(
    workbook,
    `hallazgos_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

// ─── Export Catalogs ─────────────────────────────────────────────────────────

export function exportCatalogToPDF(items: CatalogItem[], typeName: string): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Encabezado azul corporativo
  doc.setFillColor(25, 118, 210);
  doc.rect(0, 0, pageWidth, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Reporte de Catálogo: ${typeName}`, 14, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const now = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
  doc.text(`Generado: ${now}`, pageWidth - 14, 14, { align: "right" });

  // Configuración de columnas
  const isNorm = items.some(item => item.category !== undefined || item.description !== undefined);
  const headers = isNorm 
    ? ["Nombre", "Categoría", "Punto de Control", "Estado"]
    : ["Nombre", "Estado"];

  const body = items.map(item => {
    const status = item.active ? "Activo" : "Inactivo";
    if (isNorm) {
      return [item.name, item.category ?? "—", item.description ?? "—", status];
    }
    return [item.name, status];
  });

  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: body,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 246, 255],
    },
    columnStyles: isNorm ? {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 70 },
      3: { cellWidth: 20 },
    } : {
      0: { cellWidth: 150 },
      1: { cellWidth: 30 },
    }
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );
  }

  doc.save(`catalogo_${typeName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportCatalogToExcel(items: CatalogItem[], typeName: string): void {
  const isNorm = items.some(item => item.category !== undefined || item.description !== undefined);
  const rows = items.map(item => {
    const status = item.active ? "Activo" : "Inactivo";
    if (isNorm) {
      return {
        Nombre: item.name,
        Categoría: item.category ?? "—",
        "Punto de Control": item.description ?? "—",
        Estado: status
      };
    }
    return {
      Nombre: item.name,
      Estado: status
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  if (isNorm) {
    worksheet["!cols"] = [
      { wch: 25 }, // Nombre
      { wch: 30 }, // Categoría
      { wch: 50 }, // Punto de Control
      { wch: 12 }, // Estado
    ];
  } else {
    worksheet["!cols"] = [
      { wch: 40 }, // Nombre
      { wch: 15 }, // Estado
    ];
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, typeName);

  XLSX.writeFile(
    workbook,
    `catalogo_${typeName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}
