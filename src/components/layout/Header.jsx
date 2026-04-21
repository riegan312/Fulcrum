import { Lock, Search } from 'lucide-react'

export function Header() {
  return (
    <header className="panel flex items-center justify-between gap-4 p-3">
      <label className="group flex max-w-xl flex-1 items-center gap-3 rounded-lg border border-stroke-soft bg-surface-2 px-3 py-2.5">
        <Search size={16} className="text-ink-dim" />
        <input
          readOnly
          value=""
          placeholder="搜索工具或标签"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-dim/80 focus:outline-none"
        />
        <span className="data-mono rounded-md border border-stroke-soft px-2 py-1 text-[11px] leading-none text-ink-dim">
          Cmd+K
        </span>
      </label>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-orange/70 bg-orange px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-95"
      >
        <Lock size={15} />
        升级 Fulcrum PRO
      </button>
    </header>
  )
}
