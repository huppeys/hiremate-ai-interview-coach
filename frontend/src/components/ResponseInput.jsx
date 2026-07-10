import { useState, useRef } from "react";
import api from "../api/axiosConfig";

export default function ResponseInput({ value, onChange, sessionId }) {
  const [mode, setMode] = useState("text");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function startRecording() {
    setRecordingError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "response.webm");

        setTranscribing(true);
        setRecordingError("");
        try {
          const res = await api.post(`/sessions/${sessionId}/audio`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          onChange(res.data.transcript);
        } catch (err) {
          setRecordingError(
            "Couldn't transcribe your recording. Please try again or switch to Text mode."
          );
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setRecordingError("Microphone access denied. Please allow microphone access and try again.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  function switchMode(newMode) {
    if (recording) stopRecording();
    setMode(newMode);
    onChange("");
    setRecordingError("");
  }

  return (
    <div className="w-full mb-4">
      <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-3 w-fit">
        <button
          type="button"
          onClick={() => switchMode("text")}
          className={`px-4 py-2 text-sm font-medium transition ${
            mode === "text"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          ✏️ Text
        </button>
        <button
          type="button"
          onClick={() => switchMode("voice")}
          className={`px-4 py-2 text-sm font-medium transition ${
            mode === "voice"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          🎙️ Voice
        </button>
      </div>

      {mode === "text" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your response here..."
          rows={6}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      )}

      {mode === "voice" && (
        <div className="w-full">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 rounded-xl py-8 px-4 bg-indigo-50">
            {!recording ? (
              <>
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={transcribing}
                  className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-2xl flex items-center justify-center shadow-lg transition mb-3 disabled:opacity-50"
                >
                  🎙️
                </button>
                <p className="text-sm text-gray-500">
                  {transcribing
                    ? "Transcribing your response..."
                    : value
                    ? "Recording saved. Tap to re-record."
                    : "Tap to start recording"}
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white text-2xl flex items-center justify-center shadow-lg transition mb-3 animate-pulse"
                >
                  ⏹️
                </button>
                <p className="text-sm text-red-500 font-medium">
                  Recording... Tap to stop
                </p>
              </>
            )}
          </div>

          {value && !transcribing && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1">
                Transcript (edit if needed):
              </p>
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
          )}

          {recordingError && (
            <p className="text-red-500 text-xs mt-2">{recordingError}</p>
          )}
        </div>
      )}
    </div>
  );
}