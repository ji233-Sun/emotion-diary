import { InfoBlock, Metric } from "@/src/components/ui";
import { formatDate } from "@/src/lib/format";
import type { DiaryEntry } from "@/src/types/diary";

export function AnalysisResult({ entry }: { entry: DiaryEntry }) {
  const { analysis } = entry.result;
  const emotionEntries = Object.entries(analysis.emotions).sort((first, second) => second[1] - first[1]);

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <span className="date">{formatDate(entry.createdAt)}</span>
        <div className="text">{entry.result.formatted_log}</div>
      </div>

      <div className="metric-group">
        <Metric label="Valence" value={analysis.valence} />
        <Metric label="Arousal" value={analysis.arousal} />
        <Metric label="Dominance" value={analysis.dominance} />
      </div>

      <div className="emotion-bars">
        {emotionEntries.map(([emotion, score]) => (
          <div className="emotion-bar-row" key={emotion}>
            <span className="label">{emotion}</span>
            <div className="emotion-bar-track">
              <div className="emotion-bar-fill" style={{ width: `${score}%` }} />
            </div>
            <span className="score">{score}%</span>
          </div>
        ))}
      </div>

      <div>
        <InfoBlock title="Triggers" value={entry.result.key_triggers.join(", ")} />
        <InfoBlock title="Complexity" value={analysis.complexity} />
        <InfoBlock title="Insights" value={entry.result.insights} />
        <InfoBlock title="Reflection" value={entry.result.suggestion} />
      </div>
    </div>
  );
}
