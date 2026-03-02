// =============================================================================
// CAI Prep Course — PDF Certificate Generator
// =============================================================================

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface CertificateData {
  employeeName: string
  courseTitle: string
  credentialCode: string
  completionDate: string
  certificateNumber: string
  totalHours: number
  quizScore: number
}

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([792, 612]) // Landscape letter

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

  const { width, height } = page.getSize()

  // Colors
  const pspBlue = rgb(0.055, 0.647, 0.914) // #0ea5e9
  const pspTeal = rgb(0.078, 0.722, 0.651) // #14b8a6
  const darkText = rgb(0.1, 0.1, 0.1)
  const mutedText = rgb(0.4, 0.4, 0.4)
  const goldAccent = rgb(0.855, 0.702, 0.243) // gold

  // === Border ===
  const borderWidth = 3
  const margin = 30
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - 2 * margin,
    height: height - 2 * margin,
    borderColor: pspBlue,
    borderWidth,
  })
  // Inner border
  page.drawRectangle({
    x: margin + 8,
    y: margin + 8,
    width: width - 2 * (margin + 8),
    height: height - 2 * (margin + 8),
    borderColor: pspTeal,
    borderWidth: 1,
  })

  // === Corner decorations (simple L shapes) ===
  const cornerLen = 40
  const corners = [
    { x: margin + 15, y: height - margin - 15, dx: 1, dy: -1 },
    { x: width - margin - 15, y: height - margin - 15, dx: -1, dy: -1 },
    { x: margin + 15, y: margin + 15, dx: 1, dy: 1 },
    { x: width - margin - 15, y: margin + 15, dx: -1, dy: 1 },
  ]
  for (const c of corners) {
    page.drawLine({ start: { x: c.x, y: c.y }, end: { x: c.x + cornerLen * c.dx, y: c.y }, thickness: 2, color: goldAccent })
    page.drawLine({ start: { x: c.x, y: c.y }, end: { x: c.x, y: c.y + cornerLen * c.dy }, thickness: 2, color: goldAccent })
  }

  // === Logo placeholder ===
  page.drawRectangle({
    x: width / 2 - 80,
    y: height - 110,
    width: 160,
    height: 36,
    color: pspBlue,
    borderColor: pspBlue,
    borderWidth: 0,
  })
  page.drawText('PS PROPERTY MANAGEMENT', {
    x: width / 2 - 72,
    y: height - 100,
    size: 8,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  // === Title ===
  const title = 'Certificate of Completion'
  const titleWidth = helveticaBold.widthOfTextAtSize(title, 28)
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 155,
    size: 28,
    font: helveticaBold,
    color: darkText,
  })

  // === Decorative line under title ===
  page.drawLine({
    start: { x: width / 2 - 120, y: height - 165 },
    end: { x: width / 2 + 120, y: height - 165 },
    thickness: 2,
    color: goldAccent,
  })

  // === "This certifies that" ===
  const certText = 'This certifies that'
  const certWidth = timesItalic.widthOfTextAtSize(certText, 14)
  page.drawText(certText, {
    x: (width - certWidth) / 2,
    y: height - 200,
    size: 14,
    font: timesItalic,
    color: mutedText,
  })

  // === Employee Name ===
  const nameWidth = helveticaBold.widthOfTextAtSize(data.employeeName, 32)
  page.drawText(data.employeeName, {
    x: (width - nameWidth) / 2,
    y: height - 245,
    size: 32,
    font: helveticaBold,
    color: pspBlue,
  })

  // === Line under name ===
  page.drawLine({
    start: { x: width / 2 - 150, y: height - 255 },
    end: { x: width / 2 + 150, y: height - 255 },
    thickness: 1,
    color: mutedText,
  })

  // === "has successfully completed" ===
  const completedText = 'has successfully completed'
  const completedWidth = timesItalic.widthOfTextAtSize(completedText, 14)
  page.drawText(completedText, {
    x: (width - completedWidth) / 2,
    y: height - 285,
    size: 14,
    font: timesItalic,
    color: mutedText,
  })

  // === Course Title ===
  const courseWidth = helveticaBold.widthOfTextAtSize(data.courseTitle, 22)
  page.drawText(data.courseTitle, {
    x: (width - courseWidth) / 2,
    y: height - 320,
    size: 22,
    font: helveticaBold,
    color: darkText,
  })

  // === Credential Badge ===
  const badgeText = data.credentialCode
  const badgeWidth = helveticaBold.widthOfTextAtSize(badgeText, 14)
  const badgeBoxWidth = badgeWidth + 24
  page.drawRectangle({
    x: (width - badgeBoxWidth) / 2,
    y: height - 358,
    width: badgeBoxWidth,
    height: 26,
    color: pspTeal,
    borderWidth: 0,
  })
  page.drawText(badgeText, {
    x: (width - badgeWidth) / 2,
    y: height - 351,
    size: 14,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  // === Details row ===
  const detailY = height - 400
  const detailFont = helvetica
  const detailSize = 11

  // Date
  page.drawText(`Completed: ${data.completionDate}`, {
    x: 100,
    y: detailY,
    size: detailSize,
    font: detailFont,
    color: mutedText,
  })

  // Hours
  const hoursText = `Study Hours: ${data.totalHours}`
  const hoursWidth = detailFont.widthOfTextAtSize(hoursText, detailSize)
  page.drawText(hoursText, {
    x: (width - hoursWidth) / 2,
    y: detailY,
    size: detailSize,
    font: detailFont,
    color: mutedText,
  })

  // Score
  page.drawText(`Final Score: ${data.quizScore}%`, {
    x: width - 200,
    y: detailY,
    size: detailSize,
    font: detailFont,
    color: mutedText,
  })

  // === Signature lines ===
  const sigY = 100
  // Left signature
  page.drawLine({
    start: { x: 120, y: sigY },
    end: { x: 320, y: sigY },
    thickness: 1,
    color: mutedText,
  })
  page.drawText('Training Director', {
    x: 170,
    y: sigY - 18,
    size: 10,
    font: helvetica,
    color: mutedText,
  })
  page.drawText('PS Property Management', {
    x: 150,
    y: sigY - 32,
    size: 9,
    font: timesItalic,
    color: mutedText,
  })

  // Right signature
  page.drawLine({
    start: { x: width - 320, y: sigY },
    end: { x: width - 120, y: sigY },
    thickness: 1,
    color: mutedText,
  })
  page.drawText('Date Issued', {
    x: width - 252,
    y: sigY - 18,
    size: 10,
    font: helvetica,
    color: mutedText,
  })
  page.drawText(data.completionDate, {
    x: width - 255,
    y: sigY - 32,
    size: 9,
    font: timesItalic,
    color: mutedText,
  })

  // === Certificate Number ===
  const certNumText = `Certificate #${data.certificateNumber}`
  const certNumWidth = helvetica.widthOfTextAtSize(certNumText, 8)
  page.drawText(certNumText, {
    x: (width - certNumWidth) / 2,
    y: 55,
    size: 8,
    font: helvetica,
    color: mutedText,
  })

  // === Footer ===
  const footerText = 'PSPM CAI Prep Course — Serving Central Texas communities since 1987'
  const footerWidth = helvetica.widthOfTextAtSize(footerText, 7)
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 42,
    size: 7,
    font: helvetica,
    color: mutedText,
  })

  return pdfDoc.save()
}
