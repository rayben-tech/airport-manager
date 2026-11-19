import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  title: string
  /** element in the left slot (default: back button); pass `null` for nothing */
  left?: ReactNode
  /** element in the right slot, usually a `round-glass` button */
  right?: ReactNode
}

/** White centered title between two 44px round glass buttons (sits on the dark top of the gradient). */
export default function PageHeader({ title, left, right }: Props) {
  const navigate = useNavigate()
  const lead =
    left === undefined ? (
      <button type="button" aria-label="Retour" onClick={() => navigate(-1)} className="round-glass">
        <ArrowLeft size={22} />
      </button>
    ) : (
      left
    )

  return (
    <header className="flex items-center gap-2 pt-6 text-white">
      <div className="flex w-11 shrink-0">{lead}</div>
      <h1 className="min-w-0 flex-1 truncate text-center text-title font-semibold">{title}</h1>
      <div className="flex w-11 shrink-0 justify-end">{right}</div>
    </header>
  )
}
