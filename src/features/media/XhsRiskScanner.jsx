import { useMemo, useState } from 'react'
import { AlertTriangle, Loader2, ShieldAlert, Sparkles } from 'lucide-react'
import { useUsageAccess } from '../access/UsageAccessContext'

const TOOL_TAGS = ['风控', '流量']
const ACTION_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border !border-[#FB923C] !bg-[#EA580C] px-2.5 py-1.5 text-xs font-semibold !text-white transition hover:!bg-[#F97316] disabled:cursor-not-allowed disabled:!border-[#FB923C] disabled:!bg-[#EA580C] disabled:!text-white disabled:opacity-100 disabled:brightness-90'

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function XhsRiskScanner() {
  const { runWithQuota } = useUsageAccess()
  const [text, setText] = useState('')
  const [scanResult, setScanResult] = useState({
    scannedText: '',
    score: 0,
    flaggedWords: [],
    optimizedText: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const canScan = useMemo(() => text.trim().length > 0 && !isLoading, [text, isLoading])

  const flaggedMap = useMemo(() => {
    const map = new Map()
    scanResult.flaggedWords.forEach((item) => {
      if (item.word) {
        map.set(item.word, { reason: item.reason, type: item.type || 'warning' })
      }
    })
    return map
  }, [scanResult.flaggedWords])

  const riskTone =
    scanResult.score >= 70
      ? { textColor: 'text-red-400', gaugeColor: '#f87171', summary: '限流风险高，强烈建议修改' }
      : scanResult.score >= 40
        ? { textColor: 'text-yellow-300', gaugeColor: '#facc15', summary: '存一定风险，建议微调' }
        : { textColor: 'text-emerald-400', gaugeColor: '#34d399', summary: '内容相对安全，可直接发布' }

  async function handleScan() {
    if (!canScan) {
      return
    }

    await runWithQuota(
      {
        tool: 'xhs_risk_scanner',
        action: 'scan',
        preview: text.trim().slice(0, 120),
      },
      async () => {
        setIsLoading(true)
        setError('')

        try {
          const inputSnapshot = text
          const response = await fetch('/api/xhs-risk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: inputSnapshot }),
          })

          const data = await response.json()
          if (!response.ok) {
            throw new Error(data?.error || '扫描失败，请稍后重试。')
          }

          setScanResult({
            scannedText: inputSnapshot,
            score: Number(data.score) || 0,
            flaggedWords: Array.isArray(data.flagged_words) ? data.flagged_words : [],
            optimizedText: typeof data.optimized_text === 'string' ? data.optimized_text : '',
          })
        } catch (requestError) {
          setError(requestError.message || '请求失败，请检查网络与配置。')
        } finally {
          setIsLoading(false)
        }
      }
    )
  }

  function renderHighlightedText(content) {
    if (!content.trim()) {
      return <p className="text-sm text-zinc-500">请先在左侧输入待测文案。</p>
    }

    if (!scanResult.flaggedWords.length) {
      return <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{content}</p>
    }

    const words = [...new Set(scanResult.flaggedWords.map((item) => item.word).filter(Boolean))].sort(
      (a, b) => b.length - a.length
    )
    if (!words.length) {
      return <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{content}</p>
    }

    const regex = new RegExp(`(${words.map((word) => escapeRegExp(word)).join('|')})`, 'g')
    const parts = content.split(regex)

    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
        {parts.map((part, index) => {
          const meta = flaggedMap.get(part)
          if (!meta) {
            return <span key={`${part}-${index}`}>{part}</span>
          }

          const isCritical = meta.type === 'critical'
          const chipClass = isCritical
            ? 'bg-red-900/30 text-red-300 decoration-red-300'
            : 'bg-yellow-900/30 text-yellow-300 decoration-yellow-300'

          return (
            <span
              key={`${part}-${index}`}
              className={`group relative mx-[1px] rounded px-1 underline decoration-wavy ${chipClass}`}
            >
              {part}
              <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden min-w-[220px] max-w-[320px] rounded-md border border-zinc-700 bg-[#121418] px-3 py-2 text-xs leading-relaxed text-zinc-100 shadow-lg group-hover:block">
                {meta.reason}
              </span>
            </span>
          )
        })}
      </p>
    )
  }

  return (
    <section className="rounded-xl border border-gray-900 bg-[#0A0B0E] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.015)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
        <h3 className="text-base font-semibold tracking-tight text-ink">小红书风险词扫描仪</h3>
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
          <div className="mb-4 flex h-8 items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">文案输入区</h4>
            <button type="button" onClick={handleScan} disabled={!canScan} className={ACTION_BUTTON_CLASS}>
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isLoading ? '扫描中...' : '执行扫描'}
            </button>
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="请粘贴你的小红书预发布文案..."
            className="flex-1 min-h-[360px] w-full resize-none rounded-lg border border-gray-700 bg-[#0C0D10] px-3 py-2.5 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
          />
        </article>

        <article className="flex h-full flex-col rounded-lg border border-gray-800 bg-surface-1 p-4">
          <div className="mb-3 flex h-8 items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">诊断看板</h4>
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              <ShieldAlert size={13} />
              实时风控
            </span>
          </div>

          <div className="flex-1 space-y-3">
            <div className="rounded-lg border border-gray-700 bg-[#090B10] p-3">
              <p className="text-xs text-zinc-500">风险指数</p>
              {isLoading ? (
                <div className="mt-2 h-16 animate-pulse rounded bg-zinc-800/70" />
              ) : (
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className="grid h-16 w-16 place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(${riskTone.gaugeColor} ${scanResult.score}%, #1f2937 ${scanResult.score}% 100%)`,
                    }}
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-[#090B10]">
                      <span className={`data-mono text-sm font-semibold ${riskTone.textColor}`}>
                        {Math.round(scanResult.score)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className={`data-mono text-3xl font-semibold ${riskTone.textColor}`}>
                      {Math.round(scanResult.score)}/100
                    </p>
                    <p className={`mt-1 text-xs ${riskTone.textColor}`}>
                      {riskTone.summary}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative rounded-lg border border-gray-700 bg-[#090B10] p-3">
              <p className="mb-2 text-xs text-zinc-500">高亮诊断区</p>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-800/80" />
                  <div className="h-4 w-10/12 animate-pulse rounded bg-zinc-800/70" />
                  <div className="h-4 w-9/12 animate-pulse rounded bg-zinc-800/60" />
                </div>
              ) : (
                <div className="data-mono">{renderHighlightedText(scanResult.scannedText)}</div>
              )}
            </div>

            <div className="rounded-lg border border-gray-700 bg-[#090B10] p-3">
              <p className="mb-2 text-xs text-zinc-500">改写建议</p>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-800/80" />
                  <div className="h-4 w-10/12 animate-pulse rounded bg-zinc-800/70" />
                  <div className="h-4 w-9/12 animate-pulse rounded bg-zinc-800/60" />
                </div>
              ) : error ? (
                <p className="inline-flex items-center gap-1 text-sm text-red-400">
                  <AlertTriangle size={14} />
                  {error}
                </p>
              ) : scanResult.optimizedText ? (
                <p className="data-mono whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {scanResult.optimizedText}
                </p>
              ) : (
                <p className="text-sm text-zinc-500">完成扫描后，这里会显示优化后的安全表达。</p>
              )}
            </div>
          </div>
        </article>
      </div>

      <p className="mt-4 text-center text-[11px] text-gray-600">
        本工具仅结合广告法、平台社区准则及 AI 语义识别进行自动评估，结果仅供参考，不代表平台最终审核结论。
      </p>
    </section>
  )
}
