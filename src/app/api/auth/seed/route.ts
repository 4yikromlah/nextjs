import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    const results: string[] = []

    // Seed admin user (upsert to always fix password)
    const hashedAdminPassword = await bcrypt.hash('admin', 10)
    const existingAdmin = await db.user.findUnique({ where: { username: 'admin' } })
    if (!existingAdmin) {
      await db.user.create({
        data: {
          username: 'admin',
          password: hashedAdminPassword,
          name: 'Administrator',
          role: 'ADMIN',
        }
      })
      results.push('Admin user created')
    } else {
      await db.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedAdminPassword }
      })
      results.push('Admin user password updated')
    }

    // Seed guru users
    const guruData = [
      { username: 'mulyadi', password: 'gurubahagia', name: 'Drs. Mulyadi', role: 'GURU' as const, subject: 'Matematika' },
      { username: 'sari', password: 'gurubahagia', name: 'Sari Wahyuni, S.Pd', role: 'GURU' as const, subject: 'Bahasa Indonesia' },
    ]

    for (const guru of guruData) {
      const existingGuru = await db.user.findUnique({ where: { username: guru.username } })
      if (!existingGuru) {
        const hashedPassword = await bcrypt.hash(guru.password, 10)
        await db.user.create({ data: { ...guru, password: hashedPassword } })
        results.push(`Guru user "${guru.name}" created`)
      } else {
        const hashedPassword = await bcrypt.hash(guru.password, 10)
        await db.user.update({
          where: { id: existingGuru.id },
          data: { password: hashedPassword }
        })
        results.push(`Guru user "${guru.name}" password updated`)
      }
    }

    // Get mulyadi's ID for exam creation
    const mulyadi = await db.user.findUnique({ where: { username: 'mulyadi' } })
    const sari = await db.user.findUnique({ where: { username: 'sari' } })

    // Seed Exam 1: Matematika
    if (mulyadi) {
      const existingExam1 = await db.exam.findFirst({ where: { title: 'Ujian Matematika Kelas XII' } })
      if (!existingExam1) {
        const exam1 = await db.exam.create({
          data: {
            title: 'Ujian Matematika Kelas XII',
            description: 'Ujian Akhir Semester Genap Mata Pelajaran Matematika',
            duration: 90,
            isActive: true,
            createdBy: mulyadi.id,
          }
        })

        // Seed questions for Exam 1
        await db.question.createMany({
          data: [
            {
              examId: exam1.id,
              questionText: 'Hasil dari integral ∫(2x + 3)dx adalah...',
              optionA: 'x² + 3x + C',
              optionB: '2x² + 3x + C',
              optionC: 'x² + 3 + C',
              optionD: '2x + 3 + C',
              optionE: 'x² + 6x + C',
              correctAnswer: 'A',
              explanation: '∫(2x + 3)dx = x² + 3x + C, menggunakan aturan integral pangkat.',
              order: 1,
            },
            {
              examId: exam1.id,
              questionText: 'Jika f(x) = 3x² - 2x + 1, maka f\'(x) = ...',
              optionA: '6x - 2',
              optionB: '3x - 2',
              optionC: '6x² - 2',
              optionD: '6x + 2',
              optionE: '3x² - 2',
              correctAnswer: 'A',
              explanation: 'Turunan dari 3x² adalah 6x, turunan dari -2x adalah -2, turunan dari 1 adalah 0. Jadi f\'(x) = 6x - 2.',
              order: 2,
            },
            {
              examId: exam1.id,
              questionText: 'Nilai determinan matriks [[2, 3], [4, 5]] adalah...',
              optionA: '-2',
              optionB: '2',
              optionC: '-22',
              optionD: '22',
              optionE: '10',
              correctAnswer: 'A',
              explanation: 'Determinan = (2×5) - (3×4) = 10 - 12 = -2.',
              order: 3,
            },
            {
              examId: exam1.id,
              questionText: 'Jika log 2 = 0,301 dan log 3 = 0,477, maka log 6 = ...',
              optionA: '0,778',
              optionB: '0,778',
              optionC: '0,143',
              optionD: '0,624',
              optionE: '1,778',
              correctAnswer: 'A',
              explanation: 'log 6 = log(2×3) = log 2 + log 3 = 0,301 + 0,477 = 0,778.',
              order: 4,
            },
            {
              examId: exam1.id,
              questionText: 'Hasil dari lim(x→2) (x² - 4)/(x - 2) adalah...',
              optionA: '4',
              optionB: '2',
              optionC: '0',
              optionD: '∞',
              optionE: '8',
              correctAnswer: 'A',
              explanation: 'lim(x→2) (x² - 4)/(x - 2) = lim(x→2) (x + 2)(x - 2)/(x - 2) = lim(x→2) (x + 2) = 4.',
              order: 5,
            },
          ]
        })
        results.push('Exam "Ujian Matematika Kelas XII" created with 5 questions')
      } else {
        results.push('Exam "Ujian Matematika Kelas XII" already exists')
      }
    }

    // Seed Exam 2: Bahasa Indonesia
    if (sari) {
      const existingExam2 = await db.exam.findFirst({ where: { title: 'Ujian Bahasa Indonesia Kelas XI' } })
      if (!existingExam2) {
        const exam2 = await db.exam.create({
          data: {
            title: 'Ujian Bahasa Indonesia Kelas XI',
            description: 'Ujian Akhir Semester Genap Mata Pelajaran Bahasa Indonesia',
            duration: 60,
            isActive: true,
            createdBy: sari.id,
          }
        })

        // Seed questions for Exam 2
        await db.question.createMany({
          data: [
            {
              examId: exam2.id,
              questionText: 'Majas yang membandingkan dua hal secara langsung disebut...',
              optionA: 'Asosiasi',
              optionB: 'Metafora',
              optionC: 'Personifikasi',
              optionD: 'Hiperbola',
              optionE: 'Litotes',
              correctAnswer: 'A',
              explanation: 'Asosiasi (atau perumpamaan eksplisit) adalah majas yang membandingkan dua hal secara langsung dengan menggunakan kata pembanding seperti "bagai", "seperti", "laksana".',
              order: 1,
            },
            {
              examId: exam2.id,
              questionText: 'Kalimat yang mengandung majas personifikasi adalah...',
              optionA: 'Angin menari di antara dedaunan',
              optionB: 'Hatinya sedingin es',
              optionC: 'Dia singa di medan perang',
              optionD: 'Aku merasa terbang ke langit',
              optionE: 'Rumahnya sebesar istana',
              correctAnswer: 'A',
              explanation: 'Personifikasi adalah majas yang mengumpamakan benda mati seolah-olah hidup seperti manusia. "Angin menari" memberikan sifat manusia (menari) pada angin (benda mati).',
              order: 2,
            },
            {
              examId: exam2.id,
              questionText: 'Bagian struktur teks persuasi yang berisi harapan agar pembaca melakukan sesuatu disebut...',
              optionA: 'Ajakan',
              optionB: 'Pengenalan isu',
              optionC: 'Rangkaian argumen',
              optionD: 'Pernyataan fakta',
              optionE: 'Penegasan',
              correctAnswer: 'A',
              explanation: 'Ajakan adalah bagian dari teks persuasi yang berisi harapan atau anjuran agar pembaca atau pendengar melakukan sesuatu sesuai dengan yang diinginkan penulis.',
              order: 3,
            },
            {
              examId: exam2.id,
              questionText: 'Kata baku dari kata "aktifitas" adalah...',
              optionA: 'Aktivitas',
              optionB: 'Aktifitas',
              optionC: 'Aktipitas',
              optionD: 'Aktivutas',
              optionE: 'Aktipitas',
              correctAnswer: 'A',
              explanation: 'Kata baku yang benar adalah "aktivitas", bukan "aktifitas". Kata ini berasal dari bahasa Belanda "activiteit".',
              order: 4,
            },
            {
              examId: exam2.id,
              questionText: 'Unsur intrinsik cerpen yang merupakan urutan peristiwa dari awal hingga akhir disebut...',
              optionA: 'Alur',
              optionB: 'Tema',
              optionC: 'Penokohan',
              optionD: 'Latar',
              optionE: 'Sudut pandang',
              correctAnswer: 'A',
              explanation: 'Alur (plot) adalah unsur intrinsik yang merupakan urutan peristiwa dari awal hingga akhir dalam sebuah karya sastra.',
              order: 5,
            },
          ]
        })
        results.push('Exam "Ujian Bahasa Indonesia Kelas XI" created with 5 questions')
      } else {
        results.push('Exam "Ujian Bahasa Indonesia Kelas XI" already exists')
      }
    }

    return NextResponse.json({ message: 'Seed completed', results })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
