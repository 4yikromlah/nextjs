import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [totalExams, totalStudents, totalQuestions, activeExams, completedSessions, sessionsWithScore] = await Promise.all([
      db.exam.count(),
      db.user.count({ where: { role: 'SISWA' } }),
      db.question.count(),
      db.exam.count({ where: { isActive: true } }),
      db.examSession.count({ where: { status: 'COMPLETED' } }),
      db.examSession.findMany({ where: { status: 'COMPLETED', score: { not: null } }, select: { score: true } })
    ])

    const averageScore = sessionsWithScore.length > 0
      ? Math.round(sessionsWithScore.reduce((sum, s) => sum + (s.score || 0), 0) / sessionsWithScore.length)
      : 0

    return NextResponse.json({ totalExams, totalStudents, totalQuestions, activeExams, completedSessions, averageScore })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
