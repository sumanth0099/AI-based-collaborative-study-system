// src/pages/AIPage.jsx
import { useState, useEffect } from 'react';
import useAIStore from '../stores/aiStore.js';
import './AIPage.css';

const TABS = [
  { key: 'quiz',       label: '🎯 Quiz',       desc: 'Test your knowledge with AI-generated quizzes' },
  { key: 'flashcards', label: '🃏 Flashcards',  desc: 'Quick study cards for any topic' },
  { key: 'chat',       label: '💬 AI Chat',     desc: 'Ask the AI anything' },
  { key: 'summary',   label: '📄 Summary',     desc: 'Generate a summary of your notes' },
  { key: 'important', label: '❓ Key Questions',desc: 'Generate important questions from notes' },
];

export default function AIPage() {
  const {
    quizTopics, fetchQuizTopics, generateQuiz, submitQuiz, resetQuiz, currentQuiz, quizResult, isGeneratingQuiz,
    generateFlashcards, flashcards, isGeneratingFlashcards,
    sendChatMessage, chatHistory, isChatLoading, clearChat,
    generateSummary, summary, isGeneratingSummary, clearSummary,
    generateImportantQuestions, importantQuestions, isGeneratingImportantQuestions, clearImportantQuestions,
  } = useAIStore();

  const [activeTab, setActiveTab] = useState('quiz');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [chatInput, setChatInput] = useState('');
  const [summaryTopic, setSummaryTopic] = useState(null);
  const [flashTopic, setFlashTopic] = useState(null);
  const [chatTopic, setChatTopic] = useState(null);
  const [importantTopic, setImportantTopic] = useState(null);

  useEffect(() => { fetchQuizTopics(); }, []);

  // Quiz handlers
  const handleGenQuiz = () => {
    if (!selectedTopic) return;
    generateQuiz(selectedTopic.id, selectedTopic.topic);
  };

  const handleAnswer = (qId, ans) => setQuizAnswers(p => ({...p, [qId]: ans}));

  const handleSubmitQuiz = async () => {
    const questions = currentQuiz.questions || [];
    const answers = questions.map(q => ({
      selectedAnswer: quizAnswers[q.id] || '',
      correctAnswer: q.correctAnswer,
    }));
    await submitQuiz({
      noteId: selectedTopic?.id || '',
      subject: currentQuiz.subject || '',
      topic: selectedTopic?.topic || '',
      difficulty: 'medium',
      totalQuestions: questions.length,
      answers,
    });
  };

  // Chat handler
  const handleChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatTopic) return;
    sendChatMessage(chatTopic.id, chatTopic.topic, chatInput);
    setChatInput('');
  };

  return (
    <div className="ai-page">
      <div className="page-header">
        <h1>🤖 AI Tools</h1>
        <p>Supercharge your studying with artificial intelligence.</p>
      </div>

      {/* Tab pills */}
      <div className="ai-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`ai-tab-btn ${activeTab===t.key?'ai-tab-active':''}`} onClick={() => setActiveTab(t.key)} id={`ai-tab-${t.key}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Quiz */}
      {activeTab === 'quiz' && (
        <div className="ai-panel">
          {!currentQuiz && !quizResult && (
            <div className="glass-card ai-panel-card">
              <h3>Select a Topic</h3>
              <p>Choose a topic from your notes to generate a quiz.</p>
              <div className="ai-topic-grid">
                {quizTopics.length === 0 && <p style={{color:'var(--text-muted)'}}>No notes available. Create some notes first!</p>}
                {quizTopics.map(t => (
                  <button
                    key={t.id}
                    className={`ai-topic-btn ${selectedTopic?.id===t.id?'ai-topic-selected':''}`}
                    onClick={() => setSelectedTopic(t)}
                    id={`quiz-topic-${t.id}`}
                  >
                    {t.topic}
                  </button>
                ))}
              </div>
              {selectedTopic && (
                <button className="btn btn-primary" onClick={handleGenQuiz} disabled={isGeneratingQuiz} id="gen-quiz-btn">
                  {isGeneratingQuiz ? <><div className="spinner spinner-sm"/>Generating...</> : '🎯 Generate Quiz'}
                </button>
              )}
            </div>
          )}

          {currentQuiz && !quizResult && (
            <div className="glass-card ai-panel-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h3>Quiz: {currentQuiz.subject}</h3>
                <button className="btn btn-ghost btn-sm" onClick={resetQuiz}>✕ Cancel</button>
              </div>
              <div className="quiz-questions">
                {(currentQuiz.questions || []).map((q, i) => (
                  <div key={q.id || i} className="quiz-question">
                    <p className="quiz-q-text"><strong>Q{i+1}.</strong> {q.question}</p>
                    <div className="quiz-options">
                      {(q.options || []).map((opt, j) => (
                        <button
                          key={j}
                          className={`quiz-option ${quizAnswers[q.id]===opt?'quiz-option-selected':''}`}
                          onClick={() => handleAnswer(q.id, opt)}
                          id={`quiz-q${q.id}-opt${j}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={handleSubmitQuiz} disabled={Object.keys(quizAnswers).length < (currentQuiz.questions||[]).length} id="submit-quiz-btn">
                Submit Quiz
              </button>
            </div>
          )}

          {quizResult && (
            <div className="glass-card ai-panel-card quiz-result">
              <div className="quiz-result-score" style={{color: quizResult.result?.percentage >= 70 ? 'var(--success)' : 'var(--error)'}}>
                {quizResult.result?.correctAnswers}/{quizResult.result?.totalQuestions}
              </div>
              <h3>{quizResult.message?.title || quizResult.message || 'Quiz complete!'}</h3>
              <p>{quizResult.result?.percentage}% score</p>
              <button className="btn btn-primary" onClick={() => { resetQuiz(); setQuizAnswers({}); }} id="retake-quiz-btn">Take Another Quiz</button>
            </div>
          )}
        </div>
      )}

      {/* Flashcards */}
      {activeTab === 'flashcards' && (
        <div className="ai-panel">
          <div className="glass-card ai-panel-card">
            <h3>Generate Flashcards</h3>
            <div className="ai-topic-grid">
              {quizTopics.map(t => (
                <button key={t.id} className={`ai-topic-btn ${flashTopic?.id===t.id?'ai-topic-selected':''}`} onClick={() => setFlashTopic(t)} id={`flash-topic-${t.id}`}>{t.topic}</button>
              ))}
            </div>
            {flashTopic && (
              <button className="btn btn-primary" onClick={() => generateFlashcards(flashTopic.id, flashTopic.topic)} disabled={isGeneratingFlashcards} id="gen-flashcards-ai-btn">
                {isGeneratingFlashcards ? <><div className="spinner spinner-sm"/>Generating...</> : '🃏 Generate Flashcards'}
              </button>
            )}
          </div>
          {flashcards.length > 0 && (
            <div className="ai-flashcard-grid">
              {flashcards.map((fc, i) => (
                <div key={fc.id||i} className="flashcard-full">
                  <div className="flashcard-full-inner">
                    <div className="flashcard-full-front"><span className="flashcard-label">Front</span><p>{fc.front}</p></div>
                    <div className="flashcard-full-back"><span className="flashcard-label">Back</span><p>{fc.back}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {activeTab === 'chat' && (
        <div className="ai-panel">
          <div className="glass-card ai-panel-card ai-chat-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3>AI Study Assistant</h3>
              <button className="btn btn-ghost btn-sm" onClick={clearChat} id="clear-chat-btn">Clear</button>
            </div>
            {!chatTopic ? (
              <div style={{marginBottom: 16}}>
                <p>Select a topic to chat about:</p>
                <div className="ai-topic-grid">
                  {quizTopics.map(t => (
                    <button key={t.id} className="ai-topic-btn" onClick={() => setChatTopic(t)}>{t.topic}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span className="badge badge-primary">Topic: {chatTopic.topic}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setChatTopic(null)}>Change Topic</button>
              </div>
            )}
            <div className="ai-chat-history">
              {chatHistory.length === 0 && (
                <div className="ai-chat-welcome">
                  <div style={{fontSize:'3rem'}}>🤖</div>
                  <h3>Hello! I'm your AI study assistant.</h3>
                  <p>Ask me any question you have about your studies!</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`ai-chat-msg ai-chat-${msg.role}`}>
                  <div className="ai-chat-role">{msg.role==='user'?'👤':'🤖'}</div>
                  <div className="ai-chat-bubble">{msg.content}</div>
                </div>
              ))}
              {isChatLoading && (
                <div className="ai-chat-msg ai-chat-ai">
                  <div className="ai-chat-role">🤖</div>
                  <div className="ai-chat-bubble ai-typing"><span/><span/><span/></div>
                </div>
              )}
            </div>
            <form className="ai-chat-form" onSubmit={handleChat}>
              <input id="ai-chat-input" className="form-input" placeholder={chatTopic ? "Ask anything..." : "Select a topic first..."} value={chatInput} onChange={e=>setChatInput(e.target.value)} disabled={isChatLoading || !chatTopic} />
              <button type="submit" className="btn btn-primary btn-icon" disabled={!chatInput.trim()||isChatLoading||!chatTopic} id="ai-chat-send">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Summary */}
      {activeTab === 'summary' && (
        <div className="ai-panel">
          <div className="glass-card ai-panel-card">
            <h3>Summarize Notes</h3>
            <p>Select a topic to generate an AI summary.</p>
            <div className="ai-topic-grid">
              {quizTopics.map(t => (
                <button key={t.id} className={`ai-topic-btn ${summaryTopic?.id===t.id?'ai-topic-selected':''}`} onClick={() => setSummaryTopic(t)} id={`sum-topic-${t.id}`}>{t.topic}</button>
              ))}
            </div>
            {summaryTopic && (
              <button className="btn btn-primary" onClick={() => generateSummary(summaryTopic.id, summaryTopic.topic)} disabled={isGeneratingSummary} id="gen-summary-ai-btn">
                {isGeneratingSummary ? <><div className="spinner spinner-sm"/>Generating...</> : '📄 Generate Summary'}
              </button>
            )}
            {summary && (
              <div className="ai-summary-result">
                <h4>Summary</h4>
                <p>{typeof summary === 'string' ? summary : JSON.stringify(summary)}</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Important Questions */}
      {activeTab === 'important' && (
        <div className="ai-panel">
          <div className="glass-card ai-panel-card">
            <h3>Generate Key Questions</h3>
            <p>Select a topic to generate 5 important questions to test your understanding.</p>
            <div className="ai-topic-grid">
              {quizTopics.map(t => (
                <button key={t.id} className={`ai-topic-btn ${importantTopic?.id===t.id?'ai-topic-selected':''}`} onClick={() => setImportantTopic(t)} id={`imp-topic-${t.id}`}>{t.topic}</button>
              ))}
            </div>
            {importantTopic && (
              <button className="btn btn-primary" onClick={() => generateImportantQuestions(importantTopic.id, importantTopic.topic)} disabled={isGeneratingImportantQuestions} id="gen-imp-questions-ai-btn">
                {isGeneratingImportantQuestions ? <><div className="spinner spinner-sm"/>Generating...</> : '❓ Generate Important Questions'}
              </button>
            )}
            {importantQuestions && Array.isArray(importantQuestions) && (
              <div className="ai-important-questions-result">
                <h4>Key Questions</h4>
                <ul className="important-questions-list" style={{ marginTop: '1rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {importantQuestions.map((q, idx) => (
                    <li key={idx} style={{ lineHeight: '1.5' }}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
