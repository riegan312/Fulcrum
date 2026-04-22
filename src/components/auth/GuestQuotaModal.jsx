import { Lock, Sparkles } from 'lucide-react'
import { useState } from 'react'

export function GuestQuotaModal({ open, onClose, onConfirm }) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) {
    return null
  }

  async function handleVerify() {
    const nextCode = code.trim()
    if (!/^\d{6}$/.test(nextCode)) {
      setError('请输入 6 位数字验证码。')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/wechat-code/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: nextCode }),
      })
      const data = await response.json()

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || '验证码校验失败。')
      }

      onConfirm()
      setCode('')
      setError('')
    } catch (requestError) {
      setError(requestError.message || '验证失败，请稍后重试。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-[#0B0C10] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600/20 text-orange-400">
          <Lock size={18} />
        </div>

        <h3 className="text-lg font-semibold text-ink">设备免费额度已用完</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          请先关注公众号并发送“验证码”，收到 6 位数字后填入下方。验证通过后即可注册并继续使用。
        </p>

        <div className="mt-4 rounded-lg border border-gray-800 bg-[#0E1015] p-3">
          <img
            src="/wechat-verify-qr.jpg"
            alt="公众号二维码"
            className="mx-auto h-48 w-48 rounded-md border border-gray-700 object-cover"
          />
          <p className="mt-2 text-center text-xs text-zinc-500">
            微信扫码关注后，发送“验证码”
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs text-zinc-500">微信验证码</label>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="请输入 6 位数字"
            className="data-mono h-10 w-full rounded-md border border-gray-700 bg-[#12141A] px-3 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-orange-500"
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onClose()
              setCode('')
              setError('')
            }}
            className="rounded-md border border-gray-700 bg-[#12141A] px-3 py-2 text-sm text-zinc-300 transition hover:bg-[#171A21] hover:text-ink"
          >
            稍后再说
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-orange-400 bg-[#EA580C] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#F97316] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Sparkles size={14} />
            {isLoading ? '验证中...' : '验证并注册'}
          </button>
        </div>
      </div>
    </div>
  )
}
