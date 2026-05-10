import { describe, expect, it } from "vitest";
import { analyzeDiaryText, transcribeAudio } from "./bailian";
import type { DiaryAnalysisResult } from "@/src/types/diary";

const analysisResult: DiaryAnalysisResult = {
  formatted_log: "用户记录了项目延期带来的焦虑，以及来自同事的支持。",
  analysis: {
    valence: -32,
    arousal: 68,
    dominance: -18,
    emotions: {
      Fear: 62,
      Trust: 28,
    },
    overall_sentiment: -32,
    dominant_emotion: "Fear",
    complexity: "中",
  },
  key_triggers: ["项目延期", "团队进度"],
  insights: "焦虑主要来自交付不确定性，同时支持资源仍然存在。",
  suggestion: "先写下明天最小可交付的一步。",
};

describe("analyzeDiaryText", () => {
  it("calls Bailian DeepSeek v4 flash and parses the JSON analysis", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: url.toString(), init: init ?? {} });

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `\n\n\`\`\`json\n${JSON.stringify(analysisResult)}\n\`\`\``,
              },
            },
          ],
        }),
        { status: 200 },
      );
    };

    const result = await analyzeDiaryText("今天项目延期，我很焦虑。", {
      apiKey: "test-key",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      fetcher,
    });

    expect(result).toEqual(analysisResult);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions");
    expect(requests[0].init.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });

    const body = JSON.parse(requests[0].init.body as string);
    expect(body.model).toBe("deepseek-v4-flash");
    expect(body.messages.at(-1).content).toContain("今天项目延期");
    expect(body.enable_thinking).toBe(false);
  });
});

describe("transcribeAudio", () => {
  it("calls Bailian Qwen3 ASR with a base64 audio data URL", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: url.toString(), init: init ?? {} });

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: [{ text: "今天我有点焦虑，但也收到了支持。" }],
              },
            },
          ],
        }),
        { status: 200 },
      );
    };

    const text = await transcribeAudio("data:audio/webm;base64,AAAA", {
      apiKey: "test-key",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      fetcher,
    });

    expect(text).toBe("今天我有点焦虑，但也收到了支持。");
    const body = JSON.parse(requests[0].init.body as string);
    expect(body.model).toBe("qwen3-asr-flash");
    expect(body.messages[0].content[0]).toEqual({
      type: "input_audio",
      input_audio: {
        data: "data:audio/webm;base64,AAAA",
      },
    });
    expect(body.asr_options).toEqual({ enable_itn: true });
  });
});
