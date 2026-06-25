import { useState, useRef, useEffect } from "react";

const ROLES = [
  "Software Engineer Intern",
  "Software Engineer",
  "Senior Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer",
  "iOS Developer",
  "Android Developer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Cloud Engineer",
  "Data Scientist",
  "Data Analyst",
  "Data Engineer",
  "Machine Learning Engineer",
  "AI Engineer",
  "Cybersecurity Analyst",
  "Security Engineer",
  "QA Engineer",
  "Product Manager",
  "Product Designer",
  "UX Designer",
  "UI Designer",
  "UX Researcher",
  "Business Analyst",
  "Systems Analyst",
  "IT Support Specialist",
  "Network Engineer",
  "Database Administrator",
  "Embedded Systems Engineer",
  "Firmware Engineer",
  "Robotics Engineer",
  "Game Developer",
  "Blockchain Developer",
  "Solutions Architect",
  "Technical Program Manager",
  "Engineering Manager",
  "Marketing Analyst",
  "Digital Marketing Specialist",
  "Content Strategist",
  "SEO Specialist",
  "Social Media Manager",
  "Financial Analyst",
  "Investment Banking Analyst",
  "Accounting Intern",
  "Operations Analyst",
  "Supply Chain Analyst",
  "Human Resources Intern",
  "Recruiter",
  "Healthcare Data Analyst",
  "Clinical Research Associate",
  "Biomedical Engineer",
  "Pharmaceutical Sales Representative",
  "Registered Nurse",
  "Physical Therapist",
  "Consultant",
  "Management Consultant",
  "Sales Engineer",
  "Account Executive",
];

export default function RoleDropdown({ value, onChange, error }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = ROLES.filter((role) =>
    role.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(role) {
    setQuery(role);
    onChange(role);
    setOpen(false);
  }

  function handleInputChange(e) {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Software Engineer Intern"
        className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
      />

      {open && filtered.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {filtered.map((role) => (
            <li
              key={role}
              onClick={() => handleSelect(role)}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
            >
              {role}
            </li>
          ))}
        </ul>
      )}

      {open && filtered.length === 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 px-3 py-2 text-sm text-gray-400">
          No matching roles — you can type a custom role.
        </div>
      )}
    </div>
  );
}
