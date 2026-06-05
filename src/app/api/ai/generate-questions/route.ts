import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { examId, subject, topic, count, difficulty } = await request.json()

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID harus diisi' }, { status: 400 })
    }

    if (!topic) {
      return NextResponse.json({ error: 'Topik/mata pelajaran harus diisi' }, { status: 400 })
    }

    // Check exam exists
    const exam = await db.exam.findUnique({ where: { id: examId } })
    if (!exam) {
      return NextResponse.json({ error: 'Ujian tidak ditemukan' }, { status: 404 })
    }

    const questionCount = Math.max(1, Math.min(count || 5, 50))
    const difficultyLevel = difficulty || 'sedang'

    const zai = await ZAI.create()

    const systemPrompt = `Kamu adalah seorang guru profesional di Indonesia yang ahli dalam membuat soal ujian berkualitas tinggi. Kamu harus membuat soal pilihan ganda dengan 5 opsi jawaban (A-E) untuk siswa SMA/SMK di Indonesia.

ATURAN PENTING:
1. Jawaban benar HARUS bervariasi — jangan selalu A! Distribusikan jawaban benar secara merata ke opsi A, B, C, D, dan E.
2. Pembahasan HARUS sangat rinci dan mendetail — jelaskan langkah demi langkah, sebutkan rumus yang digunakan, dan jelaskan mengapa opsi lain salah.
3. Soal harus sesuai kurikulum Indonesia dan menggunakan bahasa Indonesia yang baik dan benar.
4. Tingkat kesulitan: ${difficultyLevel}.
5. Buat tepat ${questionCount} soal.

FORMAT OUTPUT — WAJIB kirim dalam format JSON array persis seperti ini, tanpa teks tambahan:
[
  {
    "questionText": "Teks soal di sini...",
    "optionA": "Opsi A",
    "optionB": "Opsi B",
    "optionC": "Opsi C",
    "optionD": "Opsi D",
    "optionE": "Opsi E",
    "correctAnswer": "B",
    "explanation": "Pembahasan rinci langkah demi langkah"
  }
]`

    const userPrompt = `Buat ${questionCount} soal pilihan ganda (5 opsi A-E) untuk mata pelajaran "${subject || topic}" dengan topik "${topic}" pada tingkat kesulitan ${difficultyLevel}.

INGAT:
- Jawaban benar HARUS bervariasi (tidak selalu A)!
- Pembahasan HARUS sangat detail dan rinci!
- Gunakan bahasa Indonesia yang baik dan benar!
- Kembalikan HANYA JSON array, tanpa markdown code block!`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      return NextResponse.json({ error: 'AI tidak menghasilkan respons' }, { status: 500 })
    }

    let questions: {
      questionText: string
      optionA: string
      optionB: string
      optionC: string
      optionD: string
      optionE: string
      correctAnswer: string
      explanation: string
    }[] = []

    try {
      questions = JSON.parse(responseText)
    } catch {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        try {
          questions = JSON.parse(jsonMatch[0])
        } catch {
          return NextResponse.json({
            error: 'Gagal memproses respons AI. Coba lagi.',
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({
          error: 'Format respons AI tidak valid. Coba lagi.',
        }, { status: 500 })
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'AI tidak menghasilkan soal yang valid' }, { status: 500 })
    }

    const validQuestions = questions.filter(q =>
      q.questionText && q.optionA && q.optionB && q.optionC && q.optionD && q.optionE &&
      ['A', 'B', 'C', 'D', 'E'].includes(q.correctAnswer)
    )

    if (validQuestions.length === 0) {
      return NextResponse.json({ error: 'Tidak ada soal valid yang dihasilkan AI' }, { status: 500 })
    }

    const maxOrder = await db.question.findFirst({
      where: { examId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    let order = (maxOrder?.order ?? 0) + 1

    for (const q of validQuestions) {
      await db.question.create({
        data: {
          examId,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          optionE: q.optionE,
          correctAnswer: q.correctAnswer.toUpperCase(),
          explanation: q.explanation || null,
          order: order++,
        },
      })
    }

    return NextResponse.json({
      count: validQuestions.length,
      message: `${validQuestions.length} soal berhasil dibuat oleh AI`,
    })
  } catch (error) {
    console.error('AI generate questions error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan saat membuat soal dengan AI' }, { status: 500 })
  }
}
