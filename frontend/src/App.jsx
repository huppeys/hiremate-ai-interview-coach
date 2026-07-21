import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import SessionConfig from "./pages/SessionConfig";
import InterviewSession from "./pages/InterviewSession";
import SessionFeedback from "./pages/SessionFeedback";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/session-config" element={<SessionConfig />} />
        <Route path="/interview/:sessionId" element={<InterviewSession />} />
        <Route path="/feedback/:sessionId" element={<SessionFeedback />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
