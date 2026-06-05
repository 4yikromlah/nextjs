import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const DEFAULT_SISWA_PASSWORD = 'siswa'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const student = await db.user.findFirst({
      where: { id, role: 'SISWA' },
      select: {
        id: true,
        username: true,
        name: true,
        class: true,
        subject: true,
        isActive: true,
        createdAt: true,
      }
    })
    if (!student) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ ...student, password: DEFAULT_SISWA_PASSWORD })
  } catch (error) {
    console.error('Get student error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { username, name, class: studentClass, subject, password } = await request.json()

    // Check if student exists
    const existing = await db.user.findFirst({ where: { id, role: 'SISWA' } })
    if (!existing) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    }

    // Check username uniqueness if changing username
    if (username && username !== existing.username) {
      const duplicate = await db.user.findUnique({ where: { username } })
      if (duplicate) {
        return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (username !== undefined) updateData.username = username
    if (name !== undefined) updateData.name = name
    if (studentClass !== undefined) updateData.class = studentClass || null
    if (subject !== undefined) updateData.subject = subject || null
    if (password && password.trim() !== '') updateData.password = await bcrypt.hash(password, 10)

    // Only update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang diperbarui' }, { status: 400 })
    }

    const student = await db.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      id: student.id,
      username: student.username,
      name: student.name,
      class: student.class,
      subject: student.subject,
      password: password && password.trim() !== '' ? password : DEFAULT_SISWA_PASSWORD,
      isActive: student.isActive,
      createdAt: student.createdAt,
    })
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if student exists
    const existing = await db.user.findFirst({ where: { id, role: 'SISWA' } })
    if (!existing) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ message: 'Siswa berhasil dihapus' })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
