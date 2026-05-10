import type { DiaryAnalysisResult, EmotionalComplexity, EmotionName } from "@/src/types/diary";

const BAILIAN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEEPSEEK_MODEL = "deepseek-v4-flash";
const QWEN_ASR_MODEL = "qwen3-asr-flash";

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
const COMPLEXITIES: EmotionalComplexity[] = ["低", "中", "高"];

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface BailianOptions {
  apiKey?: string;
  baseUrl?: string;
  fetcher?: Fetcher;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  output?: {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };
  error?: {
    message?: string;
  };
  message?: string;
}

export async function analyzeDiaryText(input: string, options: BailianOptions = {}) {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    throw new Error("Diary text is required.");
  }

  const data = await postChatCompletion(
    {
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: "system",
          content: ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `用户输入（语音转文字）：\n${trimmedInput}`,
        },
      ],
      stream: false,
      enable_thinking: false,
    },
    options,
  );
  const content = extractTextContent(data);
  const parsedJson = parseJsonObject(content);

  return normalizeDiaryAnalysis(parsedJson);
}

export async function transcribeAudio(audioDataUrl: string, options: BailianOptions = {}) {
  if (!audioDataUrl.startsWith("data:")) {
    throw new Error("Audio input must be a Data URL.");
  }

  const data = await postChatCompletion(
    {
      model: QWEN_ASR_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: {
                data: audioDataUrl,
              },
            },
          ],
        },
      ],
      stream: false,
      asr_options: {
        enable_itn: true,
      },
    },
    options,
  );
  const text = extractTextContent(data).trim();

  if (!text) {
    throw new Error("Qwen ASR returned an empty transcript.");
  }

  return text;
}

export function getBailianConfig() {
  return {
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseUrl: process.env.DASHSCOPE_BASE_URL ?? BAILIAN_BASE_URL,
  };
}

async function postChatCompletion(payload: unknown, options: BailianOptions) {
  const apiKey = options.apiKey ?? getBailianConfig().apiKey;
  if (!apiKey) {
    throw new Error("Missing DASHSCOPE_API_KEY environment variable.");
  }

  const baseUrl = stripTrailingSlash(options.baseUrl ?? getBailianConfig().baseUrl);
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = (await response.json().catch(() => ({}))) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(extractProviderError(data) ?? `Bailian request failed with HTTP ${response.status}.`);
  }

  return data;
}

function extractTextContent(data: ChatCompletionResponse) {
  const content = data.choices?.[0]?.message?.content ?? data.output?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (isRecord(item) && typeof item.text === "string") {
          return item.text;
        }

        return "";
      })
      .join("");
  }

  throw new Error("Bailian response did not include text content.");
}

function parseJsonObject(content: string) {
  const jsonText = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(jsonText) as unknown;
  } catch {
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(jsonText.slice(start, end + 1)) as unknown;
    }

    throw new Error("DeepSeek did not return valid JSON analysis.");
  }
}

function normalizeDiaryAnalysis(value: unknown): DiaryAnalysisResult {
  if (!isRecord(value) || !isRecord(value.analysis)) {
    throw new Error("DeepSeek analysis is missing required fields.");
  }

  const analysis = value.analysis;
  const dominantEmotion = normalizeEmotion(analysis.dominant_emotion);

  return {
    formatted_log: normalizeText(value.formatted_log, "formatted_log"),
    analysis: {
      valence: clampNumber(analysis.valence, -100, 100, "analysis.valence"),
      arousal: clampNumber(analysis.arousal, 0, 100, "analysis.arousal"),
      dominance: clampNumber(analysis.dominance, -100, 100, "analysis.dominance"),
      emotions: normalizeEmotionScores(analysis.emotions),
      overall_sentiment: clampNumber(analysis.overall_sentiment, -100, 100, "analysis.overall_sentiment"),
      dominant_emotion: dominantEmotion,
      complexity: normalizeComplexity(analysis.complexity),
    },
    key_triggers: normalizeTextArray(value.key_triggers, "key_triggers"),
    insights: normalizeText(value.insights, "insights"),
    suggestion: normalizeText(value.suggestion, "suggestion"),
  };
}

function normalizeEmotionScores(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("analysis.emotions must be an object.");
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([emotion]) => EMOTIONS.includes(emotion as EmotionName))
      .map(([emotion, score]) => [emotion, clampNumber(score, 0, 100, `analysis.emotions.${emotion}`)]),
  );
}

function normalizeEmotion(value: unknown) {
  if (typeof value === "string" && EMOTIONS.includes(value as EmotionName)) {
    return value as EmotionName;
  }

  throw new Error("analysis.dominant_emotion is invalid.");
}

function normalizeComplexity(value: unknown) {
  if (typeof value === "string" && COMPLEXITIES.includes(value as EmotionalComplexity)) {
    return value as EmotionalComplexity;
  }

  throw new Error("analysis.complexity is invalid.");
}

function normalizeText(value: unknown, fieldName: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  throw new Error(`${fieldName} must be a non-empty string.`);
}

function normalizeTextArray(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }

  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  if (items.length === 0) {
    throw new Error(`${fieldName} must include at least one non-empty string.`);
  }

  return items.map((item) => item.trim());
}

function clampNumber(value: unknown, min: number, max: number, fieldName: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function extractProviderError(data: ChatCompletionResponse) {
  return data.error?.message ?? data.message;
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const ANALYSIS_SYSTEM_PROMPT = `你是一位专业的临床心理学家和情感分析专家，使用科学的情感量化方法分析用户日志。

采用以下框架：
- Valence（效价）：-100 到 +100。
- Arousal（唤醒度）：0 到 100。
- Dominance（支配感）：-100 到 +100。
- Plutchik 基础情绪：Joy, Trust, Fear, Surprise, Sadness, Disgust, Anger, Anticipation。每种输出强度 0-100，仅列出强度大于 10 的。
- Overall Sentiment：-100 到 +100。
- Dominant Emotion：最强的一种。
- Emotional Complexity：低/中/高。

任务：
1. 先格式化用户输入为清晰、结构化的日志摘要，中文，200 字以内。
2. 进行多维度情感分析。
3. 提取关键事件或触发因素、可能的原因和建设性洞察，简短、支持性、非判断性。
4. 建议一个简短的反思问题或调节策略。

只返回严格 JSON，不要添加 Markdown、解释或额外文字。JSON 结构必须为：
{
  "formatted_log": "结构化摘要...",
  "analysis": {
    "valence": -45,
    "arousal": 65,
    "dominance": 30,
    "emotions": {
      "Sadness": 75,
      "Anger": 40,
      "Fear": 25
    },
    "overall_sentiment": -50,
    "dominant_emotion": "Sadness",
    "complexity": "中"
  },
  "key_triggers": ["事件1", "事件2"],
  "insights": "简短支持性洞察...",
  "suggestion": "一个反思问题或小建议..."
}`;
