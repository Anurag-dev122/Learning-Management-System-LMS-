import React, { useEffect, useState } from 'react';
import { API } from './utils/api';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import DashboardStudent from './components/DashboardStudent';
import DashboardInstructor from './components/DashboardInstructor';
import DashboardParent from './components/DashboardParent';
import DashboardAdmin from './components/DashboardAdmin';
import CourseCatalog from './components/CourseCatalog';
import CourseViewer from './components/CourseViewer';
import CourseBuilder from './components/CourseBuilder';
import LiveClassroom from './components/LiveClassroom';
import CertificateViewer from './components/CertificateViewer';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Active view states
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [builderCourseId, setBuilderCourseId] = useState(null);
  const [liveCourseId, setLiveCourseId] = useState(null);

  // Certificate drawer
  const [certificateData, setCertificateData] = useState(null);

  // Student reports state
  const [studentReports, setStudentReports] = useState(null);

  const fetchReports = async () => {
    if (user && user.role === 'student') {
      try {
        const data = await API.get(`/api/reports/student/${user.id}`);
        setStudentReports(data);
      } catch(e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    // Check local theme setting
    if (localStorage.getItem('dark-theme') === 'true') {
      document.body.classList.add('dark-theme');
    }

    const userId = API.getUserId();
    const role = API.getRole();
    const userName = API.getUserName();

    if (userId && role && userName) {
      setUser({ id: userId, name: userName, role });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, activeTab]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    API.clearSession();
    setUser(null);
    setSelectedCourseId(null);
    setBuilderCourseId(null);
    setLiveCourseId(null);
    setCertificateData(null);
    setActiveTab('dashboard');
  };

  const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('dark-theme', isDark);
  };

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setActiveTab('course-viewer');
  };

  const handleEditCourse = (courseId) => {
    setBuilderCourseId(courseId);
    setActiveTab('course-builder');
  };

  const handlePreviewCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setActiveTab('course-viewer');
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><h2>Syncing credentials...</h2></div>;
  }

  if (!user) {
    return (
      <div id="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', minHeight: '100vh' }}>
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div id="app-container">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedCourseId(null);
          setBuilderCourseId(null);
          setLiveCourseId(null);
        }} 
        onLogout={handleLogout} 
      />

      {/* MAIN CONTENT AREA */}
      <main id="main-content">
        <header className="top-header">
          <div>
            {selectedCourseId && <span style={{ fontWeight: 600, color: 'var(--accent)' }}>📚 Learning Mode</span>}
            {builderCourseId && <span style={{ fontWeight: 600, color: 'var(--accent)' }}>🛠️ Editor Mode</span>}
          </div>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">🌓</button>
        </header>

        <div id="view-container" style={{ flexGrow: 1, overflowY: 'auto' }}>
          {activeTab === 'dashboard' && (
            <>
              {user.role === 'student' && (
                <DashboardStudent 
                  user={user} 
                  onSelectCourse={handleSelectCourse} 
                  onNavigateToCatalog={() => setActiveTab('courses')} 
                />
              )}
              {user.role === 'instructor' && (
                <DashboardInstructor 
                  onEditCourse={handleEditCourse} 
                  onPreviewCourse={handlePreviewCourse} 
                />
              )}
              {user.role === 'parent' && <DashboardParent />}
              {user.role === 'admin' && <DashboardAdmin />}
            </>
          )}

          {activeTab === 'courses' && (
            <CourseCatalog 
              user={user} 
              onSelectCourse={handleSelectCourse} 
            />
          )}

          {activeTab === 'learning-paths' && (
            <div className="view-content">
              <h2>🛣️ Guided Learning Paths</h2>
              <p className="text-muted" style={{ marginBottom: '32px' }}>Pre-planned sequences of courses to help you achieve specific career milestones.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-card">
                  <h3>Full Stack Web Developer Path</h3>
                  <p className="text-muted" style={{ marginTop: '8px', marginBottom: '20px' }}>Go from zero programming experience to landing a job as a modern full-stack web developer.</p>
                  <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '20px', marginLeft: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div><strong>Course 1:</strong> Introduction to Computer Science</div>
                    <div><strong>Course 2:</strong> Advanced Software Engineering & Design</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && user.role === 'student' && studentReports && (
            <div className="view-content">
              <h2>📊 Student Gradebook & Completion</h2>
              <p className="text-muted" style={{ marginBottom: '32px' }}>Overview of course enrollments, progress, and assignments feedback.</p>

              <div className="glass-card">
                <h3>Registered Courses progress</h3>
                <div className="table-container" style={{ marginTop: '16px' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Progress</th>
                        <th>Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentReports.enrollments.map(e => (
                        <tr key={e.id}>
                          <td><strong>{e.course_title}</strong></td>
                          <td>{e.progress}%</td>
                          <td>
                            {e.progress === 100 ? (
                              <button 
                                className="btn btn-success btn-sm" 
                                onClick={() => setCertificateData({ title: e.course_title, completedAt: e.completed_at })}
                              >
                                🎓 View Certificate
                              </button>
                            ) : (
                              <span className="text-muted">Available at 100% completion</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-card" style={{ marginTop: '32px' }}>
                <h3>Assignment Submissions</h3>
                <div className="table-container" style={{ marginTop: '16px' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Assignment Name</th>
                        <th>Grade</th>
                        <th>Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentReports.submissions.length === 0 ? (
                        <tr><td colSpan="4" className="text-muted" style={{ textAlign: 'center' }}>No assignments submitted yet.</td></tr>
                      ) : (
                        studentReports.submissions.map(s => (
                          <tr key={s.id}>
                            <td>{s.course_title}</td>
                            <td>{s.assignment_title}</td>
                            <td>{s.grade !== null ? <strong>{s.grade}%</strong> : <span className="text-muted">Ungraded</span>}</td>
                            <td>{s.feedback || <span className="text-muted">No instructor feedback yet.</span>}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'course-viewer' && selectedCourseId && (
            <CourseViewer 
              courseId={selectedCourseId} 
              user={user} 
              onJoinLive={() => {
                setLiveCourseId(selectedCourseId);
                setActiveTab('live-classroom');
              }} 
              onClose={() => setActiveTab('dashboard')} 
            />
          )}

          {activeTab === 'course-builder' && builderCourseId && (
            <CourseBuilder 
              courseId={builderCourseId} 
              onClose={() => {
                setBuilderCourseId(null);
                setActiveTab('dashboard');
              }} 
            />
          )}

          {activeTab === 'live-classroom' && liveCourseId && (
            <LiveClassroom 
              courseId={liveCourseId} 
              onClose={() => {
                setLiveCourseId(null);
                setActiveTab('course-viewer');
              }} 
            />
          )}
        </div>
      </main>

      {/* Certificate Viewer Overlay */}
      {certificateData && (
        <CertificateViewer 
          userName={user.name} 
          courseTitle={certificateData.title} 
          completedAt={certificateData.completedAt} 
          onClose={() => setCertificateData(null)} 
        />
      )}
    </div>
  );
}
