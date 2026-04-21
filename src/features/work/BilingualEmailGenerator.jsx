import { useEffect, useMemo, useState } from 'react'
import { Copy, Loader2, Sparkles } from 'lucide-react'
import { useUsageAccess } from '../access/UsageAccessContext'

const TOOL_TAGS = ['社交', '沟通']
const ACTION_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border !border-[#FB923C] !bg-[#EA580C] px-2.5 py-1.5 text-xs font-semibold !text-white transition hover:!bg-[#F97316] disabled:cursor-not-allowed disabled:!border-[#FB923C] disabled:!bg-[#EA580C] disabled:!text-white disabled:opacity-100 disabled:brightness-90'

const EXAMPLE_EMAILS = {
  zh: '尊敬的王女士，\n\n您好！\n\n关于明天的线上会议，由于日程冲突，不知能否调整至下午三点进行？\n\n期待您的回复。\n\n李华',
  en: "Dear Ms. Wang,\n\nI hope this email finds you well. Regarding tomorrow's online meeting, would it be possible to reschedule it to 3:00 PM?\n\nLooking forward to your reply.\n\nBest regards,\nLi Hua",
}

export function BilingualEmailGenerator() {
  const { runWithQuota } = useUsageAccess()
  const [recipient, setRecipient] = useState('')
  const [content, setContent] = useState('')
  const [sender, setSender] = useState('')
  const [language, setLanguage] = useState('zh')
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

  const canSubmit = useMemo(() => {
    return recipient.trim() && content.trim() && sender.trim() && !isLoading
  }, [recipient, content, sender, isLoading])

  const placeholderOutput = EXAMPLE_EMAILS[language]

  async function handleGenerate() {
    if (!canSubmit) {
      return
    }

    await runWithQuota(
      {
        tool: 'bilingual_email_generator',
        action: 'generate',
        preview: content.trim().slice(0, 120),
      },
      async () => {
        setIsLoading(true)
        setError('')
        setOutput('')

        try {
          const response = await fetch('/api/bilingual-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recipient,
              content,
              sender,
              language,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data?.error || '邮件生成失败，请稍后重试。')
          }

          setOutput(data.email || '')
        } catch (requestError) {
          setError(requestError.message || '请求失败，请检查网络和配置。')
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
        <h3 className="text-base font-semibold tracking-tight text-ink">双语邮件生成器</h3>
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
          <div className="mb-3 flex h-8 items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">基本信息</h4>
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

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">收件人</label>
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="例如：王女士"
                className="h-10 w-full rounded-lg border border-gray-700 bg-[#0C0D10] px-3 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-500">邮件核心内容</label>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="例如：明天的线上会议能不能改成下午三点"
                className="h-36 w-full resize-none rounded-lg border border-gray-700 bg-[#0C0D10] px-3 py-2.5 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-500">发件人</label>
              <input
                value={sender}
                onChange={(event) => setSender(event.target.value)}
                placeholder="例如：李华"
                className="h-10 w-full rounded-lg border border-gray-700 bg-[#0C0D10] px-3 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-500">语言</label>
              <div className="inline-flex rounded-full border border-gray-700 bg-[#101116] p-1">
                <button
                  type="button"
                  onClick={() => setLanguage('zh')}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    language === 'zh' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-ink'
                  }`}
                >
                  中文
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    language === 'en' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-ink'
                  }`}
                >
                  英文
                </button>
              </div>
            </div>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-lg border border-gray-800 bg-surface-1 p-4">
          <div className="mb-3 flex h-8 items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">邮件正文</h4>
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

          <div className="flex-1 min-h-[292px] rounded-lg border border-gray-700 bg-[#0B0C10] p-3">
            {isLoading && (
              <div className="space-y-2 pt-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800/80" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-800/70" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800/60" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800/50" />
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
                {placeholderOutput}
              </pre>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
