import { ChevronRight, Crown } from 'lucide-react'

/** Same look as the banner on /profil. */
export default function PremiumBanner({ subtitle }: { subtitle: string }) {
  return (
    <div className="premium flex h-16 items-center gap-3 rounded-3xl border border-white/30 px-4 text-white shadow-nav-glow">
      <Crown size={32} className="stroke-amber-500 text-gold" fill="currentColor" strokeWidth={1.5} />
      <div className="flex-1">
        <p className="text-value font-bold leading-tight">Voyageur Premium</p>
        <p className="text-small text-white/80">{subtitle}</p>
      </div>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
        <ChevronRight size={18} />
      </span>
    </div>
  )
}
