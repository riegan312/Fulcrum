import { LogIn, LogOut } from 'lucide-react'
import { SidebarNavItem } from '../navigation/SidebarNavItem'
import { useUsageAccess } from '../../features/access/UsageAccessContext'

export function Sidebar({ categories, activeCategoryId, onCategoryChange }) {
  const { isAuthenticated, isAdminMode, guestQuota, accountQuota, openAuthModal, logout } =
    useUsageAccess()
  const isLastTrial = !isAuthenticated && guestQuota === 1

  return (
    <aside className="panel flex w-full flex-col p-4 lg:h-full lg:w-[260px]">
      <div className="border-b border-stroke-soft pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
            <img src="/fulcrum-mark.svg" alt="Fulcrum Logo" className="h-8 w-8 object-contain" />
          </div>
          <h1 className="flex items-center gap-2.5 leading-none">
            <span className="brand-cn text-[1.42rem] leading-none tracking-[-0.02em] text-white">支点</span>
            <span className="brand-en translate-y-[1px] text-[1.12rem] leading-none tracking-[0.05em] text-zinc-400">
              Fulcrum
            </span>
          </h1>
        </div>
      </div>

      <nav className="mt-4 grid flex-1 grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
        {categories.map((category) => (
          <SidebarNavItem
            key={category.id}
            icon={category.icon}
            label={category.label}
            active={activeCategoryId === category.id}
            onClick={() => onCategoryChange(category.id)}
          />
        ))}
      </nav>

      <div className="panel mt-4 rounded-lg border-stroke-glow bg-surface-2/70 p-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-stroke-soft" />
          <div className="min-w-0 flex-1">
            {isAdminMode ? (
              <>
                <p className="truncate text-sm font-medium text-ink">管理员模式</p>
                <p className="data-mono text-xs text-[#EA580C]">Archimedes ∞</p>
              </>
            ) : isAuthenticated ? (
              <>
                <p className="truncate text-sm font-medium text-ink">已登录用户</p>
                <p className="data-mono text-xs text-ink-dim">
                  账号额度剩余：{String(accountQuota).padStart(3, '0')} 次
                </p>
              </>
            ) : (
              <>
                <p className="truncate text-sm font-medium text-ink">访客模式</p>
                <p
                  className={`data-mono text-xs ${
                    isLastTrial ? 'animate-pulse text-[#EA580C]' : 'text-zinc-500'
                  }`}
                >
                  试用额度剩余：{guestQuota} 次
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={isAuthenticated ? logout : openAuthModal}
            className="rounded-md p-1.5 text-ink-dim transition-colors hover:bg-surface-1 hover:text-ink"
            aria-label={isAuthenticated ? 'Logout' : 'Login'}
          >
            {isAuthenticated ? <LogOut size={16} /> : <LogIn size={16} />}
          </button>
        </div>
      </div>
    </aside>
  )
}
