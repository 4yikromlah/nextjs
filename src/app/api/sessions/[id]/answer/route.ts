import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { questionId, selectedAnswer, userId } = await request.json()

    if (!questionId || !selectedAnswer || !userId) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    // Get correct answer
    const question = await db.question.findUnique({ where: { id: questionId } })
    if (!question) {
      return NextResponse.json({ error: 'Soal tidak ditemukan' }, { status: 404 })
    }

    const isCorrect = selectedAnswer.toUpperCase() === question.correctAnswer.toUpperCase()

    // Upsert answer
    const existing = await db.answer.findFirst({
      where: { sessionId: id, questionId }
    })

    let answer
    if (existing) {
      answer = await db.answer.update({
        where: { id: existing.id },
        data: { selectedAnswer: selectedAnswer.toUpperCase(), isCorrect, userId }
      })
    } else {
      answer = await db.answer.create({
        data: { sessionId: id, questionId, selectedAnswer: selectedAnswer.toUpperCase(), isCorrect, userId }
      })
    }

    return NextResponse.json(answer)
  } catch (error) {
    console.error('Save answer error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
