import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

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
        // Backend not ready yet — use empty state
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-teal-800">HireMate</h1>
        <div className="flex items-center gap-4">
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

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome back!</h2>
          <p className="text-gray-500 text-sm mt-1">
            Ready to practice? Start a new session below.
          </p>
        </div>

        {/* Start New Session button */}
        <button
          onClick={() => navigate("/session-config")}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-4 rounded-2xl text-lg transition mb-8 shadow"
        >
          🎯 Start New Session
        </button>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-teal-700">
              {recentSessions.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Sessions</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-teal-700">—</p>
            <p className="text-xs text-gray-500 mt-1">Avg Score</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-teal-700">—</p>
            <p className="text-xs text-gray-500 mt-1">Top Industry</p>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">
            Recent Sessions
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
              {recentSessions.map((session, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {session.target_role || "Interview Session"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.industry} ·{" "}
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-teal-700">
                    {session.score ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
