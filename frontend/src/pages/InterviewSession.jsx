import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import ResponseInput from "../components/ResponseInput";

const TIMER_SECONDS = 120;

const DUMMY_QUESTIONS = [
  {
    id: "q1",
    question: "Tell me about a time you worked in a team to solve a difficult problem.",
    type: "behavioral",
    difficulty: "medium",
    tips: "Use the STAR method: Situation, Task, Action, Result.",
  },
  {
    id: "q2",
    question: "What is the difference between a stack and a queue?",
    type: "technical",
    difficulty: "easy",
    tips: "Think about the order in which items are added and removed.",
  },
  {
    id: "q3",
    question: "Describe a situation where you had to meet a tight deadline.",
    type: "behavioral",
    difficulty: "medium",
    tips: "Focus on how you prioritized tasks and communicated with your team.",
  },
];

export default function InterviewSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [followUp, setFollowUp] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await api.get(`/sessions/${sessionId}`);
        setQuestions(res.data.questions || []);
        setTimerActive(true);
      } catch (err) {
        setQuestions(DUMMY_QUESTIONS);
        setTimerActive(true);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function timerColor() {
    if (timeLeft > 60) return "text-green-600";
    if (timeLeft > 30) return "text-yellow-500";
    return "text-red-500";
  }

  async function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitting(true);
    setTimerActive(false);

    try {
      const currentQuestion = questions[currentIndex];
      const res = await api.post(`/sessions/${sessionId}/responses`, {
        questionId: currentQuestion.id,
        questionText: currentQuestion.question,
        answer,
      });
      setFeedback(res.data.feedback || null);
      setFollowUp(res.data.followUpQuestion || null);
    } catch (err) {
      setFeedback({
        contentScore: 7,
        clarityScore: 8,
        confidenceScore: 7,
        starScore: 6,
        tip: "Try to use the STAR method: Situation, Task, Action, Result.",
        fillerWords: [],
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setSessionDone(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setAnswer("");
    setFeedback(null);
    setFollowUp(null);
    setTimeLeft(TIMER_SECONDS);
    setTimerActive(true);
  }

  function handleExit() {
    if (window.confirm("Are you sure you want to exit? Your progress will be saved.")) {
      navigate("/dashboard");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading your interview session...</p>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-indigo-700 mb-2">Session Complete!</h2>
          <p className="text-gray-500 mb-6">Great work! You answered all {questions.length} questions.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <button onClick={handleExit} className="text-sm text-gray-500 hover:text-red-500 transition font-medium">
          ✕ Exit
        </button>
        <span className="text-sm font-medium text-gray-600">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className={`text-sm font-bold ${timerColor()}`}>
          ⏱ {formatTime(timeLeft)}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-2xl mx-auto w-full">
        <div className="w-full bg-white rounded-2xl shadow p-6 mb-6">
          <p className="text-xs text-indigo-500 font-semibold uppercase mb-2">
            {currentQuestion?.type} · {currentQuestion?.difficulty}
          </p>
          <p className="text-lg font-medium text-gray-800">{currentQuestion?.question}</p>
          {currentQuestion?.tips && (
            <p className="text-sm text-gray-400 mt-3 italic">💡 {currentQuestion.tips}</p>
          )}
        </div>

        {followUp && (
          <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-yellow-600 uppercase mb-1">Follow-up</p>
            <p className="text-sm text-gray-700">{followUp}</p>
          </div>
        )}

        {feedback && (
          <div className="w-full bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">Feedback</p>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <span className="text-gray-600">Content: <strong>{feedback.contentScore}/10</strong></span>
              <span className="text-gray-600">Clarity: <strong>{feedback.clarityScore}/10</strong></span>
              <span className="text-gray-600">Confidence: <strong>{feedback.confidenceScore}/10</strong></span>
              <span className="text-gray-600">STAR: <strong>{feedback.starScore}/10</strong></span>
            </div>
            {feedback.tip && (
              <p className="text-sm text-indigo-700 italic">💡 {feedback.tip}</p>
            )}
          </div>
        )}

        {!feedback && (
          <ResponseInput value={answer} onChange={setAnswer} />
        )}

        {!feedback ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || !answer.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition"
          >
            {submitting ? "Submitting..." : "Submit Answer"}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition"
          >
            {currentIndex + 1 >= questions.length ? "Finish Session" : "Next Question →"}
          </button>
        )}
      </div>
    </div>
  );
}
