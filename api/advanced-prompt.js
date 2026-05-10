import { createClient, normalizeText, PROMPT_SYSTEM_PROMPT } from './_lib/deepseek.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const coreNeed = typeof req.body?.coreNeed === 'string' ? req.body.coreNeed.trim() : ''
    const constraints =
      typeof req.body?.constraints === 'string' ? req.body.constraints.trim() : ''

    if (!coreNeed) {
      return res.status(400).json({ error: 'coreNeed is required.' })
    }

    const userInput = [
      `核心诉求：${coreNeed}`,
      constraints ? `特定限制：${constraints}` : '特定限制：无',
    ].join('\n')

    const client = createClient()
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.4,
      messages: [
        { role: 'system', content: PROMPT_SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ],
    })

    const prompt = normalizeText(completion.choices?.[0]?.message?.content ?? '')
    if (!prompt) {
      return res.status(502).json({ error: 'Model returned an empty prompt.' })
    }
    return res.status(200).json({ prompt })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to generate advanced prompt.' })
  }
}

