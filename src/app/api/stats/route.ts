import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [totalExams, totalSessions, completedSessions] = await Promise.all([
      db.exam.count(),
      db.examSession.count(),
      db.examSession.findMany({
        where: { status: 'COMPLETED', score: { not: null } },
        select: { score: true },
      }),
    ])

    const averageScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
      : 0

    return NextResponse.json({
      totalExams,
      totalSessions,
      averageScore,
      defaultPassword: 'admin', // Default password for admin account
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
