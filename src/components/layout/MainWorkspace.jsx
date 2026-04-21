import { Header } from './Header'
import { ToolGrid } from '../tools/ToolGrid'
import { CATEGORY_WORKSPACES } from '../../features/registry/workspaceRegistry'

export function MainWorkspace({ currentCategoryId, currentCategoryLabel, tools }) {
  const WorkspaceComponent = CATEGORY_WORKSPACES[currentCategoryId]

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-3">
      <Header />
      <section className="panel flex-1 p-4">
        <div className="mb-4 flex items-center justify-between border-b border-stroke-soft pb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-ink-dim">Category</p>
            <h2 className="mt-1 text-base font-semibold text-ink">{currentCategoryLabel}</h2>
          </div>
          <p className="text-xs text-zinc-500">任何人都能撬动地球。</p>
        </div>

        {WorkspaceComponent ? <WorkspaceComponent /> : <ToolGrid tools={tools} />}
      </section>
    </main>
  )
}
