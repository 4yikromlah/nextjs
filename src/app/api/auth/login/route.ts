import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password harus diisi' }, { status: 400 })
    }

    // Auto-seed admin if no admin exists
    const adminCount = await db.user.count({ where: { role: 'ADMIN' } })
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await db.user.create({
        data: { email: 'admin@cbt.com', password: hashedPassword, name: 'Administrator', role: 'ADMIN' }
      })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Akun tidak aktif' }, { status: 403 })
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, class: user.class }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
