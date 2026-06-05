import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password, name, role, class: className, subject } = await request.json()

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Username, password, dan nama harus diisi' }, { status: 400 })
    }

    // Check username uniqueness
    const existing = await db.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || 'SISWA',
        class: className || null,
        subject: subject || null,
      }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        class: user.class,
        subject: user.subject,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
