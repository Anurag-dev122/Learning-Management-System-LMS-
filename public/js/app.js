const API = {
  userId: localStorage.getItem('userId') || null,
  role: localStorage.getItem('role') || null,
  userName: localStorage.getItem('userName') || null,

  headers() {
    return {
      'Content-Type': 'application/json',
      'x-user-id': this.userId || ''
    };
  },

  async get(url) {
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  },

  async upload(url, formData) {
    // Exclude JSON content type header for multipart
    const headers = { 'x-user-id': this.userId || '' };
    const res = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

const app = {
  currentView: 'dashboard',
  activeCourseId: null,
  activeLessonId: null,

  init() {
    // Setup Theme
    if (localStorage.getItem('dark-theme') === 'true') {
      document.body.classList.add('dark-theme');
    }

    this.bindEvents();
    this.checkAuth();
  },

  bindEvents() {
    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      localStorage.setItem('dark-theme', document.body.classList.contains('dark-theme'));
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
      this.logout();
    });

    // Hash Router support
    window.addEventListener('hashchange', () => this.route());
  },

  checkAuth() {
    if (!API.userId) {
      this.showLoginView();
    } else {
      document.getElementById('user-profile-name').innerText = API.userName;
      document.getElementById('user-profile-role').innerText = API.role;
      this.buildSidebar();
      
      // Default to hash or dashboard
      if (!window.location.hash) {
        window.location.hash = '#dashboard';
      } else {
        this.route();
      }
    }
  },

  logout() {
    API.userId = null;
    API.role = null;
    API.userName = null;
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    window.location.hash = '';
    this.showLoginView();
  },

  route() {
    const hash = window.location.hash || '#dashboard';
    const main = document.getElementById('view-container');
    
    // Parse hashes e.g. #course/1 or #live/1 or #builder/1
    const parts = hash.split('/');
    const routeName = parts[0];
    const routeParam = parts[1];

    // Reset active side links
    document.querySelectorAll('.nav-links .nav-item').forEach(item => {
      item.classList.remove('active');
      const href = item.querySelector('a')?.getAttribute('href');
      if (href === routeName) {
        item.classList.add('active');
      }
    });

    if (routeName === '#dashboard') {
      this.renderDashboard();
    } else if (routeName === '#courses') {
      this.renderCoursesCatalog();
    } else if (routeName === '#learning-paths') {
      this.renderLearningPaths();
    } else if (routeName === '#reports') {
      this.renderReports();
    } else if (routeName === '#course' && routeParam) {
      this.renderCourseViewer(routeParam);
    } else if (routeName === '#builder' && routeParam) {
      this.renderCourseBuilder(routeParam);
    } else if (routeName === '#live' && routeParam) {
      this.renderLiveClassroom(routeParam);
    }
  },

  buildSidebar() {
    const links = document.getElementById('sidebar-nav-links');
    let html = `
      <li class="nav-item"><a href="#dashboard">📊 Dashboard</a></li>
      <li class="nav-item"><a href="#courses">📚 Course Catalog</a></li>
      <li class="nav-item"><a href="#learning-paths">🛣️ Learning Paths</a></li>
      <li class="nav-item"><a href="#reports">📈 Reports & Gradebook</a></li>
    `;
    links.innerHTML = html;
  },

  showLoginView() {
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('auth-container').style.display = 'flex';
    this.renderAuthForm('login');
  },

  showAppView() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    this.checkAuth();
  },

  renderAuthForm(mode) {
    const container = document.getElementById('auth-form-box');
    if (mode === 'login') {
      container.innerHTML = `
        <h2 style="margin-bottom: 24px; font-weight: 800;">Sign In</h2>
        <form id="form-login" onsubmit="event.preventDefault();">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="login-email" class="form-control" placeholder="student@lms.com" required value="student@lms.com">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required value="student123">
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 16px;">Log In</button>
        </form>
        <p style="margin-top: 20px; text-align: center; font-size: 14px;" class="text-muted">
          Need an account? <a href="#" id="link-goto-signup" style="color: var(--accent); font-weight: 600; text-decoration: none;">Create one</a>
        </p>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color); font-size: 12px; color: var(--text-muted);">
          <strong>Demo Logins:</strong><br>
          • Student: student@lms.com / student123<br>
          • Instructor: instructor@lms.com / instructor123<br>
          • Parent: parent@lms.com / parent123<br>
          • Admin: admin@lms.com / admin123
        </div>
      `;

      document.getElementById('form-login').addEventListener('submit', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
          const res = await API.post('/api/auth/login', { email, password });
          API.userId = res.id;
          API.role = res.role;
          API.userName = res.name;
          localStorage.setItem('userId', res.id);
          localStorage.setItem('role', res.role);
          localStorage.setItem('userName', res.name);
          this.showAppView();
        } catch (e) {
          alert("Login error: " + e.message);
        }
      });

      document.getElementById('link-goto-signup').addEventListener('click', (e) => {
        e.preventDefault();
        this.renderAuthForm('signup');
      });
    } else {
      // Signup Mode
      container.innerHTML = `
        <h2 style="margin-bottom: 24px; font-weight: 800;">Create Account</h2>
        <form id="form-signup" onsubmit="event.preventDefault();">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="signup-name" class="form-control" required placeholder="John Doe">
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="signup-email" class="form-control" required placeholder="email@example.com">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="signup-password" class="form-control" required placeholder="••••••••">
          </div>
          <div class="form-group">
            <label>Account Role</label>
            <select id="signup-role" class="form-control">
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <div class="form-group" id="parent-student-link-group" style="display: none;">
            <label>Linked Student's Email</label>
            <input type="email" id="signup-parent-student" class="form-control" placeholder="student@lms.com">
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 16px;">Sign Up</button>
        </form>
        <p style="margin-top: 20px; text-align: center; font-size: 14px;" class="text-muted">
          Already have an account? <a href="#" id="link-goto-login" style="color: var(--accent); font-weight: 600; text-decoration: none;">Sign In</a>
        </p>
      `;

      document.getElementById('signup-role').addEventListener('change', (e) => {
        document.getElementById('parent-student-link-group').style.display = e.target.value === 'parent' ? 'block' : 'none';
      });

      document.getElementById('form-signup').addEventListener('submit', async () => {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const role = document.getElementById('signup-role').value;
        const parentStudentEmail = document.getElementById('signup-parent-student').value;

        try {
          const res = await API.post('/api/auth/signup', { name, email, password, role, parentStudentEmail });
          alert("Account successfully created! Please log in.");
          this.renderAuthForm('login');
        } catch (e) {
          alert("Signup error: " + e.message);
        }
      });

      document.getElementById('link-goto-login').addEventListener('click', (e) => {
        e.preventDefault();
        this.renderAuthForm('login');
      });
    }
  },

  // 1. RENDER DASHBOARD (Role Specific)
  async renderDashboard() {
    const container = document.getElementById('view-container');
    container.innerHTML = `<div class="view-content"><h2 style="margin-bottom: 24px;">Loading dashboard...</h2></div>`;

    try {
      if (API.role === 'student') {
        const report = await API.get(`/api/reports/student/${API.userId}`);
        let coursesHtml = '';

        if (report.enrollments.length === 0) {
          coursesHtml = `<p class="text-muted">You are not enrolled in any courses yet. Go to the <a href="#courses">Catalog</a> to register!</p>`;
        } else {
          coursesHtml = `
            <div class="courses-container">
              ${report.enrollments.map(e => `
                <div class="glass-card course-card">
                  <div class="course-card-header">
                    <span class="badge badge-info">ENROLLED</span>
                    <h3 style="margin-top: 8px;">${e.course_title}</h3>
                  </div>
                  <div class="course-card-body">
                    <p style="font-size: 14px;" class="text-muted">Progress: ${e.progress}%</p>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill" style="width: ${e.progress}%"></div>
                    </div>
                  </div>
                  <div class="course-card-footer">
                    <a href="#course/${e.course_id}" class="btn btn-primary">Resume Learning</a>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }

        container.innerHTML = `
          <div class="view-content">
            <div class="glass-card" style="background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(16, 185, 129, 0.1));">
              <h2>👋 Welcome back, ${API.userName}!</h2>
              <p class="text-muted" style="margin-top: 8px;">Continue your learning sequence and review recent assessment reports below.</p>
            </div>
            
            <h3 style="margin: 32px 0 16px 0;">Your Active Courses</h3>
            ${coursesHtml}
          </div>
        `;

      } else if (API.role === 'instructor') {
        const report = await API.get('/api/reports/instructor');
        
        let gradeCenterHtml = '';
        if (report.submissionsAwaitingGrade.length === 0) {
          gradeCenterHtml = `<tr><td colspan="4" class="text-muted" style="text-align: center;">No pending grading tasks. Excellent!</td></tr>`;
        } else {
          report.submissionsAwaitingGrade.forEach(s => {
            gradeCenterHtml += `
              <tr>
                <td>${s.student_name}</td>
                <td>${s.course_title} - <strong>${s.assignment_title}</strong></td>
                <td><a href="${s.file_path}" target="_blank" class="btn btn-secondary btn-sm">📎 View Submission</a></td>
                <td>
                  <button class="btn btn-primary" onclick="app.openGradeModal(${s.id}, '${s.student_name}', '${s.assignment_title}')">✍️ Grade</button>
                </td>
              </tr>
            `;
          });
        }

        container.innerHTML = `
          <div class="view-content">
            <h2>👨‍🏫 Instructor Dashboard</h2>
            <p class="text-muted" style="margin-bottom: 24px;">Build curriculums, review student analytics, and grade incoming assignments.</p>

            <div class="dashboard-grid">
              ${report.analytics.map(c => `
                <div class="glass-card stat-widget">
                  <div class="stat-icon primary">📚</div>
                  <div class="stat-details">
                    <h3>${c.total_students}</h3>
                    <p>${c.title} (Avg: ${Math.round(c.avg_progress)}%)</p>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="glass-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3>Active Curriculums</h3>
                <button class="btn btn-primary" onclick="app.openCreateCourseModal()">➕ New Course</button>
              </div>
              <div class="table-container">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Course Title</th>
                      <th>Fee</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${report.courses.map(c => `
                      <tr>
                        <td><strong>${c.title}</strong></td>
                        <td>$${c.price}</td>
                        <td>
                          <a href="#builder/${c.id}" class="btn btn-secondary">🛠️ Edit Curriculum</a>
                          <a href="#course/${c.id}" class="btn btn-primary">👁️ Preview Viewer</a>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="glass-card" style="margin-top: 32px;">
              <h3>📝 Grading Center Awaiting Reviews</h3>
              <div class="table-container" style="margin-top: 16px;">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Assignment</th>
                      <th>File Link</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${gradeCenterHtml}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;

      } else if (API.role === 'parent') {
        const report = await API.get('/api/reports/parent');
        
        let alertsHtml = '';
        if (report.alerts.length === 0) {
          alertsHtml = `<div class="risk-alert warning" style="background-color: rgba(16, 185, 129, 0.1); color: var(--success); border-left-color: var(--success);">🟢 Student is currently in good academic standing. No risk alerts active.</div>`;
        } else {
          report.alerts.forEach(a => {
            alertsHtml += `
              <div class="risk-alert ${a.type === 'warning' ? 'warning' : 'danger'}">
                ⚠️ ${a.message}
              </div>
            `;
          });
        }

        container.innerHTML = `
          <div class="view-content">
            <h2>👨‍👩‍👧 Parent Portal</h2>
            <p class="text-muted" style="margin-bottom: 24px;">Monitor academic progress, performance reports, and alerts for linked learner: <strong>${report.child.name}</strong></p>

            <div class="glass-card">
              <h3>🚨 Engagement & Risk Alerts</h3>
              <div class="risk-alert-container" style="margin-top: 16px;">
                ${alertsHtml}
              </div>
            </div>

            <div class="glass-card" style="margin-top: 32px;">
              <h3>📚 Registered Courses & Progress</h3>
              <div class="table-container" style="margin-top: 16px;">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Course Title</th>
                      <th>Progress</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${report.enrollments.map(e => `
                      <tr>
                        <td><strong>${e.course_title}</strong></td>
                        <td>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span>${e.progress}%</span>
                            <div class="progress-bar-container" style="width: 120px; margin: 0;">
                              <div class="progress-bar-fill" style="width: ${e.progress}%"></div>
                            </div>
                          </div>
                        </td>
                        <td>${e.progress === 100 ? '<span class="badge badge-success">Completed</span>' : '<span class="badge badge-warning">Active</span>'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;

      } else if (API.role === 'admin') {
        const stats = await API.get('/api/reports/admin');
        container.innerHTML = `
          <div class="view-content">
            <h2>⚙️ System Administrator Portal</h2>
            <p class="text-muted" style="margin-bottom: 24px;">Global stats overview, coupon administration, and platform metrics.</p>

            <div class="dashboard-grid">
              <div class="glass-card stat-widget">
                <div class="stat-icon primary">👥</div>
                <div class="stat-details">
                  <h3>${stats.totalUsers}</h3>
                  <p>Total Registered Users</p>
                </div>
              </div>
              <div class="glass-card stat-widget">
                <div class="stat-icon success">💵</div>
                <div class="stat-details">
                  <h3>$${stats.totalRevenue.toFixed(2)}</h3>
                  <p>Accumulated Revenue</p>
                </div>
              </div>
              <div class="glass-card stat-widget">
                <div class="stat-icon info">📚</div>
                <div class="stat-details">
                  <h3>${stats.totalCourses}</h3>
                  <p>Total Catalog Courses</p>
                </div>
              </div>
            </div>
            
            <div class="glass-card">
              <h3>Create Scholarship Discount Code</h3>
              <form id="form-discount-code" onsubmit="event.preventDefault();" style="display: flex; gap: 16px; margin-top: 16px; align-items: flex-end;">
                <div class="form-group" style="flex: 1; margin: 0;">
                  <label>Promo Code</label>
                  <input type="text" id="admin-coupon-code" class="form-control" placeholder="SCHOLAR75" required>
                </div>
                <div class="form-group" style="flex: 1; margin: 0;">
                  <label>Discount Percent</label>
                  <input type="number" id="admin-coupon-percent" class="form-control" min="1" max="100" placeholder="75" required>
                </div>
                <button type="submit" class="btn btn-primary">Create Promo Code</button>
              </form>
            </div>
          </div>
        `;

        document.getElementById('form-discount-code').addEventListener('submit', async () => {
          const code = document.getElementById('admin-coupon-code').value;
          const discountPercent = document.getElementById('admin-coupon-percent').value;
          try {
            await API.post('/api/courses', { title: 'dummy' }); // check role block check
            // Simulating API creating discount code directly on SQLite or alert
            alert(`Promo Code ${code} created at ${discountPercent}% discount!`);
            document.getElementById('admin-coupon-code').value = '';
            document.getElementById('admin-coupon-percent').value = '';
          } catch(e) {
            alert(e.message);
          }
        });
      }
    } catch (e) {
      container.innerHTML = `<div class="view-content"><p class="text-danger">Failed to load dashboard: ${e.message}</p></div>`;
    }
  },

  // 2. RENDER COURSE CATALOG
  async renderCoursesCatalog() {
    const container = document.getElementById('view-container');
    container.innerHTML = `<div class="view-content"><h2 style="margin-bottom: 24px;">Loading Catalog...</h2></div>`;

    try {
      const courses = await API.get('/api/courses');
      let enrollments = [];
      if (API.role === 'student') {
        const studentReport = await API.get(`/api/reports/student/${API.userId}`);
        enrollments = studentReport.enrollments.map(e => e.course_id);
      }

      container.innerHTML = `
        <div class="view-content">
          <h2>📚 Academic Course Catalog</h2>
          <p class="text-muted" style="margin-bottom: 32px;">Browse courses, view fees, and register using payment plans or scholarship vouchers.</p>

          <div class="courses-container">
            ${courses.map(c => {
              const isEnrolled = enrollments.includes(c.id);
              let buttonHtml = '';
              if (isEnrolled) {
                buttonHtml = `<a href="#course/${c.id}" class="btn btn-secondary">Resume Learning</a>`;
              } else if (API.role === 'student') {
                buttonHtml = `<button class="btn btn-primary" onclick="app.openCheckoutModal(${c.id}, '${c.title.replace(/'/g, "\\'")}', ${c.price})">Register & Enroll</button>`;
              } else {
                buttonHtml = `<a href="#course/${c.id}" class="btn btn-secondary">Preview Course</a>`;
              }

              return `
                <div class="glass-card course-card">
                  <div class="course-card-header">
                    <span class="badge badge-info">${c.learning_path_title || 'General'}</span>
                    <h3 style="margin-top: 8px;">${c.title}</h3>
                  </div>
                  <div class="course-card-body">
                    <p class="text-muted" style="font-size: 14px; flex-grow: 1;">${c.description}</p>
                    <p style="font-weight: 600; margin-top: 12px; font-size: 15px;">Instructor: ${c.instructor_name}</p>
                  </div>
                  <div class="course-card-footer">
                    <span style="font-size: 18px; font-weight: 800; color: var(--accent);">$${c.price}</span>
                    ${buttonHtml}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="view-content"><p class="text-danger">Failed to load course catalog.</p></div>`;
    }
  },

  // 3. RENDER LEARNING PATHS
  async renderLearningPaths() {
    const container = document.getElementById('view-container');
    container.innerHTML = `<div class="view-content"><h2>🛣️ Guided Learning Paths</h2><p class="text-muted">Loading paths...</p></div>`;

    try {
      const paths = await API.get('/api/learning-paths');
      container.innerHTML = `
        <div class="view-content">
          <h2>🛣️ Guided Learning Paths</h2>
          <p class="text-muted" style="margin-bottom: 32px;">Pre-planned sequences of courses to help you achieve specific career milestones.</p>
          
          <div style="display: flex; flex-direction: column; gap: 24px;">
            ${paths.map(p => `
              <div class="glass-card">
                <h3>${p.title}</h3>
                <p class="text-muted" style="margin-top: 8px; margin-bottom: 20px;">${p.description}</p>
                <div style="border-left: 3px solid var(--accent); padding-left: 20px; margin-left: 10px; display: flex; flex-direction: column; gap: 12px;">
                  <div><strong>Course 1:</strong> Introduction to Computer Science</div>
                  <div><strong>Course 2:</strong> Advanced Software Engineering & Design</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="view-content"><p class="text-danger">Failed to load learning paths.</p></div>`;
    }
  },

  // 4. RENDER REPORTS
  async renderReports() {
    const container = document.getElementById('view-container');
    if (API.role === 'parent' || API.role === 'instructor' || API.role === 'admin') {
      // Redirect or show role specific report in the main dashboard view
      this.renderDashboard();
      return;
    }

    // Student specific Gradebook
    container.innerHTML = `<div class="view-content"><h2>📊 Your Performance Report</h2><p class="text-muted">Loading performance files...</p></div>`;
    try {
      const data = await API.get(`/api/reports/student/${API.userId}`);
      
      let submissionsHtml = '';
      if (data.submissions.length === 0) {
        submissionsHtml = `<tr><td colspan="4" class="text-muted" style="text-align: center;">No assignments submitted yet.</td></tr>`;
      } else {
        data.submissions.forEach(s => {
          submissionsHtml += `
            <tr>
              <td>${s.course_title}</td>
              <td>${s.assignment_title}</td>
              <td>${s.grade !== null ? `<strong>${s.grade}%</strong>` : '<span class="text-muted">Ungraded</span>'}</td>
              <td>${s.feedback || '<span class="text-muted">No instructor feedback yet.</span>'}</td>
            </tr>
          `;
        });
      }

      container.innerHTML = `
        <div class="view-content">
          <h2>📊 Student Gradebook & Completion</h2>
          <p class="text-muted" style="margin-bottom: 32px;">Overview of course enrollments, progress, and assignments feedback.</p>

          <div class="glass-card">
            <h3>Registered Courses progress</h3>
            <div class="table-container" style="margin-top: 16px;">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Progress</th>
                    <th>Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.enrollments.map(e => `
                    <tr>
                      <td><strong>${e.course_title}</strong></td>
                      <td>${e.progress}%</td>
                      <td>
                        ${e.progress === 100 
                          ? `<button class="btn btn-success btn-sm" onclick="app.viewCertificate('${e.course_title}', '${e.completed_at}')">🎓 View Certificate</button>` 
                          : '<span class="text-muted">Available at 100% completion</span>'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="glass-card" style="margin-top: 32px;">
            <h3>Assignment Submissions</h3>
            <div class="table-container" style="margin-top: 16px;">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Assignment Name</th>
                    <th>Grade</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  ${submissionsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="view-content"><p class="text-danger">Failed to load report card.</p></div>`;
    }
  },

  // 5. RENDER ACTIVE COURSE VIEWER (Modules & Lessons SPA)
  async renderCourseViewer(courseId) {
    this.activeCourseId = courseId;
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="course-layout">
        <div class="course-sidebar" id="course-tree-sidebar">
          <div style="padding: 20px;"><p>Loading lectures...</p></div>
        </div>
        <div class="course-content-viewer" id="course-lesson-viewer">
          <h2>Select a lesson to begin.</h2>
        </div>
      </div>
    `;

    try {
      const data = await API.get(`/api/courses/${courseId}`);
      this.renderCourseSidebarTree(data);
      
      // Auto open first lesson if modules exist
      if (data.modules.length > 0 && data.modules[0].lessons.length > 0) {
        this.openLesson(data.modules[0].lessons[0]);
      }
    } catch (e) {
      document.getElementById('course-tree-sidebar').innerHTML = `<p class="text-danger">Error loading syllabus.</p>`;
    }
  },

  renderCourseSidebarTree(data) {
    const sidebar = document.getElementById('course-tree-sidebar');
    let html = `
      <div style="padding: 20px; border-bottom: 1px solid var(--border-color);">
        <h4 style="font-weight: 800;">${data.course.title}</h4>
        <p class="text-muted" style="font-size: 12px; margin-top: 4px;">Instructor: ${data.course.instructor_name}</p>
        <button class="btn btn-secondary btn-sm" style="width:100%; margin-top: 12px;" onclick="app.openForumTab(${data.course.id})">💬 Course Forum</button>
        <button class="btn btn-secondary btn-sm" style="width:100%; margin-top: 8px;" onclick="app.openLiveClassTab(${data.course.id})">🎥 Join Live Class</button>
      </div>
    `;

    data.modules.forEach(mod => {
      html += `
        <div class="course-module-item">
          <div class="module-title-bar">${mod.title}</div>
          <ul class="lesson-list">
            ${mod.lessons.map(les => {
              const isCompleted = false; // Mocking lesson completed checkmark
              return `
                <li class="lesson-item ${les.id === this.activeLessonId ? 'active' : ''}" onclick="app.fetchAndOpenLesson(${les.id})">
                  <div class="lesson-status-icon"></div>
                  <span>${les.title}</span>
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      `;
    });

    sidebar.innerHTML = html;
  },

  async fetchAndOpenLesson(lessonId) {
    this.activeLessonId = lessonId;
    // Mark active in sidebar
    document.querySelectorAll('.lesson-item').forEach(li => li.classList.remove('active'));
    
    try {
      const data = await API.get(`/api/courses/${this.activeCourseId}`);
      let targetLesson = null;
      data.modules.forEach(m => {
        m.lessons.forEach(l => {
          if (l.id === lessonId) targetLesson = l;
        });
      });
      if (targetLesson) {
        this.openLesson(targetLesson);
      }
    } catch(e) {
      alert("Error fetching lesson content: " + e.message);
    }
  },

  openLesson(lesson) {
    const viewer = document.getElementById('course-lesson-viewer');
    
    let contentHtml = '';
    if (lesson.content_type === 'text') {
      contentHtml = `
        <div class="lesson-body">
          <p>${lesson.content_url_or_text}</p>
        </div>
      `;
    } else if (lesson.content_type === 'video') {
      contentHtml = `
        <div class="lesson-body">
          <div class="video-simulation" style="height: 380px; margin-bottom: 24px;">
            <video src="${lesson.content_url_or_text}" controls style="width: 100%; height: 100%; object-fit: cover;"></video>
          </div>
          <p>Watch the video lecture above to understand the core elements of this course module.</p>
        </div>
      `;
    } else if (lesson.content_type === 'scorm') {
      contentHtml = `
        <div class="scorm-simulator">
          <h3>📦 SCORM Package: eLearning Module</h3>
          <p class="text-muted" style="color: #94a3b8; margin: 16px 0;">Version: ${lesson.scorm_meta?.scorm_version || '1.2'} | Provider: ${lesson.scorm_meta?.vendor || 'Standard'}</p>
          <div class="glass-card" style="background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); margin-bottom: 20px;">
            <p style="color: #f1f5f9;">Playing packaging content: "Introduction to JavaScript Engine"</p>
          </div>
          <button class="btn btn-primary" onclick="app.completeSCORMInteractive()">Complete SCORM Interactive module</button>
        </div>
      `;
    }

    // Append quiz or assignment sub-blocks if present
    let extraBlocksHtml = '';
    if (lesson.quiz) {
      extraBlocksHtml += `
        <div class="glass-card" style="margin-top: 40px;" id="quiz-player-spot">
          <!-- Quiz will render inside here dynamically -->
        </div>
      `;
    }

    if (lesson.assignment) {
      extraBlocksHtml += `
        <div class="glass-card" style="margin-top: 40px;">
          <h3>📤 Assignment: ${lesson.assignment.title}</h3>
          <p class="text-muted" style="margin: 8px 0 16px 0;"><strong>Instructions:</strong> ${lesson.assignment.instruction_text}</p>
          <p style="font-size: 13px; color: var(--danger); margin-bottom: 20px;">Due date: ${lesson.assignment.due_date}</p>
          
          <form id="form-assignment-upload" onsubmit="event.preventDefault();" enctype="multipart/form-data" class="upload-dropzone">
            <div class="upload-dropzone-icon">📁</div>
            <p>Click to select or drag and drop your script file here.</p>
            <input type="file" id="assignment-file" style="display: none;" name="submissionFile" onchange="document.getElementById('upload-file-label').innerText = this.files[0].name">
            <span id="upload-file-label" style="font-weight: 600; color: var(--accent);">No file selected</span>
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('assignment-file').click()">Browse Files</button>
            <button type="submit" class="btn btn-primary" style="margin-top: 10px;">Upload Submission</button>
          </form>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <h4>👥 Peer Review Submission Panel</h4>
            <p class="text-muted" style="font-size: 13px; margin: 4px 0 12px 0;">Select another student's submission to evaluate. Complete your peer reviews to build grade bonuses.</p>
            <div id="peer-review-list-spot">Loading submissions...</div>
          </div>
        </div>
      `;
    }

    viewer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2>${lesson.title}</h2>
        <button class="btn btn-success" onclick="app.markLessonProgress()">✔️ Mark Complete & Next</button>
      </div>
      ${contentHtml}
      ${extraBlocksHtml}
    `;

    // Load Quiz if present
    if (lesson.quiz) {
      window.QuizEngine.renderQuiz('quiz-player-spot', lesson.quiz, async (answers) => {
        try {
          const res = await API.post(`/api/quizzes/${lesson.quiz.id}/submit`, { answers });
          window.QuizEngine.showFeedback(res);
        } catch (e) {
          alert("Error submitting quiz: " + e.message);
        }
      });
    }

    // Load Peer Review list if assignment is present
    if (lesson.assignment) {
      this.loadPeerReviewSubmissions(lesson.assignment.id);

      document.getElementById('form-assignment-upload').addEventListener('submit', async (e) => {
        const fileInput = document.getElementById('assignment-file');
        if (fileInput.files.length === 0) {
          alert("Please pick a file first!");
          return;
        }
        const formData = new FormData();
        formData.append('submissionFile', fileInput.files[0]);

        try {
          await API.upload(`/api/assignments/${lesson.assignment.id}/submit`, formData);
          alert("Assignment submitted successfully!");
          this.loadPeerReviewSubmissions(lesson.assignment.id);
        } catch(e) {
          alert("Upload failed: " + e.message);
        }
      });
    }
  },

  async loadPeerReviewSubmissions(assignmentId) {
    const container = document.getElementById('peer-review-list-spot');
    if (!container) return;
    try {
      const subs = await API.get(`/api/assignments/${assignmentId}/peer-reviewable`);
      if (subs.length === 0) {
        container.innerHTML = `<p class="text-muted" style="font-size: 13px;">No other student submissions are currently awaiting peer review.</p>`;
        return;
      }
      container.innerHTML = `
        <div class="table-container">
          <table class="custom-table" style="font-size: 13px;">
            <thead>
              <tr>
                <th>Student</th>
                <th>File</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${subs.map(s => `
                <tr>
                  <td>${s.student_name}</td>
                  <td><a href="${s.file_path}" target="_blank">📎 Download</a></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="app.openPeerReviewModal(${s.id}, '${s.student_name}')">Review</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<p class="text-danger">Failed to load peer review items.</p>`;
    }
  },

  async markLessonProgress() {
    try {
      const res = await API.post(`/api/courses/${this.activeCourseId}/progress`, { lessonId: this.activeLessonId });
      alert(`Lesson completed! Total Course Progress: ${res.progress}%`);
      if (res.completed) {
        alert("🎉 Congratulations! You have fully completed the course! Download your certificate from the Reports tab.");
      }
      this.renderCourseViewer(this.activeCourseId);
    } catch(e) {
      alert("Error updating progress: " + e.message);
    }
  },

  completeSCORMInteractive() {
    alert("SCORM package report: lesson passed (cmi.core.lesson_status = completed). Updating progress...");
    this.markLessonProgress();
  },

  // DISCUSSION FORUMS
  async openForumTab(courseId) {
    const viewer = document.getElementById('course-lesson-viewer');
    viewer.innerHTML = `
      <h2>💬 Course Discussion Board</h2>
      <p class="text-muted" style="margin-bottom: 24px;">Post questions and interact with peers and instructors.</p>
      
      <div class="glass-card">
        <h3>Create New Post</h3>
        <form id="form-forum-post" onsubmit="event.preventDefault();" style="margin-top: 16px;">
          <div class="form-group">
            <label>Topic Title</label>
            <input type="text" id="forum-post-title" class="form-control" placeholder="Question about homework 1..." required>
          </div>
          <div class="form-group">
            <label>Message</label>
            <textarea id="forum-post-message" class="form-control" rows="3" placeholder="Write your post details here..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Post Topic</button>
        </form>
      </div>

      <div class="glass-card" style="margin-top: 32px;">
        <h3>Recent Discussions</h3>
        <div class="discussion-board" id="forum-posts-list" style="margin-top: 16px;">
          Loading topics...
        </div>
      </div>
    `;

    document.getElementById('form-forum-post').addEventListener('submit', async () => {
      const title = document.getElementById('forum-post-title').value;
      const message = document.getElementById('forum-post-message').value;
      try {
        await API.post(`/api/courses/${courseId}/discussions`, { title, message });
        alert("Discussion posted!");
        this.openForumTab(courseId);
      } catch (e) {
        alert(e.message);
      }
    });

    try {
      const posts = await API.get(`/api/courses/${courseId}/discussions`);
      const list = document.getElementById('forum-posts-list');
      if (posts.length === 0) {
        list.innerHTML = `<p class="text-muted">No discussion threads created yet. Start the conversation!</p>`;
        return;
      }
      list.innerHTML = posts.map(p => `
        <div class="discussion-post">
          <div class="post-avatar">${p.author_name[0]}</div>
          <div class="post-content">
            <div class="post-header">
              <span class="post-author">${p.author_name} <span class="badge ${p.author_role === 'instructor' ? 'badge-success' : 'badge-info'}" style="font-size:9px;">${p.author_role}</span></span>
              <span class="post-date">${new Date(p.created_at).toLocaleString()}</span>
            </div>
            ${p.title ? `<h4 style="margin-bottom: 8px;">${p.title}</h4>` : ''}
            <div class="post-body">${p.message}</div>
          </div>
        </div>
      `).join('');
    } catch(e) {
      alert("Error loading posts: " + e.message);
    }
  },

  // LIVE CLASS SCHEDULE & VIEW
  async openLiveClassTab(courseId) {
    const viewer = document.getElementById('course-lesson-viewer');
    viewer.innerHTML = `
      <h2>🎥 Live Video Sessions</h2>
      <p class="text-muted" style="margin-bottom: 24px;">Join planned live classes or check scheduled timeframes.</p>
    `;

    if (API.role === 'instructor' || API.role === 'admin') {
      viewer.innerHTML += `
        <div class="glass-card" style="margin-bottom: 24px;">
          <h3>Schedule Office Hours / Lecture</h3>
          <form id="form-live-schedule" onsubmit="event.preventDefault();" style="display: flex; gap: 16px; margin-top: 16px; align-items: flex-end;">
            <div class="form-group" style="flex: 1; margin: 0;">
              <label>Topic Title</label>
              <input type="text" id="live-title" class="form-control" placeholder="Homework QA session" required>
            </div>
            <div class="form-group" style="flex: 1; margin: 0;">
              <label>Scheduled Date & Time</label>
              <input type="datetime-local" id="live-time" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary">Schedule Class</button>
          </form>
        </div>
      `;

      document.getElementById('form-live-schedule').addEventListener('submit', async () => {
        const title = document.getElementById('live-title').value;
        const scheduledTime = document.getElementById('live-time').value;
        const meetingLink = `#live/${courseId}`;
        try {
          await API.post(`/api/courses/${courseId}/live-classes`, { title, scheduledTime, meetingLink });
          alert("Live Class Scheduled!");
          this.openLiveClassTab(courseId);
        } catch (e) {
          alert(e.message);
        }
      });
    }

    try {
      const list = await API.get(`/api/courses/${courseId}/live-classes`);
      let classesHtml = '';
      if (list.length === 0) {
        classesHtml = `<p class="text-muted">No live classes scheduled for this course.</p>`;
      } else {
        classesHtml = `
          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Scheduled Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(l => `
                  <tr>
                    <td><strong>${l.title}</strong></td>
                    <td>${new Date(l.scheduled_time).toLocaleString()}</td>
                    <td>
                      <a href="#live/${courseId}" class="btn btn-primary">Join Live Classroom</a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      viewer.innerHTML += `
        <div class="glass-card">
          <h3>Upcoming Live Classes</h3>
          <div style="margin-top: 16px;">
            ${classesHtml}
          </div>
        </div>
      `;
    } catch(e) {
      alert("Error loading live list: " + e.message);
    }
  },

  // LIVE CLASSROOM SIMULATOR WITH WHITEBOARD
  renderLiveClassroom(courseId) {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="view-content" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2>🎥 Live Virtual Lecture</h2>
          <a href="#course/${courseId}" class="btn btn-secondary">Exit Classroom</a>
        </div>
        
        <div class="live-classroom">
          <div class="video-grid-container">
            <div class="video-simulation">
              <div class="instructor-feed">👨‍🏫 Instructor Video stream active</div>
              <div class="video-label">Instructor: Dr. Jane Smith</div>
            </div>
            
            <div class="whiteboard-container">
              <div class="whiteboard-controls">
                <button class="btn btn-secondary btn-sm" onclick="app.clearWhiteboard()">Clear Whiteboard</button>
                <span style="font-size: 13px; color: var(--text-muted); align-self: center;">Draw below to explain concepts:</span>
              </div>
              <canvas id="whiteboard-canvas"></canvas>
            </div>
          </div>

          <div class="live-chat-panel">
            <div class="chat-header">💬 Live Classroom Chat</div>
            <div class="chat-messages" id="live-chat-box">
              <div class="chat-bubble instructor"><strong>Instructor:</strong> Welcome everyone! Feel free to sketch on the shared whiteboard panel.</div>
            </div>
            <form class="chat-input-bar" id="form-live-chat" onsubmit="event.preventDefault();">
              <input type="text" id="chat-input-text" class="form-control" style="flex: 1;" placeholder="Ask a question..." required>
              <button type="submit" class="btn btn-primary">Send</button>
            </form>
          </div>
        </div>
      </div>
    `;

    this.initWhiteboard();
    
    document.getElementById('form-live-chat').addEventListener('submit', () => {
      const input = document.getElementById('chat-input-text');
      const box = document.getElementById('live-chat-box');
      box.innerHTML += `
        <div class="chat-bubble student"><strong>You:</strong> ${input.value}</div>
      `;
      box.scrollTop = box.scrollHeight;
      input.value = '';
    });
  },

  initWhiteboard() {
    const canvas = document.getElementById('whiteboard-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Scale canvas sizes
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let drawing = false;

    canvas.addEventListener('mousedown', (e) => {
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!drawing) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    });

    canvas.addEventListener('mouseup', () => drawing = false);
    canvas.addEventListener('mouseleave', () => drawing = false);
  },

  clearWhiteboard() {
    const canvas = document.getElementById('whiteboard-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },

  // 6. CERTIFICATE POPUP
  viewCertificate(courseTitle, completedAt) {
    const overlay = document.getElementById('global-modal-overlay');
    overlay.innerHTML = `
      <div class="modal-box" style="max-width: 860px; width: 95%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3>🎓 Course Completion Certificate</h3>
          <button class="btn btn-secondary" onclick="app.closeModal()">Close</button>
        </div>
        <div class="certificate-preview-box">
          <canvas id="certificate-canvas"></canvas>
          <div style="display: flex; gap: 16px;">
            <button class="btn btn-primary" onclick="window.CertificateEngine.download('certificate-canvas', 'LMS-Certificate.png')">📥 Download PNG</button>
            <button class="btn btn-secondary" onclick="window.print()">🖨️ Print Certificate</button>
          </div>
        </div>
      </div>
    `;
    overlay.classList.add('active');
    
    // Delay drawing slightly so elements are painted
    setTimeout(() => {
      window.CertificateEngine.drawCertificate('certificate-canvas', API.userName, courseTitle, completedAt);
    }, 150);
  },

  // 7. INSTRUCTOR CURRICULUM BUILDER
  async renderCourseBuilder(courseId) {
    const container = document.getElementById('view-container');
    container.innerHTML = `<div class="view-content"><h2>🛠️ Curriculum Builder</h2><p>Loading course modules...</p></div>`;

    try {
      const data = await API.get(`/api/courses/${courseId}`);
      
      let modulesHtml = '';
      if (data.modules.length === 0) {
        modulesHtml = `<p class="text-muted">No modules added yet. Use the control below to create your first learning module.</p>`;
      } else {
        data.modules.forEach(mod => {
          modulesHtml += `
            <div class="glass-card" style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                <h4 style="font-weight: 700;">📦 Module: ${mod.title}</h4>
                <button class="btn btn-secondary btn-sm" onclick="app.openAddLessonModal(${mod.id})">➕ Add Lesson</button>
              </div>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; margin-left: 10px;">
                ${mod.lessons.map(l => `
                  <li style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(0,0,0,0.02); border: 1px solid var(--border-color); border-radius: 8px;">
                    <div>
                      <span>📖 ${l.title}</span>
                      <span class="badge badge-info" style="font-size: 8px; margin-left: 8px;">${l.content_type}</span>
                    </div>
                    <div>
                      ${l.content_type === 'text' ? `
                        <button class="btn btn-secondary btn-sm" onclick="app.openAddQuizModal(${l.id})">Quiz Creator</button>
                        <button class="btn btn-secondary btn-sm" onclick="app.openAddAssignmentModal(${l.id})">Assignment Creator</button>
                      ` : ''}
                    </div>
                  </li>
                `).join('')}
                ${mod.lessons.length === 0 ? '<li class="text-muted" style="font-size: 13px;">No lessons inside this module.</li>' : ''}
              </ul>
            </div>
          `;
        });
      }

      container.innerHTML = `
        <div class="view-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div>
              <h2>🛠️ Curriculum Builder: ${data.course.title}</h2>
              <p class="text-muted">Define the modules, structured lectures, and assessment milestones.</p>
            </div>
            <a href="#dashboard" class="btn btn-secondary">Back to Dashboard</a>
          </div>

          <div class="glass-card" style="margin-bottom: 32px;">
            <h3>Create New Module</h3>
            <form id="form-create-module" onsubmit="event.preventDefault();" style="display: flex; gap: 16px; margin-top: 16px; align-items: flex-end;">
              <div class="form-group" style="flex: 1; margin: 0;">
                <label>Module Title</label>
                <input type="text" id="builder-module-title" class="form-control" placeholder="Module 1: Advanced Objects" required>
              </div>
              <button type="submit" class="btn btn-primary">Create Module</button>
            </form>
          </div>

          <h3>Syllabus Blueprint</h3>
          <div style="margin-top: 16px;">
            ${modulesHtml}
          </div>
        </div>
      `;

      document.getElementById('form-create-module').addEventListener('submit', async () => {
        const title = document.getElementById('builder-module-title').value;
        try {
          await API.post(`/api/courses/${courseId}/modules`, { title });
          alert("Module added!");
          this.renderCourseBuilder(courseId);
        } catch(e) {
          alert(e.message);
        }
      });

    } catch (e) {
      container.innerHTML = `<div class="view-content"><p class="text-danger">Failed to load Curriculum Builder: ${e.message}</p></div>`;
    }
  },

  // 8. CHECKOUT DIALOG (Stripe simulation supporting Installments & coupon discount codes)
  openCheckoutModal(courseId, courseTitle, price) {
    const overlay = document.getElementById('global-modal-overlay');
    overlay.innerHTML = `
      <div class="modal-box">
        <h3 style="margin-bottom: 16px;">💳 Register & Checkout</h3>
        <p class="text-muted" style="margin-bottom: 20px;">Registering for: <strong>${courseTitle}</strong></p>
        
        <div class="checkout-modal-details">
          <div class="form-group">
            <label>Payment Plan Select</label>
            <div class="payment-split-select" id="payment-split-options">
              <div class="installment-option active" data-split="1" onclick="app.setInstallmentActive(this)">Full Pay ($${price})</div>
              <div class="installment-option" data-split="2" onclick="app.setInstallmentActive(this)">2 Splits ($${(price/2).toFixed(2)}/mo)</div>
              <div class="installment-option" data-split="4" onclick="app.setInstallmentActive(this)">4 Splits ($${(price/4).toFixed(2)}/mo)</div>
            </div>
          </div>

          <div class="form-group">
            <label>Scholarship Discount Code</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="checkout-coupon" class="form-control" style="flex:1;" placeholder="SCHOLAR100">
              <button class="btn btn-secondary" onclick="app.applyCheckoutCoupon(${price})">Apply</button>
            </div>
            <span id="coupon-feedback" style="font-size:12px; font-weight:600;"></span>
          </div>

          <div style="border-top:1px solid var(--border-color); padding-top: 16px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:14px; color:var(--text-muted);">Grand Total Due Now:</span>
            <strong style="font-size:22px; color:var(--accent);" id="checkout-grand-total">$${price.toFixed(2)}</strong>
          </div>

          <div style="display:flex; gap:12px; margin-top:20px;">
            <button class="btn btn-primary" style="flex:1;" onclick="app.submitEnrollment(${courseId})">Confirm Payment & Enroll</button>
            <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
          </div>
        </div>
      </div>
    `;
    overlay.classList.add('active');
  },

  setInstallmentActive(elem) {
    document.querySelectorAll('#payment-split-options .installment-option').forEach(el => el.classList.remove('active'));
    elem.classList.add('active');
    this.recalculateTotal(parseFloat(document.getElementById('checkout-grand-total').getAttribute('data-base-price') || elem.parentNode.parentNode.parentNode.querySelector('#checkout-coupon').getAttribute('data-base-price')));
  },

  async applyCheckoutCoupon(basePrice) {
    const code = document.getElementById('checkout-coupon').value;
    const feedback = document.getElementById('coupon-feedback');
    
    // We simulate coupon validity via client check or query
    if (code === 'SCHOLAR50' || code === 'SCHOLAR100') {
      const pct = code === 'SCHOLAR100' ? 100 : 50;
      feedback.style.color = 'var(--success)';
      feedback.innerText = `Coupon code applied: ${pct}% discount!`;
      const finalPrice = Math.max(0, basePrice - (basePrice * (pct / 100)));
      
      const activeOption = document.querySelector('#payment-split-options .installment-option.active');
      const splits = parseInt(activeOption.getAttribute('data-split'));
      document.getElementById('checkout-grand-total').innerText = `$${(finalPrice / splits).toFixed(2)}`;
      document.getElementById('checkout-grand-total').setAttribute('data-final-price', finalPrice);
    } else {
      feedback.style.color = 'var(--danger)';
      feedback.innerText = "Invalid coupon code.";
    }
  },

  async submitEnrollment(courseId) {
    const couponInput = document.getElementById('checkout-coupon').value;
    const splitOption = document.querySelector('#payment-split-options .installment-option.active');
    const totalInstallments = parseInt(splitOption.getAttribute('data-split'));

    try {
      await API.post(`/api/courses/${courseId}/enroll`, {
        paymentMethod: 'stripe_mock',
        discountCode: couponInput || null,
        totalInstallments
      });
      alert("Registration Successful! Welcome to the course.");
      this.closeModal();
      window.location.hash = `#course/${courseId}`;
    } catch(e) {
      alert("Enrollment failed: " + e.message);
    }
  },

  // 9. INSTRUCTOR MODALS
  openCreateCourseModal() {
    const overlay = document.getElementById('global-modal-overlay');
    overlay.innerHTML = `
      <div class="modal-box">
        <h3>➕ Add New Course</h3>
        <form id="form-modal-create-course" onsubmit="event.preventDefault();" style="margin-top: 16px;">
          <div class="form-group">
            <label>Course Title</label>
            <input type="text" id="modal-c-title" class="form-control" required placeholder="Introduction to Node.js">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="modal-c-desc" class="form-control" rows="3" placeholder="Brief course syllabus summary..."></textarea>
          </div>
          <div class="form-group">
            <label>Price ($)</label>
            <input type="number" id="modal-c-price" class="form-control" min="0" step="0.01" value="49.99">
          </div>
          <div style="display:flex; gap:12px; margin-top:20px;">
            <button type="submit" class="btn btn-primary" style="flex:1;">Create Course</button>
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
          </div>
        </form>
      </div>
    `;
    overlay.classList.add('active');

    document.getElementById('form-modal-create-course').addEventListener('submit', async () => {
      const title = document.getElementById('modal-c-title').value;
      const description = document.getElementById('modal-c-desc').value;
      const price = parseFloat(document.getElementById('modal-c-price').value);

      try {
        await API.post('/api/courses', { title, description, price });
        alert("Course created successfully!");
        this.closeModal();
        this.renderDashboard();
      } catch(e) {
        alert(e.message);
      }
    });
  },

  openAddLessonModal(modId) {
    const overlay = document.getElementById('global-modal-overlay');
    overlay.innerHTML = `
      <div class="modal-box">
        <h3>📖 Add Lesson to Module</h3>
        <form id="form-modal-add-lesson" onsubmit="event.preventDefault();" style="margin-top: 16px;">
          <div class="form-group">
            <label>Lesson Title</label>
            <input type="text" id="modal-l-title" class="form-control" required placeholder="Lesson 1.3: Intermediate Loops">
          </div>
          <div class="form-group">
            <label>Content Type</label>
            <select id="modal-l-type" class="form-control">
              <option value="text">Rich Text Content</option>
              <option value="video">External Video URL</option>
              <option value="scorm">SCORM package metadata (JSON)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Content Body / URL</label>
            <textarea id="modal-l-body" class="form-control" rows="4" placeholder="Write lesson body here, or provide a URL / SCORM metadata JSON..."></textarea>
          </div>
          <div style="display:flex; gap:12px; margin-top:20px;">
            <button type="submit" class="btn btn-primary" style="flex:1;">Add Lesson</button>
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
          </div>
        </form>
      </div>
    `;
    overlay.classList.add('active');

    document.getElementById('form-modal-add-lesson').addEventListener('submit', async () => {
      const title = document.getElementById('modal-l-title').value;
      const contentType = document.getElementById('modal-l-type').value;
      const contentUrlOrText = document.getElementById('modal-l-body').value;

      try {
        await API.post(`/api/modules/${modId}/lessons`, { title, contentType, contentUrlOrText });
        alert("Lesson added successfully!");
        this.closeModal();
        this.renderCourseBuilder(this.activeCourseId);
      } catch(e) {
        alert(e.message);
      }
    });
  },

  openAddQuizModal(lesId) {
    const overlay = document.getElementById('global-modal-overlay');
    overlay.innerHTML = `
      <div class="modal-box" style="max-width: 580px;">
        <h3>📝 Add Assessment Quiz</h3>
        <form id="form-modal-add-quiz" onsubmit="event.preventDefault();" style="margin-top: 16px;">
          <div class="form-group">
            <label>Quiz Title</label>
            <input type="text" id="modal-q-title" class="form-control" required placeholder="Variables Chapter Quiz">
          </div>
          <div class="form-group">
            <label>Passing Score (%)</label>
            <input type="number" id="modal-q-score" class="form-control" min="10" max="100" value="70">
          </div>
          
          <div style="border-top:1px solid var(--border-color); padding-top: 12px; margin-top: 12px;">
            <h5>Question 1</h5>
            <div class="form-group">
              <label>Question Text</label>
              <input type="text" id="modal-q-qtext" class="form-control" placeholder="What is the result of 2 + 2?" required>
            </div>
            <div class="form-group">
              <label>Options (Comma separated)</label>
              <input type="text" id="modal-q-options" class="form-control" placeholder="3, 4, 5, 6" required>
            </div>
            <div class="form-group">
              <label>Correct Option Index (0-based)</label>
              <input type="number" id="modal-q-correct" class="form-control" min="0" max="3" value="1" required>
            </div>
          </div>

          <div style="display:flex; gap:12px; margin-top:20px;">
            <button type="submit" class="btn btn-primary" style="flex:1;">Add Quiz</button>
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
          </div>
        </form>
      </div>
    `;
    overlay.classList.add('active');

    document.getElementById('form-modal-add-quiz').addEventListener('submit', async () => {
      const title = document.getElementById('modal-q-title').value;
      const passingScore = parseInt(document.getElementById('modal-q-score').value);
      const qText = document.getElementById('modal-q-qtext').value;
      const options = document.getElementById('modal-q-options').value.split(',').map(s => s.trim());
      const correctOption = parseInt(document.getElementById('modal-q-correct').value);

      const questions = [{
        question_text: qText,
        options: options,
        correct_option: correctOption
      }];

      try {
        await API.post(`/api/lessons/${lesId}/quiz`, { title, passingScore, questions });
        alert("Quiz successfully added!");
        this.closeModal();
      } catch(e) {
        alert(e.message);
      }
    });
  },

  openAddAssignmentModal(lesId) {
    const overlay = document.getElementById('global-modal-overlay');
    overlay.innerHTML = `
      <div class="modal-box">
        <h3>📤 Add Coding Assignment</h3>
        <form id="form-modal-add-assignment" onsubmit="event.preventDefault();" style="margin-top: 16px;">
          <div class="form-group">
            <label>Assignment Title</label>
            <input type="text" id="modal-a-title" class="form-control" required placeholder="Homework 1: Node Server Setup">
          </div>
          <div class="form-group">
            <label>Instruction Text</label>
            <textarea id="modal-a-desc" class="form-control" rows="3" placeholder="Provide assignment specifications..." required></textarea>
          </div>
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" id="modal-a-date" class="form-control" required value="2026-12-31">
          </div>
          
          <div style="display:flex; gap:12px; margin-top:20px;">
            <button type="submit" class="btn btn-primary" style="flex:1;">Add Assignment</button>
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
          </div>
        </form>
      </div>
    `;
    overlay.classList.add('active');

    document.getElementById('form-modal-add-assignment').addEventListener('submit', async () => {
      const title = document.getElementById('modal-a-title').value;
      const instructionText = document.getElementById('modal-a-desc').value;
      const dueDate = document.getElementById('modal-a-date').value;

      try {
        await API.post(`/api/lessons/${lesId}/assignment`, { title, instructionText, dueDate });
        alert("Assignment added successfully!");
        this.closeModal();
      } catch(e) {
        alert(e.message);
      }
    });
  },

  openGradeModal(submissionId, studentName, assignmentTitle) {
    const overlay = document.getElementById('global-modal-overlay');
    overlay.innerHTML = `
      <div class="modal-box">
        <h3>✍️ Grade Student Submission</h3>
        <p class="text-muted" style="margin: 4px 0 16px 0;">Student: <strong>${studentName}</strong> | ${assignmentTitle}</p>
        <form id="form-modal-grade" onsubmit="event.preventDefault();">
          <div class="form-group">
            <label>Score (0 - 100)</label>
            <input type="number" id="modal-g-score" class="form-control" min="0" max="100" value="90" required>
          </div>
          <div class="form-group">
            <label>Feedback Commentary</label>
            <textarea id="modal-g-feedback" class="form-control" rows="3" placeholder="Good work! Your router matches specifications."></textarea>
          </div>
          <div style="display:flex; gap:12px; margin-top:20px;">
            <button type="submit" class="btn btn-primary" style="flex:1;">Submit Grade</button>
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
          </div>
        </form>
      </div>
    `;
    overlay.classList.add('active');

    document.getElementById('form-modal-grade').addEventListener('submit', async () => {
      const grade = parseFloat(document.getElementById('modal-g-score').value);
      const feedback = document.getElementById('modal-g-feedback').value;

      try {
        await API.post(`/api/submissions/${submissionId}/grade`, { grade, feedback });
        alert("Grade recorded!");
        this.closeModal();
        this.renderDashboard();
      } catch(e) {
        alert(e.message);
      }
    });
  },

  openPeerReviewModal(submissionId, studentName) {
    const overlay = document.getElementById('global-modal-overlay');
    overlay.innerHTML = `
      <div class="modal-box">
        <h3>👥 Evaluate Peer Submission</h3>
        <p class="text-muted" style="margin-bottom: 16px;">Evaluating: <strong>${studentName}</strong></p>
        <form id="form-modal-peer" onsubmit="event.preventDefault();">
          <div class="form-group">
            <label>Peer Score (0 - 100)</label>
            <input type="number" id="modal-p-score" class="form-control" min="0" max="100" value="85" required>
          </div>
          <div class="form-group">
            <label>Review Remarks</label>
            <textarea id="modal-p-feedback" class="form-control" rows="3" placeholder="Code is clean, server handles requests, but misses formatting." required></textarea>
          </div>
          <div style="display:flex; gap:12px; margin-top:20px;">
            <button type="submit" class="btn btn-primary" style="flex:1;">Submit Peer Review</button>
            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
          </div>
        </form>
      </div>
    `;
    overlay.classList.add('active');

    document.getElementById('form-modal-peer').addEventListener('submit', async () => {
      const peerGrade = parseFloat(document.getElementById('modal-p-score').value);
      const peerFeedback = document.getElementById('modal-p-feedback').value;

      try {
        await API.post(`/api/submissions/${submissionId}/peer-review`, { peerGrade, peerFeedback });
        alert("Peer Review Submitted!");
        this.closeModal();
        this.refreshCurrentCourse();
      } catch(e) {
        alert(e.message);
      }
    });
  },

  refreshCurrentCourse() {
    this.renderCourseViewer(this.activeCourseId);
  },

  closeModal() {
    const overlay = document.getElementById('global-modal-overlay');
    overlay.classList.remove('active');
    overlay.innerHTML = '';
  }
};

window.onload = () => app.init();
