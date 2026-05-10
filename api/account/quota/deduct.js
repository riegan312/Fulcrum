const DEFAULT_ACCOUNT_QUOTA = 10
const quotaStore = new Map()

function normalizeQuota(value, fallback = 0) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }
  return Math.floor(parsed)
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const uid = typeof req.body?.uid === 'string' ? req.body.uid.trim() : ''
  if (!uid) {
    return res.status(400).json({ error: 'uid is required.' })
  }

  const current = quotaStore.has(uid)
    ? normalizeQuota(quotaStore.get(uid), 0)
    : DEFAULT_ACCOUNT_QUOTA

  if (current <= 0) {
    return res.status(402).json({ error: '账号额度已用完，请升级 Fulcrum PRO。', remaining: 0 })
  }

  const next = current - 1
  quotaStore.set(uid, next)
  return res.status(200).json({ remaining: next })
}

