import React, { useEffect, useState } from 'react';
import { API } from '../utils/api';

export default function DashboardInstructor({ onEditCourse, onPreviewCourse }) {
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cPrice, setCPrice] = useState('49.99');

  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [gScore, setGScore] = useState('90');
  const [gFeedback, setGFeedback] = useState('');

  const loadData = async () => {
    try {
      const res = await API.get('/api/reports/instructor');
      setCourses(res.courses || []);
      setSubmissions(res.submissionsAwaitingGrade || []);
      setAnalytics(res.analytics || []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/courses', { title: cTitle, description: cDesc, price: parseFloat(cPrice) });
      alert("Course created successfully!");
      setCourseModalOpen(false);
      setCTitle('');
      setCDesc('');
      loadData();
    } catch(err) {
      alert("Error: " + err.message);
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!activeSubmission) return;
    try {
      await API.post(`/api/submissions/${activeSubmission.id}/grade`, { grade: parseFloat(gScore), feedback: gFeedback });
      alert("Grade recorded!");
      setGradeModalOpen(false);
      setGFeedback('');
      loadData();
    } catch(err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) {
    return <div className="view-content"><h2>Loading instructor reports...</h2></div>;
  }

  return (
    <div className="view-content">
      <h2>👨‍🏫 Instructor Dashboard</h2>
      <p className="text-muted" style={{ marginBottom: '24px' }}>Build curriculums, review student analytics, and grade incoming assignments.</p>

      <div className="dashboard-grid">
        {analytics.map(c => (
          <div key={c.id} className="glass-card stat-widget">
            <div className="stat-icon primary">📚</div>
            <div className="stat-details">
              <h3>{c.total_students}</h3>
              <p>{c.title} (Avg: {Math.round(c.avg_progress)}%)</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Active Curriculums</h3>
          <button className="btn btn-primary" onClick={() => setCourseModalOpen(true)}>➕ New Course</button>
        </div>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Fee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.title}</strong></td>
                  <td>${c.price}</td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => onEditCourse(c.id)} style={{ marginRight: '8px' }}>🛠️ Edit Curriculum</button>
                    <button className="btn btn-primary" onClick={() => onPreviewCourse(c.id)}>👁️ Preview Viewer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '32px' }}>
        <h3>📝 Grading Center Awaiting Reviews</h3>
        <div className="table-container" style={{ marginTop: '16px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Assignment</th>
                <th>File Link</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr><td colSpan="4" className="text-muted" style={{ textAlign: 'center' }}>No pending grading tasks. Excellent!</td></tr>
              ) : (
                submissions.map(s => (
                  <tr key={s.id}>
                    <td>{s.student_name}</td>
                    <td>{s.course_title} - <strong>{s.assignment_title}</strong></td>
                    <td><a href={s.file_path} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📎 View Submission</a></td>
                    <td>
                      <button className="btn btn-primary" onClick={() => { setActiveSubmission(s); setGradeModalOpen(true); }}>✍️ Grade</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE COURSE MODAL */}
      {courseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>➕ Add New Course</h3>
            <form onSubmit={handleCreateCourseSubmit} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Course Title</label>
                <input type="text" className="form-control" required placeholder="Introduction to Node.js" value={cTitle} onChange={e => setCTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows="3" placeholder="Brief course syllabus summary..." value={cDesc} onChange={e => setCDesc(e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <label>Price ($)</label>
                <input type="number" className="form-control" min="0" step="0.01" value={cPrice} onChange={e => setCPrice(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Course</button>
                <button type="button" className="btn btn-secondary" onClick={() => setCourseModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADING MODAL */}
      {gradeModalOpen && activeSubmission && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>✍️ Grade Student Submission</h3>
            <p className="text-muted" style={{ margin: '4px 0 16px 0' }}>Student: <strong>{activeSubmission.student_name}</strong> | {activeSubmission.assignment_title}</p>
            <form onSubmit={handleGradeSubmit}>
              <div className="form-group">
                <label>Score (0 - 100)</label>
                <input type="number" className="form-control" min="0" max="100" required value={gScore} onChange={e => setGScore(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Feedback Commentary</label>
                <textarea className="form-control" rows="3" placeholder="Good work! Your router matches specifications." value={gFeedback} onChange={e => setGFeedback(e.target.value)}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Grade</button>
                <button type="button" className="btn btn-secondary" onClick={() => setGradeModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
