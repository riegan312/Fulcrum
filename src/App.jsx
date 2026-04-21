import { useMemo, useState } from 'react'
import { GuestQuotaModal } from './components/auth/GuestQuotaModal'
import { Sidebar } from './components/layout/Sidebar'
import { MainWorkspace } from './components/layout/MainWorkspace'
import { CATEGORIES, DEFAULT_CATEGORY_ID } from './data/navigation'
import { TOOLS_BY_CATEGORY } from './data/tools'
import { UsageAccessProvider, useUsageAccess } from './features/access/UsageAccessContext'

function AppLayout() {
  const [activeCategoryId, setActiveCategoryId] = useState(DEFAULT_CATEGORY_ID)
  const { isAuthModalOpen, closeAuthModal, completeGuestRegistration } = useUsageAccess()

  const currentCategory = useMemo(
    () => CATEGORIES.find((category) => category.id === activeCategoryId) ?? CATEGORIES[0],
    [activeCategoryId]
  )

  const tools = TOOLS_BY_CATEGORY[activeCategoryId] ?? []

  return (
    <div className="h-full bg-abyss p-3 text-ink">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-3 lg:flex-row">
        <Sidebar
          categories={CATEGORIES}
          activeCategoryId={activeCategoryId}
          onCategoryChange={setActiveCategoryId}
        />
        <MainWorkspace
          currentCategoryId={activeCategoryId}
          currentCategoryLabel={currentCategory.label}
          tools={tools}
        />
      </div>

      <GuestQuotaModal
        open={isAuthModalOpen}
        onClose={closeAuthModal}
        onConfirm={completeGuestRegistration}
      />
    </div>
  )
}

function App() {
  return (
    <UsageAccessProvider>
      <AppLayout />
    </UsageAccessProvider>
  )
}

export default App
