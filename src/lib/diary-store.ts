"use client";

import { useMemo, useSyncExternalStore } from "react";
import { createMockDiaryAnalysis } from "./analysis";
import type { DiaryAnalysisResult, DiaryEntry } from "@/src/types/diary";

export const DIARY_STORAGE_KEY = "emodiary.entries.v1";
const DIARY_STORAGE_EVENT = "emodiary:entries";

export function useDiaryEntries() {
  const snapshot = useSyncExternalStore(
    subscribeToEntryStore,
    getEntryStoreSnapshot,
    getServerEntryStoreSnapshot,
  );

  return useMemo(() => parseEntriesSnapshot(snapshot), [snapshot]);
}

export function createDiaryEntry(rawText: string, analysisResult?: DiaryAnalysisResult): DiaryEntry {
  const trimmedText = rawText.trim();

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    rawText: trimmedText,
    result: analysisResult ?? createMockDiaryAnalysis(trimmedText),
  };
}

export function findDiaryEntry(entries: DiaryEntry[], entryId: string) {
  return entries.find((entry) => entry.id === entryId);
}

export function writeStoredEntries(entries: DiaryEntry[]) {
  window.localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(DIARY_STORAGE_EVENT));
}

export function parseEntriesSnapshot(snapshot: string): DiaryEntry[] {
  try {
    const parsedEntries = JSON.parse(snapshot);

    return Array.isArray(parsedEntries) ? (parsedEntries as DiaryEntry[]) : [];
  } catch {
    return [];
  }
}

function subscribeToEntryStore(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(DIARY_STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(DIARY_STORAGE_EVENT, onStoreChange);
  };
}

function getEntryStoreSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(DIARY_STORAGE_KEY) ?? "[]";
}

function getServerEntryStoreSnapshot() {
  return "[]";
}
