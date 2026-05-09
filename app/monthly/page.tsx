"use client";

import { AppShell } from "@/src/components/app-shell";
import { MonthlyReportCard } from "@/src/components/monthly-report-card";
import { useDiaryEntries } from "@/src/lib/diary-store";

export default function MonthlyPage() {
  const entries = useDiaryEntries();

  return (
    <AppShell>
      {entries.length > 0 ? (
        <MonthlyReportCard entries={entries} />
      ) : (
        <div className="empty-state">
          <p>Not enough data for a report.</p>
        </div>
      )}
    </AppShell>
  );
}
