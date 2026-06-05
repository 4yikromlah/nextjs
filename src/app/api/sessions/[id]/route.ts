import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await db.examSession.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        exam: { include: { questions: { orderBy: { order: 'asc' } } } },
        answers: { include: { question: true } }
      }
    })
    if (!session) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
    return NextResponse.json(session)
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const session = await db.examSession.findUnique({
      where: { id },
      include: { exam: { include: { questions: true } }, answers: true }
    })
    if (!session) return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })

    // Calculate score
    const totalQuestions = session.exam.questions.length
    const correctAnswers = session.answers.filter(a => a.isCorrect === true).length
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    const updated = await db.examSession.update({
      where: { id },
      data: { endTime: new Date(), status: 'COMPLETED', score }
    })

    return NextResponse.json({ ...updated, score, correctAnswers, totalQuestions })
  } catch (error) {
    console.error('Submit session error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
