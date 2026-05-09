"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AnalysisResult } from "@/src/components/analysis-result";
import { AppShell } from "@/src/components/app-shell";
import { findDiaryEntry, useDiaryEntries } from "@/src/lib/diary-store";

export default function DiaryDetailPage() {
  const params = useParams<{ id: string }>();
  const entries = useDiaryEntries();
  const entry = findDiaryEntry(entries, params.id);

  return (
    <AppShell>
      {entry ? (
        <>
          <AnalysisResult entry={entry} />
          <div className="composer-actions">
            <Link className="action-btn secondary" href="/history">
              Back to History
            </Link>
            <Link className="action-btn primary" href="/">
              New Entry
            </Link>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>Entry not found.</p>
          <Link className="action-btn secondary" href="/history">Back to History</Link>
        </div>
      )}
    </AppShell>
  );
}
