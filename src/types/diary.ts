export type EmotionName =
  | "Joy"
  | "Trust"
  | "Fear"
  | "Surprise"
  | "Sadness"
  | "Disgust"
  | "Anger"
  | "Anticipation";

export type EmotionalComplexity = "低" | "中" | "高";

export type EmotionScores = Partial<Record<EmotionName, number>>;

export interface DiaryAnalysis {
  valence: number;
  arousal: number;
  dominance: number;
  emotions: EmotionScores;
  overall_sentiment: number;
  dominant_emotion: EmotionName;
  complexity: EmotionalComplexity;
}

export interface DiaryAnalysisResult {
  formatted_log: string;
  analysis: DiaryAnalysis;
  key_triggers: string[];
  insights: string;
  suggestion: string;
}

export interface DiaryEntry {
  id: string;
  createdAt: string;
  rawText: string;
  result: DiaryAnalysisResult;
}

export interface HeatmapDay {
  date: string;
  day: number;
  count: number;
  intensity: number;
  averageValence: number;
  averageArousal: number;
}

export interface MonthlyReport {
  monthLabel: string;
  entryCount: number;
  averageValence: number;
  averageArousal: number;
  dominantEmotion: EmotionName | "暂无";
  heatmapDays: HeatmapDay[];
  overview: string;
  pattern: string;
  triggers: string[];
  suggestions: string[];
}
