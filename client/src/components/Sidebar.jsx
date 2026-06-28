import React from 'react';

export default function Sidebar({ user, activeTab, onTabChange, onLogout }) {
  const getAvatarChar = () => {
    return user && user.name ? user.name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <aside id="sidebar">
      <div className="sidebar-header">
        <div className="user-avatar" style={{ background: 'linear-gradient(135deg, var(--accent), #f43f5e)' }}>🎓</div>
        <div className="sidebar-logo">ACADEMY LMS</div>
      </div>
      
      <ul className="nav-links">
        <li 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          📊 Dashboard
        </li>
        <li 
          className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => onTabChange('courses')}
        >
          📚 Course Catalog
        </li>
        <li 
          className={`nav-item ${activeTab === 'learning-paths' ? 'active' : ''}`}
          onClick={() => onTabChange('learning-paths')}
        >
          🛣️ Learning Paths
        </li>
        {user && user.role === 'student' && (
          <li 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => onTabChange('reports')}
          >
            📈 Reports & Gradebook
          </li>
        )}
      </ul>

      <div className="sidebar-footer">
        <div className="user-profile-summary">
          <div className="user-avatar">{getAvatarChar()}</div>
          <div className="user-info">
            <span className="user-name">{user ? user.name : 'Guest'}</span>
            <span className="user-role">{user ? user.role : ''}</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onLogout} style={{ width: '100%' }}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
