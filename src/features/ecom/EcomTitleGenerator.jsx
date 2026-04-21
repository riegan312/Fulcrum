import { useEffect, useMemo, useState } from 'react'
import { Copy, Loader2, Sparkles } from 'lucide-react'
import { useUsageAccess } from '../access/UsageAccessContext'

const TOOL_TAGS = ['SEO', '海外', '搜索引擎', '流量']
const ACTION_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-md border !border-[#FB923C] !bg-[#EA580C] px-2.5 py-1.5 text-xs font-semibold !text-white transition hover:!bg-[#F97316] disabled:cursor-not-allowed disabled:!border-[#FB923C] disabled:!bg-[#EA580C] disabled:!text-white disabled:opacity-100 disabled:brightness-90'

const PLATFORMS = ['Amazon', 'Shopee', 'Lazada', 'TikTok Shop', 'AliExpress']
const LANGUAGES = [
  { code: 'en', label: '英语' },
  { code: 'fr', label: '法语' },
  { code: 'ja', label: '日语' },
  { code: 'ko', label: '韩语' },
  { code: 'de', label: '德语' },
  { code: 'es', label: '西语' },
  { code: 'pt', label: '葡语' },
  { code: 'ru', label: '俄语' },
  { code: 'th', label: '泰语' },
  { code: 'id', label: '印尼语' },
  { code: 'vi', label: '越南语' },
  { code: 'tl', label: '菲律宾语' },
]

const LANGUAGE_EXAMPLES = {
  en: {
    brand: 'AeroBreeze',
    product: 'Portable Neck Fan',
    feature: 'Bladeless 4000mAh Fast Charge',
    variant: 'White',
    hook: 'Beat Heat Instantly',
    benefit: 'Cool Down In 3 Seconds',
    seo: 'portable neck fan mini fan bladeless fan usb fan quiet fan wearable fan',
    tags: 'Ready Stock | COD | Local Seller',
    tail: 'for women men office travel outdoor summer hands-free rechargeable personal cooler',
  },
  fr: {
    brand: 'AeroBreeze',
    product: 'Ventilateur De Cou Portable',
    feature: 'Sans Pales 4000mAh Charge Rapide',
    variant: 'Blanc',
    hook: 'Fraîcheur Immédiate',
    benefit: 'Refroidit En 3 Secondes',
    seo: 'ventilateur cou portable mini ventilateur sans pales usb silencieux mains libres',
    tags: 'Ready Stock | COD | Local Seller',
    tail: 'pour voyage extérieur bureau été rechargeable personnel léger',
  },
  ja: {
    brand: 'AeroBreeze',
    product: '携帯用ネックファン',
    feature: '羽根なし 4000mAh 急速充電',
    variant: 'ホワイト',
    hook: '一瞬でひんやり',
    benefit: '3秒でクールダウン',
    seo: 'ネックファン 携帯扇風機 羽根なし USB 充電式 静音 ハンズフリー',
    tags: 'Ready Stock | COD | Local Seller',
    tail: '通勤 旅行 アウトドア 夏用 軽量 首掛け 扇風機',
  },
  ko: {
    brand: 'AeroBreeze',
    product: '휴대용 넥밴드 선풍기',
    feature: '무날개 4000mAh 고속충전',
    variant: '화이트',
    hook: '더위 즉시 해결',
    benefit: '3초 쿨링',
    seo: '넥밴드선풍기 휴대용선풍기 무날개 USB충전 저소음 핸즈프리',
    tags: 'Ready Stock | COD | Local Seller',
    tail: '출퇴근 여행 야외 여름용 개인용 경량',
  },
  de: {
    brand: 'AeroBreeze',
    product: 'Tragbarer Nackenventilator',
    feature: 'Bladeless 4000mAh Schnellladen',
    variant: 'Weiß',
    hook: 'Hitze Sofort Stoppen',
    benefit: 'Kühlt In 3 Sekunden',
    seo: 'nackenventilator tragbar mini ventilator bladeless usb leise freihändig',
    tags: 'Ready Stock | COD | Local Seller',
    tail: 'für reisen outdoor büro sommer persönlich wiederaufladbar',
  },
  es: {
    brand: 'AeroBreeze',
    product: 'Ventilador De Cuello Portátil',
    feature: 'Sin Aspas 4000mAh Carga Rápida',
    variant: 'Blanco',
    hook: 'Adiós Al Calor Ya',
    benefit: 'Enfría En 3 Segundos',
    seo: 'ventilador cuello portátil mini sin aspas usb silencioso manos libres',
    tags: 'Ready Stock | COD | Local Seller',
    tail: 'para viaje exterior oficina verano personal recargable',
  },
  pt: {
    brand: 'AeroBreeze',
    product: 'Ventilador De Pescoço Portátil',
    feature: 'Sem Hélices 4000mAh Carga Rápida',
    variant: 'Branco',
    hook: 'Refresque-se Agora',
    benefit: 'Resfria Em 3 Segundos',
    seo: 'ventilador pescoço portátil mini sem hélices usb silencioso mãos livres',
    tags: 'Ready Stock | COD | Local Seller',
    tail: 'para viagem externo escritório verão pessoal recarregável',
  },
  ru: {
    brand: 'AeroBreeze',
    product: 'Портативный Шейный Вентилятор',
    feature: 'Без Лопастей 4000mAh Быстрая Зарядка',
    variant: 'Белый',
    hook: 'Прохлада Сразу',
    benefit: 'Охлаждение За 3 Секунды',
    seo: 'шейный вентилятор портативный мини безлопастной usb тихий hands free',
    tags: 'Ready Stock | COD | Local Seller',
    tail: 'для путешествий улицы офиса лета персональный перезаряжаемый',
  },
  th: {
    brand: 'AeroBreeze',
    product: 'พัดลมคล้องคอแบบพกพา',
    feature: 'ไร้ใบพัด 4000mAh ชาร์จไว',
    variant: 'สีขาว',
    hook: 'คลายร้อนทันที',
    benefit: 'เย็นภายใน 3 วินาที',
    seo: 'พัดลมคล้องคอ พัดลมพกพา ไร้ใบพัด USB เงียบ แฮนด์ฟรี',
    tags: 'Ready Stock | COD | Local Seller',
    tail: 'เดินทาง กลางแจ้ง ออฟฟิศ หน้าร้อน แบบชาร์จได้',
  },
  id: {
    brand: 'AeroBreeze',
    product: 'Kipas Leher Portable',
    feature: 'Tanpa Baling 4000mAh Fast Charge',
    variant: 'Putih',
    hook: 'Sejuk Seketika',
    benefit: 'Dingin Dalam 3 Detik',
    seo: 'kipas leher portable mini tanpa baling usb senyap hands free',
    tags: 'Ready Stock | COD | Local Seller',
    tail: 'untuk travel outdoor kantor musim panas rechargeable',
  },
  vi: {
    brand: 'AeroBreeze',
    product: 'Quạt Đeo Cổ Cầm Tay',
    feature: 'Không Cánh 4000mAh Sạc Nhanh',
    variant: 'Trắng',
    hook: 'Mát Ngay Lập Tức',
    benefit: 'Làm Mát Trong 3 Giây',
    seo: 'quạt đeo cổ quạt mini không cánh usb êm tay rảnh tay',
    tags: 'Ready Stock | COD | Local Seller',
    tail: 'đi du lịch ngoài trời văn phòng mùa hè sạc lại',
  },
  tl: {
    brand: 'AeroBreeze',
    product: 'Portable Neck Fan',
    feature: 'Bladeless 4000mAh Fast Charge',
    variant: 'White',
    hook: 'Lamang Presko Agad',
    benefit: 'Cool In 3 Seconds',
    seo: 'portable neck fan mini fan bladeless usb fan tahimik hands free',
    tags: 'Ready Stock | COD | Local Seller',
    tail: 'para sa biyahe outdoor opisina tag-init rechargeable',
  },
}

function getPlaceholder(platform, language) {
  const p = LANGUAGE_EXAMPLES[language] || LANGUAGE_EXAMPLES.en

  if (platform === 'Amazon') {
    return `${p.brand} ${p.product}, ${p.feature}, ${p.variant}`
  }

  if (platform === 'TikTok Shop') {
    return `${p.hook} | ${p.benefit} | ${p.product} ✨`
  }

  if (platform === 'Shopee' || platform === 'Lazada') {
    return `${p.seo} 【${p.tags}】`
  }

  return `${p.product} ${p.feature} ${p.seo} ${p.tail}`
}

export function EcomTitleGenerator() {
  const { runWithQuota } = useUsageAccess()
  const [originalTitle, setOriginalTitle] = useState('')
  const [platform, setPlatform] = useState('Amazon')
  const [language, setLanguage] = useState('en')
  const [sellingPoints, setSellingPoints] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return undefined
    }

    const timer = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(timer)
  }, [copied])

  const canSubmit = useMemo(() => originalTitle.trim().length > 0 && !isLoading, [originalTitle, isLoading])

  async function handleGenerate() {
    if (!canSubmit) {
      return
    }

    await runWithQuota(
      {
        tool: 'ecom_title_generator',
        action: 'generate',
        preview: originalTitle.trim().slice(0, 120),
      },
      async () => {
        setIsLoading(true)
        setError('')
        setOutput('')

        try {
          const response = await fetch('/api/ecom-title', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originalTitle,
              platform,
              language,
              sellingPoints,
            }),
          })

          const data = await response.json()
          if (!response.ok) {
            throw new Error(data?.error || '标题生成失败，请稍后重试。')
          }

          setOutput(data.title || '')
        } catch (requestError) {
          setError(requestError.message || '请求失败，请检查网络与配置。')
        } finally {
          setIsLoading(false)
        }
      }
    )
  }

  async function handleCopy() {
    if (!output || isLoading) {
      return
    }

    await navigator.clipboard.writeText(output)
    setCopied(true)
  }

  return (
    <section className="rounded-xl border border-gray-900 bg-[#0A0B0E] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.015)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
        <h3 className="text-base font-semibold tracking-tight text-ink">外语标题生成器</h3>
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
          <div className="mb-4 flex h-8 items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">商品信息</h4>
            <button type="button" onClick={handleGenerate} disabled={!canSubmit} className={ACTION_BUTTON_CLASS}>
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isLoading ? '生成中...' : '执行生成'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">中文原标题</label>
              <textarea
                value={originalTitle}
                onChange={(event) => setOriginalTitle(event.target.value)}
                placeholder="例如：挂脖风扇"
                className="h-28 w-full resize-none rounded-lg border border-gray-700 bg-[#0C0D10] px-3 py-2.5 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-500">目标平台</label>
              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-700 bg-[#0C0D10] px-3 text-sm text-ink outline-none transition focus:border-stroke-glow"
              >
                {PLATFORMS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-500">目标语种</label>
              <div className="grid grid-cols-4 gap-2">
                {LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLanguage(item.code)}
                    className={`rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                      language === item.code
                        ? 'scale-[1.02] border-orange-300 bg-orange-600 text-white ring-1 ring-orange-300/50 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_16px_rgba(234,88,12,0.35)]'
                        : 'border-gray-700 bg-[#101116] text-zinc-300 hover:border-gray-600 hover:bg-[#151821]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-500">核心卖点（选填）</label>
              <input
                value={sellingPoints}
                onChange={(event) => setSellingPoints(event.target.value)}
                placeholder="例如：静音、无线、快充"
                className="h-10 w-full rounded-lg border border-gray-700 bg-[#0C0D10] px-3 text-sm text-ink placeholder:text-zinc-500 outline-none transition focus:border-stroke-glow"
              />
            </div>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-lg border border-gray-800 bg-surface-1 p-4">
          <div className="mb-3 flex h-8 items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">本地化标题</h4>
            <button type="button" onClick={handleCopy} disabled={!output || isLoading} className={ACTION_BUTTON_CLASS}>
              <Copy size={14} />
              {copied ? '已复制' : '一键复制'}
            </button>
          </div>
          <div className="mb-1 h-5" />

          <div className="flex-1 min-h-[330px] rounded-lg border border-gray-700 bg-[#090B10] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            {isLoading && (
              <div className="space-y-2 pt-1">
                <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-800/80" />
                <div className="h-4 w-10/12 animate-pulse rounded bg-zinc-800/70" />
                <div className="h-4 w-9/12 animate-pulse rounded bg-zinc-800/60" />
              </div>
            )}

            {!isLoading && error && <p className="text-sm text-red-400">{error}</p>}

            {!isLoading && !error && output && (
              <pre className="data-mono whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{output}</pre>
            )}

            {!isLoading && !error && !output && (
              <pre className="data-mono whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-500">
                {getPlaceholder(platform, language)}
              </pre>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
