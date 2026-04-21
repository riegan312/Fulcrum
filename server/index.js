import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import dotenv from 'dotenv'
import express from 'express'
import OpenAI from 'openai'

const app = express()
const accountQuotaStore = new Map()

const envLocalPath = path.resolve(process.cwd(), '.env.local')
const envPath = path.resolve(process.cwd(), '.env')

function loadRuntimeEnv() {
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true })
  } else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true })
  }

  return {
    apiPort: Number(process.env.API_PORT || 8787),
    apiKey: (process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '').trim(),
  }
}

app.use(express.json({ limit: '1mb' }))

const SYSTEM_PROMPT =
  '你是一个资深的 Excel 数据专家。你的任务是将用户的自然语言需求转换为正确的 Excel 函数公式。只输出一段干净的公式代码，不包含任何 Markdown 代码块符号，不要说任何废话或解释。'
const EMAIL_SYSTEM_PROMPT =
  '你是一位精通中英双语的职场沟通专家。你的任务是根据用户提供的收发件人姓名和简短需求，生成格式标准、语气专业礼貌的邮件。如果是中文，请使用得体商务礼仪；如果是英文，请遵循标准的商务邮件规范。只输出邮件正文，不要包含任何解释。'
const PROMPT_SYSTEM_PROMPT =
  '你是一位世界级的 AI 提示词工程师 (Prompt Engineer)。你的任务是将用户提供的一般性诉求、背景和限制条件，整合并升级为逻辑严密、结构清晰的高级提示词。请务必使用通用的结构化框架（包含：Role, Background, Task, Rules, Format 等）。你的输出必须是可以直接被另一个大模型完美理解并执行的纯提示词文本，坚决不要输出任何多余的解释、问候语或总结。'
const ECOM_SYSTEM_PROMPT =
  '你是一位精通全球主流电商平台（Amazon, Shopee, TikTok Shop）算法的 SEO 专家。用户会提供中文商品名称和目标平台。\n你的任务是：\n1. 识别该品类在当地市场的核心搜索热词（High-volume Keywords）。\n2. 按照该平台的最佳实践排版标题（例如 Amazon 的首字母大写、品牌前置逻辑）。\n3. 严禁单纯字面翻译，必须使用地道的电商词汇。\n4. 给出 1 个最终建议标题，不要任何解释。'
const XHS_RISK_SYSTEM_PROMPT =
  '你是一位精通小红书社区准则和内容审核逻辑的专家。用户会提供一段文案。\n你的任务是：\n1. 识别文中违反广告法（如“最”、“第一”）或平台规则（如引流词“微信”、“私聊”）的词汇。\n2. 评估文案是否存在引流偏向、过度营销或低俗等风险。\n3. 给出详细的风险评分（0-100）和具体的改写方案。\n4. 你的输出格式必须为 JSON，包含：{score, flagged_words: [{word, type, reason}], optimized_text, summary}。其中 type 只能是 critical 或 warning。不要输出任何额外文本。'
const DECISION_SYSTEM_PROMPT =
  '你是一位擅长把复杂选择讲明白的决策顾问。用户会给你决策矩阵结果。\n输出要求：\n1) 只写两段话，不要标题，不要前缀，不要分点编号。\n2) 第一段做分析，第二段给建议；每段4-5句，整体约320-520字。\n3) 必须结合用户给出的具体信息（例如哪个方面谁更占优、用户更看重什么），但不要逐条复读打分。\n4) 用口语化、自然、普通人看得懂的中文，像真人顾问在当面交流。\n5) 不要堆术语和书面腔，避免“维度、权重、指标、可持续性、反向压力测试”等词。\n6) 建议要可执行，给出下一步怎么做、怎么观察，不要空话。\n7) 禁止出现第一人称（如“我、我们、本人、作为顾问我”），全程使用中立陈述句。\n8) 禁止输出井号、星号、反引号、英文项目符号。'

function normalizeFormulaOutput(raw = '') {
  const text = raw.trim()
  const fencedMatch = text.match(/^```(?:[A-Za-z0-9_-]+)?\s*([\s\S]*?)```$/)
  const withoutFences = fencedMatch ? fencedMatch[1].trim() : text
  return withoutFences.replace(/^公式[:：]\s*/i, '').trim()
}

function normalizeEmailOutput(raw = '') {
  const text = raw.trim()
  const fencedMatch = text.match(/^```(?:[A-Za-z0-9_-]+)?\s*([\s\S]*?)```$/)
  return (fencedMatch ? fencedMatch[1] : text).trim()
}

function normalizePromptOutput(raw = '') {
  const text = raw.trim()
  const fencedMatch = text.match(/^```(?:[A-Za-z0-9_-]+)?\s*([\s\S]*?)```$/)
  return (fencedMatch ? fencedMatch[1] : text).trim()
}

function normalizeTitleOutput(raw = '') {
  const text = raw.trim()
  const fencedMatch = text.match(/^```(?:[A-Za-z0-9_-]+)?\s*([\s\S]*?)```$/)
  return (fencedMatch ? fencedMatch[1] : text).trim()
}

function parseJsonFromModel(raw = '') {
  const text = raw.trim()
  const fencedMatch = text.match(/^```(?:json)?\s*([\s\S]*?)```$/i)
  const candidate = (fencedMatch ? fencedMatch[1] : text).trim()

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

function normalizeXhsRiskResult(raw = '') {
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

  return {
    score,
    flagged_words: flaggedWords,
    optimized_text: optimizedText,
    summary,
  }
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function calculateProfitSandbox(payload) {
  const purchaseCost = toNumber(payload.purchaseCost)
  const shippingCost = toNumber(payload.shippingCost)
  const platformRatePct = toNumber(payload.platformRatePct)
  const adRatePct = toNumber(payload.adRatePct)
  const returnRatePct = toNumber(payload.returnRatePct)
  const price = toNumber(payload.price)

  const platformRate = platformRatePct / 100
  const adRate = adRatePct / 100
  const returnRate = returnRatePct / 100

  const platformFee = price * platformRate
  const adFee = price * adRate
  const actualCost =
    purchaseCost + shippingCost + shippingCost * returnRate + price * 0.01 * returnRatePct
  const netProfit = price - actualCost - platformFee - adFee
  const grossMargin = price > 0 ? (netProfit / price) * 100 : 0

  const fixedCost = purchaseCost + shippingCost * (1 + returnRate)
  const denominator = 1 - returnRate - platformRate - adRate
  const breakevenPrice = denominator > 0 ? fixedCost / denominator : null

  return {
    platformFee,
    adFee,
    actualCost,
    netProfit,
    grossMargin,
    breakevenPrice,
  }
}

function getEcomPlatformStrategy(rawPlatform = '') {
  const platform = rawPlatform.toLowerCase()

  if (platform === 'amazon') {
    return {
      normalizedPlatform: 'Amazon',
      strategy: [
        '风格：极其严谨、说明书式。',
        '格式：[Brand] + [Product Name] + [Material/Key Feature] + [Size/Color]。',
        '规则：每个单词首字母大写，不要使用促销词（如 Best, Sale）。',
      ].join('\n'),
    }
  }

  if (platform === 'tiktok shop' || platform === 'tiktok' || platform === 'tiktokshop') {
    return {
      normalizedPlatform: 'TikTok Shop',
      strategy: [
        '风格：社交媒体风、抓眼球。',
        '格式：[Hook词] + [Core Benefit] + [Product Name] + [Emoji]。',
        '规则：标题要短，强调“即时痛点解决”，语言更具感染力。',
      ].join('\n'),
    }
  }

  if (platform === 'shopee' || platform === 'lazada') {
    return {
      normalizedPlatform: platform === 'lazada' ? 'Lazada' : 'Shopee',
      strategy: [
        '风格：关键词高密度堆砌。',
        '格式：使用大量核心词，中间用【】或 | 隔开。',
        '规则：加入“Ready Stock”、“COD”、“Local Seller”等高权重营销标签。',
      ].join('\n'),
    }
  }

  return {
    normalizedPlatform: 'AliExpress',
    strategy: [
      '风格：长尾词覆盖。',
      '格式：尽可能多地罗列同义词和功能词，不强求语法优美，只求搜索覆盖。',
      '规则：只输出一个最终标题，不加解释。',
    ].join('\n'),
  }
}

function createClient(apiKey) {
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  })
}

function deductAccountQuota(uid) {
  const normalizedUid = String(uid || '').trim()
  if (!normalizedUid) {
    throw new Error('uid is required.')
  }

  const current = accountQuotaStore.has(normalizedUid) ? accountQuotaStore.get(normalizedUid) : 10
  if (current <= 0) {
    return { remaining: 0, blocked: true }
  }

  const next = current - 1
  accountQuotaStore.set(normalizedUid, next)
  return { remaining: next, blocked: false }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/wechat/verify', (req, res) => {
  const signature = typeof req.query?.signature === 'string' ? req.query.signature : ''
  const timestamp = typeof req.query?.timestamp === 'string' ? req.query.timestamp : ''
  const nonce = typeof req.query?.nonce === 'string' ? req.query.nonce : ''
  const echostr = typeof req.query?.echostr === 'string' ? req.query.echostr : ''

  if (!signature || !timestamp || !nonce || !echostr) {
    return res.status(400).send('Missing required query params.')
  }

  const token = 'fulcrum789'
  const sorted = [token, timestamp, nonce].sort().join('')
  const digest = crypto.createHash('sha1').update(sorted).digest('hex')

  if (digest === signature) {
    return res.status(200).send(echostr)
  }

  return res.status(401).send('Invalid signature.')
})

app.post('/api/account/quota/deduct', (req, res) => {
  try {
    const uid = typeof req.body?.uid === 'string' ? req.body.uid : ''
    const result = deductAccountQuota(uid)

    if (result.blocked) {
      return res.status(402).json({ error: '账号额度已用完，请升级 Fulcrum PRO。' })
    }

    return res.json({ remaining: result.remaining })
  } catch (error) {
    return res.status(400).json({ error: error?.message || 'Failed to deduct account quota.' })
  }
})

app.post('/api/excel-formula', async (req, res) => {
  try {
    const { apiKey } = loadRuntimeEnv()

    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'Server is missing DEEPSEEK_API_KEY (or OPENAI_API_KEY) configuration.' })
    }

    const client = createClient(apiKey)

    const userInput = typeof req.body?.input === 'string' ? req.body.input.trim() : ''

    if (!userInput) {
      return res.status(400).json({ error: 'Input is required.' })
    }

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content ?? ''
    const formula = normalizeFormulaOutput(raw)

    if (!formula) {
      return res.status(502).json({ error: 'Model returned an empty formula.' })
    }

    return res.json({ formula })
  } catch (error) {
    const statusCode = typeof error?.status === 'number' ? error.status : 500
    const message =
      error?.error?.message ||
      error?.message ||
      'Failed to generate formula from DeepSeek API.'

    return res.status(statusCode).json({ error: message })
  }
})

app.post('/api/bilingual-email', async (req, res) => {
  try {
    const { apiKey } = loadRuntimeEnv()

    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'Server is missing DEEPSEEK_API_KEY (or OPENAI_API_KEY) configuration.' })
    }

    const recipient = typeof req.body?.recipient === 'string' ? req.body.recipient.trim() : ''
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
    const sender = typeof req.body?.sender === 'string' ? req.body.sender.trim() : ''
    const language = req.body?.language === 'en' ? 'en' : 'zh'

    if (!recipient || !content || !sender) {
      return res
        .status(400)
        .json({ error: 'recipient, content, and sender are required fields.' })
    }

    const client = createClient(apiKey)
    const userPrompt =
      language === 'en'
        ? `Generate a professional English business email.\nRecipient: ${recipient}\nSender: ${sender}\nRequest: ${content}\nOutput must include greeting, body, and signature with clear line breaks.`
        : `请生成一封专业中文商务邮件。\n收件人：${recipient}\n发件人：${sender}\n需求：${content}\n输出必须包含称呼、正文、落款，并且分段换行。`

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.3,
      messages: [
        { role: 'system', content: EMAIL_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content ?? ''
    const email = normalizeEmailOutput(raw)

    if (!email) {
      return res.status(502).json({ error: 'Model returned an empty email.' })
    }

    return res.json({ email })
  } catch (error) {
    const statusCode = typeof error?.status === 'number' ? error.status : 500
    const message =
      error?.error?.message ||
      error?.message ||
      'Failed to generate bilingual email from DeepSeek API.'

    return res.status(statusCode).json({ error: message })
  }
})

app.post('/api/advanced-prompt', async (req, res) => {
  try {
    const { apiKey } = loadRuntimeEnv()

    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'Server is missing DEEPSEEK_API_KEY (or OPENAI_API_KEY) configuration.' })
    }

    const coreNeed = typeof req.body?.coreNeed === 'string' ? req.body.coreNeed.trim() : ''
    const background = typeof req.body?.background === 'string' ? req.body.background.trim() : ''
    const constraints = typeof req.body?.constraints === 'string' ? req.body.constraints.trim() : ''

    if (!coreNeed) {
      return res.status(400).json({ error: 'coreNeed is required.' })
    }

    const client = createClient(apiKey)
    const userPrompt = [
      `核心诉求：${coreNeed}`,
      `补充背景：${background || '未提供'}`,
      `特定限制：${constraints || '未提供'}`,
      '请输出结构化高级提示词，并包含 Role、Background、Task、Rules、Format 五个部分。Rules 至少 4 条，编号列出。',
    ].join('\n')

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.3,
      messages: [
        { role: 'system', content: PROMPT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content ?? ''
    const prompt = normalizePromptOutput(raw)

    if (!prompt) {
      return res.status(502).json({ error: 'Model returned an empty prompt.' })
    }

    return res.json({ prompt })
  } catch (error) {
    const statusCode = typeof error?.status === 'number' ? error.status : 500
    const message =
      error?.error?.message ||
      error?.message ||
      'Failed to generate advanced prompt from DeepSeek API.'

    return res.status(statusCode).json({ error: message })
  }
})

app.post('/api/ecom-title', async (req, res) => {
  try {
    const { apiKey } = loadRuntimeEnv()

    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'Server is missing DEEPSEEK_API_KEY (or OPENAI_API_KEY) configuration.' })
    }

    const originalTitle =
      typeof req.body?.originalTitle === 'string' ? req.body.originalTitle.trim() : ''
    const platform = typeof req.body?.platform === 'string' ? req.body.platform.trim() : 'Amazon'
    const language = typeof req.body?.language === 'string' ? req.body.language.trim() : 'en'
    const sellingPoints =
      typeof req.body?.sellingPoints === 'string' ? req.body.sellingPoints.trim() : ''

    if (!originalTitle) {
      return res.status(400).json({ error: 'originalTitle is required.' })
    }

    const client = createClient(apiKey)
    const { normalizedPlatform, strategy } = getEcomPlatformStrategy(platform)
    const userPrompt = [
      `中文原标题：${originalTitle}`,
      `目标平台：${normalizedPlatform}`,
      `目标语种：${language}`,
      `核心卖点：${sellingPoints || '未提供'}`,
      '请严格遵守以下平台策略并生成标题：',
      strategy,
      '必须体现该平台对应的格式与用词风格差异。',
      '请输出 1 个最终建议标题，且仅输出标题正文，不要解释。',
    ].join('\n')

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.4,
      messages: [
        { role: 'system', content: ECOM_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content ?? ''
    const title = normalizeTitleOutput(raw)

    if (!title) {
      return res.status(502).json({ error: 'Model returned an empty title.' })
    }

    return res.json({ title })
  } catch (error) {
    const statusCode = typeof error?.status === 'number' ? error.status : 500
    const message =
      error?.error?.message ||
      error?.message ||
      'Failed to generate e-commerce title from DeepSeek API.'

    return res.status(statusCode).json({ error: message })
  }
})

app.post('/api/xhs-risk', async (req, res) => {
  try {
    const { apiKey } = loadRuntimeEnv()

    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'Server is missing DEEPSEEK_API_KEY (or OPENAI_API_KEY) configuration.' })
    }

    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
    if (!text) {
      return res.status(400).json({ error: 'text is required.' })
    }

    const client = createClient(apiKey)
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.2,
      messages: [
        { role: 'system', content: XHS_RISK_SYSTEM_PROMPT },
        { role: 'user', content: `待诊断文案：\n${text}` },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content ?? ''
    const result = normalizeXhsRiskResult(raw)

    if (!result) {
      return res.status(502).json({ error: 'Model returned invalid JSON structure.' })
    }

    return res.json(result)
  } catch (error) {
    const statusCode = typeof error?.status === 'number' ? error.status : 500
    const message =
      error?.error?.message || error?.message || 'Failed to scan XHS risk from DeepSeek API.'

    return res.status(statusCode).json({ error: message })
  }
})

app.post('/api/profit-sandbox', (req, res) => {
  const metrics = calculateProfitSandbox(req.body ?? {})
  return res.json(metrics)
})

app.post('/api/decision-report', async (req, res) => {
  try {
    const { apiKey } = loadRuntimeEnv()
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'Server is missing DEEPSEEK_API_KEY (or OPENAI_API_KEY) configuration.' })
    }

    const payload = req.body ?? {}
    const topic = typeof payload.topic === 'string' ? payload.topic.trim() : '未命名决策'
    const optionA = typeof payload.optionA === 'string' ? payload.optionA.trim() : '选项 A'
    const optionB = typeof payload.optionB === 'string' ? payload.optionB.trim() : '选项 B'
    const dimensions = Array.isArray(payload.dimensions) ? payload.dimensions : []
    const scoreA = toNumber(payload.scoreA)
    const scoreB = toNumber(payload.scoreB)
    const winner = payload.winner === 'A' || payload.winner === 'B' ? payload.winner : 'tie'

    const normalizedDimensions = dimensions
      .map((item) => ({
        name: typeof item?.name === 'string' ? item.name.trim() : '',
        weight: toNumber(item?.weight),
        scoreA: toNumber(item?.scoreA),
        scoreB: toNumber(item?.scoreB),
      }))
      .filter((item) => item.name)

    const client = createClient(apiKey)
    const userPrompt = [
      `决策主题：${topic}`,
      `选项A：${optionA}`,
      `选项B：${optionB}`,
      `加权总分A：${scoreA.toFixed(2)}`,
      `加权总分B：${scoreB.toFixed(2)}`,
      `当前胜出项：${winner === 'A' ? optionA : winner === 'B' ? optionB : '平分'}`,
      '评价维度（名称 / 权重 / A评分 / B评分）：',
      ...normalizedDimensions.map(
        (item) => `- ${item.name} / ${item.weight} / ${item.scoreA} / ${item.scoreB}`
      ),
      '请直接给自然语言结论和建议，避免复述分数表格，不要写“简短分析/简短建议”这种前缀。',
    ].join('\n')

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.4,
      messages: [
        { role: 'system', content: DECISION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const reportRaw = (completion.choices?.[0]?.message?.content ?? '').trim()
    let report = reportRaw
      .replace(/[＃#＊*`]/g, '')
      .replace(/^\s*\d+[.)、]\s*/gm, '')
      .replace(/^\s*(简短分析|简短建议)\s*[：:]\s*/gm, '')
      .replace(/可持续性/g, '长期相处')
      .replace(/维度/g, '方面')
      .replace(/权重/g, '重视程度')
      .replace(/指标/g, '要素')
      .replace(/反向压力测试/g, '倒着想最坏情况')
      .replace(/作为顾问[,，]?\s*/g, '')
      .replace(/我建议/g, '建议')
      .replace(/我认为/g, '更合理的判断是')
      .replace(/我来为你/g, '')
      .replace(/我来/g, '')
      .replace(/我们可以/g, '可以')
      .replace(/我们先/g, '先')
      .replace(/我们/g, '')
      .trim()

    if (report.length > 0 && report.length < 220) {
      const leadText =
        winner === 'A'
          ? `${optionA}目前更贴近你现在最在意的方向，但这并不代表${optionB}完全不合适。`
          : winner === 'B'
            ? `${optionB}目前更贴近你现在最在意的方向，但这并不代表${optionA}完全不合适。`
            : `${optionA}和${optionB}现在非常接近，说明你还在两个方向之间摇摆。`

      const expandText = [
        leadText,
        `你给出的信息里，已经能看出你在做这个${topic}时真正看重的点，这些点要继续保留，因为它们反映的是你当下最真实的需求。`,
        '接下来可以先做一轮小范围试跑：给自己设一个短周期观察窗口，把最在意的两三件事放进日常体验里验证，而不是只看纸面分数。',
        '如果试跑后你的体感和分数一致，就可以更稳地推进；如果不一致，就回头微调重视程度再比较一次，这样决定会更踏实。',
      ].join('')

      report = `${report}\n\n${expandText}`.trim()
    }
    if (!report) {
      return res.status(502).json({ error: 'Model returned an empty report.' })
    }

    return res.json({ report })
  } catch (error) {
    const statusCode = typeof error?.status === 'number' ? error.status : 500
    const message =
      error?.error?.message || error?.message || 'Failed to generate decision report from API.'

    return res.status(statusCode).json({ error: message })
  }
})

const { apiPort } = loadRuntimeEnv()

app.listen(apiPort, () => {
  console.log(`Fulcrum API listening on http://localhost:${apiPort}`)
})
