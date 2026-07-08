import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import RoleDropdown from "../components/RoleDropdown";

const INTERVIEW_TYPES = [
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "mixed", label: "Mixed" },
];

const EXPERIENCE_LEVELS = [
  { value: "intern", label: "Intern" },
  { value: "entry", label: "Entry-Level" },
  { value: "mid", label: "Mid-Level" },
];

export default function SessionConfig() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [config, setConfig] = useState({
    interviewType: "",
    role: "",
    industry: "",
    experienceLevel: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(name, value) {
    setConfig((prev) => ({ ...prev, [name]: value }));
  }

  function validateStep() {
    const newErrors = {};

    if (step === 1 && !config.interviewType) {
      newErrors.interviewType = "Please select an interview type.";
    }

    if (step === 2) {
      if (!config.role.trim()) newErrors.role = "Target role is required.";
      if (!config.industry.trim()) newErrors.industry = "Industry is required.";
    }

    if (step === 3 && !config.experienceLevel) {
      newErrors.experienceLevel = "Please select your experience level.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, 3));
  }

  function handleBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }

async function handleStartSession() {
    if (!validateStep()) return;

    setServerError("");
    setIsSubmitting(true);
    try {
      const res = await api.post("/questions/generate", {
        interviewType: config.interviewType,
        role: config.role,
        industry: config.industry,
        experienceLevel: config.experienceLevel,
      });
      const sessionId = res.data.questions.sessionId;
      navigate(`/interview/${sessionId}`);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          "Unable to start session. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  ${
                    n === step
                      ? "bg-indigo-600 text-white"
                      : n < step
                      ? "bg-indigo-200 text-indigo-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
              >
                {n}
              </div>
              {n < 3 && (
                <div
                  className={`flex-1 h-1 mx-1 rounded ${
                    n < step ? "bg-indigo-300" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-indigo-700 mb-1">
              Interview Type
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              What kind of questions would you like to practice?
            </p>

            <div className="grid grid-cols-3 gap-3">
              {INTERVIEW_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => updateField("interviewType", t.value)}
                  className={`py-4 rounded-xl border text-sm font-medium transition
                    ${
                      config.interviewType === t.value
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-600 hover:border-indigo-300"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {errors.interviewType && (
              <p className="text-red-500 text-xs mt-2">{errors.interviewType}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-indigo-700 mb-1">
              Role &amp; Industry
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Tell us what you're preparing for.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Role
                </label>
                <RoleDropdown
                  value={config.role}
                  onChange={(val) => updateField("role", val)}
                  error={errors.role}
                />
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={config.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
                  placeholder="e.g. Technology, Healthcare, Business"
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                    errors.industry ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.industry && (
                  <p className="text-red-500 text-xs mt-1">{errors.industry}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-indigo-700 mb-1">
              Experience Level
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              This helps us calibrate question difficulty.
            </p>

            <div className="space-y-2">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <label
                  key={lvl.value}
                  className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition
                    ${
                      config.experienceLevel === lvl.value
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-300 hover:border-indigo-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="experienceLevel"
                    value={lvl.value}
                    checked={config.experienceLevel === lvl.value}
                    onChange={(e) => updateField("experienceLevel", e.target.value)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {lvl.label}
                  </span>
                </label>
              ))}
            </div>
            {errors.experienceLevel && (
              <p className="text-red-500 text-xs mt-2">{errors.experienceLevel}</p>
            )}
          </div>
        )}

        {serverError && (
          <p className="text-red-500 text-sm text-center mt-4">{serverError}</p>
        )}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 disabled:opacity-0"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartSession}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition"
            >
              {isSubmitting ? "Starting..." : "Start Session"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
