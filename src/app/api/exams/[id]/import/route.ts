import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import mammoth from 'mammoth'

function parseQuestions(text: string) {
  const questions: Array<{
    questionText: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    optionE: string
    correctAnswer: string
    explanation: string
  }> = []

  // Split by question numbers (1. 2. 3. etc)
  const blocks = text.split(/(?=\d+\.\s)/).filter(b => b.trim())

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 6) continue

    // Extract question text (first line, remove number prefix)
    const questionLine = lines[0].replace(/^\d+\.\s*/, '')
    
    // Extract options
    let optionA = '', optionB = '', optionC = '', optionD = '', optionE = ''
    let correctAnswer = ''
    let explanation = ''

    for (const line of lines.slice(1)) {
      const optMatch = line.match(/^([A-E])\.\s*(.+)/)
      if (optMatch) {
        const letter = optMatch[1]
        const text = optMatch[2]
        if (letter === 'A') optionA = text
        else if (letter === 'B') optionB = text
        else if (letter === 'C') optionC = text
        else if (letter === 'D') optionD = text
        else if (letter === 'E') optionE = text
      } else if (line.match(/^(JAWABAN|KUNCI|JAWAB)\s*[:=]\s*([A-E])/i)) {
        const match = line.match(/^(JAWABAN|KUNCI|JAWAB)\s*[:=]\s*([A-E])/i)
        if (match) correctAnswer = match[2].toUpperCase()
      } else if (line.match(/^(PEMBAHASAN|PENJELASAN)\s*[:=]\s*/i)) {
        explanation = line.replace(/^(PEMBAHASAN|PENJELASAN)\s*[:=]\s*/i, '')
      } else if (explanation && !line.match(/^([A-E]\.)/) && !line.match(/^\d+\./)) {
        explanation += ' ' + line
      }
    }

    if (questionLine && optionA && optionB && correctAnswer) {
      questions.push({
        questionText: questionLine,
        optionA, optionB, optionC, optionD, optionE,
        correctAnswer,
        explanation
      })
    }
  }

  return questions
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File harus diupload' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value

    const parsedQuestions = parseQuestions(text)

    if (parsedQuestions.length === 0) {
      return NextResponse.json({ error: 'Tidak ada soal yang berhasil diparsing dari file. Pastikan format: 1. Soal... A. Pilihan A B. Pilihan B ... JAWABAN: A PEMBAHASAN: ...' }, { status: 400 })
    }

    const maxOrder = await db.question.findFirst({
      where: { examId: id },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    let startOrder = maxOrder?.order ?? 0

    const created = await db.$transaction(
      parsedQuestions.map((q, i) =>
        db.question.create({
          data: {
            examId: id,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            optionE: q.optionE,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            order: startOrder + i + 1
          }
        })
      )
    )

    return NextResponse.json({ count: created.length, questions: created })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengimport file' }, { status: 500 })
  }
}
