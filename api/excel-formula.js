import { createClient, normalizeFormulaOutput, SYSTEM_PROMPT } from './_lib/deepseek.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const input = typeof req.body?.input === 'string' ? req.body.input.trim() : ''
    if (!input) {
      return res.status(400).json({ error: 'Input is required.' })
    }

    const client = createClient()
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input },
      ],
    })

    const formula = normalizeFormulaOutput(completion.choices?.[0]?.message?.content ?? '')
    if (!formula) {
      return res.status(502).json({ error: 'Model returned an empty formula.' })
    }
    return res.status(200).json({ formula })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to generate formula.' })
  }
}

