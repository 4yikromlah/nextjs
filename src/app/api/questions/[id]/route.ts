import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()
    const question = await db.question.update({ where: { id }, data })
    return NextResponse.json(question)
  } catch (error) {
    console.error('Update question error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.question.delete({ where: { id } })
    return NextResponse.json({ message: 'Soal berhasil dihapus' })
  } catch (error) {
    console.error('Delete question error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
