import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ProfileSetup from "./pages/ProfileSetup";
import SessionConfig from "./pages/SessionConfig";
import InterviewSession from "./pages/InterviewSession";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/session-config" element={<SessionConfig />} />
        <Route path="/interview/:sessionId" element={<InterviewSession />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
