import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function Landing() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking"); // "checking" | "connected" | "error"

  useEffect(() => {
    async function checkHealth() {
      try {
        await api.get("/health");
        setStatus("connected");
      } catch (err) {
        setStatus("error");
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-teal-800 mb-2">HireMate</h1>
        <p className="text-gray-500 mb-8">AI Interview Coach</p>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-teal-50 rounded-xl p-3">
            <p className="text-2xl mb-1">🎯</p>
            <p className="text-xs text-gray-600">Tailored Questions</p>
          </div>
          <div className="bg-teal-50 rounded-xl p-3">
            <p className="text-2xl mb-1">💡</p>
            <p className="text-xs text-gray-600">AI Feedback</p>
          </div>
          <div className="bg-teal-50 rounded-xl p-3">
            <p className="text-2xl mb-1">📈</p>
            <p className="text-xs text-gray-600">Track Progress</p>
          </div>
        </div>

        {/* Backend status indicator */}
        <div className="flex items-center justify-center gap-2 mb-6 text-sm">
          {status === "checking" && (
            <>
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span className="text-yellow-600">Connecting to server...</span>
            </>
          )}
          {status === "connected" && (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-green-600">Server connected</span>
            </>
          )}
          {status === "error" && (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-red-500">Unable to reach server</span>
            </>
          )}
        </div>

        <button
          onClick={() => navigate("/login")}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-medium py-3 rounded-xl transition mb-3"
        >
          Log In
        </button>
        <button
          onClick={() => navigate("/signup")}
          className="w-full border border-teal-700 text-teal-700 hover:bg-teal-50 font-medium py-3 rounded-xl transition"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
