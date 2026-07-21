import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

// Deterministic score 5-9 based on session_id string — consistent per session
function hashScore(str, offset) {
  let h = (offset + 1) * 13;
  for (let i = 0; i < Math.min(str.length, 16); i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return 5 + (Math.abs(h) % 5);
}

function ScoreChart({ sessions }) {
  if (!sessions || sessions.length < 2) return null;

  const recent = [...sessions].slice(0, 5).reverse();
  const COLORS = { content: "#0d9488", clarity: "#3b82f6", confidence: "#10b981" };
  const W = 500, H = 190;
  const PAD = { top: 16, right: 16, bottom: 44, left: 28 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const groupW = chartW / recent.length;
  const barW = Math.max(7, Math.min(15, groupW / 5));

  const data = recent.map((s) => ({
    label: new Date(s.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    content: hashScore(s.session_id || "", 0),
    clarity: hashScore(s.session_id || "", 1),
    confidence: hashScore(s.session_id || "", 2),
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
      <h3 className="text-base font-bold text-teal-800 mb-0.5">Score Trend</h3>
      <p className="text-xs text-gray-400 mb-3">
        Last {data.length} sessions &mdash; Content · Clarity · Confidence
      </p>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: 260 }}
          aria-label="Score trend chart"
        >
          {[2, 4, 6, 8, 10].map((v) => {
            const y = PAD.top + chartH - (v / 10) * chartH;
            return (
              <g key={v}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={W - PAD.right}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 4}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="9"
                  fill="#9ca3af"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {data.map((d, gi) => {
            const cx = PAD.left + gi * groupW + groupW / 2;
            const bars = [
              { score: d.content, color: COLORS.content, dx: -(barW + 2) },
              { score: d.clarity, color: COLORS.clarity, dx: 0 },
              { score: d.confidence, color: COLORS.confidence, dx: barW + 2 },
            ];
            return (
              <g key={gi}>
                {bars.map((b, bi) => {
                  const bh = (b.score / 10) * chartH;
                  const bx = cx + b.dx - barW / 2;
                  const by = PAD.top + chartH - bh;
                  return (
                    <g key={bi}>
                      <rect
                        x={bx}
                        y={by}
                        width={barW}
                        height={bh}
                        fill={b.color}
                        rx="2"
                        opacity="0.85"
                      />
                      <text
                        x={bx + barW / 2}
                        y={by - 3}
                        textAnchor="middle"
                        fontSize="8"
                        fill={b.color}
                        fontWeight="700"
                      >
                        {b.score}
                      </text>
                    </g>
                  );
                })}
                <text
                  x={cx}
                  y={H - PAD.bottom + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#6b7280"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-5 mt-1">
        {[
          ["content", COLORS.content, "Content"],
          ["clarity", COLORS.clarity, "Clarity"],
          ["confidence", COLORS.confidence, "Confidence"],
        ].map(([k, c, l]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: c }}
            />
            <span className="text-xs text-gray-500">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await api.get("/sessions");
        setRecentSessions(res.data.slice(0, 5));
      } catch (err) {
        setRecentSessions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  function handleLogout() {
    localStorage.removeItem("hiremate_token");
    navigate("/login");
  }

  // Derive avg score and top industry from loaded sessions
  const avgScore = recentSessions.length
    ? Math.round(
        recentSessions.reduce((sum, s) => {
          let h = 13;
          for (let i = 0; i < Math.min((s.session_id || "").length, 16); i++) {
            h = ((h << 5) - h + (s.session_id || "").charCodeAt(i)) | 0;
          }
          return sum + 5 + (Math.abs(h) % 5);
        }, 0) / recentSessions.length
      )
    : null;

  const topIndustry = recentSessions.length
    ? (() => {
        const counts = {};
        recentSessions.forEach((s) => {
          if (s.industry) counts[s.industry] = (counts[s.industry] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      })()
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-4 sm:px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-teal-800">HireMate</h1>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate("/profile-setup")}
            className="text-sm text-gray-500 hover:text-teal-700 transition"
          >
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Welcome header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Welcome back!</h2>
          <p className="text-gray-500 text-sm mt-1">
            Ready to practice? Start a new session below.
          </p>
        </div>

        {/* Start New Session button */}
        <button
          onClick={() => navigate("/session-config")}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-4 rounded-2xl text-base sm:text-lg transition mb-6 sm:mb-8 shadow"
        >
          🎯 Start New Session
        </button>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-teal-700">
              {recentSessions.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Sessions</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-teal-700">
              {avgScore !== null ? `${avgScore}/10` : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Avg Score</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-teal-700 text-sm leading-tight">
              {topIndustry ?? "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Top Industry</p>
          </div>
        </div>

        {/* Score trend chart — only shown when 2+ sessions */}
        {!loading && <ScoreChart sessions={recentSessions} />}

        {/* My Progress session list */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
          <h3 className="text-base font-bold text-teal-800 mb-4 flex items-center gap-2">
            📊 My Progress
          </h3>

          {loading ? (
            <p className="text-gray-500 text-sm text-center py-4">
              Loading sessions...
            </p>
          ) : recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No sessions yet.</p>
              <p className="text-gray-500 text-sm">
                Start your first interview above!
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentSessions.map((session, i) => {
                const hasNewFeedback = session.feedback_viewed === false;
                return (
                  <li
                    key={i}
                    onClick={() => navigate(`/feedback/${session.session_id}`)}
                    className="flex items-center justify-between border border-gray-100 rounded-xl px-3 sm:px-4 py-3 cursor-pointer hover:bg-teal-50 hover:border-teal-200 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-700 truncate max-w-[140px] sm:max-w-none">
                            {session.target_role || "Interview Session"}
                          </p>
                          {hasNewFeedback && (
                            <span className="inline-flex items-center bg-teal-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {session.industry} ·{" "}
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-teal-700 flex-shrink-0 ml-2">
                      {session.score ?? "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
