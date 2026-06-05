import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const DEFAULT_GURU_PASSWORD = 'guru'

export async function GET() {
  try {
    const teachers = await db.user.findMany({
      where: { role: 'GURU' },
      select: {
        id: true,
        username: true,
        name: true,
        subject: true,
        plainPassword: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    // Return with actual plain password
    const result = teachers.map(t => ({
      id: t.id,
      username: t.username,
      name: t.name,
      subject: t.subject,
      password: t.plainPassword || DEFAULT_GURU_PASSWORD,
      createdAt: t.createdAt,
    }))
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get teachers error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, name, subject, password } = await request.json()

    if (!username || !name || !password) {
      return NextResponse.json({ error: 'Username, nama, dan password harus diisi' }, { status: 400 })
    }

    // Check username uniqueness
    const existing = await db.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const teacher = await db.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        plainPassword: password,
        role: 'GURU',
        subject: subject || null,
      }
    })

    return NextResponse.json({
      id: teacher.id,
      username: teacher.username,
      name: teacher.name,
      subject: teacher.subject,
      password: password,
      createdAt: teacher.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Create teacher error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
