import { Bot, BriefcaseBusiness, GraduationCap, Megaphone, ShoppingBag } from 'lucide-react'

export const CATEGORIES = [
  { id: 'ai', label: 'AI', icon: Bot },
  { id: 'ecom', label: '电商', icon: ShoppingBag },
  { id: 'media', label: '自媒体', icon: Megaphone },
  { id: 'work', label: '职场', icon: BriefcaseBusiness },
  { id: 'growth', label: '个人成长', icon: GraduationCap },
]

export const DEFAULT_CATEGORY_ID = 'ai'
