"use client";

import { Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AppShell } from "@/src/components/app-shell";
import { createDiaryEntry, useDiaryEntries, writeStoredEntries } from "@/src/lib/diary-store";

export default function Home() {
  const router = useRouter();
  const entries = useDiaryEntries();
  const [rawText, setRawText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedText = rawText.trim();
    if (!trimmedText) {
      return;
    }

    const entry = createDiaryEntry(trimmedText);
    writeStoredEntries([entry, ...entries]);
    setRawText("");
    router.push(`/history/${entry.id}`);
  }

  function handleMockRecord() {
    setIsRecording(true);
    window.setTimeout(() => {
      setRawText("今天项目上线延期，我有点焦虑，也担心影响团队进度。不过同事给了我支持，我准备明天先拆出最小可交付部分。");
      setIsRecording(false);
    }, 650);
  }

  return (
    <AppShell>
      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="What's on your mind?"
          autoFocus
        />
        <div className="composer-actions">
          <button
            className={`action-btn secondary ${isRecording ? "active" : ""}`}
            type="button"
            onClick={handleMockRecord}
            aria-label="Voice input"
          >
            <Mic size={18} />
          </button>
          <button className="action-btn primary" type="submit" disabled={!rawText.trim() || isRecording}>
            Save
          </button>
        </div>
      </form>
    </AppShell>
  );
}
