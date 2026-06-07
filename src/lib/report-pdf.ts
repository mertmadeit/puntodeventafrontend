"use client"

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

type PdfColumn = {
  header: string
  dataKey: string
}

type PdfReportOptions = {
  filename: string
  title: string
  subtitle?: string
  summary?: Array<[string, string]>
  columns: PdfColumn[]
  rows: Array<Record<string, string | number>>
}

const generatedAtFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function normalizeFilename(filename: string) {
  return filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`
}

export function downloadPdfReport({
  filename,
  title,
  subtitle,
  summary = [],
  columns,
  rows,
}: PdfReportOptions) {
  const doc = new jsPDF({
    orientation: columns.length > 5 ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 40
  let cursorY = 42

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(title, marginX, cursorY)

  cursorY += 18
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(90)
  doc.text(`Generado: ${generatedAtFormatter.format(new Date())}`, marginX, cursorY)

  if (subtitle) {
    cursorY += 16
    doc.setFontSize(10)
    doc.text(subtitle, marginX, cursorY, { maxWidth: pageWidth - marginX * 2 })
  }

  if (summary.length) {
    cursorY += 22
    doc.setFontSize(10)
    for (const [label, value] of summary) {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(35)
      doc.text(`${label}:`, marginX, cursorY)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(80)
      doc.text(value || "-", marginX + 110, cursorY)
      cursorY += 14
    }
  }

  autoTable(doc, {
    startY: cursorY + 12,
    columns,
    body: rows,
    margin: { left: marginX, right: marginX },
    styles: {
      cellPadding: 6,
      font: "helvetica",
      fontSize: 9,
      overflow: "linebreak",
      textColor: [45, 45, 45],
    },
    headStyles: {
      fillColor: [32, 41, 56],
      fontStyle: "bold",
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [247, 248, 250],
    },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages()
      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(`Pagina ${pageCount}`, pageWidth - marginX, pageHeight - 24, {
        align: "right",
      })
    },
  })

  doc.save(normalizeFilename(filename))
}
