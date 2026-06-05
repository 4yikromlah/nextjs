import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')
    const createdBy = searchParams.get('createdBy')

    const examWhere: Record<string, unknown> = {}
    if (subject) examWhere.creator = { subject }
    if (createdBy) examWhere.createdBy = createdBy

    const sessionWhere: Record<string, unknown> = { status: 'COMPLETED', score: { not: null } }
    if (subject) sessionWhere.exam = { creator: { subject } }
    if (createdBy) sessionWhere.exam = { createdBy }

    const [totalExams, completedSessions, totalQuestions, activeExams] = await Promise.all([
      db.exam.count({ where: examWhere }),
      db.examSession.findMany({
        where: sessionWhere,
        select: { score: true },
      }),
      db.question.count({
        where: subject ? { exam: { creator: { subject } } } : {},
      }),
      db.exam.count({ where: { ...examWhere, isActive: true } }),
    ])

    const totalCompleted = completedSessions.length
    const averageScore = totalCompleted > 0
      ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalCompleted)
      : 0

    // Count total students (filtered by subject if provided)
    const studentWhere: Record<string, unknown> = { role: 'SISWA' }
    if (subject) studentWhere.subject = subject
    const totalStudents = await db.user.count({ where: studentWhere })

    return NextResponse.json({
      totalExams,
      completedSessions: totalCompleted,
      averageScore,
      totalStudents,
      totalQuestions,
      activeExams,
      defaultPassword: 'admin',
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
