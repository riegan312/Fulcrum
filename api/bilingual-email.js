import { createClient, EMAIL_SYSTEM_PROMPT, normalizeText } from './_lib/deepseek.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const recipient = typeof req.body?.recipient === 'string' ? req.body.recipient.trim() : ''
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
    const sender = typeof req.body?.sender === 'string' ? req.body.sender.trim() : ''
    const language = req.body?.language === 'en' ? 'en' : 'zh'
    if (!recipient || !content || !sender) {
      return res.status(400).json({ error: 'recipient, content, and sender are required fields.' })
    }

    const userInput = [
      `收件人：${recipient}`,
      `发件人：${sender}`,
      `语言：${language === 'en' ? '英文' : '中文'}`,
      `需求：${content}`,
    ].join('\n')

    const client = createClient()
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.4,
      messages: [
        { role: 'system', content: EMAIL_SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ],
    })

    const email = normalizeText(completion.choices?.[0]?.message?.content ?? '')
    if (!email) {
      return res.status(502).json({ error: 'Model returned an empty email.' })
    }
    return res.status(200).json({ email })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to generate bilingual email.' })
  }
}

