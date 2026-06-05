import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // Verify question exists
    const existing = await db.question.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Soal tidak ditemukan' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.questionText !== undefined) updateData.questionText = data.questionText
    if (data.optionA !== undefined) updateData.optionA = data.optionA
    if (data.optionB !== undefined) updateData.optionB = data.optionB
    if (data.optionC !== undefined) updateData.optionC = data.optionC
    if (data.optionD !== undefined) updateData.optionD = data.optionD
    if (data.optionE !== undefined) updateData.optionE = data.optionE
    if (data.correctAnswer !== undefined) updateData.correctAnswer = data.correctAnswer
    if (data.explanation !== undefined) updateData.explanation = data.explanation || null
    if (data.order !== undefined) updateData.order = data.order

    const question = await db.question.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error('Update question error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui soal' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.question.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Soal tidak ditemukan' }, { status: 404 })
    }

    await db.question.delete({ where: { id } })
    return NextResponse.json({ message: 'Soal berhasil dihapus' })
  } catch (error) {
    console.error('Delete question error:', error)
    return NextResponse.json({ error: 'Gagal menghapus soal' }, { status: 500 })
  }
}
