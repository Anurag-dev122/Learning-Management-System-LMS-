import React, { useEffect, useState } from 'react';
import { API } from '../utils/api';

export default function CourseViewer({ courseId, user, onJoinLive, onClose }) {
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  // Discussion Board states
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [forumPosts, setForumPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostMsg, setNewPostMsg] = useState('');

  // Peer review modal states
  const [peerReviewableSubs, setPeerReviewableSubs] = useState([]);
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [peerScore, setPeerScore] = useState('85');
  const [peerFeedback, setPeerFeedback] = useState('');

  // Assessment Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  // File submit state
  const [selectedFile, setSelectedFile] = useState(null);

  const loadCourseData = async () => {
    try {
      const data = await API.get(`/api/courses/${courseId}`);
      setCourse(data.course);
      setModules(data.modules);
      
      // Auto-select first lesson if none active
      if (!activeLesson && data.modules.length > 0 && data.modules[0].lessons.length > 0) {
        setActiveLesson(data.modules[0].lessons[0]);
      } else if (activeLesson) {
        // Refresh active lesson details
        let updated = null;
        data.modules.forEach(m => {
          m.lessons.forEach(l => {
            if (l.id === activeLesson.id) updated = l;
          });
        });
        if (updated) setActiveLesson(updated);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const handleLessonSelect = (les) => {
    setActiveLesson(les);
    setDiscussionOpen(false);
    setQuizAnswers({});
    setQuizResult(null);
    setSelectedFile(null);
    if (les.assignment) {
      loadPeerSubmissions(les.assignment.id);
    }
  };

  const loadPeerSubmissions = async (assignId) => {
    try {
      const subs = await API.get(`/api/assignments/${assignId}/peer-reviewable`);
      setPeerReviewableSubs(subs);
    } catch(e) {
      console.error(e);
    }
  };

  const loadForumPosts = async () => {
    try {
      const posts = await API.get(`/api/courses/${courseId}/discussions`);
      setForumPosts(posts);
      setDiscussionOpen(true);
    } catch(e) {
      console.error(e);
    }
  };

  const handleForumSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/api/courses/${courseId}/discussions`, { title: newPostTitle, message: newPostMsg });
      alert("Discussion posted!");
      setNewPostTitle('');
      setNewPostMsg('');
      loadForumPosts();
    } catch(err) {
      alert(err.message);
    }
  };

  const handleMarkComplete = async () => {
    if (!activeLesson) return;
    try {
      const res = await API.post(`/api/courses/${courseId}/progress`, { lessonId: activeLesson.id });
      alert(`Lesson completed! Total Course Progress: ${res.progress}%`);
      if (res.completed) {
        alert("🎉 Congratulations! You have fully completed the course! Download your certificate from the Reports tab.");
      }
      loadCourseData();
    } catch(e) {
      alert("Error: " + e.message);
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!activeLesson || !activeLesson.quiz) return;
    try {
      const res = await API.post(`/api/quizzes/${activeLesson.quiz.id}/submit`, { answers: quizAnswers });
      setQuizResult(res);
      loadCourseData();
    } catch(err) {
      alert("Error: " + err.message);
    }
  };

  const handleAssignmentUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !activeLesson || !activeLesson.assignment) return;
    const formData = new FormData();
    formData.append('submissionFile', selectedFile);
    try {
      await API.upload(`/api/assignments/${activeLesson.assignment.id}/submit`, formData);
      alert("Assignment submitted successfully!");
      setSelectedFile(null);
      loadPeerSubmissions(activeLesson.assignment.id);
    } catch(err) {
      alert("Upload failed: " + err.message);
    }
  };

  const handlePeerReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    try {
      await API.post(`/api/submissions/${selectedSub.id}/peer-review`, { peerGrade: parseFloat(peerScore), peerFeedback });
      alert("Peer review submitted!");
      setPeerModalOpen(false);
      setPeerFeedback('');
      if (activeLesson && activeLesson.assignment) {
        loadPeerSubmissions(activeLesson.assignment.id);
      }
    } catch(err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="course-layout"><h3>Loading course player...</h3></div>;
  }

  return (
    <div className="course-layout">
      {/* Left Sidebar */}
      <div className="course-sidebar">
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <h4 style={{ fontWeight: 800 }}>{course ? course.title : ''}</h4>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '12px' }} onClick={loadForumPosts}>
            💬 Course Forum
          </button>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '8px' }} onClick={onJoinLive}>
            🎥 Join Live Class
          </button>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '8px' }} onClick={onClose}>
            ⬅️ Close Viewer
          </button>
        </div>

        {modules.map(mod => (
          <div key={mod.id} className="course-module-item">
            <div className="module-title-bar">{mod.title}</div>
            <ul className="lesson-list">
              {mod.lessons.map(les => (
                <li 
                  key={les.id} 
                  className={`lesson-item ${activeLesson && activeLesson.id === les.id ? 'active' : ''}`}
                  onClick={() => handleLessonSelect(les)}
                >
                  <div className="lesson-status-icon"></div>
                  <span>{les.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Main content viewport */}
      <div className="course-content-viewer">
        {discussionOpen ? (
          <div>
            <h2>💬 Course Discussion Board</h2>
            <p className="text-muted" style={{ marginBottom: '24px' }}>Post questions and interact with peers and instructors.</p>
            
            <div className="glass-card">
              <h3>Create New Post</h3>
              <form onSubmit={handleForumSubmit} style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label>Topic Title</label>
                  <input type="text" className="form-control" placeholder="Question about homework 1..." required value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea className="form-control" rows="3" placeholder="Write your post details here..." required value={newPostMsg} onChange={e => setNewPostMsg(e.target.value)}></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Post Topic</button>
              </form>
            </div>

            <div className="glass-card" style={{ marginTop: '32px' }}>
              <h3>Recent Discussions</h3>
              <div className="discussion-board" style={{ marginTop: '16px' }}>
                {forumPosts.length === 0 ? (
                  <p className="text-muted">No discussion threads created yet. Start the conversation!</p>
                ) : (
                  forumPosts.map(p => (
                    <div key={p.id} className="discussion-post">
                      <div className="post-avatar">{p.author_name[0]}</div>
                      <div className="post-content">
                        <div className="post-header">
                          <span className="post-author">{p.author_name} <span className="badge badge-info" style={{ fontSize: '9px' }}>{p.author_role}</span></span>
                          <span className="post-date">{new Date(p.created_at).toLocaleString()}</span>
                        </div>
                        {p.title && <h4 style={{ marginBottom: '8px' }}>{p.title}</h4>}
                        <div className="post-body">{p.message}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : activeLesson ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>{activeLesson.title}</h2>
              <button className="btn btn-success" onClick={handleMarkComplete}>✔️ Mark Complete & Next</button>
            </div>

            {activeLesson.content_type === 'text' && (
              <div className="lesson-body">
                <p>{activeLesson.content_url_or_text}</p>
              </div>
            )}

            {activeLesson.content_type === 'video' && (
              <div className="lesson-body">
                <div className="video-simulation" style={{ height: '380px', marginBottom: '24px' }}>
                  <video src={activeLesson.content_url_or_text} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
                </div>
                <p>Watch the video lecture above to understand the core elements of this course module.</p>
              </div>
            )}

            {activeLesson.content_type === 'scorm' && (
              <div className="scorm-simulator">
                <h3>📦 SCORM Package: eLearning Module</h3>
                <p className="text-muted" style={{ color: '#94a3b8', margin: '16px 0' }}>SCORM Version: 1.2 | Package Player active</p>
                <button className="btn btn-primary" onClick={handleMarkComplete}>Complete SCORM Interactive module</button>
              </div>
            )}

            {activeLesson.quiz && (
              <div className="glass-card" style={{ marginTop: '40px' }}>
                <h3>📝 Assessment: {activeLesson.quiz.title}</h3>
                <p className="text-muted">Passing Score: {activeLesson.quiz.passing_score}%</p>
                
                {quizResult ? (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ color: quizResult.passed ? 'var(--success)' : 'var(--danger)' }}>
                      {quizResult.passed ? '🎉 Assessment Passed!' : '❌ Assessment Failed'}
                    </h4>
                    <p style={{ margin: '12px 0' }}>
                      You scored {quizResult.score}% ({quizResult.correctCount}/{quizResult.totalQuestions} correct).
                    </p>
                    <button className="btn btn-secondary" onClick={() => setQuizResult(null)}>Retry Quiz</button>
                  </div>
                ) : (
                  <form onSubmit={handleQuizSubmit} style={{ marginTop: '16px' }}>
                    {activeLesson.quiz.questions.map((q, idx) => (
                      <div key={q.id} className="quiz-question" style={{ marginBottom: '16px' }}>
                        <h4>Question {idx + 1}: {q.question_text}</h4>
                        <div className="quiz-options">
                          {q.options.map((opt, optIdx) => (
                            <label key={optIdx} className="quiz-option">
                              <input 
                                type="radio" 
                                name={`q-${q.id}`} 
                                value={optIdx} 
                                checked={quizAnswers[q.id] === optIdx}
                                onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))} 
                              />
                              <span style={{ marginLeft: '8px' }}>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button type="submit" className="btn btn-primary">Submit Assessment</button>
                  </form>
                )}
              </div>
            )}

            {activeLesson.assignment && (
              <div className="glass-card" style={{ marginTop: '40px' }}>
                <h3>📤 Assignment: {activeLesson.assignment.title}</h3>
                <p className="text-muted" style={{ margin: '8px 0 16px 0' }}><strong>Instructions:</strong> {activeLesson.assignment.instruction_text}</p>
                <p style={{ fontSize: '13px', color: 'var(--danger)', marginBottom: '20px' }}>Due date: {activeLesson.assignment.due_date}</p>
                
                <form onSubmit={handleAssignmentUpload} className="upload-dropzone">
                  <div className="upload-dropzone-icon">📁</div>
                  <p>Click to select or drag and drop your script file here.</p>
                  <input 
                    type="file" 
                    id="assignment-file-picker"
                    style={{ display: 'none' }} 
                    onChange={e => setSelectedFile(e.target.files[0])} 
                  />
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                    {selectedFile ? selectedFile.name : 'No file selected'}
                  </span>
                  <button type="button" className="btn btn-secondary" onClick={() => document.getElementById('assignment-file-picker').click()}>Browse Files</button>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Upload Submission</button>
                </form>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <h4>👥 Peer Review Submission Panel</h4>
                  <p className="text-muted" style={{ fontSize: '13px', margin: '4px 0 12px 0' }}>Select another student's submission to evaluate. Complete your peer reviews to build grade bonuses.</p>
                  
                  {peerReviewableSubs.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: '13px' }}>No other student submissions are currently awaiting peer review.</p>
                  ) : (
                    <div className="table-container">
                      <table className="custom-table" style={{ fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>File</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {peerReviewableSubs.map(s => (
                            <tr key={s.id}>
                              <td>{s.student_name}</td>
                              <td><a href={s.file_path} target="_blank" rel="noreferrer">📎 Download</a></td>
                              <td>
                                <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedSub(s); setPeerModalOpen(true); }}>Review</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <h2>Select a lesson to begin.</h2>
        )}
      </div>

      {/* PEER REVIEW MODAL */}
      {peerModalOpen && selectedSub && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>👥 Evaluate Peer Submission</h3>
            <p className="text-muted" style={{ marginBottom: '16px' }}>Evaluating: <strong>{selectedSub.student_name}</strong></p>
            <form onSubmit={handlePeerReviewSubmit}>
              <div className="form-group">
                <label>Peer Score (0 - 100)</label>
                <input type="number" className="form-control" min="0" max="100" required value={peerScore} onChange={e => setPeerScore(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Review Remarks</label>
                <textarea className="form-control" rows="3" placeholder="Code is clean, server handles requests, but misses formatting." required value={peerFeedback} onChange={e => setPeerFeedback(e.target.value)}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Peer Review</button>
                <button type="button" className="btn btn-secondary" onClick={() => setPeerModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
