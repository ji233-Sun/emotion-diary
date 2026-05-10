Emodiary（emotion diary， /ˌimoʊˈdaɪəri/，绪语，in Chinese）是一款AI驱动的情绪日志软件；基于前沿大语言模型与STT技术，该软件可以给予一个用户有反馈、可分析的情绪日志输入端口，并协助用户洞察其较长时间段的情绪状态。

## AI API 配置

当前实现通过阿里云百炼 OpenAI 兼容接口调用：

- 文本情绪分析：`deepseek-v4-flash`
- 语音转文字：`qwen3-asr-flash`

本地运行前创建 `.env.local`：

```bash
DASHSCOPE_API_KEY=sk-your-bailian-api-key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

`DASHSCOPE_API_KEY` 只在 Next.js 服务端 API route 中读取，不会暴露给浏览器端代码。

---

用户进入软件后，可以通过语音输入倾斜其遇到的事情或主观的情感表达，然后，软件会调用LLM进行：

- 对用户语音内容的格式化输出
- 对用户输入内容的情感分析

然后，用户可以通过History功能查询自己的输入历史记录和对应的报告，每个月会生成一份月报，包含：

- 用户当月的情感分析
- 月情感热力度

---

**Emotion Dimensions**：

- **主要维度（Dimensional Model）**：Russell 的 Circumplex Model（环形模型）
    - **Valence（效价/愉悦度）**：-100 到 +100（-100=极度负面，0=中性，+100=极度正面）。反映整体好坏感受。
    - **Arousal（唤醒度/强度）**：0 到 100（0=平静/疲惫，100=极高激活/兴奋或焦虑）。反映情绪能量水平。
    - **Dominance（可选，支配感）**：-100 到 +100（可选，用于区分“愤怒 vs 恐惧”等）。
- **离散情绪分类（Categorical）**：Plutchik’s Wheel of Emotions（8 种基础情绪 + 强度层级）
    - Joy（喜悦）、Trust（信任）、Fear（恐惧）、Surprise（惊讶）、Sadness（悲伤）、Disgust（厌恶）、Anger（愤怒）、Anticipation（期待）。
    - 每种情绪输出**主要情绪 + 次要情绪** + **强度百分比**（0-100%）。

---

**AI-Powered Prompt**:

1. 单次

```haskell
你是一位专业的临床心理学家和情感分析专家，使用科学的情感量化方法分析用户日志。

采用以下框架：
- **Valence（效价）**：-100 到 +100（正面/负面强度）
- **Arousal（唤醒度）**：0 到 100（情绪激活/能量水平）
- **Dominance（支配感，可选）**：-100 到 +100
- **Plutchik 基础情绪**：Joy, Trust, Fear, Surprise, Sadness, Disgust, Anger, Anticipation。每种输出强度 0-100%，仅列出强度>10%的。
- **Overall Sentiment**：-100 到 +100
- **Dominant Emotion**：最强的一种
- **Emotional Complexity**：低/中/高（基于混合程度）

**任务**：
1. 先格式化用户输入为清晰、结构化的日志摘要（中文，200字以内）。
2. 进行多维度情感分析。
3. 提取关键事件/触发因素、可能的原因和建设性洞察（简短、支持性、非判断性）。
4. 建议一个简短的反思问题或调节策略（可选）。

**输出必须严格使用以下 JSON 格式**（不要添加额外文字）：

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
}

用户输入（语音转文字）：
[USER_INPUT_HERE]
```

2. 月度

```haskell
基于以下本月所有日志的情感量化数据，生成专业月报。

数据：[JSON数组 或 汇总统计]

生成内容包括：
- 本月总体情绪概览（平均 Valence/Arousal、主导情绪趋势）
- 月情感热力度：描述高/低谷时期、情绪波动模式
- 主要触发因素与模式
- 积极变化与建议
- 可视化建议（文字描述热图/趋势）

用温暖、专业、鼓励的语气，用中文输出，结构清晰（标题、小节、 bullet points）。
```
