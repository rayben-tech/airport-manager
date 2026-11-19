import type { ComponentPropsWithoutRef } from 'react'

/** Frosted white card with dark text (shared passenger style). */
export default function GlassCard({ className = '', ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={`frost-card p-4 ${className}`} {...props} />
}
