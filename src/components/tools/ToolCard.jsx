export function ToolCard({ tool }) {
  return (
    <article className="panel subtle-grid p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">{tool.name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-dim">{tool.description}</p>
        </div>
        <span className="data-mono rounded-md border border-stroke-glow px-2 py-1 text-[10px] uppercase tracking-wide text-orange">
          {tool.status}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-stroke-soft pt-3">
        <span className="text-xs text-ink-dim">Usage</span>
        <span className="data-mono text-xs text-ink">{String(tool.usage).padStart(3, '0')}</span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-ink-dim">Quota</span>
        <span className="data-mono text-xs text-ink">{String(tool.quota).padStart(3, '0')}</span>
      </div>
    </article>
  )
}
