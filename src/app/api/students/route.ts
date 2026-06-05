import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const DEFAULT_SISWA_PASSWORD = 'siswa'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')

    const where: Record<string, unknown> = { role: 'SISWA' }
    if (subject) {
      where.subject = subject
    }

    const students = await db.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        class: true,
        subject: true,
        plainPassword: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    const result = students.map(s => ({
      id: s.id,
      username: s.username,
      name: s.name,
      class: s.class,
      subject: s.subject,
      password: s.plainPassword || DEFAULT_SISWA_PASSWORD,
      isActive: s.isActive,
      createdAt: s.createdAt,
    }))
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, name, class: studentClass, subject, password } = await request.json()

    if (!username || !name) {
      return NextResponse.json({ error: 'Username dan nama harus diisi' }, { status: 400 })
    }

    const rawPassword = password || DEFAULT_SISWA_PASSWORD

    // Check username uniqueness
    const existing = await db.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10)
    const student = await db.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        plainPassword: rawPassword,
        role: 'SISWA',
        class: studentClass || null,
        subject: subject || null,
      }
    })

    return NextResponse.json({
      id: student.id,
      username: student.username,
      name: student.name,
      class: student.class,
      subject: student.subject,
      password: rawPassword,
      isActive: student.isActive,
      createdAt: student.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// CSV Bulk Import
export async function PUT(request: NextRequest) {
  try {
    const { students } = await request.json()

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'Data siswa tidak valid' }, { status: 400 })
    }

    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const row of students) {
      const username = (row.username || '').trim()
      const name = (row.name || '').trim()
      const studentClass = (row.class || '').trim()
      const subject = (row.subject || '').trim()
      const password = (row.password || '').trim() || DEFAULT_SISWA_PASSWORD

      if (!username || !name) {
        results.failed++
        results.errors.push(`Baris dilewati: username atau nama kosong`)
        continue
      }

      // Check uniqueness
      const existing = await db.user.findUnique({ where: { username } })
      if (existing) {
        results.failed++
        results.errors.push(`Username "${username}" sudah digunakan`)
        continue
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      await db.user.create({
        data: {
          username,
          name,
          password: hashedPassword,
          plainPassword: password,
          role: 'SISWA',
          class: studentClass || null,
          subject: subject || null,
        }
      })
      results.success++
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
