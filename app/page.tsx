"use client";

import {
  Activity,
  BarChart3,
  CalendarDays,
  History,
  Mic,
  Save,
  Sparkles,
} from "lucide-react";
import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import { createMockDiaryAnalysis, createMonthlyReport } from "@/src/lib/analysis";
import type { DiaryEntry, EmotionName } from "@/src/types/diary";

const STORAGE_KEY = "emodiary.entries.v1";
const STORAGE_EVENT = "emodiary:entries";

const SAMPLE_TEXT =
  "今天项目上线延期，我有点焦虑，也担心影响团队进度。不过同事给了我支持，我准备明天先拆出最小可交付部分。";

const EMOTION_LABELS: Record<EmotionName, string> = {
  Joy: "喜悦",
  Trust: "信任",
  Fear: "恐惧",
  Surprise: "惊讶",
  Sadness: "悲伤",
  Disgust: "厌恶",
  Anger: "愤怒",
  Anticipation: "期待",
};

export default function Home() {
  const [rawText, setRawText] = useState(SAMPLE_TEXT);
  const entriesSnapshot = useSyncExternalStore(
    subscribeToEntryStore,
    getEntryStoreSnapshot,
    getServerEntryStoreSnapshot,
  );
  const entries = useMemo(() => parseEntriesSnapshot(entriesSnapshot), [entriesSnapshot]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const activeEntry = entries.find((entry) => entry.id === activeEntryId) ?? entries[0];
  const monthlyReport = useMemo(() => createMonthlyReport(entries), [entries]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedText = rawText.trim();
    if (!trimmedText) {
      return;
    }

    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      rawText: trimmedText,
      result: createMockDiaryAnalysis(trimmedText),
    };

    writeStoredEntries([entry, ...entries]);
    setActiveEntryId(entry.id);
    setRawText("");
  }

  function handleMockRecord() {
    setIsRecording(true);
    window.setTimeout(() => {
      setRawText(SAMPLE_TEXT);
      setIsRecording(false);
    }, 650);
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} />
            AI Mock MVP
          </span>
          <h1>Emodiary 绪语</h1>
          <p>
            记录当天事件与情绪，生成结构化日志、情感维度分析、历史报告和月度情绪热力度。
          </p>
        </div>
        <div className="hero-panel" aria-label="Monthly snapshot">
          <span>本月记录</span>
          <strong>{monthlyReport.entryCount}</strong>
          <small>{monthlyReport.monthLabel}</small>
        </div>
      </section>

      <section className="workspace">
        <form className="composer panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <div>
              <h2>今日日志</h2>
              <p>语音输入暂用 Mock 转写，AI 分析暂用本地规则替代。</p>
            </div>
            <button
              className={isRecording ? "icon-button is-active" : "icon-button"}
              type="button"
              onClick={handleMockRecord}
              aria-label="Mock voice input"
              title="Mock voice input"
            >
              <Mic size={20} />
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="写下今天发生的事情、感受、想法或身体状态..."
          />
          <div className="composer-actions">
            <span>{isRecording ? "正在生成 Mock 转写..." : "本地保存到浏览器 LocalStorage"}</span>
            <button type="submit" disabled={!rawText.trim()}>
              <Save size={18} />
              保存并分析
            </button>
          </div>
        </form>

        <section className="panel result-panel">
          <div className="panel-heading">
            <div>
              <h2>单次分析</h2>
              <p>符合 README 中的 JSON 输出结构。</p>
            </div>
            <Activity size={22} />
          </div>

          {activeEntry ? (
            <AnalysisResult entry={activeEntry} />
          ) : (
            <EmptyState title="暂无分析" description="保存第一条日志后会显示 Mock AI 结果。" />
          )}
        </section>
      </section>

      <section className="dashboard">
        <section className="panel history-panel">
          <div className="panel-heading">
            <div>
              <h2>History</h2>
              <p>查看历史日志与对应报告。</p>
            </div>
            <History size={22} />
          </div>

          {entries.length > 0 ? (
            <div className="history-list">
              {entries.map((entry) => (
                <button
                  className={entry.id === activeEntry?.id ? "history-item is-selected" : "history-item"}
                  key={entry.id}
                  type="button"
                  onClick={() => setActiveEntryId(entry.id)}
                >
                  <span>{formatDate(entry.createdAt)}</span>
                  <strong>{entry.result.analysis.dominant_emotion}</strong>
                  <small>{entry.result.formatted_log}</small>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无历史" description="历史记录会在本机浏览器中保留。" />
          )}
        </section>

        <section className="panel monthly-panel">
          <div className="panel-heading">
            <div>
              <h2>月报</h2>
              <p>月情感热力度与聚合洞察。</p>
            </div>
            <CalendarDays size={22} />
          </div>

          <MonthlyReportCard entries={entries} />
        </section>
      </section>
    </main>
  );
}

function subscribeToEntryStore(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
  };
}

function getEntryStoreSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function getServerEntryStoreSnapshot() {
  return "[]";
}

function parseEntriesSnapshot(snapshot: string): DiaryEntry[] {
  try {
    return JSON.parse(snapshot) as DiaryEntry[];
  } catch {
    return [];
  }
}

function writeStoredEntries(entries: DiaryEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function AnalysisResult({ entry }: { entry: DiaryEntry }) {
  const { analysis } = entry.result;
  const emotionEntries = Object.entries(analysis.emotions).sort((first, second) => second[1] - first[1]);

  return (
    <div className="analysis">
      <div className="summary-card">
        <span>{formatDate(entry.createdAt)}</span>
        <p>{entry.result.formatted_log}</p>
      </div>

      <div className="metric-grid">
        <Metric label="Valence" value={analysis.valence} range="-100 / +100" />
        <Metric label="Arousal" value={analysis.arousal} range="0 / 100" />
        <Metric label="Dominance" value={analysis.dominance} range="-100 / +100" />
      </div>

      <div className="emotion-stack">
        {emotionEntries.map(([emotion, score]) => (
          <div className="emotion-row" key={emotion}>
            <span>
              {emotion} · {EMOTION_LABELS[emotion as EmotionName]}
            </span>
            <div className="bar">
              <i style={{ width: `${score}%` }} />
            </div>
            <strong>{score}%</strong>
          </div>
        ))}
      </div>

      <div className="insight-grid">
        <InfoBlock title="触发因素" value={entry.result.key_triggers.join(" / ")} />
        <InfoBlock title="复杂度" value={analysis.complexity} />
        <InfoBlock title="支持性洞察" value={entry.result.insights} />
        <InfoBlock title="反思建议" value={entry.result.suggestion} />
      </div>
    </div>
  );
}

function MonthlyReportCard({ entries }: { entries: DiaryEntry[] }) {
  const report = createMonthlyReport(entries);
  const hotDays = report.heatmapDays.filter((day) => day.count > 0);

  return (
    <div className="monthly-report">
      <div className="report-stats">
        <Metric label="平均效价" value={report.averageValence} range="-100 / +100" />
        <Metric label="平均唤醒" value={report.averageArousal} range="0 / 100" />
        <div className="stat-card">
          <span>主导情绪</span>
          <strong>{report.dominantEmotion}</strong>
          <small>{report.dominantEmotion === "暂无" ? "等待记录" : "Plutchik"}</small>
        </div>
      </div>

      <div className="heatmap" aria-label="Monthly emotion heatmap">
        {report.heatmapDays.map((day) => (
          <span
            aria-label={`${day.date}: ${day.count} entries`}
            className="heatmap-day"
            key={day.date}
            style={{
              opacity: day.count === 0 ? 0.22 : 0.45 + day.intensity / 180,
              background: day.averageValence < 0 ? "#d96b6b" : "#4f9f7f",
            }}
            title={`${day.date} · ${day.count} 条 · Valence ${day.averageValence}`}
          >
            {day.day}
          </span>
        ))}
      </div>

      <div className="report-copy">
        <InfoBlock title="总体概览" value={report.overview} />
        <InfoBlock title="热度模式" value={report.pattern} />
        <InfoBlock
          title="主要触发因素"
          value={report.triggers.length > 0 ? report.triggers.join(" / ") : "暂无"}
        />
        <div className="info-block">
          <span>积极变化与建议</span>
          <ul>
            {report.suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </div>
      </div>

      {hotDays.length > 0 && (
        <div className="trend-note">
          <BarChart3 size={18} />
          <span>已检测到 {hotDays.length} 个有记录日期，颜色表示平均效价，透明度表示情绪热度。</span>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, range }: { label: string; value: number; range: string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{range}</small>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="info-block">
      <span>{title}</span>
      <p>{value}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
