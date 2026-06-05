import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    const existing = await db.user.findFirst({ where: { role: 'ADMIN' } })
    if (existing) {
      return NextResponse.json({ message: 'Admin sudah ada', user: { id: existing.id, email: existing.email, name: existing.name, role: existing.role } })
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = await db.user.create({
      data: { email: 'admin@cbt.com', password: hashedPassword, name: 'Administrator', role: 'ADMIN' }
    })

    return NextResponse.json({ message: 'Admin berhasil dibuat', user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
