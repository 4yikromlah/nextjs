import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const examId = searchParams.get('examId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (examId) where.examId = examId
    if (status) where.status = status

    const sessions = await db.examSession.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, class: true } },
        exam: { select: { title: true, duration: true } },
        _count: { select: { answers: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, examId } = await request.json()
    if (!userId || !examId) {
      return NextResponse.json({ error: 'userId dan examId harus diisi' }, { status: 400 })
    }

    // Check for existing in-progress session
    const existing = await db.examSession.findFirst({
      where: { userId, examId, status: 'IN_PROGRESS' }
    })
    if (existing) {
      return NextResponse.json(existing)
    }

    const session = await db.examSession.create({
      data: { userId, examId, startTime: new Date(), status: 'IN_PROGRESS' }
    })
    return NextResponse.json(session)
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
