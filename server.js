const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup upload folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer for assignment uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

// Simple In-Memory Session Simulation using Cookies/Headers
// For ease, we will read the user's ID from a header "x-user-id" or fallback to query params
app.use(async (req, res, next) => {
  const userId = req.headers['x-user-id'] || req.query.userId;
  if (userId) {
    try {
      const user = await db.get('SELECT id, name, email, role, parent_student_id FROM users WHERE id = ?', [userId]);
      if (user) {
        req.user = user;
      }
    } catch (e) {
      console.error("Session lookup error:", e);
    }
  }
  next();
});

// Helper validation middleware
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Access denied.' });
    }
    next();
  };
}

// AUTHENTICATION
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role, parentStudentEmail } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    let parentStudentId = null;
    if (role === 'parent' && parentStudentEmail) {
      const student = await db.get('SELECT id FROM users WHERE email = ? AND role = "student"', [parentStudentEmail]);
      if (!student) {
        return res.status(400).json({ error: `Student with email ${parentStudentEmail} not found` });
      }
      parentStudentId = student.id;
    }

    const result = await db.run(
      'INSERT INTO users (name, email, password, role, parent_student_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, role, parentStudentId]
    );
    res.json({ id: result.id, name, email, role });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(req.user);
});

// COURSES
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await db.all(`
      SELECT c.*, u.name as instructor_name, lp.title as learning_path_title 
      FROM courses c 
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN learning_paths lp ON c.learning_path_id = lp.id
    `);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/learning-paths', async (req, res) => {
  try {
    const paths = await db.all(`SELECT * FROM learning_paths`);
    res.json(paths);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses', requireAuth, requireRole(['instructor', 'admin']), async (req, res) => {
  const { title, description, price, learningPathId } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const result = await db.run(
      'INSERT INTO courses (title, description, instructor_id, price, learning_path_id) VALUES (?, ?, ?, ?, ?)',
      [title, description, req.user.id, price || 0, learningPathId || null]
    );
    res.json({ id: result.id, title, description, price, learningPathId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// COURSE DETAILS (Includes modules, lessons, quizzes, assignments)
app.get('/api/courses/:id', async (req, res) => {
  const courseId = req.params.id;
  try {
    const course = await db.get(`
      SELECT c.*, u.name as instructor_name 
      FROM courses c 
      JOIN users u ON c.instructor_id = u.id 
      WHERE c.id = ?
    `, [courseId]);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const modules = await db.all('SELECT * FROM modules WHERE course_id = ? ORDER BY sort_order ASC', [courseId]);
    for (let mod of modules) {
      mod.lessons = await db.all('SELECT * FROM lessons WHERE module_id = ? ORDER BY sort_order ASC', [mod.id]);
      
      // Inject details for quizzes or assignments if present
      for (let les of mod.lessons) {
        if (les.content_type === 'text' || les.content_type === 'video') {
          const quiz = await db.get('SELECT id, title, passing_score FROM quizzes WHERE lesson_id = ?', [les.id]);
          if (quiz) {
            les.quiz = quiz;
            les.quiz.questions = await db.all('SELECT id, question_text, options, correct_option FROM questions WHERE quiz_id = ?', [quiz.id]);
            // Parse options back to array
            les.quiz.questions.forEach(q => {
              try { q.options = JSON.parse(q.options); } catch (e) {}
            });
          }
          const assignment = await db.get('SELECT id, title, instruction_text, due_date FROM assignments WHERE lesson_id = ?', [les.id]);
          if (assignment) {
            les.assignment = assignment;
          }
        } else if (les.content_type === 'scorm') {
          try { les.scorm_meta = JSON.parse(les.content_url_or_text); } catch (e) {}
        }
      }
    }

    // Check if the current user is enrolled
    let enrollment = null;
    if (req.user) {
      enrollment = await db.get('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?', [req.user.id, courseId]);
    }

    res.json({ course, modules, enrollment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// COURSE BUILDER ACTIONS
app.post('/api/courses/:id/modules', requireAuth, requireRole(['instructor', 'admin']), async (req, res) => {
  const { title } = req.body;
  const courseId = req.params.id;
  try {
    const result = await db.run('INSERT INTO modules (course_id, title) VALUES (?, ?)', [courseId, title]);
    res.json({ id: result.id, title, course_id: courseId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/modules/:modId/lessons', requireAuth, requireRole(['instructor', 'admin']), async (req, res) => {
  const { title, contentType, contentUrlOrText } = req.body;
  const modId = req.params.modId;
  try {
    const result = await db.run(
      'INSERT INTO lessons (module_id, title, content_type, content_url_or_text) VALUES (?, ?, ?, ?)',
      [modId, title, contentType, contentUrlOrText]
    );
    res.json({ id: result.id, title, content_type: contentType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lessons/:lesId/quiz', requireAuth, requireRole(['instructor', 'admin']), async (req, res) => {
  const { title, passingScore, questions } = req.body; // questions should be array
  const lesId = req.params.lesId;
  try {
    const quizResult = await db.run('INSERT INTO quizzes (lesson_id, title, passing_score) VALUES (?, ?, ?)', [lesId, title, passingScore]);
    const quizId = quizResult.id;
    for (let q of questions) {
      await db.run('INSERT INTO questions (quiz_id, question_text, options, correct_option) VALUES (?, ?, ?, ?)', [
        quizId,
        q.question_text,
        JSON.stringify(q.options),
        q.correct_option
      ]);
    }
    res.json({ success: true, quizId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lessons/:lesId/assignment', requireAuth, requireRole(['instructor', 'admin']), async (req, res) => {
  const { title, instructionText, dueDate } = req.body;
  const lesId = req.params.lesId;
  try {
    await db.run('INSERT INTO assignments (lesson_id, title, instruction_text, due_date) VALUES (?, ?, ?, ?)', [
      lesId,
      title,
      instructionText,
      dueDate
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENROLLMENT & CHECKOUT WITH INSTALLMENTS / DISCOUNT CODES
app.post('/api/courses/:id/enroll', requireAuth, async (req, res) => {
  const courseId = req.params.id;
  const { paymentMethod, discountCode, totalInstallments } = req.body;

  try {
    const course = await db.get('SELECT price FROM courses WHERE id = ?', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    let finalPrice = course.price;
    if (discountCode) {
      const codeRow = await db.get('SELECT discount_percent FROM discount_codes WHERE code = ?', [discountCode]);
      if (codeRow) {
        finalPrice = Math.max(0, finalPrice - (finalPrice * (codeRow.discount_percent / 100)));
      } else {
        return res.status(400).json({ error: 'Invalid discount code' });
      }
    }

    const numInstallments = parseInt(totalInstallments) || 1;
    const paymentStatus = numInstallments > 1 ? 'installment' : (finalPrice === 0 ? 'paid' : 'paid');
    const amountPaid = numInstallments > 1 ? (finalPrice / numInstallments) : finalPrice;

    await db.run(
      `INSERT INTO enrollments (student_id, course_id, progress, payment_status, amount_paid, total_installments, paid_installments) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, courseId, 0, paymentStatus, amountPaid, numInstallments, 1]
    );

    res.json({ success: true, paymentStatus, amountPaid, finalPrice });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'You are already enrolled in this course.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PROGRESS TRACKER (Updates progress when completing lessons)
app.post('/api/courses/:id/progress', requireAuth, async (req, res) => {
  const courseId = req.params.id;
  const { lessonId } = req.body; // In a real LMS, we track individual completed lessons and compute progress.
  try {
    const enrollment = await db.get('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?', [req.user.id, courseId]);
    if (!enrollment) {
      return res.status(400).json({ error: 'Not enrolled' });
    }

    // Retrieve total lessons count
    const totalLessons = await db.get(`
      SELECT COUNT(*) as count 
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = ?
    `, [courseId]);

    // Simple mockup: increments progress by 1 lesson equivalent, capped at 100%
    const currentProgress = enrollment.progress;
    const increment = Math.ceil(100 / (totalLessons.count || 1));
    const newProgress = Math.min(100, currentProgress + increment);
    const completedAt = newProgress === 100 ? new Date().toISOString() : null;

    await db.run('UPDATE enrollments SET progress = ?, completed_at = ? WHERE id = ?', [newProgress, completedAt, enrollment.id]);
    res.json({ progress: newProgress, completed: newProgress === 100 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// QUIZ SUBMISSION & GRADING
app.post('/api/quizzes/:id/submit', requireAuth, async (req, res) => {
  const quizId = req.params.id;
  const { answers } = req.body; // Object of questionId -> selectedOptionIndex

  try {
    const questions = await db.all('SELECT id, correct_option FROM questions WHERE quiz_id = ?', [quizId]);
    let correctCount = 0;
    for (let q of questions) {
      if (answers[q.id] == q.correct_option) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const quiz = await db.get('SELECT passing_score, lesson_id FROM quizzes WHERE id = ?', [quizId]);
    const passed = score >= quiz.passing_score;

    // Trigger auto-progress if passed
    if (passed) {
      const moduleRow = await db.get(`
        SELECT m.course_id 
        FROM modules m
        JOIN lessons l ON l.module_id = m.id
        WHERE l.id = ?
      `, [quiz.lesson_id]);
      if (moduleRow) {
        const enrollment = await db.get('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?', [req.user.id, moduleRow.course_id]);
        if (enrollment) {
          const totalLessons = await db.get(`
            SELECT COUNT(*) as count FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?
          `, [moduleRow.course_id]);
          const newProgress = Math.min(100, enrollment.progress + Math.ceil(100 / (totalLessons.count || 1)));
          const completedAt = newProgress === 100 ? new Date().toISOString() : null;
          await db.run('UPDATE enrollments SET progress = ?, completed_at = ? WHERE id = ?', [newProgress, completedAt, enrollment.id]);
        }
      }
    }

    res.json({ score, passed, correctCount, totalQuestions: questions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ASSIGNMENT UPLOADS & SUBMISSION
app.post('/api/assignments/:id/submit', requireAuth, upload.single('submissionFile'), async (req, res) => {
  const assignmentId = req.params.id;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = `/uploads/${req.file.filename}`;

  try {
    // Delete existing submission if any
    await db.run('DELETE FROM submissions WHERE assignment_id = ? AND student_id = ?', [assignmentId, req.user.id]);
    
    await db.run(
      'INSERT INTO submissions (assignment_id, student_id, file_path, submitted_at) VALUES (?, ?, ?, ?)',
      [assignmentId, req.user.id, filePath, new Date().toISOString()]
    );

    res.json({ success: true, filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GRADING (INSTRUCTOR / PEER REVIEW)
app.post('/api/submissions/:id/grade', requireAuth, requireRole(['instructor', 'admin']), async (req, res) => {
  const submissionId = req.params.id;
  const { grade, feedback } = req.body;
  try {
    await db.run(
      'UPDATE submissions SET grade = ?, feedback = ? WHERE id = ?',
      [grade, feedback, submissionId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/submissions/:id/peer-review', requireAuth, requireRole(['student']), async (req, res) => {
  const submissionId = req.params.id;
  const { peerGrade, peerFeedback } = req.body;
  try {
    await db.run(
      'UPDATE submissions SET peer_reviewed_by = ?, peer_grade = ?, peer_feedback = ? WHERE id = ?',
      [req.user.id, peerGrade, peerFeedback, submissionId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch other student submissions for peer-review
app.get('/api/assignments/:id/peer-reviewable', requireAuth, async (req, res) => {
  const assignmentId = req.params.id;
  try {
    // Return other students submissions for the same assignment
    const list = await db.all(`
      SELECT s.*, u.name as student_name 
      FROM submissions s 
      JOIN users u ON s.student_id = u.id 
      WHERE s.assignment_id = ? AND s.student_id != ? AND s.peer_reviewed_by IS NULL
    `, [assignmentId, req.user.id]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DISCUSSION FORUMS
app.get('/api/courses/:id/discussions', async (req, res) => {
  const courseId = req.params.id;
  try {
    const posts = await db.all(`
      SELECT d.*, u.name as author_name, u.role as author_role 
      FROM discussion_boards d 
      JOIN users u ON d.user_id = u.id 
      WHERE d.course_id = ? 
      ORDER BY d.created_at DESC
    `, [courseId]);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses/:id/discussions', requireAuth, async (req, res) => {
  const courseId = req.params.id;
  const { title, message, parentId } = req.body;
  try {
    const result = await db.run(
      'INSERT INTO discussion_boards (course_id, user_id, title, message, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [courseId, req.user.id, title || null, message, parentId || null, new Date().toISOString()]
    );
    res.json({ id: result.id, message, created_at: new Date().toISOString(), author_name: req.user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIVE CLASSES
app.get('/api/courses/:id/live-classes', async (req, res) => {
  try {
    const list = await db.all('SELECT * FROM live_classes WHERE course_id = ?', [req.params.id]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses/:id/live-classes', requireAuth, requireRole(['instructor', 'admin']), async (req, res) => {
  const { title, scheduledTime, meetingLink } = req.body;
  try {
    await db.run('INSERT INTO live_classes (course_id, title, scheduled_time, meeting_link) VALUES (?, ?, ?, ?)', [
      req.params.id,
      title,
      scheduledTime,
      meetingLink
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REPORTS & METRICS
// Student Report / Gradebook
app.get('/api/reports/student/:id', requireAuth, async (req, res) => {
  const studentId = req.params.id;
  try {
    const enrollments = await db.all(`
      SELECT e.*, c.title as course_title, c.price as course_price
      FROM enrollments e 
      JOIN courses c ON e.course_id = c.id 
      WHERE e.student_id = ?
    `, [studentId]);

    const submissions = await db.all(`
      SELECT s.*, a.title as assignment_title, c.title as course_title 
      FROM submissions s 
      JOIN assignments a ON s.assignment_id = a.id
      JOIN lessons l ON a.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE s.student_id = ?
    `, [studentId]);

    res.json({ enrollments, submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent visibility into Child progress
app.get('/api/reports/parent', requireAuth, requireRole(['parent']), async (req, res) => {
  if (!req.user.parent_student_id) {
    return res.status(400).json({ error: 'No student linked to this parent profile.' });
  }
  try {
    const child = await db.get('SELECT id, name, email FROM users WHERE id = ?', [req.user.parent_student_id]);
    const enrollments = await db.all(`
      SELECT e.*, c.title as course_title 
      FROM enrollments e 
      JOIN courses c ON e.course_id = c.id 
      WHERE e.student_id = ?
    `, [child.id]);

    const submissions = await db.all(`
      SELECT s.*, a.title as assignment_title, c.title as course_title 
      FROM submissions s 
      JOIN assignments a ON s.assignment_id = a.id
      JOIN lessons l ON a.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE s.student_id = ?
    `, [child.id]);

    // Risk Alert System: Alert parent if progress is low (< 20%) on older courses or average grade is failing (< 60)
    let alerts = [];
    enrollments.forEach(e => {
      if (e.progress < 25) {
        alerts.push({
          type: 'warning',
          message: `Child is showing low engagement in "${e.course_title}" (Progress: ${e.progress}%).`
        });
      }
    });
    submissions.forEach(s => {
      if (s.grade !== null && s.grade < 60) {
        alerts.push({
          type: 'danger',
          message: `Low grade alert in "${s.course_title}" for assignment "${s.assignment_title}": Grade is ${s.grade}%.`
        });
      }
    });

    res.json({ child, enrollments, submissions, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Instructor Analytics (all student submissions, course engagement and average scores)
app.get('/api/reports/instructor', requireAuth, requireRole(['instructor', 'admin']), async (req, res) => {
  try {
    const courses = await db.all('SELECT id, title, price FROM courses WHERE instructor_id = ?', [req.user.id]);
    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) {
      return res.json({ courses: [], submissionsAwaitingGrade: [], analytics: [] });
    }

    const placeholders = courseIds.map(() => '?').join(',');
    
    // Submissions that need grading
    const submissionsAwaitingGrade = await db.all(`
      SELECT s.*, u.name as student_name, a.title as assignment_title, c.title as course_title
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      JOIN assignments a ON s.assignment_id = a.id
      JOIN lessons l ON a.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE c.id IN (${placeholders}) AND s.grade IS NULL
    `, courseIds);

    // Engagement stats per course
    const analytics = await db.all(`
      SELECT c.id, c.title, COUNT(e.id) as total_students, AVG(e.progress) as avg_progress
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.id IN (${placeholders})
      GROUP BY c.id
    `, courseIds);

    res.json({ courses, submissionsAwaitingGrade, analytics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin global control dashboard
app.get('/api/reports/admin', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const totalCourses = await db.get('SELECT COUNT(*) as count FROM courses');
    const totalEnrollments = await db.get('SELECT COUNT(*) as count FROM enrollments');
    const revenue = await db.get('SELECT SUM(amount_paid) as total FROM enrollments');

    res.json({
      totalUsers: totalUsers.count,
      totalCourses: totalCourses.count,
      totalEnrollments: totalEnrollments.count,
      totalRevenue: revenue.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// START SERVER AND DATABASE INITIALIZATION
db.initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`LMS Server successfully booted on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
  });
