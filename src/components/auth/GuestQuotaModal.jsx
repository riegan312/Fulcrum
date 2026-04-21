import { Lock, Sparkles } from 'lucide-react'

export function GuestQuotaModal({ open, onClose, onConfirm }) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-[#0B0C10] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600/20 text-orange-400">
          <Lock size={18} />
        </div>

        <h3 className="text-lg font-semibold text-ink">设备免费额度已用完</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          为了防止 API 被恶意消耗，请登录后继续使用。注册即送 10 次额外额度，并可跨设备同步您的所有记录。
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-700 bg-[#12141A] px-3 py-2 text-sm text-zinc-300 transition hover:bg-[#171A21] hover:text-ink"
          >
            稍后再说
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-md border border-orange-400 bg-[#EA580C] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#F97316]"
          >
            <Sparkles size={14} />
            登录/注册并继续
          </button>
        </div>
      </div>
    </div>
  )
}

