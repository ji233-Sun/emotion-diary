import { describe, expect, it } from "vitest";
import {
  createMockDiaryAnalysis,
  createMonthlyReport,
} from "./analysis";
import type { DiaryEntry } from "@/src/types/diary";

describe("createMockDiaryAnalysis", () => {
  it("returns the diary analysis contract required by the README", () => {
    const result = createMockDiaryAnalysis("今天项目上线延期，我有点焦虑，但同事也给了我支持。");

    expect(result.formatted_log).toContain("项目上线延期");
    expect(result.analysis.valence).toBeGreaterThanOrEqual(-100);
    expect(result.analysis.valence).toBeLessThanOrEqual(100);
    expect(result.analysis.arousal).toBeGreaterThanOrEqual(0);
    expect(result.analysis.arousal).toBeLessThanOrEqual(100);
    expect(result.analysis.dominant_emotion).toBeTruthy();
    expect(result.key_triggers.length).toBeGreaterThan(0);
    expect(result.insights).toBeTruthy();
    expect(result.suggestion).toBeTruthy();
  });

  it("marks clearly positive input as positive valence", () => {
    const result = createMockDiaryAnalysis("今天收到了很好的反馈，感觉开心、期待，也很有动力。");

    expect(result.analysis.valence).toBeGreaterThan(0);
    expect(result.analysis.dominant_emotion).toBe("Joy");
  });
});

describe("createMonthlyReport", () => {
  it("aggregates diary entries into monthly metrics and heatmap days", () => {
    const entries: DiaryEntry[] = [
      {
        id: "1",
        createdAt: "2026-05-01T10:00:00.000Z",
        rawText: "开心",
        result: createMockDiaryAnalysis("今天很开心"),
      },
      {
        id: "2",
        createdAt: "2026-05-02T10:00:00.000Z",
        rawText: "焦虑",
        result: createMockDiaryAnalysis("今天焦虑又疲惫"),
      },
    ];

    const report = createMonthlyReport(entries, new Date("2026-05-09T00:00:00.000Z"));

    expect(report.monthLabel).toBe("2026年5月");
    expect(report.entryCount).toBe(2);
    expect(report.averageValence).toBeTypeOf("number");
    expect(report.averageArousal).toBeTypeOf("number");
    expect(report.dominantEmotion).toBeTruthy();
    expect(report.heatmapDays).toHaveLength(31);
    expect(report.heatmapDays.some((day) => day.count > 0)).toBe(true);
  });
});
