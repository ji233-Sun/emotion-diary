import type {
  DiaryAnalysisResult,
  DiaryEntry,
  EmotionName,
  EmotionScores,
  HeatmapDay,
  MonthlyReport,
} from "@/src/types/diary";

const EMOTIONS: EmotionName[] = [
  "Joy",
  "Trust",
  "Fear",
  "Surprise",
  "Sadness",
  "Disgust",
  "Anger",
  "Anticipation",
];

const KEYWORDS: Record<
  EmotionName,
  {
    words: string[];
    valence: number;
    arousal: number;
    dominance: number;
  }
> = {
  Joy: {
    words: ["开心", "快乐", "高兴", "满意", "幸福", "顺利", "喜欢", "动力", "很好"],
    valence: 55,
    arousal: 58,
    dominance: 30,
  },
  Trust: {
    words: ["支持", "信任", "安心", "可靠", "陪伴", "理解", "帮助"],
    valence: 38,
    arousal: 36,
    dominance: 20,
  },
  Fear: {
    words: ["害怕", "担心", "焦虑", "紧张", "压力", "不安", "恐惧"],
    valence: -45,
    arousal: 74,
    dominance: -35,
  },
  Surprise: {
    words: ["惊讶", "意外", "突然", "没想到", "变化"],
    valence: 8,
    arousal: 64,
    dominance: -5,
  },
  Sadness: {
    words: ["难过", "失落", "疲惫", "沮丧", "孤独", "委屈", "低落"],
    valence: -55,
    arousal: 34,
    dominance: -30,
  },
  Disgust: {
    words: ["厌烦", "反感", "恶心", "排斥", "不想"],
    valence: -48,
    arousal: 50,
    dominance: -8,
  },
  Anger: {
    words: ["生气", "愤怒", "不公平", "争吵", "被指责", "烦躁", "延期"],
    valence: -42,
    arousal: 72,
    dominance: 28,
  },
  Anticipation: {
    words: ["期待", "计划", "希望", "准备", "目标", "机会"],
    valence: 35,
    arousal: 56,
    dominance: 32,
  },
};

export function createMockDiaryAnalysis(input: string): DiaryAnalysisResult {
  const normalizedInput = input.trim();
  const fallbackText = normalizedInput || "今天的情绪记录较短，暂时缺少可分析的具体事件。";
  const scores = scoreEmotions(fallbackText);
  const dominantEmotion = getDominantEmotion(scores);
  const activeScores = getActiveScores(scores, dominantEmotion);
  const valence = clamp(
    Math.round(weightedAverage(activeScores, (emotion) => KEYWORDS[emotion].valence)),
    -100,
    100,
  );
  const arousal = clamp(
    Math.round(weightedAverage(activeScores, (emotion) => KEYWORDS[emotion].arousal)),
    0,
    100,
  );
  const dominance = clamp(
    Math.round(weightedAverage(activeScores, (emotion) => KEYWORDS[emotion].dominance)),
    -100,
    100,
  );
  const emotions = Object.fromEntries(
    Object.entries(scores).filter(([, score]) => score > 10),
  ) as EmotionScores;

  return {
    formatted_log: createSummary(fallbackText),
    analysis: {
      valence,
      arousal,
      dominance,
      emotions,
      overall_sentiment: valence,
      dominant_emotion: dominantEmotion,
      complexity: Object.keys(emotions).length >= 4 ? "高" : Object.keys(emotions).length >= 2 ? "中" : "低",
    },
    key_triggers: extractTriggers(fallbackText, dominantEmotion),
    insights: createInsight(dominantEmotion, valence, arousal),
    suggestion: createSuggestion(dominantEmotion),
  };
}

export function createMonthlyReport(
  entries: DiaryEntry[],
  currentDate = new Date(),
): MonthlyReport {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.createdAt);
    return entryDate.getFullYear() === year && entryDate.getMonth() === month;
  });
  const averageValence = average(monthEntries.map((entry) => entry.result.analysis.valence));
  const averageArousal = average(monthEntries.map((entry) => entry.result.analysis.arousal));
  const dominantEmotion = getMonthlyDominantEmotion(monthEntries);
  const triggers = getTopTriggers(monthEntries);

  return {
    monthLabel: `${year}年${month + 1}月`,
    entryCount: monthEntries.length,
    averageValence,
    averageArousal,
    dominantEmotion,
    heatmapDays: createHeatmapDays(year, month, monthEntries),
    overview: createMonthlyOverview(monthEntries.length, averageValence, averageArousal, dominantEmotion),
    pattern: createMonthlyPattern(averageValence, averageArousal),
    triggers,
    suggestions: createMonthlySuggestions(averageValence, averageArousal, triggers),
  };
}

function scoreEmotions(input: string): Record<EmotionName, number> {
  const scores = Object.fromEntries(EMOTIONS.map((emotion) => [emotion, 8])) as Record<
    EmotionName,
    number
  >;

  for (const emotion of EMOTIONS) {
    const matches = KEYWORDS[emotion].words.filter((word) => input.includes(word)).length;
    scores[emotion] = clamp(8 + matches * 34, 0, 100);
  }

  if (Object.values(scores).every((score) => score <= 8)) {
    scores.Trust = 22;
    scores.Anticipation = 18;
  }

  return scores;
}

function getDominantEmotion(scores: Record<EmotionName, number>): EmotionName {
  return EMOTIONS.reduce((current, emotion) =>
    scores[emotion] > scores[current] ? emotion : current,
  );
}

function getActiveScores(scores: Record<EmotionName, number>, fallbackEmotion: EmotionName) {
  const activeScores = EMOTIONS.filter((emotion) => scores[emotion] > 10).map((emotion) => ({
    emotion,
    score: scores[emotion],
  }));

  return activeScores.length > 0 ? activeScores : [{ emotion: fallbackEmotion, score: 1 }];
}

function weightedAverage(
  activeScores: Array<{ emotion: EmotionName; score: number }>,
  getValue: (emotion: EmotionName) => number,
) {
  const totalWeight = activeScores.reduce((sum, item) => sum + item.score, 0);
  return activeScores.reduce((sum, item) => sum + getValue(item.emotion) * item.score, 0) / totalWeight;
}

function createSummary(input: string) {
  const trimmed = input.replace(/\s+/g, " ").slice(0, 180);
  return `用户记录了：${trimmed}${input.length > 180 ? "..." : ""}`;
}

function extractTriggers(input: string, dominantEmotion: EmotionName) {
  const triggers = [
    "项目",
    "工作",
    "同事",
    "家人",
    "学习",
    "关系",
    "健康",
    "计划",
    "反馈",
    "延期",
  ].filter((word) => input.includes(word));

  if (triggers.length > 0) {
    return triggers.slice(0, 3);
  }

  return [`${dominantEmotion} 相关事件`, "当天主观感受"];
}

function createInsight(dominantEmotion: EmotionName, valence: number, arousal: number) {
  if (valence < -20 && arousal > 60) {
    return `${dominantEmotion} 较突出，同时情绪能量偏高，可能说明当前事件仍在占用较多注意力。`;
  }

  if (valence > 20) {
    return "整体情绪偏积极，可以留意哪些具体因素带来了支持感和行动感。";
  }

  return "情绪状态较混合，适合先记录事实、感受和下一步可控行动。";
}

function createSuggestion(dominantEmotion: EmotionName) {
  const suggestions: Record<EmotionName, string> = {
    Joy: "可以写下今天最值得保留的一个细节，帮助以后复盘积极来源。",
    Trust: "可以感谢一个提供支持的人，或记录这份支持具体帮助了什么。",
    Fear: "尝试列出一件最小可控行动，把担心拆成今天能处理的一步。",
    Surprise: "可以区分变化中已确定和未确定的部分，降低信息混乱感。",
    Sadness: "给自己留出短时间休息，并记录一个不需要立刻解决的感受。",
    Disgust: "可以写下触发反感的边界，明确下一次想如何表达需求。",
    Anger: "先暂停几分钟，再写下事实、解释和希望被看见的需求。",
    Anticipation: "把期待转成一个可执行的小计划，保持节奏而不过度透支。",
  };

  return suggestions[dominantEmotion];
}

function getMonthlyDominantEmotion(entries: DiaryEntry[]): EmotionName | "暂无" {
  if (entries.length === 0) {
    return "暂无";
  }

  const totals = Object.fromEntries(EMOTIONS.map((emotion) => [emotion, 0])) as Record<
    EmotionName,
    number
  >;

  for (const entry of entries) {
    for (const emotion of EMOTIONS) {
      totals[emotion] += entry.result.analysis.emotions[emotion] ?? 0;
    }
  }

  return getDominantEmotion(totals);
}

function getTopTriggers(entries: DiaryEntry[]) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const trigger of entry.result.key_triggers) {
      counts.set(trigger, (counts.get(trigger) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((first, second) => second[1] - first[1])
    .slice(0, 5)
    .map(([trigger]) => trigger);
}

function createHeatmapDays(year: number, month: number, entries: DiaryEntry[]): HeatmapDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dayEntries = entries.filter((entry) => new Date(entry.createdAt).getDate() === day);
    const averageValence = average(dayEntries.map((entry) => entry.result.analysis.valence));
    const averageArousal = average(dayEntries.map((entry) => entry.result.analysis.arousal));

    return {
      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      count: dayEntries.length,
      intensity: dayEntries.length === 0 ? 0 : clamp(Math.round(averageArousal), 15, 100),
      averageValence,
      averageArousal,
    };
  });
}

function createMonthlyOverview(
  entryCount: number,
  averageValence: number,
  averageArousal: number,
  dominantEmotion: EmotionName | "暂无",
) {
  if (entryCount === 0) {
    return "本月还没有日志，月报会在记录后自动生成。";
  }

  return `本月共记录 ${entryCount} 次，平均效价 ${averageValence}，平均唤醒度 ${averageArousal}，主导情绪为 ${dominantEmotion}。`;
}

function createMonthlyPattern(averageValence: number, averageArousal: number) {
  if (averageArousal >= 65) {
    return "情绪热度偏高，建议关注高压或高兴奋事件后的恢复节奏。";
  }

  if (averageValence < -15) {
    return "整体效价偏低，可以优先识别反复出现的压力源。";
  }

  return "情绪波动处于相对可观察区间，适合继续保持稳定记录。";
}

function createMonthlySuggestions(averageValence: number, averageArousal: number, triggers: string[]) {
  const suggestions = ["每周固定回看一次记录，标出可控因素和不可控因素。"];

  if (averageArousal > 65) {
    suggestions.push("在高唤醒日之后安排低负荷恢复活动。");
  }

  if (averageValence < -15) {
    suggestions.push("为高频触发因素准备一个具体求助或沟通方案。");
  }

  if (triggers.length > 0) {
    suggestions.push(`重点观察「${triggers[0]}」是否持续影响情绪。`);
  }

  return suggestions;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
