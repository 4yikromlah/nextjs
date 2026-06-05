import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const exam = await db.exam.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        creator: { select: { name: true } },
        _count: { select: { sessions: true } },
      }
    })
    if (!exam) {
      return NextResponse.json({ error: 'Ujian tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(exam)
  } catch (error) {
    console.error('Get exam error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Whitelist only allowed fields to prevent mass assignment
    const data: Record<string, unknown> = {}
    if ('title' in body) data.title = body.title
    if ('subject' in body) data.subject = body.subject || null
    if ('description' in body) data.description = body.description || null
    if ('duration' in body) data.duration = body.duration
    if ('isActive' in body) data.isActive = body.isActive

    const exam = await db.exam.update({
      where: { id },
      data,
    })
    return NextResponse.json(exam)
  } catch (error) {
    console.error('Update exam error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.exam.delete({ where: { id } })
    return NextResponse.json({ message: 'Ujian berhasil dihapus' })
  } catch (error) {
    console.error('Delete exam error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
