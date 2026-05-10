import OpenAI from 'openai'

export const SYSTEM_PROMPT =
  '你是一个资深的 Excel 数据专家。你的任务是将用户的自然语言需求转换为正确的 Excel 函数公式。只输出一段干净的公式代码，不包含任何 Markdown 代码块符号，不要说任何废话或解释。'

export const EMAIL_SYSTEM_PROMPT =
  '你是一位精通中英双语的职场沟通专家。你的任务是根据用户提供的收发件人姓名和简短需求，生成格式标准、语气专业礼貌的邮件。如果是中文，请使用得体商务礼仪；如果是英文，请遵循标准的商务邮件规范。只输出邮件正文，不要包含任何解释。'

export const PROMPT_SYSTEM_PROMPT =
  '你是一位世界级的 AI 提示词工程师 (Prompt Engineer)。你的任务是将用户提供的一般性诉求、背景和限制条件，整合并升级为逻辑严密、结构清晰的高级提示词。请务必使用通用的结构化框架（包含：Role, Background, Task, Rules, Format 等）。你的输出必须是可以直接被另一个大模型完美理解并执行的纯提示词文本，坚决不要输出任何多余的解释、问候语或总结。'

export const ECOM_SYSTEM_PROMPT =
  '你是一位精通全球主流电商平台（Amazon, Shopee, TikTok Shop）算法的 SEO 专家。用户会提供中文商品名称和目标平台。\n你的任务是：\n1. 识别该品类在当地市场的核心搜索热词（High-volume Keywords）。\n2. 按照该平台的最佳实践排版标题（例如 Amazon 的首字母大写、品牌前置逻辑）。\n3. 严禁单纯字面翻译，必须使用地道的电商词汇。\n4. 给出 1 个最终建议标题，不要任何解释。'

export const XHS_RISK_SYSTEM_PROMPT =
  '你是一位精通小红书社区准则和内容审核逻辑的专家。用户会提供一段文案。\n你的任务是：\n1. 识别文中违反广告法（如“最”、“第一”）或平台规则（如引流词“微信”、“私聊”）的词汇。\n2. 评估文案是否存在引流偏向、过度营销或低俗等风险。\n3. 给出详细的风险评分（0-100）和具体的改写方案。\n4. 你的输出格式必须为 JSON，包含：{score, flagged_words: [{word, type, reason}], optimized_text, summary}。其中 type 只能是 critical 或 warning。不要输出任何额外文本。'

export const DECISION_SYSTEM_PROMPT =
  '你是一位擅长把复杂选择讲明白的决策顾问。用户会给你决策矩阵结果。\n输出要求：\n1) 只写两段话，不要标题，不要前缀，不要分点编号。\n2) 第一段做分析，第二段给建议；每段4-5句，整体约320-520字。\n3) 必须结合用户给出的具体信息（例如哪个方面谁更占优、用户更看重什么），但不要逐条复读打分。\n4) 用口语化、自然、普通人看得懂的中文，像真人顾问在当面交流。\n5) 不要堆术语和书面腔，避免“维度、权重、指标、可持续性、反向压力测试”等词。\n6) 建议要可执行，给出下一步怎么做、怎么观察，不要空话。\n7) 禁止出现第一人称（如“我、我们、本人、作为顾问我”），全程使用中立陈述句。\n8) 禁止输出井号、星号、反引号、英文项目符号。'

export function createClient() {
  const apiKey = (process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '').trim()
  if (!apiKey) {
    throw new Error('Server is missing DEEPSEEK_API_KEY (or OPENAI_API_KEY) configuration.')
  }
  return new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' })
}

export function normalizeText(raw = '') {
  const text = raw.trim()
  const fencedMatch = text.match(/^```(?:[A-Za-z0-9_-]+)?\s*([\s\S]*?)```$/)
  return (fencedMatch ? fencedMatch[1] : text).trim()
}

export function normalizeFormulaOutput(raw = '') {
  return normalizeText(raw).replace(/^公式[:：]\s*/i, '').trim()
}

export function parseJsonFromModel(raw = '') {
  const candidate = normalizeText(raw)
  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      return null
    }
    try {
      return JSON.parse(candidate.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

export function normalizeXhsRiskResult(raw = '') {
  const parsed = parseJsonFromModel(raw)
  if (!parsed || typeof parsed !== 'object') {
    return null
  }

  const scoreRaw = Number(parsed.score)
  const score = Number.isFinite(scoreRaw) ? Math.min(100, Math.max(0, scoreRaw)) : null
  const flaggedWords = Array.isArray(parsed.flagged_words)
    ? parsed.flagged_words
        .map((item) => ({
          word: typeof item?.word === 'string' ? item.word.trim() : '',
          type: item?.type === 'critical' ? 'critical' : 'warning',
          reason: typeof item?.reason === 'string' ? item.reason.trim() : '',
        }))
        .filter((item) => item.word && item.reason)
    : []
  const optimizedText =
    typeof parsed.optimized_text === 'string' ? parsed.optimized_text.trim() : ''
  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : ''

  if (score === null || !optimizedText) {
    return null
  }

  return { score, flagged_words: flaggedWords, optimized_text: optimizedText, summary }
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function getEcomPlatformStrategy(rawPlatform = '') {
  const platform = rawPlatform.toLowerCase()
  if (platform === 'amazon') {
    return {
      normalizedPlatform: 'Amazon',
      strategy:
        '风格：极其严谨、说明书式。\n格式：[Brand] + [Product Name] + [Material/Key Feature] + [Size/Color]。\n规则：每个单词首字母大写，不要使用促销词（如 Best, Sale）。',
    }
  }
  if (platform === 'tiktok shop' || platform === 'tiktok' || platform === 'tiktokshop') {
    return {
      normalizedPlatform: 'TikTok Shop',
      strategy:
        '风格：社交媒体风、抓眼球。\n格式：[Hook词] + [Core Benefit] + [Product Name] + [Emoji]。\n规则：标题要短，强调“即时痛点解决”，语言更具感染力。',
    }
  }
  if (platform === 'shopee' || platform === 'lazada') {
    return {
      normalizedPlatform: platform === 'lazada' ? 'Lazada' : 'Shopee',
      strategy:
        '风格：关键词高密度堆砌。\n格式：使用大量核心词，中间用【】或 | 隔开。\n规则：加入“Ready Stock”、“COD”、“Local Seller”等高权重营销标签。',
    }
  }
  return {
    normalizedPlatform: 'AliExpress',
    strategy:
      '风格：长尾词覆盖。\n格式：尽可能多地罗列同义词和功能词，不强求语法优美，只求搜索覆盖。\n规则：只输出一个最终标题，不加解释。',
  }
}

