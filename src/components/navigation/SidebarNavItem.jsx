export function SidebarNavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
        active
          ? 'border-stroke-glow bg-surface-2 text-ink'
          : 'border-transparent text-ink-dim hover:border-stroke-soft hover:bg-surface-2/60 hover:text-ink'
      }`}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-orange" />}
      <Icon size={16} className={active ? 'text-orange' : 'text-ink-dim group-hover:text-ink'} />
      <span className="font-medium">{label}</span>
    </button>
  )
}
