import { createMonthlyReport } from "@/src/lib/analysis";
import { InfoBlock, Metric } from "@/src/components/ui";
import type { DiaryEntry } from "@/src/types/diary";

export function MonthlyReportCard({ entries }: { entries: DiaryEntry[] }) {
  const report = createMonthlyReport(entries);

  return (
    <div className="monthly-report-container">
      <div className="metric-group">
        <Metric label="Avg Valence" value={report.averageValence} />
        <Metric label="Avg Arousal" value={report.averageArousal} />
        <Metric label="Dominant" value={report.dominantEmotion} />
      </div>

      <div className="heatmap" aria-label="Monthly heatmap">
        {report.heatmapDays.map((day) => (
          <span
            className="heatmap-day"
            key={day.date}
            data-active={day.count > 0}
            title={`${day.date} - ${day.count} entries`}
          >
            {day.day}
          </span>
        ))}
      </div>

      <div style={{ marginTop: "40px", display: "flex", flexDirection: "column" }}>
        <InfoBlock title="Overview" value={report.overview} />
        <InfoBlock title="Pattern" value={report.pattern} />
        <InfoBlock
          title="Triggers"
          value={report.triggers.length > 0 ? report.triggers.join(", ") : "None"}
        />
        <div className="info-section">
          <h3 className="title">Suggestions</h3>
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.95rem", lineHeight: 1.6 }}>
            {report.suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
