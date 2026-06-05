import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    const subject = searchParams.get('subject')

    const where: Record<string, unknown> = { status: 'COMPLETED' }

    if (examId) {
      where.examId = examId
    }

    if (subject) {
      // Filter by subject through both exam's subject field AND creator's subject field
      where.exam = {
        OR: [
          { subject: subject },
          { creator: { subject: subject } }
        ]
      }
    }

    const sessions = await db.examSession.findMany({
      where,
      include: {
        exam: { select: { title: true, duration: true, id: true, creator: { select: { subject: true } } } },
        user: { select: { name: true, username: true, class: true } },
      },
      orderBy: { startTime: 'desc' },
    })
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Get results error:', error)
    return NextResponse.json({ error: 'Gagal memuat hasil ujian' }, { status: 500 })
  }
}
