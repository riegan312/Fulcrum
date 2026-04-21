import { useEffect, useMemo, useState } from 'react'
import { Copy, Loader2, Sparkles } from 'lucide-react'
import { useUsageAccess } from '../access/UsageAccessContext'

const INITIAL_HINT = '=IF(A1>100, SUM(C:C), "")'
const TOOL_TAGS = ['办公软件', '效率', '数据']
const ACTION_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border !border-[#FB923C] !bg-[#EA580C] px-2.5 py-1.5 text-xs font-semibold !text-white transition hover:!bg-[#F97316] disabled:cursor-not-allowed disabled:!border-[#FB923C] disabled:!bg-[#EA580C] disabled:!text-white disabled:opacity-100 disabled:brightness-90'

export function ExcelFormulaConverter() {
  const { runWithQuota } = useUsageAccess()
  const [input, setInput] = useState('')
  const [formula, setFormula] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return undefined
    }

    const timer = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(timer)
  }, [copied])

  const canSubmit = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading])

  async function handleGenerate() {
    if (!canSubmit) {
      return
    }

    await runWithQuota(
      {
        tool: 'excel_formula_converter',
        action: 'generate',
        preview: input.trim().slice(0, 120),
      },
      async () => {
        setIsLoading(true)
        setError('')
        setFormula('')

        try {
          const response = await fetch('/api/excel-formula', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data?.error || '公式生成失败，请稍后重试。')
          }

          setFormula(data.formula || '')
        } catch (requestError) {
          setError(requestError.message || '请求失败，请检查网络和配置。')
        } finally {
          setIsLoading(false)
        }
      }
    )
  }

  async function handleCopy() {
    if (!formula || isLoading) {
      return
    }

    await navigator.clipboard.writeText(formula)
    setCopied(true)
  }

  return (
    <section className="rounded-xl border border-gray-900 bg-[#0A0B0E] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.015)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
        <h3 className="text-base font-semibold tracking-tight text-ink">Excel 公式转换器</h3>
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

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <article className="flex h-full flex-col rounded-lg border border-gray-800 bg-surface-1 p-4">
          <div className="mb-3 flex h-8 items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">要求</h4>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canSubmit}
              className={ACTION_BUTTON_CLASS}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isLoading ? '演算中...' : '执行生成'}
            </button>
          </div>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="例如：如果 A1 大于 100，就计算 C 列总和。"
            className="h-72 w-full resize-none rounded-lg border border-gray-700 bg-[#0C0D10] px-3 py-2.5 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
          />
        </article>

        <article className="flex h-full flex-col rounded-lg border border-gray-800 bg-surface-1 p-4">
          <div className="mb-3 flex h-8 items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">公式</h4>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!formula || isLoading}
              className={ACTION_BUTTON_CLASS}
            >
              <Copy size={14} />
              {copied ? '已复制' : '一键复制'}
            </button>
          </div>

          <div className="min-h-72 rounded-lg border border-gray-700 bg-[#0B0C10] p-3">
            {isLoading && (
              <div className="space-y-2 pt-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800/80" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800/70" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800/60" />
              </div>
            )}

            {!isLoading && error && <p className="text-sm text-red-400">{error}</p>}

            {!isLoading && !error && formula && (
              <pre className="data-mono whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                {formula}
              </pre>
            )}

            {!isLoading && !error && !formula && (
              <p className="text-sm text-zinc-500">{INITIAL_HINT}</p>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
