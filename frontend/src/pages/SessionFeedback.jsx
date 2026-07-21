import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

function deriveScore(text) {
  if (!text) return 6;
  const words = text.trim().split(/\s+/).length;
  if (words < 20) return 5;
  if (words < 50) return 7;
  if (words < 100) return 8;
  return 9;
}

function ScoreBadge({ score }) {
  const color =
    score >= 8 ? "text-green-700 bg-green-50" :
    score >= 6 ? "text-teal-700 bg-teal-50" :
    "text-yellow-700 bg-yellow-50";
  return (
    <span className={`text-sm font-bold px-3 py-1 rounded-full ${color}`}>
      {score}/10
    </span>
  );
}

export default function SessionFeedback() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem(`feedbackViewed_${sessionId}`, "true");

    async function load() {
      try {
        const res = await api.get(`/sessions/${sessionId}`);
        setSession(res.data.session);
        setResponses(res.data.responses || []);
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading your feedback...</p>
      </div>
    );
  }

  const scores = responses.map((r) => deriveScore(r.response_text));
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-bold text-teal-800 mb-1">Interview Complete!</h1>
          {session && (
            <p className="text-gray-500 text-sm mb-4">
              {session.target_role} &middot; {session.interview_type} &middot;{" "}
              {new Date(session.created_at).toLocaleDateString()}
            </p>
          )}
          {avgScore !== null && (
            <div className="inline-flex items-center gap-2 bg-teal-50 px-6 py-3 rounded-full">
              <span className="text-3xl font-bold text-teal-700">{avgScore}</span>
              <span className="text-gray-500 text-sm">/10 Overall Score</span>
            </div>
          )}
          {responses.length === 0 && (
            <p className="text-gray-400 text-sm mt-2">
              No responses recorded for this session.
            </p>
          )}
        </div>

        {/* Per-response cards */}
        {responses.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase px-1">
              Your Responses ({responses.length})
            </h2>
            {responses.map((r, i) => (
              <div key={r.response_id || i} className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-teal-600 uppercase">
                    Question {i + 1}
                  </span>
                  <ScoreBadge score={scores[i]} />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                  {r.response_text}
                </p>
                {scores[i] < 7 && (
                  <p className="text-xs text-yellow-600 mt-2 italic">
                    Tip: Try to provide more detail and use the STAR method.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-medium py-3 rounded-xl transition"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
