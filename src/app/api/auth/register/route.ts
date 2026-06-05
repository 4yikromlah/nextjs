import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, className } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: { name, email, password: hashedPassword, role: 'SISWA', class: className || null }
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, class: user.class }
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
