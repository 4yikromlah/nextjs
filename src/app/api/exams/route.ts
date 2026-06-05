import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const exams = await db.exam.findMany({
      include: {
        _count: { select: { questions: true, sessions: true } },
        creator: { select: { name: true } },
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
    const { title, description, duration, createdBy } = await request.json()

    if (!title || !createdBy) {
      return NextResponse.json({ error: 'Title dan createdBy harus diisi' }, { status: 400 })
    }

    const exam = await db.exam.create({
      data: {
        title,
        description: description || null,
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
