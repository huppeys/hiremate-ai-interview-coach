import { useNavigate } from "react-router-dom";

export default function AppNav() {
  const navigate = useNavigate();
  return (
    <nav className="bg-white shadow-sm px-6 py-3 flex items-center justify-between print:hidden">
      <button
        onClick={() => navigate("/dashboard")}
        className="text-lg font-bold text-teal-800 hover:text-teal-600 transition"
      >
        HireMate
      </button>
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-1.5 rounded-lg transition"
      >
        ← My Progress
      </button>
    </nav>
  );
}
