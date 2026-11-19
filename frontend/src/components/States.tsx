import { CircleAlert, RotateCw, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Duotone } from './icons'

/** Shimmering frosted placeholder block. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-card ${className}`} aria-hidden />
}

/** Frosted error card with the server's French message and a retry button. */
export function ErrorCard({ message, onRetry, className = '' }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={`frost-card flex flex-col items-center px-6 py-6 text-center ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/12 text-red-600">
        <CircleAlert size={26} />
      </span>
      <p className="mt-3 text-body font-semibold">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 flex h-10 items-center gap-2 rounded-full bg-linear-to-r from-btn-from to-btn-mid px-5 text-body font-bold text-white shadow-search"
        >
          <RotateCw size={16} /> Réessayer
        </button>
      )}
    </div>
  )
}

/** Friendly empty state. */
export function EmptyState({ icon, title, text, action, className = '' }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={`frost-card flex flex-col items-center px-6 py-7 text-center ${className}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-tile-lg bg-primary/12 text-primary">
        <Duotone icon={icon} size={28} />
      </span>
      <p className="mt-3 text-value font-bold">{title}</p>
      {text && <p className="mt-1 text-label text-ink-soft">{text}</p>}
      {action}
    </div>
  )
}
