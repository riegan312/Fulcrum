import { useMemo, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useUsageAccess } from '../access/UsageAccessContext'

const TOOL_TAGS = ['决策', '逻辑分析']
const ACTION_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border !border-[#FB923C] !bg-[#EA580C] px-2.5 py-1.5 text-xs font-semibold !text-white transition hover:!bg-[#F97316] disabled:cursor-not-allowed disabled:!border-[#FB923C] disabled:!bg-[#EA580C] disabled:!text-white disabled:opacity-100 disabled:brightness-90'

function createDimension() {
  return {
    id: `dim_${Math.random().toString(36).slice(2, 9)}`,
    name: '',
    weight: 50,
    scoreA: 5,
    scoreB: 5,
  }
}

export function CriticalDecisionMatrix() {
  const { runWithQuota } = useUsageAccess()
  const [topic, setTopic] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [dimensions, setDimensions] = useState([
    { id: 'salary', name: '', weight: 50, scoreA: 5, scoreB: 5 },
    { id: 'growth', name: '', weight: 50, scoreA: 5, scoreB: 5 },
  ])
  const [hasScoringChange, setHasScoringChange] = useState(false)
  const [report, setReport] = useState('')
  const [reportError, setReportError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const metrics = useMemo(() => {
    const totalWeight = dimensions.reduce((sum, item) => sum + Number(item.weight || 0), 0)
    const weightedA = dimensions.reduce(
      (sum, item) => sum + Number(item.weight || 0) * Number(item.scoreA || 0),
      0
    )
    const weightedB = dimensions.reduce(
      (sum, item) => sum + Number(item.weight || 0) * Number(item.scoreB || 0),
      0
    )

    const scoreA = totalWeight > 0 ? weightedA / totalWeight : 0
    const scoreB = totalWeight > 0 ? weightedB / totalWeight : 0

    const winner = scoreA === scoreB ? 'tie' : scoreA > scoreB ? 'A' : 'B'

    return {
      scoreA,
      scoreB,
      totalWeight,
      winner,
    }
  }, [dimensions])

  const canGenerateReport = !isLoading && dimensions.length > 0

  function updateDimension(id, key, value) {
    const numericKeys = ['weight', 'scoreA', 'scoreB']
    if (numericKeys.includes(key)) {
      setHasScoringChange(true)
    }
    setDimensions((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)))
  }

  function addDimension() {
    setHasScoringChange(true)
    setDimensions((prev) => [...prev, createDimension()])
  }

  function adjustScore(id, key, delta) {
    setHasScoringChange(true)
    setDimensions((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item
        }
        const current = Number(item[key] || 0)
        const next = Math.min(10, Math.max(1, current + delta))
        return { ...item, [key]: next }
      })
    )
  }

  async function handleGenerateReport() {
    if (!canGenerateReport) {
      return
    }

    await runWithQuota(
      {
        tool: 'critical_decision_matrix',
        action: 'generate_report',
        preview: topic.trim().slice(0, 120),
      },
      async () => {
        setIsLoading(true)
        setReportError('')

        try {
          const response = await fetch('/api/decision-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic,
              optionA,
              optionB,
              dimensions,
              scoreA: metrics.scoreA,
              scoreB: metrics.scoreB,
              winner: metrics.winner,
            }),
          })

          const data = await response.json()
          if (!response.ok) {
            throw new Error(data?.error || '报告生成失败，请稍后重试。')
          }

          setReport(data.report || '')
        } catch (error) {
          setReportError(error.message || '请求失败，请检查网络和配置。')
        } finally {
          setIsLoading(false)
        }
      }
    )
  }

  return (
    <section className="rounded-xl border border-gray-900 bg-[#0A0B0E] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.015)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
        <h3 className="text-base font-semibold tracking-tight text-ink">重大决策矩阵</h3>
        <div className="flex flex-wrap items-center gap-2">
          {TOOL_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
        <article className="flex h-full flex-col rounded-lg border border-gray-800 bg-surface-1 p-4">
          <div className="mb-4 h-8">
            <h4 className="text-sm font-semibold text-ink">参数定义面板</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">决策主题</label>
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="例如：换工作"
                className="h-10 w-full rounded-lg border border-gray-700 bg-[#0C0D10] px-3 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-zinc-500">选项 A</label>
                <input
                  value={optionA}
                  onChange={(event) => setOptionA(event.target.value)}
                  placeholder="例如：留在大厂"
                  className="h-10 w-full rounded-lg border border-gray-700 bg-[#0C0D10] px-3 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">选项 B</label>
                <input
                  value={optionB}
                  onChange={(event) => setOptionB(event.target.value)}
                  placeholder="例如：辞职创业"
                  className="h-10 w-full rounded-lg border border-gray-700 bg-[#0C0D10] px-3 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-[#090B10] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-zinc-500">评价维度列表</p>
                <button type="button" onClick={addDimension} className={ACTION_BUTTON_CLASS}>
                  + 添加维度
                </button>
              </div>

              <div className="space-y-2">
                {dimensions.map((item) => (
                  <div key={item.id} className="rounded-md border border-gray-700 bg-[#0C0D10] p-2">
                    <input
                      value={item.name}
                      onChange={(event) => updateDimension(item.id, 'name', event.target.value)}
                      placeholder={item.id === 'salary' ? '例如：薪水' : '例如：成长空间'}
                      className="mb-2 h-9 w-full rounded-md border border-gray-700 bg-[#101116] px-2 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
                    />

                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs text-zinc-500">权重</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={item.weight}
                        onChange={(event) => updateDimension(item.id, 'weight', Number(event.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded bg-[#1B1E25] accent-orange"
                      />
                      <span className="data-mono text-xs text-zinc-400">{item.weight}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-500">{optionA || '选项 A'} 评分 (1-10)</label>
                        <div className="data-mono flex h-8 items-center justify-between rounded-md border border-gray-700 bg-[#101116] px-2 text-xs text-ink">
                          <button
                            type="button"
                            onClick={() => adjustScore(item.id, 'scoreA', -1)}
                            className="text-zinc-400 transition hover:text-ink"
                            aria-label="Decrease score A"
                          >
                            ▾
                          </button>
                          <span>{item.scoreA}</span>
                          <button
                            type="button"
                            onClick={() => adjustScore(item.id, 'scoreA', 1)}
                            className="text-zinc-400 transition hover:text-ink"
                            aria-label="Increase score A"
                          >
                            ▴
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-zinc-500">{optionB || '选项 B'} 评分 (1-10)</label>
                        <div className="data-mono flex h-8 items-center justify-between rounded-md border border-gray-700 bg-[#101116] px-2 text-xs text-ink">
                          <button
                            type="button"
                            onClick={() => adjustScore(item.id, 'scoreB', -1)}
                            className="text-zinc-400 transition hover:text-ink"
                            aria-label="Decrease score B"
                          >
                            ▾
                          </button>
                          <span>{item.scoreB}</span>
                          <button
                            type="button"
                            onClick={() => adjustScore(item.id, 'scoreB', 1)}
                            className="text-zinc-400 transition hover:text-ink"
                            aria-label="Increase score B"
                          >
                            ▴
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-lg border border-gray-800 bg-surface-1 p-4">
          <div className="mb-4 h-8">
            <h4 className="text-sm font-semibold text-ink">量化分析看板</h4>
          </div>

          <div className="rounded-lg border border-gray-700 bg-[#090B10] p-3">
            <p className="text-xs text-zinc-500">实时得分对比</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-gray-700 bg-[#0C0D10] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs text-zinc-500">{optionA || '选项 A'}</p>
                  {hasScoringChange && metrics.winner === 'A' && (
                    <span className="rounded-full bg-orange px-2 py-0.5 text-[11px] font-semibold text-black">
                      最优建议
                    </span>
                  )}
                </div>
                <p className="data-mono text-3xl font-semibold text-ink">
                  {(hasScoringChange ? metrics.scoreA : 0).toFixed(2)}
                </p>
              </div>

              <div className="rounded-md border border-gray-700 bg-[#0C0D10] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs text-zinc-500">{optionB || '选项 B'}</p>
                  {hasScoringChange && metrics.winner === 'B' && (
                    <span className="rounded-full bg-orange px-2 py-0.5 text-[11px] font-semibold text-black">
                      最优建议
                    </span>
                  )}
                </div>
                <p className="data-mono text-3xl font-semibold text-ink">
                  {(hasScoringChange ? metrics.scoreB : 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex-1 rounded-lg border border-gray-700 bg-[#090B10] p-3">
            <p className="mb-2 text-xs text-zinc-500">深度建议</p>
            {reportError ? (
              <p className="text-sm text-red-400">{reportError}</p>
            ) : report ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{report}</p>
            ) : (
              <p className="text-sm text-zinc-500">生成智能决策报告后，这里会展示理性分析与风险提示。</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={!canGenerateReport}
            className="mt-3 inline-flex self-start rounded-md border !border-[#FB923C] !bg-[#EA580C] px-3 py-2 text-sm font-semibold !text-white transition hover:!bg-[#F97316] disabled:cursor-not-allowed disabled:!border-[#FB923C] disabled:!bg-[#EA580C] disabled:!text-white disabled:opacity-100 disabled:brightness-90"
          >
            {isLoading ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Sparkles size={16} className="mr-1" />}
            生成智能决策报告
          </button>
        </article>
      </div>

      <p className="mt-4 text-center text-[11px] text-gray-600">
        本工具仅提供逻辑计算与建议，不对您的最终决策承担法律责任。
      </p>
    </section>
  )
}
