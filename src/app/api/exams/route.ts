import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')
    const createdBy = searchParams.get('createdBy')
    const studentSubject = searchParams.get('studentSubject')

    const where: Record<string, unknown> = {}

    // Filter by creator's subject (for guru dashboard)
    if (subject) {
      where.OR = [
        { subject: subject },
        { creator: { subject: subject } },
      ]
    }

    // Filter by exam subject (for student dashboard - show exams matching their subject)
    if (studentSubject) {
      where.subject = studentSubject
    }

    if (createdBy) {
      where.createdBy = createdBy
    }

    const exams = await db.exam.findMany({
      where,
      include: {
        _count: { select: { questions: true, sessions: true } },
        creator: { select: { name: true, subject: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(exams)
  } catch (error) {
    console.error('Get exams error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, subject, duration, createdBy } = await request.json()

    if (!title || !createdBy) {
      return NextResponse.json({ error: 'Title dan createdBy harus diisi' }, { status: 400 })
    }

    const exam = await db.exam.create({
      data: {
        title,
        description: description || null,
        subject: subject || null,
        duration: duration || 60,
        createdBy,
        isActive: false,
      }
    })
    return NextResponse.json(exam, { status: 201 })
  } catch (error) {
    console.error('Create exam error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
