import { ToolCard } from './ToolCard'

export function ToolGrid({ tools }) {
  if (!tools.length) {
    return null
  }

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </section>
  )
}
