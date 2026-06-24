import { useState, useRef } from "react";

export default function ResponseInput({ value, onChange }) {
  const [mode, setMode] = useState("text");
  const [recording, setRecording] = useState(false);
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

      mediaRecorder.onstop = () => {
        onChange("[Voice response recorded — transcription pending backend integration]");
        stream.getTracks().forEach((track) => track.stop());
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
                  className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-2xl flex items-center justify-center shadow-lg transition mb-3"
                >
                  🎙️
                </button>
                <p className="text-sm text-gray-500">
                  {value ? "Recording saved. Tap to re-record." : "Tap to start recording"}
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

          {value && (
            <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Recorded response:</p>
              <p className="text-sm text-gray-700">{value}</p>
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
