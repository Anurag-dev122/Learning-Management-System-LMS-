# 📚 Learning Management System (LMS)

A comprehensive, full-stack **Learning Management System** built with **Node.js**, **Express**, **SQLite**, and **React (Vite)**. Designed to support multiple user roles — students, instructors, parents, and administrators — with a rich set of features including live virtual classrooms, SCORM content, quizzes, assignments, peer review, and completion certificates.

---

## ✨ Features

### 👤 Multi-Role Authentication
- **Admin** — Platform-wide oversight, user management, discount code control
- **Instructor** — Create & manage courses, grade assignments, schedule live classes
- **Student** — Enroll in courses, track progress, take quizzes, submit assignments, earn certificates
- **Parent** — Monitor their linked student's progress and reports

### 📖 Course Management
- Structured **Modules → Lessons** hierarchy with drag-friendly ordering
- Three lesson content types: `text`, `video`, and `scorm`
- Instructors can create/edit courses via a dedicated **Course Builder** UI
- Courses can be grouped under **Learning Paths** (e.g. *Full Stack Web Developer*)

### 🎯 Assessments
- Per-lesson **Quizzes** with multiple-choice questions and configurable passing scores
- **Assignments** with file upload submission, instructor grading, and written feedback
- **Peer Review** — students can review each other's assignment submissions

### 🎥 Live Virtual Classroom
- Simulated live instructor video feed
- Interactive **shared whiteboard** (HTML5 Canvas) for sketching
- Real-time **live chat** panel for Q&A

### 💳 Enrollment & Payments
- Course enrollment with payment tracking (`unpaid`, `paid`, `installment`)
- Installment plan support with configurable payment schedules
- **Discount codes** (e.g. `SCHOLAR50` for 50% off, `SCHOLAR100` for free)

### 🏆 Certificates & Reports
- Auto-generated **completion certificates** when course progress reaches 100%
- **Student Gradebook** — enrollment progress + assignment grades in one view
- Parent dashboard to track their student's enrolled course progress

### 💬 Discussion Boards
- Per-course threaded discussion boards (posts + replies)
- Instructor and student participation

### 🌓 Dark / Light Mode
- Toggle between themes; preference persisted in `localStorage`

---

## 🛠 Tech Stack

| Layer       | Technology                      |
|-------------|----------------------------------|
| Backend     | Node.js, Express.js              |
| Database    | SQLite 3 (via `sqlite3` package) |
| Frontend    | React 18, Vite 8                 |
| Styling     | Vanilla CSS (custom design system) |
| File Uploads| Multer                           |
| Dev Tools   | Concurrently                     |

---

## 📂 Project Structure

```
Learning-Management-System-LMS-/
│
├── server.js              # Express API server (all REST endpoints)
├── database.js            # SQLite schema, migrations & seed data
├── lms.db                 # SQLite database file (auto-created)
├── uploads/               # Uploaded assignment files
├── public/                # Legacy HTML/CSS/JS static frontend
│   ├── index.html
│   ├── css/
│   └── js/
│
└── client/                # React (Vite) SPA frontend
    └── src/
        ├── App.jsx                    # Root component, routing & layout
        ├── index.css                  # Global design system & tokens
        ├── utils/
        │   └── api.js                 # Centralized API fetch helper
        └── components/
            ├── Auth.jsx               # Login & Signup screens
            ├── Sidebar.jsx            # Role-aware navigation sidebar
            ├── DashboardStudent.jsx   # Student home dashboard
            ├── DashboardInstructor.jsx# Instructor home dashboard
            ├── DashboardParent.jsx    # Parent monitoring dashboard
            ├── DashboardAdmin.jsx     # Admin control panel
            ├── CourseCatalog.jsx      # Browse & enroll in courses
            ├── CourseViewer.jsx       # Lesson playback, quizzes, assignments
            ├── CourseBuilder.jsx      # Instructor course/module/lesson editor
            ├── LiveClassroom.jsx      # Virtual classroom + whiteboard + chat
            └── CertificateViewer.jsx  # Completion certificate overlay
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Anurag-dev122/Learning-Management-System-LMS-.git
cd Learning-Management-System-LMS-

# 2. Install root (backend) dependencies
npm install

# 3. Install frontend dependencies
cd client && npm install && cd ..
```

### Running in Development

```bash
npm run dev
```

This starts both servers concurrently:
- **Backend API** → `http://localhost:3000`
- **React Frontend** → `http://localhost:5173`

> The SQLite database (`lms.db`) and seed data are created automatically on first boot.

### Production Build

```bash
npm run build       # Builds the React client
npm start           # Serves the Express API only
```

---

## 🔑 Default Seed Accounts

The database is pre-seeded with demo accounts on first run:

| Role       | Email                  | Password       |
|------------|------------------------|----------------|
| Admin      | admin@lms.com          | admin123       |
| Instructor | instructor@lms.com     | instructor123  |
| Student    | student@lms.com        | student123     |
| Parent     | parent@lms.com         | parent123      |

### Discount Codes

| Code          | Discount |
|---------------|----------|
| `SCHOLAR50`   | 50% off  |
| `SCHOLAR100`  | 100% off |

---

## 🔌 API Reference

All endpoints are prefixed with `/api`. Authentication is passed via the `x-user-id` request header.

### Auth
| Method | Endpoint          | Description              | Auth Required |
|--------|-------------------|--------------------------|---------------|
| POST   | `/api/auth/login` | Login with email/password| No            |
| POST   | `/api/auth/signup`| Register new user        | No            |
| GET    | `/api/auth/me`    | Get current session user | Yes           |

### Courses
| Method | Endpoint                        | Description                       | Role              |
|--------|---------------------------------|-----------------------------------|-------------------|
| GET    | `/api/courses`                  | List all courses                  | Public            |
| POST   | `/api/courses`                  | Create a new course               | Instructor, Admin |
| GET    | `/api/courses/:id`              | Get full course detail (modules, lessons, quizzes) | Public |
| GET    | `/api/courses/instructor/:id`   | Courses by instructor             | Instructor        |

### Enrollments
| Method | Endpoint                            | Description                    |
|--------|-------------------------------------|--------------------------------|
| POST   | `/api/enroll`                       | Enroll in a course             |
| GET    | `/api/enrollments/student/:id`      | Get student enrollments        |
| PATCH  | `/api/enrollments/:id/progress`     | Update lesson progress         |

### Quizzes & Assignments
| Method | Endpoint                                    | Description                      |
|--------|---------------------------------------------|----------------------------------|
| POST   | `/api/quizzes`                              | Create a quiz for a lesson       |
| POST   | `/api/assignments`                          | Create an assignment             |
| POST   | `/api/assignments/:id/submit`               | Submit an assignment (file)      |
| PATCH  | `/api/submissions/:id/grade`               | Grade a submission               |
| POST   | `/api/submissions/:id/peer-review`         | Submit peer review               |

### Live Classes
| Method | Endpoint                        | Description               |
|--------|---------------------------------|---------------------------|
| GET    | `/api/live-classes/:courseId`   | Get live classes for course|
| POST   | `/api/live-classes`             | Schedule a live class     |

### Discussion Boards
| Method | Endpoint                           | Description                |
|--------|------------------------------------|----------------------------|
| GET    | `/api/discussions/:courseId`       | Get course discussions     |
| POST   | `/api/discussions`                 | Post a new message/reply   |

### Reports & Certificates
| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/api/reports/student/:id`        | Student progress & grades      |
| GET    | `/api/reports/admin`              | Platform-wide admin statistics |

---

## 🗄 Database Schema

| Table               | Description                                      |
|---------------------|--------------------------------------------------|
| `users`             | All users (admin, instructor, student, parent)   |
| `learning_paths`    | Grouped course sequences                         |
| `courses`           | Course catalog linked to instructors             |
| `modules`           | Ordered modules within a course                  |
| `lessons`           | Lessons (text/video/SCORM) within modules        |
| `enrollments`       | Student-Course enrollment with progress & payments |
| `quizzes`           | Quiz definitions linked to lessons               |
| `questions`         | MCQ questions for each quiz                      |
| `assignments`       | Assignment definitions linked to lessons         |
| `submissions`       | Student submissions with grades & peer review    |
| `discussion_boards` | Threaded discussion posts per course             |
| `live_classes`      | Scheduled live sessions with meeting links       |
| `discount_codes`    | Promotional codes with percent-off values        |

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).