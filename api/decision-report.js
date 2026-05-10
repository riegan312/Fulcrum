import {
  createClient,
  DECISION_SYSTEM_PROMPT,
  normalizeText,
  toNumber,
} from './_lib/deepseek.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
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

    const client = createClient()
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.4,
      messages: [
        { role: 'system', content: DECISION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    let report = normalizeText(completion.choices?.[0]?.message?.content ?? '')
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

    if (!report) {
      return res.status(502).json({ error: 'Model returned an empty report.' })
    }
    return res.status(200).json({ report })
  } catch (error) {
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to generate decision report from API.' })
  }
}

