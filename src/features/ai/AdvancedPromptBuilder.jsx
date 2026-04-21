import { useEffect, useMemo, useState } from 'react'
import { Copy, Loader2, Sparkles } from 'lucide-react'
import { useUsageAccess } from '../access/UsageAccessContext'

const TOOL_TAGS = ['模型调教', '结构化']
const ACTION_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border !border-[#FB923C] !bg-[#EA580C] px-2.5 py-1.5 text-xs font-semibold !text-white transition hover:!bg-[#F97316] disabled:cursor-not-allowed disabled:!border-[#FB923C] disabled:!bg-[#EA580C] disabled:!text-white disabled:opacity-100 disabled:brightness-90'
const INITIAL_PLACEHOLDER = `# Role: 资深小红书爆款内容运营专家
# Background: 面向女大学生群体，推广主打平价与熬夜修护的护肤产品。
# Task: 撰写一篇具有高吸引力和强互动性的种草文案。
# Rules:
1. 标题必须提供情绪价值，并包含吸引眼球的 Emoji。
2. 正文采用分段式排版，模拟闺蜜聊天的亲切口吻。
3. 总字数严格控制在 300 字以内。
4. 结尾设置提问以引导用户在评论区互动。`

export function AdvancedPromptBuilder() {
  const { runWithQuota } = useUsageAccess()
  const [coreNeed, setCoreNeed] = useState('')
  const [constraints, setConstraints] = useState('')
  const [output, setOutput] = useState('')
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

  const canSubmit = useMemo(() => coreNeed.trim().length > 0 && !isLoading, [coreNeed, isLoading])

  async function handleGenerate() {
    if (!canSubmit) {
      return
    }

    await runWithQuota(
      {
        tool: 'advanced_prompt_builder',
        action: 'generate',
        preview: coreNeed.trim().slice(0, 120),
      },
      async () => {
        setIsLoading(true)
        setError('')
        setOutput('')

        try {
          const response = await fetch('/api/advanced-prompt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              coreNeed,
              constraints,
            }),
          })

          const data = await response.json()
          if (!response.ok) {
            throw new Error(data?.error || 'Prompt 生成失败，请稍后重试。')
          }

          setOutput(data.prompt || '')
        } catch (requestError) {
          setError(requestError.message || '请求失败，请检查网络与配置。')
        } finally {
          setIsLoading(false)
        }
      }
    )
  }

  async function handleCopy() {
    if (!output || isLoading) {
      return
    }

    await navigator.clipboard.writeText(output)
    setCopied(true)
  }

  return (
    <section className="rounded-xl border border-gray-900 bg-[#0A0B0E] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.015)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
        <h3 className="text-base font-semibold tracking-tight text-ink">高质量 Prompt 生成器</h3>
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
            <h4 className="text-sm font-semibold text-ink">要求</h4>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canSubmit}
              className={ACTION_BUTTON_CLASS}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isLoading ? '正在重构 Prompt...' : '执行生成'}
            </button>
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">核心诉求</label>
              <textarea
                value={coreNeed}
                onChange={(event) => setCoreNeed(event.target.value)}
                placeholder="例如：帮我写一个小红书的护肤品推文，面向女大学生，主打平价和熬夜修护，语气要像闺蜜一样。"
                className="h-40 w-full resize-none rounded-lg border border-gray-700 bg-[#0C0D10] px-3 py-2.5 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-500">特定限制（选填）</label>
              <input
                value={constraints}
                onChange={(event) => setConstraints(event.target.value)}
                placeholder="例如：字数不超过 300 字"
                className="h-10 w-full rounded-lg border border-gray-700 bg-[#0C0D10] px-3 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
              />
            </div>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-lg border border-gray-800 bg-surface-1 p-4">
          <div className="mb-3 flex h-8 items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">提示词</h4>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!output || isLoading}
              className={ACTION_BUTTON_CLASS}
            >
              <Copy size={14} />
              {copied ? '已复制' : '一键复制'}
            </button>
          </div>
          <div className="mb-1 h-5" />

          <div className="flex-1 min-h-[364px] rounded-lg border border-gray-700 bg-[#090B10] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            {isLoading && (
              <div className="space-y-2 pt-1">
                <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-800/80" />
                <div className="h-4 w-10/12 animate-pulse rounded bg-zinc-800/70" />
                <div className="h-4 w-9/12 animate-pulse rounded bg-zinc-800/60" />
                <div className="h-4 w-8/12 animate-pulse rounded bg-zinc-800/50" />
              </div>
            )}

            {!isLoading && error && <p className="text-sm text-red-400">{error}</p>}

            {!isLoading && !error && output && (
              <pre className="data-mono whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                {output}
              </pre>
            )}

            {!isLoading && !error && !output && (
              <pre className="data-mono whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-500">
                {INITIAL_PLACEHOLDER}
              </pre>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
