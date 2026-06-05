import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await db.examSession.findUnique({
      where: { id },
      include: {
        exam: { select: { title: true, duration: true, description: true } },
        user: { select: { name: true, username: true, class: true } },
        answers: {
          include: {
            question: true,
          },
        },
      },
    })
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(session)
  } catch (error) {
    console.error('Get result error:', error)
    return NextResponse.json({ error: 'Gagal memuat hasil' }, { status: 500 })
  }
}
