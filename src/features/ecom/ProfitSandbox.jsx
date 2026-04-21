import { useMemo, useState } from 'react'

const TOOL_TAGS = ['财务分析', '决策']

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function calculateMetrics(params) {
  const purchaseCost = parseNumber(params.purchaseCost)
  const shippingCost = parseNumber(params.shippingCost)
  const platformRatePct = parseNumber(params.platformRatePct)
  const adRatePct = parseNumber(params.adRatePct)
  const returnRatePct = parseNumber(params.returnRatePct)
  const price = parseNumber(params.price)

  const platformRate = platformRatePct / 100
  const adRate = adRatePct / 100
  const returnRate = returnRatePct / 100

  const platformFee = price * platformRate
  const adFee = price * adRate
  const actualCost =
    purchaseCost + shippingCost + shippingCost * returnRate + price * 0.01 * returnRatePct
  const netProfit = price - actualCost - platformFee - adFee
  const grossMargin = price > 0 ? (netProfit / price) * 100 : 0

  const fixedCost = purchaseCost + shippingCost * (1 + returnRate)
  const denominator = 1 - returnRate - platformRate - adRate
  const breakevenPrice = denominator > 0 ? fixedCost / denominator : Infinity

  return {
    netProfit,
    grossMargin,
    breakevenPrice,
  }
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix = '',
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-zinc-500">{label}</label>
        <span className="data-mono text-xs text-zinc-400">
          {value}
          {suffix}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          min={min}
          max={max}
          step={step}
          className="data-mono h-9 w-24 rounded-md border border-gray-700 bg-[#0C0D10] px-2 text-xs text-ink outline-none transition focus:border-stroke-glow"
        />
        <input
          type="range"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          min={min}
          max={max}
          step={step}
          className="h-1.5 w-full cursor-pointer appearance-none rounded bg-[#1B1E25] accent-orange"
        />
      </div>
    </div>
  )
}

export function ProfitSandbox() {
  const [form, setForm] = useState({
    purchaseCost: 28,
    shippingCost: 6,
    platformRatePct: 0.6,
    adRatePct: 8,
    returnRatePct: 10,
    price: 59,
  })

  const metrics = useMemo(() => calculateMetrics(form), [form])

  const isProfitPositive = metrics.netProfit >= 0
  const valueColor = isProfitPositive ? 'text-orange' : 'text-red-400'
  const barColor = isProfitPositive ? 'bg-orange' : 'bg-red-500'
  const profitRatio = clamp(Math.abs(metrics.grossMargin), 0, 100)

  function updateField(key, nextValue) {
    setForm((prev) => ({
      ...prev,
      [key]: nextValue,
    }))
  }

  return (
    <section className="rounded-xl border border-gray-900 bg-[#0A0B0E] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.015)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
        <h3 className="text-base font-semibold tracking-tight text-ink">利润动态沙盘</h3>
        <div className="flex flex-wrap items-center gap-2">
          {TOOL_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
        <article className="flex h-full flex-col rounded-lg border border-gray-800 bg-surface-1 p-4">
          <div className="mb-4 h-8">
            <h4 className="text-sm font-semibold text-ink">参数调整区</h4>
          </div>

          <div className="space-y-3">
            <SliderField
              label="采购单价 (CNY)"
              value={form.purchaseCost}
              onChange={(v) => updateField('purchaseCost', v)}
              min={0}
              max={500}
              step={0.5}
            />
            <SliderField
              label="单件物流费"
              value={form.shippingCost}
              onChange={(v) => updateField('shippingCost', v)}
              min={0}
              max={100}
              step={0.5}
            />
            <SliderField
              label="平台抽成 (%)"
              value={form.platformRatePct}
              onChange={(v) => updateField('platformRatePct', v)}
              min={0}
              max={20}
              step={0.1}
              suffix="%"
            />
            <SliderField
              label="推广投入 (%)"
              value={form.adRatePct}
              onChange={(v) => updateField('adRatePct', v)}
              min={0}
              max={60}
              step={0.1}
              suffix="%"
            />
            <SliderField
              label="预估退货率 (%)"
              value={form.returnRatePct}
              onChange={(v) => updateField('returnRatePct', v)}
              min={0}
              max={50}
              step={0.1}
              suffix="%"
            />
            <SliderField
              label="预售定价 (CNY)"
              value={form.price}
              onChange={(v) => updateField('price', v)}
              min={1}
              max={999}
              step={0.5}
            />
          </div>
        </article>

        <article className="flex h-full flex-col rounded-lg border border-gray-800 bg-surface-1 p-4">
          <div className="mb-4 h-8">
            <h4 className="text-sm font-semibold text-ink">动态反馈看板</h4>
          </div>

          <div className="flex-1 rounded-lg border border-gray-700 bg-[#090B10] p-4">
            <p className="text-xs text-zinc-500">预计单笔净利</p>
            <p className={`data-mono mt-1 text-4xl font-semibold tracking-tight ${valueColor}`}>
              ¥ {metrics.netProfit.toFixed(2)}
            </p>

            <p className="mt-5 text-xs text-zinc-500">毛利率</p>
            <p className={`data-mono mt-1 text-3xl font-semibold ${valueColor}`}>
              {metrics.grossMargin.toFixed(2)}%
            </p>

            <p className="data-mono mt-5 text-xs text-zinc-500">
              保本售价：
              {Number.isFinite(metrics.breakevenPrice) ? `¥ ${metrics.breakevenPrice.toFixed(2)}` : '无法计算'}
            </p>

            <div className="mt-3 h-1.5 overflow-hidden rounded bg-[#1A1D24]">
              <div className={`h-full ${barColor}`} style={{ width: `${profitRatio}%` }} />
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
