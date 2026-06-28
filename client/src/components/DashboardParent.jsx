import React, { useEffect, useState } from 'react';
import { API } from '../utils/api';

export default function DashboardParent() {
  const [child, setChild] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadParentReport() {
      try {
        const report = await API.get('/api/reports/parent');
        setChild(report.child);
        setEnrollments(report.enrollments);
        setAlerts(report.alerts);
      } catch(e) {
        console.error("Parent dashboard loading failed", e);
      } finally {
        setLoading(false);
      }
    }
    loadParentReport();
  }, []);

  if (loading) {
    return <div className="view-content"><h2>Loading parent dashboard...</h2></div>;
  }

  if (!child) {
    return (
      <div className="view-content">
        <h2>👨‍👩‍👧 Parent Portal</h2>
        <p className="text-danger">No child profile linked to this parent account.</p>
      </div>
    );
  }

  return (
    <div className="view-content">
      <h2>👨‍👩‍👧 Parent Portal</h2>
      <p className="text-muted" style={{ marginBottom: '24px' }}>Monitor academic progress, performance reports, and alerts for linked learner: <strong>{child.name}</strong></p>

      <div className="glass-card">
        <h3>🚨 Engagement & Risk Alerts</h3>
        <div className="risk-alert-container" style={{ marginTop: '16px' }}>
          {alerts.length === 0 ? (
            <div className="risk-alert warning" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderLeftColor: 'var(--success)' }}>
              🟢 Student is currently in good academic standing. No risk alerts active.
            </div>
          ) : (
            alerts.map((a, i) => (
              <div key={i} className={`risk-alert ${a.type === 'warning' ? 'warning' : 'danger'}`}>
                ⚠️ {a.message}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '32px' }}>
        <h3>📚 Registered Courses & Progress</h3>
        <div className="table-container" style={{ marginTop: '16px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(e => (
                <tr key={e.id}>
                  <td><strong>{e.course_title}</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{e.progress}%</span>
                      <div className="progress-bar-container" style={{ width: '120px', margin: 0 }}>
                        <div className="progress-bar-fill" style={{ width: `${e.progress}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td>{e.progress === 100 ? <span className="badge badge-success">Completed</span> : <span className="badge badge-warning">Active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
