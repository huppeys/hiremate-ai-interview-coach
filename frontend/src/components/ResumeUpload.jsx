import { useState, useRef } from "react";

export default function ResumeUpload({ onFileSelect }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file only.");
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  function handleChange(e) {
    handleFile(e.target.files[0]);
  }

  function handleRemove() {
    setSelectedFile(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-700 mb-2">
        Resume Upload <span className="text-gray-400">(Optional)</span>
      </p>

      {!selectedFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            dragOver
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
          }`}
        >
          <p className="text-2xl mb-2">📄</p>
          <p className="text-sm text-gray-500">
            Drag & drop your resume here
          </p>
          <p className="text-xs text-gray-400 mt-1">or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">PDF only</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between border border-green-300 bg-green-50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600">📄</span>
            <span className="text-sm text-green-700 font-medium">
              {selectedFile.name}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
