import React, { useEffect, useState } from 'react';
import { API } from '../utils/api';

export default function CourseCatalog({ user, onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);
  const [installmentSplit, setInstallmentSplit] = useState(1); // 1, 2, or 4
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0); // percent
  const [couponFeedback, setCouponFeedback] = useState('');

  const loadCatalog = async () => {
    try {
      const res = await API.get('/api/courses');
      setCourses(res);
      
      if (API.getUserId() && API.getRole() === 'student') {
        const report = await API.get(`/api/reports/student/${API.getUserId()}`);
        setEnrolledIds(report.enrollments.map(e => e.course_id));
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const openCheckout = (course) => {
    setActiveCourse(course);
    setInstallmentSplit(1);
    setCouponCode('');
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponFeedback('');
    setCheckoutOpen(true);
  };

  const handleApplyCoupon = () => {
    if (couponCode === 'SCHOLAR50' || couponCode === 'SCHOLAR100') {
      const discount = couponCode === 'SCHOLAR100' ? 100 : 50;
      setCouponApplied(true);
      setCouponDiscount(discount);
      setCouponFeedback(`Coupon applied: ${discount}% discount!`);
    } else {
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponFeedback('Invalid coupon code.');
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!activeCourse) return;
    try {
      await API.post(`/api/courses/${activeCourse.id}/enroll`, {
        paymentMethod: 'stripe_mock',
        discountCode: couponApplied ? couponCode : null,
        totalInstallments: installmentSplit
      });
      alert("Registration Successful! Welcome to the course.");
      setCheckoutOpen(false);
      loadCatalog();
      onSelectCourse(activeCourse.id);
    } catch(err) {
      alert("Enrollment failed: " + err.message);
    }
  };

  const calculateGrandTotal = () => {
    if (!activeCourse) return 0;
    const basePrice = activeCourse.price;
    const discounted = basePrice - (basePrice * (couponDiscount / 100));
    return Math.max(0, discounted / installmentSplit);
  };

  if (loading) {
    return <div className="view-content"><h2>Loading Catalog...</h2></div>;
  }

  return (
    <div className="view-content">
      <h2>📚 Academic Course Catalog</h2>
      <p className="text-muted" style={{ marginBottom: '32px' }}>Browse courses, view fees, and register using payment plans or scholarship vouchers.</p>

      <div className="courses-container">
        {courses.map(c => {
          const isEnrolled = enrolledIds.includes(c.id);
          return (
            <div key={c.id} className="glass-card course-card">
              <div className="course-card-header">
                <span className="badge badge-info">{c.learning_path_title || 'General'}</span>
                <h3 style={{ marginTop: '8px' }}>{c.title}</h3>
              </div>
              <div className="course-card-body">
                <p className="text-muted" style={{ fontSize: '14px', flexGrow: 1 }}>{c.description}</p>
                <p style={{ fontWeight: 600, marginTop: '12px', fontSize: '15px' }}>Instructor: {c.instructor_name}</p>
              </div>
              <div className="course-card-footer">
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)' }}>${c.price}</span>
                {isEnrolled ? (
                  <button className="btn btn-secondary" onClick={() => onSelectCourse(c.id)}>Resume Learning</button>
                ) : user && user.role === 'student' ? (
                  <button className="btn btn-primary" onClick={() => openCheckout(c)}>Register & Enroll</button>
                ) : (
                  <button className="btn btn-secondary" onClick={() => onSelectCourse(c.id)}>Preview Course</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {checkoutOpen && activeCourse && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ marginBottom: '16px' }}>💳 Register & Checkout</h3>
            <p className="text-muted" style={{ marginBottom: '20px' }}>Registering for: <strong>{activeCourse.title}</strong></p>
            
            <div className="checkout-modal-details">
              <div className="form-group">
                <label>Payment Plan Select</label>
                <div className="payment-split-select">
                  <div className={`installment-option ${installmentSplit === 1 ? 'active' : ''}`} onClick={() => setInstallmentSplit(1)}>
                    Full Pay (${activeCourse.price})
                  </div>
                  <div className={`installment-option ${installmentSplit === 2 ? 'active' : ''}`} onClick={() => setInstallmentSplit(2)}>
                    2 Splits (${(activeCourse.price/2).toFixed(2)}/mo)
                  </div>
                  <div className={`installment-option ${installmentSplit === 4 ? 'active' : ''}`} onClick={() => setInstallmentSplit(4)}>
                    4 Splits (${(activeCourse.price/4).toFixed(2)}/mo)
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Scholarship Discount Code</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ flex: 1 }} 
                    placeholder="SCHOLAR100" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value)} 
                  />
                  <button className="btn btn-secondary" onClick={handleApplyCoupon}>Apply</button>
                </div>
                {couponFeedback && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: couponApplied ? 'var(--success)' : 'var(--danger)' }}>
                    {couponFeedback}
                  </span>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  {installmentSplit > 1 ? 'Installment Due Now:' : 'Grand Total Due Now:'}
                </span>
                <strong style={{ fontSize: '22px', color: 'var(--accent)' }}>
                  ${calculateGrandTotal().toFixed(2)}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCheckoutSubmit}>
                  Confirm Payment & Enroll
                </button>
                <button className="btn btn-secondary" onClick={() => setCheckoutOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
