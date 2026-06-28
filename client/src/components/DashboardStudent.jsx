import React, { useEffect, useState } from 'react';
import { API } from '../utils/api';

export default function DashboardStudent({ user, onSelectCourse, onNavigateToCatalog }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const report = await API.get(`/api/reports/student/${API.getUserId()}`);
        setEnrollments(report.enrollments);
      } catch (e) {
        console.error("Dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="view-content"><h2>Loading dashboard...</h2></div>;
  }

  return (
    <div className="view-content">
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(16, 185, 129, 0.1))' }}>
        <h2>👋 Welcome back, {user ? user.name : 'Learner'}!</h2>
        <p className="text-muted" style={{ marginTop: '8px' }}>Continue your learning sequence and review recent assessment reports below.</p>
      </div>
      
      <h3 style={{ margin: '32px 0 16px 0' }}>Your Active Courses</h3>
      {enrollments.length === 0 ? (
        <div className="glass-card">
          <p className="text-muted">You are not enrolled in any courses yet. Go to the <span onClick={onNavigateToCatalog} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>Catalog</span> to register!</p>
        </div>
      ) : (
        <div className="courses-container">
          {enrollments.map(e => (
            <div key={e.id} className="glass-card course-card">
              <div className="course-card-header">
                <span className="badge badge-info">ENROLLED</span>
                <h3 style={{ marginTop: '8px' }}>{e.course_title}</h3>
              </div>
              <div className="course-card-body">
                <p style={{ fontSize: '14px' }} className="text-muted">Progress: {e.progress}%</p>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${e.progress}%` }}></div>
                </div>
              </div>
              <div className="course-card-footer">
                <button className="btn btn-primary" onClick={() => onSelectCourse(e.course_id)}>
                  Resume Learning
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
