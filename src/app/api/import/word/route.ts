import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const examId = formData.get('examId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }
    if (!examId) {
      return NextResponse.json({ error: 'Exam ID harus disertakan' }, { status: 400 })
    }

    // Check exam exists
    const exam = await db.exam.findUnique({ where: { id: examId } })
    if (!exam) {
      return NextResponse.json({ error: 'Ujian tidak ditemukan' }, { status: 404 })
    }

    // Parse Word file
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value

    // Parse questions from text
    // Expected format:
    // 1. Question text
    // A. Option A
    // B. Option B
    // C. Option C
    // D. Option D
    // E. Option E
    // JAWABAN: A
    // PEMBAHASAN: explanation text

    const questions: {
      questionText: string
      optionA: string
      optionB: string
      optionC: string
      optionD: string
      optionE: string
      correctAnswer: string
      explanation: string
    }[] = []

    // Split by question numbers (1. 2. 3. etc)
    const questionBlocks = text.split(/\n(?=\d+\.\s)/).filter(Boolean)

    for (const block of questionBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 6) continue // Need at least question + 5 options

      // Extract question text (first line, remove number prefix)
      const qMatch = lines[0].match(/^\d+\.\s*(.+)/)
      if (!qMatch) continue
      const questionText = qMatch[1]

      // Extract options
      let optionA = '', optionB = '', optionC = '', optionD = '', optionE = ''
      let correctAnswer = 'A'
      let explanation = ''

      for (const line of lines.slice(1)) {
        const aMatch = line.match(/^[Aa]\.\s*(.+)/)
        if (aMatch) { optionA = aMatch[1]; continue }
        const bMatch = line.match(/^[Bb]\.\s*(.+)/)
        if (bMatch) { optionB = bMatch[1]; continue }
        const cMatch = line.match(/^[Cc]\.\s*(.+)/)
        if (cMatch) { optionC = cMatch[1]; continue }
        const dMatch = line.match(/^[Dd]\.\s*(.+)/)
        if (dMatch) { optionD = dMatch[1]; continue }
        const eMatch = line.match(/^[Ee]\.\s*(.+)/)
        if (eMatch) { optionE = eMatch[1]; continue }
        const ansMatch = line.match(/(?:JAWABAN|KUNCI|ANSWER)[:\s]*([A-Ea-e])/i)
        if (ansMatch) { correctAnswer = ansMatch[1].toUpperCase(); continue }
        const expMatch = line.match(/(?:PEMBAHASAN|EXPLANATION)[:\s]*(.+)/i)
        if (expMatch) { explanation = expMatch[1]; continue }
      }

      if (optionA && optionB && optionC && optionD && optionE) {
        questions.push({
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          optionE,
          correctAnswer,
          explanation,
        })
      }
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Tidak dapat menemukan soal dalam file. Pastikan format soal sesuai.' }, { status: 400 })
    }

    // Get current max order
    const maxOrder = await db.question.findFirst({
      where: { examId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    let order = (maxOrder?.order ?? 0) + 1

    // Create questions in DB
    for (const q of questions) {
      await db.question.create({
        data: {
          examId,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          optionE: q.optionE,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || null,
          order: order++,
        }
      })
    }

    return NextResponse.json({ count: questions.length })
  } catch (error) {
    console.error('Word import error:', error)
    return NextResponse.json({ error: 'Gagal mengimpor file Word' }, { status: 500 })
  }
}
