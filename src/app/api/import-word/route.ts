import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import mammoth from 'mammoth'

interface ParsedQuestion {
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionE: string
  correctAnswer: string
  explanation?: string
}

function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  // Split by numbered patterns like "1.", "2.", etc.
  const blocks = text.split(/(?=\n\s*\d+[\.\)]\s)/).filter(b => b.trim())

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l)
    if (lines.length < 2) continue

    // Extract question text (first line, remove number prefix)
    const questionLine = lines[0].replace(/^\d+[\.\)]\s*/, '')
    const options: Record<string, string> = {}
    let explanation = ''
    let correctAnswer = 'A'

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      // Match option patterns: A., A), a., a), etc.
      const optionMatch = line.match(/^([A-Ea-e])[\.\)]\s*(.+)/)
      if (optionMatch) {
        const key = optionMatch[1].toUpperCase()
        options[`option${key}`] = optionMatch[2].trim()
        continue
      }
      // Check for correct answer indicator
      if (line.match(/^(jawaban|kunci|benar)\s*[:=]\s*/i)) {
        const ans = line.replace(/^(jawaban|kunci|benar)\s*[:=]\s*/i, '').trim().toUpperCase()
        if (['A', 'B', 'C', 'D', 'E'].includes(ans)) {
          correctAnswer = ans
        }
        continue
      }
      // Check for explanation
      if (line.match(/^(pembahasan|penjelasan)\s*[:=]\s*/i)) {
        explanation = line.replace(/^(pembahasan|penjelasan)\s*[:=]\s*/i, '').trim()
        continue
      }
    }

    if (questionLine && Object.keys(options).length >= 2) {
      questions.push({
        questionText: questionLine,
        optionA: options.optionA || '',
        optionB: options.optionB || '',
        optionC: options.optionC || '',
        optionD: options.optionD || '',
        optionE: options.optionE || '',
        correctAnswer,
        explanation: explanation || undefined,
      })
    }
  }

  return questions
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const examId = formData.get('examId') as string | null

    if (!file || !examId) {
      return NextResponse.json({ error: 'File dan examId wajib' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value

    const parsedQuestions = parseQuestionsFromText(text)

    if (parsedQuestions.length === 0) {
      return NextResponse.json({ error: 'Tidak dapat menemukan soal dalam file. Pastikan format soal: nomor, teks soal, opsi A-E.' }, { status: 400 })
    }

    // Get existing question count for ordering
    const existingCount = await db.question.count({ where: { examId } })

    const created = await db.question.createMany({
      data: parsedQuestions.map((q, i) => ({
        examId,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        optionE: q.optionE,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || null,
        order: existingCount + i + 1,
      })),
    })

    return NextResponse.json({ count: created.count })
  } catch (error) {
    console.error('Import Word error:', error)
    return NextResponse.json({ error: 'Gagal import file Word' }, { status: 500 })
  }
}
