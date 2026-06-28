window.QuizEngine = {
  renderQuiz: function(containerId, quizData, onSubmitCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `
      <div class="quiz-container">
        <h3>📝 Assessment: ${quizData.title}</h3>
        <p class="text-muted">Passing Score: ${quizData.passing_score}%</p>
        <form id="quiz-form" onsubmit="event.preventDefault();">
    `;

    quizData.questions.forEach((q, qIndex) => {
      html += `
        <div class="quiz-question" data-question-id="${q.id}">
          <h4>Question ${qIndex + 1}: ${q.question_text}</h4>
          <div class="quiz-options">
      `;
      q.options.forEach((opt, oIndex) => {
        html += `
          <label class="quiz-option">
            <input type="radio" name="q-${q.id}" value="${oIndex}">
            <span>${opt}</span>
          </label>
        `;
      });
      html += `
          </div>
        </div>
      `;
    });

    html += `
          <button type="button" class="btn btn-primary" id="btn-submit-quiz">Submit Assessment</button>
        </form>
        <div id="quiz-result-feedback" style="margin-top: 20px;"></div>
      </div>
    `;

    container.innerHTML = html;

    document.getElementById('btn-submit-quiz').addEventListener('click', async () => {
      const form = document.getElementById('quiz-form');
      const answers = {};
      let allAnswered = true;

      quizData.questions.forEach(q => {
        const selected = form.querySelector(`input[name="q-${q.id}"]:checked`);
        if (selected) {
          answers[q.id] = parseInt(selected.value);
        } else {
          allAnswered = false;
        }
      });

      if (!allAnswered) {
        alert("Please answer all questions before submitting.");
        return;
      }

      // Disable button
      const submitBtn = document.getElementById('btn-submit-quiz');
      submitBtn.disabled = true;
      submitBtn.innerText = "Grading...";

      if (onSubmitCallback) {
        await onSubmitCallback(answers);
      }
    });
  },

  showFeedback: function(feedbackData) {
    const feedbackBox = document.getElementById('quiz-result-feedback');
    if (!feedbackBox) return;

    const isPassed = feedbackData.passed;
    const badgeClass = isPassed ? 'badge-success' : 'badge-danger';
    const title = isPassed ? '🎉 Assessment Passed!' : '❌ Assessment Failed';
    const message = isPassed 
      ? `Congratulations! You scored ${feedbackData.score}% (${feedbackData.correctCount}/${feedbackData.totalQuestions} correct) and passed the quiz.`
      : `You scored ${feedbackData.score}%. The passing threshold is ${feedbackData.passingScore || 70}%. Please review the materials and try again.`;

    feedbackBox.innerHTML = `
      <div class="glass-card" style="border-color: ${isPassed ? 'var(--success)' : 'var(--danger)'};">
        <h4 style="color: ${isPassed ? 'var(--success)' : 'var(--danger)'}; display: flex; align-items: center; gap: 8px;">
          ${title}
        </h4>
        <p style="margin: 12px 0;">${message}</p>
        ${isPassed ? '<button class="btn btn-primary" onclick="app.refreshCurrentCourse()">Continue Lesson</button>' : '<button class="btn btn-secondary" onclick="app.refreshCurrentCourse()">Retry Quiz</button>'}
      </div>
    `;
  }
};
