import { describe, expect, it } from "vitest";
import { createDiaryEntry, parseEntriesSnapshot } from "./diary-store";

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
});
