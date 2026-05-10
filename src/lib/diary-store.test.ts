import { describe, expect, it } from "vitest";
import { createDiaryEntry, parseEntriesSnapshot } from "./diary-store";
import type { DiaryAnalysisResult } from "@/src/types/diary";

describe("parseEntriesSnapshot", () => {
  it("returns parsed diary entries from valid JSON", () => {
    const entry = createDiaryEntry("今天很开心");

    expect(parseEntriesSnapshot(JSON.stringify([entry]))).toEqual([entry]);
  });

  it("returns an empty list when local storage contains invalid JSON", () => {
    expect(parseEntriesSnapshot("not json")).toEqual([]);
  });
});

describe("createDiaryEntry", () => {
  it("creates an analyzed diary entry for the provided text", () => {
    const entry = createDiaryEntry("今天收到了很好的反馈，感觉开心。");

    expect(entry.rawText).toBe("今天收到了很好的反馈，感觉开心。");
    expect(entry.id).toBeTruthy();
    expect(entry.createdAt).toBeTruthy();
    expect(entry.result.analysis.dominant_emotion).toBe("Joy");
  });

  it("uses a provided AI analysis result when saving an entry", () => {
    const analysis: DiaryAnalysisResult = {
      formatted_log: "用户记录了项目延期后的焦虑。",
      analysis: {
        valence: -40,
        arousal: 70,
        dominance: -20,
        emotions: { Fear: 72 },
        overall_sentiment: -40,
        dominant_emotion: "Fear",
        complexity: "低",
      },
      key_triggers: ["项目延期"],
      insights: "焦虑集中在交付不确定性。",
      suggestion: "明确下一步可控行动。",
    };

    const entry = createDiaryEntry("今天项目延期，我很焦虑。", analysis);

    expect(entry.rawText).toBe("今天项目延期，我很焦虑。");
    expect(entry.result).toBe(analysis);
  });
});
