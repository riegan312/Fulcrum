import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const GUEST_QUOTA_KEY = 'guest_quota'
const GUEST_HISTORY_KEY = 'guest_history'
const AUTH_SESSION_KEY = 'fulcrum_auth_session'
const USER_HISTORY_STORE_KEY = 'fulcrum_user_history_store'
const ADMIN_TOKEN_KEY = 'FULCRUM_ADMIN_TOKEN'
const ADMIN_TOKEN_VALUE = 'MASTER_OF_LEVER'
const DEFAULT_GUEST_QUOTA = 5
const DEFAULT_REGISTER_BONUS = 10

const UsageAccessContext = createContext(null)

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return fallback
    }
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function normalizeQuota(value, fallback) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }
  return Math.floor(parsed)
}

function hasAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) === ADMIN_TOKEN_VALUE
}

function ensureGuestQuota() {
  const quota = normalizeQuota(localStorage.getItem(GUEST_QUOTA_KEY), DEFAULT_GUEST_QUOTA)
  localStorage.setItem(GUEST_QUOTA_KEY, String(quota))
  return quota
}

function appendHistory(storeKey, entry, uid = '') {
  const payload = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    ...entry,
  }

  if (storeKey === GUEST_HISTORY_KEY) {
    const history = readJson(GUEST_HISTORY_KEY, [])
    writeJson(GUEST_HISTORY_KEY, [...history, payload].slice(-300))
    return
  }

  const allUsers = readJson(USER_HISTORY_STORE_KEY, {})
  const current = Array.isArray(allUsers[uid]) ? allUsers[uid] : []
  allUsers[uid] = [...current, payload].slice(-500)
  writeJson(USER_HISTORY_STORE_KEY, allUsers)
}

export function UsageAccessProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState('')
  const [accountQuota, setAccountQuota] = useState(DEFAULT_REGISTER_BONUS)
  const [guestQuota, setGuestQuota] = useState(DEFAULT_GUEST_QUOTA)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)

  useEffect(() => {
    setIsAdminMode(hasAdminToken())

    const session = readJson(AUTH_SESSION_KEY, null)
    if (session?.uid) {
      setIsAuthenticated(true)
      setUserId(String(session.uid))
      setAccountQuota(normalizeQuota(session.accountQuota, DEFAULT_REGISTER_BONUS))
      return
    }

    setIsAuthenticated(false)
    setUserId('')
    setAccountQuota(DEFAULT_REGISTER_BONUS)
    setGuestQuota(ensureGuestQuota())
  }, [])

  useEffect(() => {
    function syncAdminMode() {
      setIsAdminMode(hasAdminToken())
    }

    window.addEventListener('storage', syncAdminMode)
    window.addEventListener('focus', syncAdminMode)
    return () => {
      window.removeEventListener('storage', syncAdminMode)
      window.removeEventListener('focus', syncAdminMode)
    }
  }, [])

  async function deductAccountQuota() {
    const response = await fetch('/api/account/quota/deduct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid: userId }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.error || '账号额度不足，请稍后重试。')
    }

    const nextQuota = normalizeQuota(data?.remaining, 0)
    setAccountQuota(nextQuota)
    writeJson(AUTH_SESSION_KEY, { uid: userId, accountQuota: nextQuota })
  }

  async function runWithQuota(meta, task) {
    const entry = typeof meta === 'object' && meta ? meta : {}

    if (hasAdminToken()) {
      setIsAdminMode(true)
      console.info('Admin Mode: Quota bypassed')
      await task()
      appendHistory(GUEST_HISTORY_KEY, { ...entry, source: 'admin_bypass' })
      return true
    }

    if (isAuthenticated && userId) {
      await deductAccountQuota()
      await task()
      appendHistory(USER_HISTORY_STORE_KEY, { ...entry, source: 'account' }, userId)
      return true
    }

    const current = normalizeQuota(guestQuota, 0)
    if (current <= 0) {
      setIsAuthModalOpen(true)
      return false
    }

    const next = current - 1
    setGuestQuota(next)
    localStorage.setItem(GUEST_QUOTA_KEY, String(next))
    appendHistory(GUEST_HISTORY_KEY, { ...entry, source: 'guest', quotaBefore: current, quotaAfter: next })
    await task()
    return true
  }

  function completeGuestRegistration() {
    const uid = `uid_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const guestHistory = readJson(GUEST_HISTORY_KEY, [])
    const allUsers = readJson(USER_HISTORY_STORE_KEY, {})
    const existing = Array.isArray(allUsers[uid]) ? allUsers[uid] : []
    allUsers[uid] = [...existing, ...guestHistory].slice(-500)
    writeJson(USER_HISTORY_STORE_KEY, allUsers)

    localStorage.removeItem(GUEST_HISTORY_KEY)
    writeJson(AUTH_SESSION_KEY, { uid, accountQuota: DEFAULT_REGISTER_BONUS })

    setUserId(uid)
    setAccountQuota(DEFAULT_REGISTER_BONUS)
    setIsAuthenticated(true)
    setIsAuthModalOpen(false)
  }

  function logout() {
    localStorage.removeItem(AUTH_SESSION_KEY)
    setIsAuthenticated(false)
    setUserId('')
    setAccountQuota(DEFAULT_REGISTER_BONUS)
    setGuestQuota(ensureGuestQuota())
  }

  const value = useMemo(
    () => ({
      isAuthenticated,
      isAdminMode,
      userId,
      accountQuota,
      guestQuota,
      isAuthModalOpen,
      openAuthModal: () => setIsAuthModalOpen(true),
      closeAuthModal: () => setIsAuthModalOpen(false),
      completeGuestRegistration,
      runWithQuota,
      logout,
    }),
    [isAuthenticated, isAdminMode, userId, accountQuota, guestQuota, isAuthModalOpen]
  )

  return <UsageAccessContext.Provider value={value}>{children}</UsageAccessContext.Provider>
}

export function useUsageAccess() {
  const context = useContext(UsageAccessContext)
  if (!context) {
    throw new Error('useUsageAccess must be used within UsageAccessProvider.')
  }
  return context
}
