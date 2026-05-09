"use client";

import Link from "next/link";
import { AppShell } from "@/src/components/app-shell";
import { formatDate } from "@/src/lib/format";
import { useDiaryEntries } from "@/src/lib/diary-store";

export default function HistoryPage() {
  const entries = useDiaryEntries();

  return (
    <AppShell>
      {entries.length > 0 ? (
        <div className="history-list">
          {entries.map((entry) => (
            <Link className="history-item" href={`/history/${entry.id}`} key={entry.id}>
              <span className="date">{formatDate(entry.createdAt).split(' ')[0]}</span>
              <span className="emotion">{entry.result.analysis.dominant_emotion}</span>
              <span className="preview">{entry.result.formatted_log}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No entries yet.</p>
          <Link className="action-btn secondary" href="/">Write something</Link>
        </div>
      )}
    </AppShell>
  );
}
