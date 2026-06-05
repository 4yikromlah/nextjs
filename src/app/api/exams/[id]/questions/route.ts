import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const questions = await db.question.findMany({
      where: { examId: id },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(questions)
  } catch (error) {
    console.error('Get questions error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { questionText, optionA, optionB, optionC, optionD, optionE, correctAnswer, explanation } = await request.json()

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !optionE || !correctAnswer) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    const maxOrder = await db.question.findFirst({
      where: { examId: id },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const question = await db.question.create({
      data: {
        examId: id,
        questionText,
        optionA, optionB, optionC, optionD, optionE,
        correctAnswer: correctAnswer.toUpperCase(),
        explanation: explanation || null,
        order: (maxOrder?.order ?? 0) + 1
      }
    })
    return NextResponse.json(question)
  } catch (error) {
    console.error('Create question error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
