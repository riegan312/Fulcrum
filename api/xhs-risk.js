import {
  createClient,
  normalizeXhsRiskResult,
  XHS_RISK_SYSTEM_PROMPT,
} from './_lib/deepseek.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
    if (!text) {
      return res.status(400).json({ error: 'text is required.' })
    }

    const client = createClient()
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.2,
      messages: [
        { role: 'system', content: XHS_RISK_SYSTEM_PROMPT },
        { role: 'user', content: `待诊断文案：\n${text}` },
      ],
    })

    const result = normalizeXhsRiskResult(completion.choices?.[0]?.message?.content ?? '')
    if (!result) {
      return res.status(502).json({ error: 'Model returned invalid JSON structure.' })
    }
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to scan XHS risk from API.' })
  }
}

