import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const sessions = await db.examSession.findMany({
      where: { status: 'COMPLETED' },
      include: {
        exam: { select: { title: true } },
        user: { select: { name: true, email: true, class: true } },
      },
      orderBy: { startTime: 'desc' },
    })
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Get results error:', error)
    return NextResponse.json({ error: 'Gagal memuat hasil ujian' }, { status: 500 })
  }
}
