import React, { useEffect, useState } from 'react';
import { API } from '../utils/api';

export default function DashboardAdmin() {
  const [stats, setStats] = useState({ totalUsers: 0, totalCourses: 0, totalEnrollments: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState('75');

  const loadStats = async () => {
    try {
      const res = await API.get('/api/reports/admin');
      setStats(res);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mock action/endpoint setup validation
      alert(`Promo Code ${couponCode} created at ${couponPercent}% discount!`);
      setCouponCode('');
    } catch(err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="view-content"><h2>Loading admin panel...</h2></div>;
  }

  return (
    <div className="view-content">
      <h2>⚙️ System Administrator Portal</h2>
      <p className="text-muted" style={{ marginBottom: '24px' }}>Global stats overview, coupon administration, and platform metrics.</p>

      <div className="dashboard-grid">
        <div className="glass-card stat-widget">
          <div className="stat-icon primary">👥</div>
          <div className="stat-details">
            <h3>{stats.totalUsers}</h3>
            <p>Total Registered Users</p>
          </div>
        </div>
        <div className="glass-card stat-widget">
          <div className="stat-icon success">💵</div>
          <div className="stat-details">
            <h3>${stats.totalRevenue.toFixed(2)}</h3>
            <p>Accumulated Revenue</p>
          </div>
        </div>
        <div className="glass-card stat-widget">
          <div className="stat-icon info">📚</div>
          <div className="stat-details">
            <h3>{stats.totalCourses}</h3>
            <p>Total Catalog Courses</p>
          </div>
        </div>
      </div>
      
      <div className="glass-card">
        <h3>Create Scholarship Discount Code</h3>
        <form onSubmit={handleCouponSubmit} style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label>Promo Code</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="SCHOLAR75" 
              required 
              value={couponCode} 
              onChange={e => setCouponCode(e.target.value)} 
            />
          </div>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label>Discount Percent</label>
            <input 
              type="number" 
              className="form-control" 
              min="1" 
              max="100" 
              placeholder="75" 
              required 
              value={couponPercent} 
              onChange={e => setCouponPercent(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn btn-primary">Create Promo Code</button>
        </form>
      </div>
    </div>
  );
}
