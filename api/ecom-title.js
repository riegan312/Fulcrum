import {
  createClient,
  ECOM_SYSTEM_PROMPT,
  getEcomPlatformStrategy,
  normalizeText,
} from './_lib/deepseek.js'

const LANGUAGE_MAP = {
  en: '英语',
  fr: '法语',
  ja: '日语',
  ko: '韩语',
  de: '德语',
  es: '西语',
  pt: '葡语',
  ru: '俄语',
  th: '泰语',
  id: '印尼语',
  vi: '越南语',
  tl: '菲律宾语',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const originalTitle =
      typeof req.body?.originalTitle === 'string' ? req.body.originalTitle.trim() : ''
    const platform = typeof req.body?.platform === 'string' ? req.body.platform.trim() : 'Amazon'
    const language = typeof req.body?.language === 'string' ? req.body.language.trim() : 'en'
    const sellingPoints =
      typeof req.body?.sellingPoints === 'string' ? req.body.sellingPoints.trim() : ''

    if (!originalTitle) {
      return res.status(400).json({ error: 'originalTitle is required.' })
    }

    const strategy = getEcomPlatformStrategy(platform)
    const userInput = [
      `中文原标题：${originalTitle}`,
      `目标平台：${strategy.normalizedPlatform}`,
      `目标语种：${LANGUAGE_MAP[language] || '英语'}`,
      `核心卖点：${sellingPoints || '无'}`,
      '平台差异化规则：',
      strategy.strategy,
      '只输出最终标题，不要任何解释。',
    ].join('\n')

    const client = createClient()
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.45,
      messages: [
        { role: 'system', content: ECOM_SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ],
    })

    const title = normalizeText(completion.choices?.[0]?.message?.content ?? '')
    if (!title) {
      return res.status(502).json({ error: 'Model returned an empty title.' })
    }
    return res.status(200).json({ title })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to generate e-commerce title.' })
  }
}

