import { Sparkles, type LucideIcon } from 'lucide-react'
import { Duotone } from './icons'

interface Props {
  title: string
  text?: string
  icon?: LucideIcon
  onBack: () => void
}

/** Frosted placeholder card for screens and sections that are not built yet. */
export default function ComingSoon({ title, text = 'Cette section sera bientôt disponible.', icon = Sparkles, onBack }: Props) {
  return (
    <div className="frost-card mx-auto flex max-w-sm flex-col items-center px-6 py-8 text-center">
      <span className="flex h-[72px] w-[72px] items-center justify-center rounded-tile-lg bg-primary/12 text-primary">
        <Duotone icon={icon} size={36} />
      </span>
      <h2 className="mt-4 text-title font-bold">{title}</h2>
      <p className="mt-1 text-body text-ink-soft">{text}</p>
      <button
        type="button"
        onClick={onBack}
        className="mt-5 h-10 rounded-full bg-linear-to-r from-btn-from to-btn-mid px-6 text-body font-bold text-white shadow-search"
      >
        Retour
      </button>
    </div>
  )
}
