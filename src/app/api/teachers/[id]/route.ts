import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const DEFAULT_GURU_PASSWORD = 'guru'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const teacher = await db.user.findFirst({
      where: { id, role: 'GURU' },
      select: {
        id: true,
        username: true,
        name: true,
        subject: true,
        plainPassword: true,
        createdAt: true,
      }
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({
      id: teacher.id,
      username: teacher.username,
      name: teacher.name,
      subject: teacher.subject,
      password: teacher.plainPassword || DEFAULT_GURU_PASSWORD,
      createdAt: teacher.createdAt,
    })
  } catch (error) {
    console.error('Get teacher error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { username, name, subject, password } = await request.json()

    // Check if teacher exists
    const existing = await db.user.findFirst({ where: { id, role: 'GURU' } })
    if (!existing) {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 })
    }

    // Check username uniqueness if changing username
    if (username && username !== existing.username) {
      const duplicate = await db.user.findUnique({ where: { username } })
      if (duplicate) {
        return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
      }
    }

    // Build update data - don't update password if it's empty string
    const updateData: Record<string, unknown> = {}
    if (username) updateData.username = username
    if (name) updateData.name = name
    if (subject !== undefined) updateData.subject = subject || null
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
      updateData.plainPassword = password
    }

    const teacher = await db.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      id: teacher.id,
      username: teacher.username,
      name: teacher.name,
      subject: teacher.subject,
      password: teacher.plainPassword || DEFAULT_GURU_PASSWORD,
      createdAt: teacher.createdAt,
    })
  } catch (error) {
    console.error('Update teacher error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if teacher exists
    const existing = await db.user.findFirst({ where: { id, role: 'GURU' } })
    if (!existing) {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 })
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ message: 'Guru berhasil dihapus' })
  } catch (error) {
    console.error('Delete teacher error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
