import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { questionIds } = await request.json()

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'Daftar ID soal harus disertakan' }, { status: 400 })
    }

    const result = await db.question.deleteMany({
      where: {
        id: { in: questionIds }
      }
    })

    return NextResponse.json({ count: result.count, message: `${result.count} soal berhasil dihapus` })
  } catch (error) {
    console.error('Bulk delete questions error:', error)
    return NextResponse.json({ error: 'Gagal menghapus soal' }, { status: 500 })
  }
}
