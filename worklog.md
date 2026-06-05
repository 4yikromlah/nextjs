# CBT Project Worklog

---
Task ID: 1
Agent: Main Agent
Task: Add subject (mata pelajaran) field to Exam model + form + API

Work Log:
- Added `subject` field (String, optional) to Exam model in prisma/schema.prisma
- Ran db:push to apply schema migration
- Updated POST /api/exams to accept `subject` parameter
- Updated GET /api/exams to support `studentSubject` filter param and improved `subject` filter with OR clause
- Updated seed data to include `subject: 'Matematika'` and `subject: 'Bahasa Indonesia'` for existing exams
- Updated existing exams in DB via SQL to set subjects

Stage Summary:
- Exam model now has optional `subject` field
- Exam creation API accepts subject
- Exam listing API can filter by studentSubject (for student dashboard)
- Existing seeded exams have subjects set correctly

---
Task ID: 2
Agent: Main Agent + Subagents
Task: Add question editing (edit soal) functionality

Work Log:
- Created new API route: PUT /api/questions/[id] for updating questions
- Created new API route: DELETE /api/questions/[id] for deleting single questions (was missing before)
- Updated AdminDashboard.tsx: added editingQuestion state, handleEditQuestion function, edit button per question, dynamic form title
- Updated GuruDashboard.tsx: same question editing functionality added

Stage Summary:
- Questions can now be edited (pencil icon button next to each question)
- Single question deletion now works (was broken before due to missing route)
- Form title changes between "Tambah Soal Baru" and "Edit Soal" based on state

---
Task ID: 3
Agent: Main Agent
Task: Fix student edit not saving to student list

Work Log:
- Changed `fetchStudents()` to `await fetchStudents()` in handleSave (KelolaSiswa)
- Added `.trim()` to all form values before sending to API
- Fixed API PUT handler to use `username !== undefined` instead of `if (username)` (which would fail for falsy values)
- Added validation that at least one field exists for update

Stage Summary:
- Student edit now properly awaits the fetch before closing the form
- API is more robust with undefined checks instead of truthiness checks
- Form values are trimmed before submission

---
Task ID: 4
Agent: Main Agent
Task: Student dashboard - only show exams matching student's subject

Work Log:
- Updated StudentDashboard.tsx fetchExams to filter by student's subject
- Exams with matching subject OR no subject set are shown to students
- Added subject display in welcome card
- Changed `activeExams` to `availableExams` for clarity

Stage Summary:
- Students only see exams matching their enrolled subject
- Exams without a subject are visible to all students
- Student's subject is shown in the dashboard welcome message

---
Task ID: 5
Agent: Main Agent
Task: Student login - only username and password (remove exam selection)

Work Log:
- Changed `showExamSelect: false` for siswa portal config
- Changed button text from "MULAI KERJAKAN UJIAN" to "MASUK PORTAL SISWA"
- Changed button icon from Play to GraduationCap
- Removed exam selection validation from handleLogin

Stage Summary:
- Student login no longer requires selecting an exam first
- Students log in with just username and password
- Exam selection happens on the student dashboard instead

---
Task ID: 6
Agent: Main Agent
Task: Show teacher password in teacher list

Work Log:
- Added `password: string` to Guru interface in KelolaGuru.tsx
- Changed password display from "••••••••" to `{guru.password}` which shows the actual password
- Teachers API already returns `password: DEFAULT_GURU_PASSWORD` ("guru")

Stage Summary:
- Teacher passwords are now visible in the Kelola Guru table
- Shows the default password "guru" for all teachers

---
Task ID: 2b
Agent: Subagent (full-stack-developer)
Task: Update AdminDashboard - add subject to exam form + question editing

Work Log:
- Added `subject: string | null` to Exam interface
- Added `examSubject` state variable
- Added subject input field in exam creation form
- Updated handleSaveExam to include subject in POST/PUT body
- Updated handleEditExam to set examSubject
- Updated resetExamForm to reset examSubject
- Added `editingQuestion` state variable
- Added `handleEditQuestion` function
- Updated handleSaveQuestion to use PUT for editing
- Updated resetQuestionForm to clear editingQuestion
- Dynamic form title (Edit Soal vs Tambah Soal Baru)
- Added edit button (pencil icon) to each question
- Added subject badge on exam cards

Stage Summary:
- AdminDashboard now has subject field in exam form
- Questions can be edited inline
- Subject badge shown on exam cards

---
Task ID: 2c
Agent: Subagent (full-stack-developer)
Task: Update GuruDashboard - add subject to exam form + question editing

Work Log:
- Same changes as AdminDashboard but with emerald color theme
- Subject auto-filled with guruSubject when creating new exam
- Subject editable even when pre-filled
- Question editing with same functionality

Stage Summary:
- GuruDashboard now has subject field in exam form (pre-filled)
- Questions can be edited inline
- Subject badge shown on exam cards
