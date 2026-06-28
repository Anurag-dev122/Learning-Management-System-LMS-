const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'lms.db');
const db = new sqlite3.Database(dbPath);

// Helper function to run queries with Promises
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// Helper function to get a single row
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper function to get all rows
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize tables
async function initDatabase() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'instructor', 'student', 'parent')),
    parent_student_id INTEGER,
    FOREIGN KEY(parent_student_id) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS learning_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    instructor_id INTEGER NOT NULL,
    price REAL DEFAULT 0.0,
    learning_path_id INTEGER,
    FOREIGN KEY(instructor_id) REFERENCES users(id),
    FOREIGN KEY(learning_path_id) REFERENCES learning_paths(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK(content_type IN ('text', 'video', 'scorm')),
    content_url_or_text TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE CASCADE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    completed_at TEXT,
    payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'installment')),
    amount_paid REAL DEFAULT 0.0,
    total_installments INTEGER DEFAULT 1,
    paid_installments INTEGER DEFAULT 1,
    FOREIGN KEY(student_id) REFERENCES users(id),
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(student_id, course_id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    passing_score INTEGER DEFAULT 70,
    FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON string array
    correct_option INTEGER NOT NULL,
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    instruction_text TEXT,
    due_date TEXT,
    FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    file_path TEXT,
    grade REAL,
    feedback TEXT,
    submitted_at TEXT NOT NULL,
    peer_reviewed_by INTEGER,
    peer_grade REAL,
    peer_feedback TEXT,
    FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES users(id),
    FOREIGN KEY(peer_reviewed_by) REFERENCES users(id),
    UNIQUE(assignment_id, student_id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS discussion_boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT,
    message TEXT NOT NULL,
    parent_id INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(parent_id) REFERENCES discussion_boards(id) ON DELETE CASCADE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS live_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    meeting_link TEXT,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS discount_codes (
    code TEXT PRIMARY KEY,
    discount_percent REAL NOT NULL
  )`);

  // Seed default data if users table is empty
  const userCheck = await get(`SELECT COUNT(*) as count FROM users`);
  if (userCheck.count === 0) {
    // Users
    await run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, ['Administrator', 'admin@lms.com', 'admin123', 'admin']);
    const inst = await run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, ['Dr. Jane Smith', 'instructor@lms.com', 'instructor123', 'instructor']);
    const stud = await run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, ['John Doe', 'student@lms.com', 'student123', 'student']);
    await run(`INSERT INTO users (name, email, password, role, parent_student_id) VALUES (?, ?, ?, ?, ?)`, ['Robert Doe (Parent)', 'parent@lms.com', 'parent123', 'parent', stud.id]);

    // Learning Paths
    const path1 = await run(`INSERT INTO learning_paths (title, description) VALUES (?, ?)`, ['Full Stack Web Developer', 'Go from zero programming experience to landing a job as a modern full-stack web developer.']);

    // Courses
    const course1 = await run(`INSERT INTO courses (title, description, instructor_id, price, learning_path_id) VALUES (?, ?, ?, ?, ?)`, [
      'Introduction to Computer Science',
      'Learn the foundations of computing, variables, conditional statements, functions, loops, and basic data structures.',
      inst.id,
      99.99,
      path1.id
    ]);

    const course2 = await run(`INSERT INTO courses (title, description, instructor_id, price, learning_path_id) VALUES (?, ?, ?, ?, ?)`, [
      'Advanced Software Engineering & Design',
      'Master system architecture, database design patterns, Express.js microservices, and full stack application scaling.',
      inst.id,
      149.99,
      path1.id
    ]);

    // Modules for Course 1
    const mod1 = await run(`INSERT INTO modules (course_id, title, sort_order) VALUES (?, ?, ?)`, [course1.id, 'Module 1: The Basics of Node.js', 1]);
    const mod2 = await run(`INSERT INTO modules (course_id, title, sort_order) VALUES (?, ?, ?)`, [course1.id, 'Module 2: Quizzes & Data Control', 2]);

    // Lessons for Module 1
    const les1 = await run(`INSERT INTO lessons (module_id, title, content_type, content_url_or_text, sort_order) VALUES (?, ?, ?, ?, ?)`, [
      mod1.id,
      'Lesson 1.1: Introduction to Node & Express',
      'text',
      'Welcome to Course! Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser. In this lesson, we will cover npm, package.json, and setting up an Express server.',
      1
    ]);

    const les2 = await run(`INSERT INTO lessons (module_id, title, content_type, content_url_or_text, sort_order) VALUES (?, ?, ?, ?, ?)`, [
      mod1.id,
      'Lesson 1.2: Asynchronous Programming Video Tutorial',
      'video',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      2
    ]);

    // Lessons for Module 2 (SCORM, Quiz, Assignment)
    const les3 = await run(`INSERT INTO lessons (module_id, title, content_type, content_url_or_text, sort_order) VALUES (?, ?, ?, ?, ?)`, [
      mod2.id,
      'Lesson 2.1: Interactive SCORM Package - JavaScript Objects',
      'scorm',
      '{"scorm_version":"1.2","vendor":"Articulate","duration_minutes":15}',
      1
    ]);

    const les4 = await run(`INSERT INTO lessons (module_id, title, content_type, content_url_or_text, sort_order) VALUES (?, ?, ?, ?, ?)`, [
      mod2.id,
      'Lesson 2.2: JavaScript Variables Quiz',
      'text',
      'Complete this assessment to prove your understanding of variables and types.',
      2
    ]);

    const les5 = await run(`INSERT INTO lessons (module_id, title, content_type, content_url_or_text, sort_order) VALUES (?, ?, ?, ?, ?)`, [
      mod2.id,
      'Lesson 2.3: Express Server Assignment',
      'text',
      'Build a simple server that returns user information in JSON format.',
      3
    ]);

    // Quiz creation
    const quiz1 = await run(`INSERT INTO quizzes (lesson_id, title, passing_score) VALUES (?, ?, ?)`, [les4.id, 'JavaScript Variables Quiz', 70]);
    await run(`INSERT INTO questions (quiz_id, question_text, options, correct_option) VALUES (?, ?, ?, ?)`, [
      quiz1.id,
      'Which keyword declares a block-scoped local variable in JavaScript?',
      JSON.stringify(['var', 'let', 'const', 'Both let and const']),
      3
    ]);
    await run(`INSERT INTO questions (quiz_id, question_text, options, correct_option) VALUES (?, ?, ?, ?)`, [
      quiz1.id,
      'What is the correct way to write a JavaScript array?',
      JSON.stringify(['const colors = "red", "green", "blue"', 'const colors = (1:"red", 2:"green", 3:"blue")', 'const colors = ["red", "green", "blue"]', 'const colors = {"red", "green", "blue"}']),
      2
    ]);

    // Assignment creation
    await run(`INSERT INTO assignments (lesson_id, title, instruction_text, due_date) VALUES (?, ?, ?, ?)`, [
      les5.id,
      'Create a Basic Express Server',
      'Submit a single .js script that boots up an Express server on port 3000 and exposes a GET /profile endpoint returning name and roll number.',
      '2026-12-31'
    ]);

    // Discount codes
    await run(`INSERT INTO discount_codes (code, discount_percent) VALUES (?, ?)`, ['SCHOLAR50', 50]);
    await run(`INSERT INTO discount_codes (code, discount_percent) VALUES (?, ?)`, ['SCHOLAR100', 100]);

    // Discussion Boards
    await run(`INSERT INTO discussion_boards (course_id, user_id, title, message, created_at) VALUES (?, ?, ?, ?, ?)`, [
      course1.id,
      inst.id,
      'Welcome to Computer Science!',
      'Hello learners! Use this thread to introduce yourselves and ask questions about the assignments.',
      new Date().toISOString()
    ]);

    // Live Class
    await run(`INSERT INTO live_classes (course_id, title, scheduled_time, meeting_link) VALUES (?, ?, ?, ?)`, [
      course1.id,
      'Intro to Programming Live Office Hours',
      '2026-07-15T15:00',
      'https://meet.lms.com/office-hours-intro'
    ]);

    console.log('Database seeded successfully.');
  }
}

module.exports = {
  run,
  get,
  all,
  initDatabase,
  db
};
