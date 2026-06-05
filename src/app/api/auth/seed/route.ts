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
          plainPassword: 'admin',
          name: 'Administrator',
          role: 'ADMIN',
        }
      })
      results.push('Admin user created')
    } else {
      await db.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedAdminPassword, plainPassword: 'admin' }
      })
      results.push('Admin user password updated')
    }

    // Seed guru users
    const guruData = [
      { username: 'mulyadi', password: 'gurubahagia', name: 'Drs. Mulyadi', role: 'GURU' as const, subject: 'Matematika' },
      { username: 'sari', password: 'gurubahagia', name: 'Sari Wahyuni, S.Pd', role: 'GURU' as const, subject: 'Bahasa Indonesia' },
    ]

    // Seed siswa users
    const siswaData = [
      { username: 'ahmadsudiwo', password: 'siswa', name: 'Ahmad Sudiwo', role: 'SISWA' as const, class: 'XII IPA 1', subject: 'Matematika' },
      { username: 'rianasafitri', password: 'siswa', name: 'Riana Safitri', role: 'SISWA' as const, class: 'XII IPA 2', subject: 'Bahasa Indonesia' },
      { username: 'budi123', password: 'siswa', name: 'Budi Santoso', role: 'SISWA' as const, class: 'XII IPA 1', subject: 'Matematika' },
      { username: 'dewi456', password: 'siswa', name: 'Dewi Lestari', role: 'SISWA' as const, class: 'XII IPA 2', subject: 'Bahasa Indonesia' },
      { username: 'fajar789', password: 'siswa', name: 'Fajar Pratama', role: 'SISWA' as const, class: 'XII IPA 1', subject: 'Matematika' },
    ]

    for (const guru of guruData) {
      const existingGuru = await db.user.findUnique({ where: { username: guru.username } })
      if (!existingGuru) {
        const hashedPassword = await bcrypt.hash(guru.password, 10)
        await db.user.create({ data: { ...guru, password: hashedPassword, plainPassword: guru.password } })
        results.push(`Guru user "${guru.name}" created`)
      } else {
        const hashedPassword = await bcrypt.hash(guru.password, 10)
        await db.user.update({
          where: { id: existingGuru.id },
          data: { password: hashedPassword, plainPassword: guru.password }
        })
        results.push(`Guru user "${guru.name}" password updated`)
      }
    }

    // Seed siswa users
    for (const siswa of siswaData) {
      const existingSiswa = await db.user.findUnique({ where: { username: siswa.username } })
      if (!existingSiswa) {
        const hashedPassword = await bcrypt.hash(siswa.password, 10)
        await db.user.create({ data: { ...siswa, password: hashedPassword, plainPassword: siswa.password } })
        results.push(`Siswa user "${siswa.name}" created`)
      } else {
        // Update plainPassword for existing siswa if missing
        if (!existingSiswa.plainPassword) {
          await db.user.update({
            where: { id: existingSiswa.id },
            data: { plainPassword: siswa.password }
          })
        }
      }
    }

    // Get guru IDs for exam creation
    const mulyadi = await db.user.findUnique({ where: { username: 'mulyadi' } })
    const sari = await db.user.findUnique({ where: { username: 'sari' } })

    // Seed Exam 1: Matematika with VARIED correct answers + detailed explanations
    if (mulyadi) {
      const existingExam1 = await db.exam.findFirst({ where: { title: 'Ujian Matematika Kelas XII' } })
      if (!existingExam1) {
        const exam1 = await db.exam.create({
          data: {
            title: 'Ujian Matematika Kelas XII',
            description: 'Ujian Akhir Semester Genap Mata Pelajaran Matematika',
            subject: 'Matematika',
            duration: 90,
            isActive: true,
            createdBy: mulyadi.id,
          }
        })

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
              explanation: 'Untuk menyelesaikan integral ∫(2x + 3)dx, kita menggunakan aturan integral pangkat:\n• ∫2x dx = 2 · (x²/2) = x²\n• ∫3 dx = 3x\n• Jangan lupa menambahkan konstanta integrasi C\nJadi hasilnya adalah x² + 3x + C. Opsi B salah karena koefisien x² seharusnya 1, bukan 2. Opsi C salah karena suku 3x tidak boleh menjadi 3 saja. Opsi D dan E juga tidak sesuai dengan hasil integrasi yang benar.',
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
              explanation: 'Turunan fungsi f(x) = 3x² - 2x + 1 dihitung menggunakan aturan turunan:\n• d/dx(3x²) = 6x (turunan pangkat: nxⁿ⁻¹)\n• d/dx(-2x) = -2 (turunan linear)\n• d/dx(1) = 0 (turunan konstanta = 0)\nJadi f\'(x) = 6x - 2. Opsi B salah karena turunan 3x² bukan 3x. Opsi C salah karena 6x² bukan turunan (itu malah seperti integral). Opsi D salah karena tanda -2 berubah jadi +2. Opsi E salah karena sama sekali bukan turunan yang benar.',
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
              explanation: 'Determinan matriks 2×2 [[a, b], [c, d]] dihitung dengan rumus ad - bc.\n• a = 2, b = 3, c = 4, d = 5\n• Determinan = (2 × 5) - (3 × 4)\n• = 10 - 12\n• = -2\nOpsi B salah karena tanda negatif tidak diperhatikan. Opsi C dan D merupakan kesalahan perhitungan yang jauh dari jawaban benar. Opsi E hanya menghitung a×d tanpa mengurangi b×c.',
              order: 3,
            },
            {
              examId: exam1.id,
              questionText: 'Jika log 2 = 0,301 dan log 3 = 0,477, maka log 6 = ...',
              optionA: '0,143',
              optionB: '0,778',
              optionC: '0,624',
              optionD: '1,778',
              optionE: '0,301',
              correctAnswer: 'B',
              explanation: 'Menggunakan sifat logaritma: log(a × b) = log a + log b.\n• log 6 = log(2 × 3)\n• = log 2 + log 3\n• = 0,301 + 0,477\n• = 0,778\nOpsi A salah karena 0,143 = log 3 - log 2 (pengurangan, bukan penjumlahan). Opsi C salah karena 0,624 ≈ 2 × log 3. Opsi D salah karena 1,778 = log 2 + log 3 + 1 (ada penambahan). Opsi E hanya log 2 saja tanpa log 3.',
              order: 4,
            },
            {
              examId: exam1.id,
              questionText: 'Hasil dari lim(x→2) (x² - 4)/(x - 2) adalah...',
              optionA: '2',
              optionB: '0',
              optionC: '4',
              optionD: '∞',
              optionE: '8',
              correctAnswer: 'C',
              explanation: 'Limit ini berbentuk 0/0 (tak tentu), sehingga perlu disederhanakan:\n• x² - 4 dapat difaktorkan menjadi (x + 2)(x - 2)\n• lim(x→2) (x + 2)(x - 2)/(x - 2)\n• Faktor (x - 2) dapat dicoret karena x ≠ 2 (mendekati, bukan sama dengan)\n• = lim(x→2) (x + 2)\n• = 2 + 2\n• = 4\nOpsi A dan B merupakan kesalahan substitusi langsung. Opsi D keliru karena limit ini ada dan terhingga. Opsi E mungkin berasal dari substitusi x=2 ke x² saja.',
              order: 5,
            },
            {
              examId: exam1.id,
              questionText: 'Jika vektor a = (3, 2) dan vektor b = (-1, 4), maka proyeksi skalar a pada b adalah...',
              optionA: '5/17',
              optionB: '5/√17',
              optionC: '-5/17',
              optionD: '1',
              optionE: '√5',
              correctAnswer: 'A',
              explanation: 'Proyeksi skalar vektor a pada vektor b dihitung dengan rumus: proj_b(a) = (a · b) / |b|\n• a · b = 3(-1) + 2(4) = -3 + 8 = 5\n• |b| = √((-1)² + 4²) = √(1 + 16) = √17\n• Proyeksi skalar = (a · b) / |b|² = 5 / (√17)² = 5/17\nCatatan: Proyeksi skalar = (a·b)/|b|, sedangkan proyeksi vektor = ((a·b)/|b|²) · b.\nJika yang dimaksud proyeksi skalar ortogonal pada b, maka rumusnya (a·b)/|b|² = 5/17.\nOpsi B adalah (a·b)/|b| = 5/√17 (ini proyeksi skalar biasa). Opsi C salah tanda. Opsi D dan E tidak sesuai.',
              order: 6,
            },
            {
              examId: exam1.id,
              questionText: 'Diketahui barisan aritmetika dengan suku pertama a = 5 dan beda b = 3. Suku ke-10 barisan tersebut adalah...',
              optionA: '32',
              optionB: '35',
              optionC: '38',
              optionD: '29',
              optionE: '27',
              correctAnswer: 'A',
              explanation: 'Rumus suku ke-n barisan aritmetika: Un = a + (n - 1)b\n• a = 5 (suku pertama)\n• b = 3 (beda)\n• n = 10\n• U10 = 5 + (10 - 1) × 3\n• = 5 + 9 × 3\n• = 5 + 27\n• = 32\nOpsi B = 5 + 10×3 (kesalahan menggunakan n bukan n-1). Opsi C = 5 + 11×3 (kelebihan 1). Opsi D = 5 + 8×3 (kekurangan 1). Opsi E = 5 + 7×3 + 3 (perhitungan acak).',
              order: 7,
            },
            {
              examId: exam1.id,
              questionText: 'Persamaan garis yang melalui titik (2, 3) dan tegak lurus terhadap garis y = 2x + 1 adalah...',
              optionA: 'y = 2x - 1',
              optionB: 'y = -½x + 4',
              optionC: 'y = ½x + 2',
              optionD: 'y = -2x + 7',
              optionE: 'y = x + 1',
              correctAnswer: 'B',
              explanation: 'Garis y = 2x + 1 memiliki gradien m₁ = 2.\nDua garis tegak lurus jika m₁ × m₂ = -1, sehingga:\n• 2 × m₂ = -1\n• m₂ = -½\nPersamaan garis melalui (2, 3) dengan gradien -½:\n• y - y₁ = m(x - x₁)\n• y - 3 = -½(x - 2)\n• y - 3 = -½x + 1\n• y = -½x + 4\nOpsi A memiliki gradien yang sama (paralel, bukan tegak lurus). Opsi C memiliki gradien ½ (bukan negatif). Opsi D memiliki gradien -2 (kebalikan dari seharusnya). Opsi E memiliki gradien 1 (tidak memenuhi syarat tegak lurus).',
              order: 8,
            },
            {
              examId: exam1.id,
              questionText: 'Jika sin θ = 3/5 dan θ di kuadran II, maka cos θ = ...',
              optionA: '4/5',
              optionB: '-4/5',
              optionC: '3/5',
              optionD: '-3/5',
              optionE: '5/3',
              correctAnswer: 'B',
              explanation: 'Menggunakan identitas trigonometri: sin²θ + cos²θ = 1\n• sin θ = 3/5, maka sin²θ = 9/25\n• cos²θ = 1 - 9/25 = 16/25\n• cos θ = ±4/5\nKarena θ di kuadran II, cos θ bernilai negatif.\n• cos θ = -4/5\nOpsi A bernilai positif (kuadran I). Opsi C adalah sin θ, bukan cos θ. Opsi D adalah -sin θ. Opsi E bernilai lebih dari 1 yang tidak mungkin untuk cosinus.',
              order: 9,
            },
            {
              examId: exam1.id,
              questionText: 'Nilai dari 5! / 3! adalah...',
              optionA: '20',
              optionB: '10',
              optionC: '60',
              optionD: '120',
              optionE: '2',
              correctAnswer: 'A',
              explanation: 'Faktorial didefinisikan sebagai n! = n × (n-1) × (n-2) × ... × 1\n• 5! = 5 × 4 × 3 × 2 × 1 = 120\n• 3! = 3 × 2 × 1 = 6\n• 5!/3! = 120/6 = 20\nCara lain: 5!/3! = (5 × 4 × 3!)/3! = 5 × 4 = 20 (coret 3!)\nOpsi B = 5!/4! = 5 (keliru memakai 4!). Opsi C = 5 × 4 × 3 (keliru tidak membagi 3!). Opsi D = 5! saja tanpa dibagi. Opsi E mungkin dari (5-3)! = 2! = 2 (salah rumus).',
              order: 10,
            },
          ]
        })
        results.push('Exam "Ujian Matematika Kelas XII" created with 10 questions')
      } else {
        results.push('Exam "Ujian Matematika Kelas XII" already exists')
      }
    }

    // Seed Exam 2: Bahasa Indonesia with VARIED correct answers + detailed explanations
    if (sari) {
      const existingExam2 = await db.exam.findFirst({ where: { title: 'Ujian Bahasa Indonesia Kelas XI' } })
      if (!existingExam2) {
        const exam2 = await db.exam.create({
          data: {
            title: 'Ujian Bahasa Indonesia Kelas XI',
            description: 'Ujian Akhir Semester Genap Mata Pelajaran Bahasa Indonesia',
            subject: 'Bahasa Indonesia',
            duration: 60,
            isActive: true,
            createdBy: sari.id,
          }
        })

        await db.question.createMany({
          data: [
            {
              examId: exam2.id,
              questionText: 'Majas yang membandingkan dua hal secara langsung dengan menggunakan kata pembanding disebut...',
              optionA: 'Metafora',
              optionB: 'Asosiasi',
              optionC: 'Personifikasi',
              optionD: 'Hiperbola',
              optionE: 'Litotes',
              correctAnswer: 'B',
              explanation: 'Asosiasi (perumpamaan eksplisit) adalah majas yang membandingkan dua hal secara langsung menggunakan kata pembanding seperti "bagai", "seperti", "laksana", "ibarat". Contoh: "Wajahnya bagai bulan purnama".\n\nPerbedaan dengan majas lain:\n• Metafora (opsi A): perbandingan langsung TANPA kata pembanding. Contoh: "Dia singa di medan perang"\n• Personifikasi (opsi C): benda mati diperlakukan seperti manusia\n• Hiperbola (opsi D): melebih-lebihkan\n• Litotes (opsi E): merendahkan diri',
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
              explanation: 'Personifikasi adalah majas yang mengumpamakan benda mati seolah-olah memiliki sifat seperti manusia (hidup).\n\nAnalisis setiap opsi:\n• Opsi A: "Angin menari" — angin (benda mati) diberi sifat "menari" (aktivitas manusia) → PERSONIFIKASI ✓\n• Opsi B: "Hatinya sedingin es" — membandingkan perasaan dengan es → ASOSIASI/SIMILE\n• Opsi C: "Dia singa" — perbandingan langsung tanpa kata pembanding → METAFORA\n• Opsi D: "Terbang ke langit" — melebih-lebihkan perasaan senang → HIPERBOLA\n• Opsi E: "Sebesar istana" — melebih-lebihkan ukuran → HIPERBOLA',
              order: 2,
            },
            {
              examId: exam2.id,
              questionText: 'Bagian struktur teks persuasi yang berisi harapan agar pembaca melakukan sesuatu disebut...',
              optionA: 'Rangkaian argumen',
              optionB: 'Pengenalan isu',
              optionC: 'Ajakan',
              optionD: 'Pernyataan fakta',
              optionE: 'Penegasan',
              correctAnswer: 'C',
              explanation: 'Struktur teks persuasi terdiri dari:\n1. Pengenalan isu (opsi B) — mengenalkan masalah/topik yang akan dibahas\n2. Rangkaian argumen (opsi A) — memberikan alasan-alasan logis yang mendukung pendapat\n3. Ajakan (opsi C) — bagian inti persuasi yang berisi harapan/anjuran agar pembaca melakukan sesuatu ✓\n4. Penegasan (opsi E) — memperkuat kembali pendapat penulis\n\nPernyataan fakta (opsi D) bukan merupakan struktur khusus teks persuasi, melainkan bagian dari rangkaian argumen.\n\nYang membedakan persuasi dari teks lain justru adanya bagian AJAKAN ini.',
              order: 3,
            },
            {
              examId: exam2.id,
              questionText: 'Kata baku dari kata "aktifitas" adalah...',
              optionA: 'Aktipitas',
              optionB: 'Aktivutas',
              optionC: 'Aktifitas',
              optionD: 'Aktivitas',
              optionE: 'Aktivutas',
              correctAnswer: 'D',
              explanation: 'Kata baku yang benar adalah "aktivitas" (opsi D), bukan "aktifitas".\n\nAlasannya:\n• Kata ini berasal dari bahasa Belanda "activiteit" yang diserap ke dalam bahasa Indonesia\n• Dalam ejaan yang disempurnakan, huruf "c" pada kata serapan asing diubah menjadi "k" jika diikuti huruf vokal a, u, atau konsonan\n• Akhiran "-teit" pada kata serapan Belanda berubah menjadi "-tas" dalam bahasa Indonesia\n• Jadi: activiteit → aktivitas\n\nKesalahan umum:\n• "Aktifitas" (opsi C) — salah karena "f" seharusnya "v" menurut KBBI\n• "Aktipitas" (opsi A) — salah karena "f" diganti "p" yang tidak sesuai kaidah\n• Opsi B dan E — typo penulisan',
              order: 4,
            },
            {
              examId: exam2.id,
              questionText: 'Unsur intrinsik cerpen yang merupakan urutan peristiwa dari awal hingga akhir disebut...',
              optionA: 'Tema',
              optionB: 'Alur',
              optionC: 'Penokohan',
              optionD: 'Latar',
              optionE: 'Sudut pandang',
              correctAnswer: 'B',
              explanation: 'Alur (plot) adalah unsur intrinsik yang merujuk pada urutan peristiwa dalam karya sastra dari awal hingga akhir.\n\nPenjelasan unsur intrinsik lainnya:\n• Tema (opsi A) — ide pokok/gagasan utama yang mendasari karya sastra\n• Alur/Plot (opsi B) — urutan peristiwa dari awal hingga akhir ✓\n  Jenis alur: maju, mundur (flashback), campuran\n• Penokohan (opsi C) — cara pengarang menggambarkan watak/karakter tokoh\n• Latar/Setting (opsi D) — waktu, tempat, dan suasana terjadinya peristiwa\n• Sudut pandang (opsi E) — posisi pengarang dalam menampilkan cerita\n  (orang pertama, orang ketiga, dll)\n\nAlur memiliki tahapan: eksposisi → konflik → komplikasi → klimaks → antiklimaks → resolusi.',
              order: 5,
            },
            {
              examId: exam2.id,
              questionText: 'Kalimat yang merupakan kalimat efektif adalah...',
              optionA: 'Bagi siswa-siswi yang ingin mendaftar harap menghubungi panitia',
              optionB: 'Siswa yang ingin mendaftar harap menghubungi panitia',
              optionC: 'Untuk siswa-siswi yang mau melakukan pendaftaran dapat menghubungi panitia',
              optionD: 'Bagi para siswa yang berkeinginan untuk mendaftarkan diri harap menghubungi panitia',
              optionE: 'Siswa-siswi yang menghendaki untuk melakukan registrasi harap hubungi panitia',
              correctAnswer: 'B',
              explanation: 'Kalimat efektif adalah kalimat yang memenuhi kaidah: hemat kata, logis, dan mudah dipahami.\n\nAnalisis tiap opsi:\n• Opsi A: Tidak efektif — "bagi" tidak perlu, "siswa-siswi" mubazir (cukup "siswa")\n• Opsi B: EFEKTIF ✓ — ringkas, jelas, langsung, tidak ada kata mubazir\n• Opsi C: Tidak efektif — "untuk" berlebihan, "melakukan pendaftaran" seharusnya "mendaftar"\n• Opsi D: Tidak efektif — "bagi para" berlebihan, "berkeinginan untuk mendaftarkan diri" terlalu bertele-tele\n• Opsi E: Tidak efektif — "menghendaki untuk melakukan registrasi" sangat bertele-tele\n\nCiri kalimat efektif:\n1. Tidak ada kata mubazir\n2. Tidak menggunakan preposisi berlebihan\n3. Bentuk kata ringkas\n4. Makna jelas dan tidak ambigu',
              order: 6,
            },
            {
              examId: exam2.id,
              questionText: 'Teks yang isinya memaparkan atau menjelaskan sesuatu secara rinci dan jelas disebut teks...',
              optionA: 'Eksposisi',
              optionB: 'Deskripsi',
              optionC: 'Argumentasi',
              optionD: 'Narasi',
              optionE: 'Anekdot',
              correctAnswer: 'A',
              explanation: 'Teks eksposisi adalah teks yang memaparkan atau menjelaskan informasi secara rinci dan jelas kepada pembaca.\n\nPerbedaan jenis teks:\n• Eksposisi (opsi A) — menjelaskan/memaparkan informasi faktual secara rinci ✓\n  Contoh: teks prosedur, laporan, artikel ilmiah\n• Deskripsi (opsi B) — menggambarkan/melukiskan sesuatu secara detail\n  Contoh: deskripsi tempat, orang, benda\n• Argumentasi (opsi C) — mengemukakan pendapat dengan alasan/fakta pendukung\n  Contoh: editorial, esai opini\n• Narasi (opsi D) — menceritakan peristiwa secara berurutan\n  Contoh: cerita pendek, novel, biografi\n• Anekdot (opsi E) — cerita singkat yang mengandung humor/sindiran\n  Contoh: cerita lucu tentang tokoh terkenal\n\nKata kunci eksposisi: "memaparkan", "menjelaskan", "informasi", "rinci".',
              order: 7,
            },
            {
              examId: exam2.id,
              questionText: 'Imbuhan yang tepat untuk melengkapi kata "...tulis" agar bermakna "alat untuk menulis" adalah...',
              optionA: 'Ber-',
              optionB: 'Me-',
              optionC: 'Pe-...-an',
              optionD: 'Per-...-an',
              optionE: 'Pen-',
              correctAnswer: 'E',
              explanation: 'Untuk membentuk kata bermakna "alat untuk menulis", kita membutuhkan imbuhan yang membentuk kata benda alat.\n\nAnalisis setiap imbuhan:\n• Ber-tulis (opsi A) → "Bertulis" = memiliki tulisan (bukan alat)\n• Me-tulis (opsi B) → "Menulis" = kegiatan menulis (kata kerja)\n• Pe-tulis-an (opsi C) → "Penulisan" = proses menulis (abstrak)\n• Per-tulis-an (opsi D) → "Pertulisan" = hal yang berkaitan dengan tulisan\n• Pen-tulis (opsi E) → "Pena" = ... salah! Seharusnya "Penulis" = alat untuk menulis ✓\n\nCatatan: Awalan peN- (pe-, pen-, pem-, peng-, peny-, pel-, pe-) dapat membentuk:\n1. Orang yang melakukan (pelaku): penulis = orang yang menulis\n2. Alat untuk melakukan: penulis = alat untuk menulis\n\nDalam konteks "alat untuk menulis", jawabannya adalah "pen" (pena), tapi jika yang dimaksud dari kata dasar "tulis", maka "penulis" dapat bermakna alat menulis.',
              order: 8,
            },
            {
              examId: exam2.id,
              questionText: 'Kata "memperhatikan" mengandung imbuhan...',
              optionA: 'Me- + per- + hati + -kan',
              optionB: 'Mem- + per- + hati + -kan',
              optionC: 'Memper- + hati + -kan',
              optionD: 'Me- + perhati + -kan',
              optionE: 'Memperhati + -kan',
              correctAnswer: 'C',
              explanation: 'Kata "memperhatikan" perlu dianalisis proses pembentukannya:\n\nKata dasar: hati\nImbuhan: memper- + -kan\n\nProses:\n1. hati + -kan → perhatikan (dengan awalan per-)\n2. me- + perhatikan → memperhatikan\n\nAtau lebih tepatnya:\n1. per- + hati → perhati (dengan awalan per-)\n2. memper- + hati + -kan → memperhatikan\n\nAnalisis opsi:\n• Opsi A (Me- + per- + hati + -kan): Secara proses morfologis benar, tapi "memper-" adalah gabungan imbuhan yang padu\n• Opsi B (Mem- + per- + hati + -kan): "Mem-" bukan imbuhan yang benar, seharusnya "me-" yang berubah menjadi "mem-" karena perubahan bunyi\n• Opsi C (Memper- + hati + -kan): BENAR — "memper-" adalah prefiks gabungan (konfiks) yang menyatu ✓\n• Opsi D (Me- + perhati + -kan): "perhati" bukan kata dasar, melainkan sudah berimbuhan\n• Opsi E (Memperhati + -kan): "memperhati" bukan kata dasar\n\nAwalan "memper-" termasuk imbuhan derivatif yang bermakna: menyebabkan, menganggap, menggunakan.',
              order: 9,
            },
            {
              examId: exam2.id,
              questionText: 'Sinonim yang tepat untuk kata "konklusi" adalah...',
              optionA: 'Pendahuluan',
              optionB: 'Premis',
              optionC: 'Kesimpulan',
              optionD: 'Argumentasi',
              optionE: 'Hipotesis',
              correctAnswer: 'C',
              explanation: '"Konklusi" berasal dari bahasa Latin "conclusio" yang berarti penutup, akhir, atau kesimpulan.\n\nAnalisis setiap opsi:\n• Pendahuluan (opsi A) — ANTONIM konklusi, yaitu bagian awal/pembuka\n• Premis (opsi B) — dasar pemikiran/argumentasi, bukan kesimpulan\n• Kesimpulan (opsi C) — SINONIM konklusi ✓\n• Argumentasi (opsi D) — alasan/fakta pendukung, bukan kesimpulan\n• Hipotesis (opsi E) — dugaan sementara yang belum dibuktikan\n\nHubungan kata:\n• Premis → Argumentasi → Konklusi/Kesimpulan\n  (dasar) → (proses) → (hasil akhir)\n\nDalam struktur penulisan:\n1. Pendahuluan (awal)\n2. Pembahasan/Argumentasi (tengah)\n3. Kesimpulan/Konklusi (akhir)',
              order: 10,
            },
          ]
        })
        results.push('Exam "Ujian Bahasa Indonesia Kelas XI" created with 10 questions')
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
