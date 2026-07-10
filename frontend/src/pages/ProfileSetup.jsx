import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

const EDUCATION_LEVELS = [
  "High School",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Bootcamp / Self-taught",
  "Other",
];

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Business",
  "Education",
  "Engineering",
  "Marketing",
  "Other",
];

export default function ProfileSetup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    educationLevel: "",
    targetRole: "",
    targetIndustry: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!formData.educationLevel) {
      newErrors.educationLevel = "Please select your education level.";
    }

    if (!formData.targetRole.trim()) {
      newErrors.targetRole = "Target role is required.";
    }

    if (!formData.targetIndustry) {
      newErrors.targetIndustry = "Please select your target industry.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.post("/profile/setup", formData);
      navigate("/dashboard");
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Unable to save profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-teal-800 mb-1">
          Set up your profile
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          This helps us tailor your interview practice.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                errors.name ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Education Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Education Level
            </label>
            <select
              name="educationLevel"
              value={formData.educationLevel}
              onChange={handleChange}
              className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white ${
                errors.educationLevel ? "border-red-400" : "border-gray-300"
              }`}
            >
              <option value="">Select education level</option>
              {EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            {errors.educationLevel && (
              <p className="text-red-500 text-xs mt-1">{errors.educationLevel}</p>
            )}
          </div>

          {/* Target Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Role
            </label>
            <input
              type="text"
              name="targetRole"
              value={formData.targetRole}
              onChange={handleChange}
              placeholder="e.g. Software Engineer Intern"
              className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                errors.targetRole ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.targetRole && (
              <p className="text-red-500 text-xs mt-1">{errors.targetRole}</p>
            )}
          </div>

          {/* Target Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Industry
            </label>
            <select
              name="targetIndustry"
              value={formData.targetIndustry}
              onChange={handleChange}
              className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white ${
                errors.targetIndustry ? "border-red-400" : "border-gray-300"
              }`}
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            {errors.targetIndustry && (
              <p className="text-red-500 text-xs mt-1">{errors.targetIndustry}</p>
            )}
          </div>

          {serverError && (
            <p className="text-red-500 text-sm text-center">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition"
          >
            {isSubmitting ? "Saving..." : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
