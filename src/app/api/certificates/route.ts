import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { randomUUID } from 'crypto'

// =============================================================================
// POST /api/certificates
// Generate PDF certificate for a completed course
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()
    const { user_email, course_id } = body

    if (!user_email || !course_id) {
      return NextResponse.json(
        { error: 'user_email and course_id are required' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // Verify course completion
    // -------------------------------------------------------------------------
    const { data: course, error: courseError } = await supabase
      .from('cai_courses')
      .select('*')
      .eq('id', course_id)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check that user has completed all modules
    const { data: modules } = await supabase
      .from('cai_modules')
      .select('id')
      .eq('course_id', course_id)
      .eq('is_published', true)

    const moduleIds = (modules ?? []).map((m) => m.id)

    if (moduleIds.length === 0) {
      return NextResponse.json(
        { error: 'Course has no modules' },
        { status: 400 }
      )
    }

    // Check module completion
    const { data: moduleProgress } = await supabase
      .from('cai_user_progress')
      .select('module_id, status')
      .eq('user_email', user_email)
      .eq('course_id', course_id)
      .eq('status', 'completed')
      .not('module_id', 'is', null)

    const completedModuleIds = new Set(
      (moduleProgress ?? []).map((p) => p.module_id)
    )

    const allModulesCompleted = moduleIds.every((id) =>
      completedModuleIds.has(id)
    )

    if (!allModulesCompleted) {
      return NextResponse.json(
        {
          error: 'Course not fully completed',
          completed: completedModuleIds.size,
          total: moduleIds.length,
        },
        { status: 400 }
      )
    }

    // Check that user passed a practice exam (final exam)
    const { data: passedExam } = await supabase
      .from('cai_quiz_attempts')
      .select('id')
      .eq('user_email', user_email)
      .eq('course_id', course_id)
      .eq('quiz_type', 'practice_exam')
      .eq('passed', true)
      .limit(1)

    if (!passedExam?.length) {
      return NextResponse.json(
        { error: 'User must pass the final practice exam before receiving a certificate' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------------------------
    // Generate PDF Certificate
    // -------------------------------------------------------------------------
    const certificateNumber = randomUUID()
    const completionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const employeeName = user_email.split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase())

    const pdfDoc = await PDFDocument.create()

    // Landscape letter (11 x 8.5 inches)
    const page = pdfDoc.addPage([792, 612])
    const { width, height } = page.getSize()

    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

    // Colors
    const navy = rgb(0.05, 0.1, 0.3)
    const gold = rgb(0.76, 0.6, 0.2)
    const darkGray = rgb(0.3, 0.3, 0.3)
    const pspmBlue = rgb(0.09, 0.35, 0.65)

    // ---- Border ----
    const borderWidth = 3
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: gold,
      borderWidth,
    })
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: navy,
      borderWidth: 1,
    })

    // ---- PSPM Logo Placeholder (blue rectangle with text) ----
    const logoWidth = 180
    const logoHeight = 50
    const logoX = (width - logoWidth) / 2
    const logoY = height - 110
    page.drawRectangle({
      x: logoX,
      y: logoY,
      width: logoWidth,
      height: logoHeight,
      color: pspmBlue,
    })
    page.drawText('PS Property', {
      x: logoX + 20,
      y: logoY + 28,
      size: 16,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    })
    page.drawText('Management', {
      x: logoX + 20,
      y: logoY + 10,
      size: 14,
      font: helvetica,
      color: rgb(1, 1, 1),
    })

    // ---- "Certificate of Completion" ----
    const certTitle = 'Certificate of Completion'
    const certTitleWidth = helveticaBold.widthOfTextAtSize(certTitle, 30)
    page.drawText(certTitle, {
      x: (width - certTitleWidth) / 2,
      y: height - 170,
      size: 30,
      font: helveticaBold,
      color: navy,
    })

    // ---- Decorative line ----
    page.drawLine({
      start: { x: width / 2 - 150, y: height - 185 },
      end: { x: width / 2 + 150, y: height - 185 },
      thickness: 2,
      color: gold,
    })

    // ---- "This certifies that" ----
    const certifies = 'This certifies that'
    const certifiesWidth = timesItalic.widthOfTextAtSize(certifies, 14)
    page.drawText(certifies, {
      x: (width - certifiesWidth) / 2,
      y: height - 220,
      size: 14,
      font: timesItalic,
      color: darkGray,
    })

    // ---- Employee Name ----
    const nameWidth = helveticaBold.widthOfTextAtSize(employeeName, 28)
    page.drawText(employeeName, {
      x: (width - nameWidth) / 2,
      y: height - 265,
      size: 28,
      font: helveticaBold,
      color: navy,
    })

    // ---- Underline for name ----
    page.drawLine({
      start: { x: width / 2 - 180, y: height - 275 },
      end: { x: width / 2 + 180, y: height - 275 },
      thickness: 1,
      color: gold,
    })

    // ---- "has successfully completed" ----
    const completed = 'has successfully completed'
    const completedWidth = timesItalic.widthOfTextAtSize(completed, 14)
    page.drawText(completed, {
      x: (width - completedWidth) / 2,
      y: height - 310,
      size: 14,
      font: timesItalic,
      color: darkGray,
    })

    // ---- Course Title ----
    const courseTitle = course.title
    const courseTitleSize = courseTitle.length > 45 ? 18 : 22
    const courseTitleWidth = helveticaBold.widthOfTextAtSize(
      courseTitle,
      courseTitleSize
    )
    page.drawText(courseTitle, {
      x: (width - courseTitleWidth) / 2,
      y: height - 350,
      size: courseTitleSize,
      font: helveticaBold,
      color: pspmBlue,
    })

    // ---- Credential code ----
    const credLine = `Credential: ${course.credential_code}`
    const credWidth = helvetica.widthOfTextAtSize(credLine, 12)
    page.drawText(credLine, {
      x: (width - credWidth) / 2,
      y: height - 375,
      size: 12,
      font: helvetica,
      color: darkGray,
    })

    // ---- Completion date ----
    const dateLine = `Completed: ${completionDate}`
    const dateWidth = helvetica.widthOfTextAtSize(dateLine, 12)
    page.drawText(dateLine, {
      x: (width - dateWidth) / 2,
      y: height - 400,
      size: 12,
      font: helvetica,
      color: darkGray,
    })

    // ---- Decorative line ----
    page.drawLine({
      start: { x: width / 2 - 150, y: height - 420 },
      end: { x: width / 2 + 150, y: height - 420 },
      thickness: 2,
      color: gold,
    })

    // ---- Signature line (left) ----
    page.drawLine({
      start: { x: 100, y: 110 },
      end: { x: 320, y: 110 },
      thickness: 1,
      color: darkGray,
    })
    const sigLabel1 = 'Program Director'
    const sigLabel1Width = helvetica.widthOfTextAtSize(sigLabel1, 10)
    page.drawText(sigLabel1, {
      x: 100 + (220 - sigLabel1Width) / 2,
      y: 95,
      size: 10,
      font: helvetica,
      color: darkGray,
    })

    // ---- Signature line (right) ----
    page.drawLine({
      start: { x: 472, y: 110 },
      end: { x: 692, y: 110 },
      thickness: 1,
      color: darkGray,
    })
    const sigLabel2 = 'Date of Issue'
    const sigLabel2Width = helvetica.widthOfTextAtSize(sigLabel2, 10)
    page.drawText(sigLabel2, {
      x: 472 + (220 - sigLabel2Width) / 2,
      y: 95,
      size: 10,
      font: helvetica,
      color: darkGray,
    })

    // ---- Certificate number ----
    const certNum = `Certificate #${certificateNumber.substring(0, 8).toUpperCase()}`
    const certNumWidth = helvetica.widthOfTextAtSize(certNum, 8)
    page.drawText(certNum, {
      x: (width - certNumWidth) / 2,
      y: 55,
      size: 8,
      font: helvetica,
      color: darkGray,
    })

    // ---- QR code placeholder (text URL) ----
    const verifyUrl = `verify: cai-prep.psprop.net/cert/${certificateNumber.substring(0, 8)}`
    const verifyWidth = helvetica.widthOfTextAtSize(verifyUrl, 7)
    page.drawText(verifyUrl, {
      x: (width - verifyWidth) / 2,
      y: 40,
      size: 7,
      font: helvetica,
      color: darkGray,
    })

    // ---- Tagline ----
    const tagline = 'Serving Central Texas communities since 1987'
    const taglineWidth = timesItalic.widthOfTextAtSize(tagline, 9)
    page.drawText(tagline, {
      x: (width - taglineWidth) / 2,
      y: height - 450,
      size: 9,
      font: timesItalic,
      color: darkGray,
    })

    // -------------------------------------------------------------------------
    // Serialize and upload to Supabase Storage
    // -------------------------------------------------------------------------
    const pdfBytes = await pdfDoc.save()
    const fileName = `${user_email.split('@')[0]}-${course.slug}-${certificateNumber.substring(0, 8)}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('cai-certificates')
      .upload(fileName, Buffer.from(pdfBytes), {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('[POST /api/certificates] Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload certificate' },
        { status: 500 }
      )
    }

    // Create signed URL (24hr expiry)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from('cai-certificates')
      .createSignedUrl(fileName, 60 * 60 * 24) // 24 hours

    if (signError) {
      console.error('[POST /api/certificates] Sign URL error:', signError)
      return NextResponse.json(
        { error: 'Failed to generate download link' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      certificate_number: certificateNumber,
      file_name: fileName,
      download_url: signedUrl.signedUrl,
      expires_in: '24 hours',
      course_title: course.title,
      credential_code: course.credential_code,
      employee_name: employeeName,
      completion_date: completionDate,
    })
  } catch (err) {
    console.error('[POST /api/certificates]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
