"use client";

import { Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { AppShell } from "@/src/components/app-shell";
import { createDiaryEntry, useDiaryEntries, writeStoredEntries } from "@/src/lib/diary-store";
import type { DiaryAnalysisResult } from "@/src/types/diary";

export default function Home() {
  const router = useRouter();
  const entries = useDiaryEntries();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [rawText, setRawText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedText = rawText.trim();
    if (!trimmedText || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setStatusMessage("Analyzing with DeepSeek...");

    try {
      const analysisResult = await requestDiaryAnalysis(trimmedText);
      const entry = createDiaryEntry(trimmedText, analysisResult);
      writeStoredEntries([entry, ...entries]);
      setRawText("");
      router.push(`/history/${entry.id}`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setStatusMessage("");
    }
  }

  async function handleVoiceInput() {
    setErrorMessage("");

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setStatusMessage("Transcribing with Qwen3-ASR...");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErrorMessage("This browser does not support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        setIsRecording(false);
        stopTracks(stream);
        void transcribeRecording(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      };
      recorder.onerror = () => {
        setIsRecording(false);
        stopTracks(stream);
        setStatusMessage("");
        setErrorMessage("Audio recording failed.");
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setStatusMessage("Recording... click the mic again to stop.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setStatusMessage("");
    }
  }

  async function transcribeRecording(audio: Blob) {
    try {
      const text = await requestTranscription(audio);
      setRawText((currentText) => [currentText.trim(), text].filter(Boolean).join("\n"));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setStatusMessage("");
    }
  }

  return (
    <AppShell>
      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="What's on your mind?"
          disabled={isSubmitting}
          autoFocus
        />
        {(statusMessage || errorMessage) && (
          <div className={`status-toast ${errorMessage ? "error" : ""}`}>
            {!errorMessage && <span className="status-indicator"></span>}
            {errorMessage || statusMessage}
          </div>
        )}
        <div className="composer-actions">
          <button
            className={`action-btn secondary ${isRecording ? "active" : ""}`}
            type="button"
            onClick={handleVoiceInput}
            disabled={isSubmitting}
            aria-label="Voice input"
          >
            <Mic size={18} />
          </button>
          <button className="action-btn primary" type="submit" disabled={!rawText.trim() || isRecording || isSubmitting}>
            {isSubmitting ? "Analyzing" : "Save"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

async function requestDiaryAnalysis(text: string) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const data = (await response.json()) as { result?: DiaryAnalysisResult; error?: string };

  if (!response.ok || !data.result) {
    throw new Error(data.error ?? "Failed to analyze diary text.");
  }

  return data.result;
}

async function requestTranscription(audio: Blob) {
  const formData = new FormData();
  formData.set("audio", audio, "recording.webm");

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as { text?: string; error?: string };

  if (!response.ok || !data.text) {
    throw new Error(data.error ?? "Failed to transcribe audio.");
  }

  return data.text;
}

function stopTracks(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}
