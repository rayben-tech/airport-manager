import type { Airline } from '../types'

/** Brand-colored airline badge built from the IATA code (no external image needed). */
export default function AirlineLogo({ airline, size = 40 }: { airline: Airline; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl font-extrabold tracking-tight text-white shadow-sm"
      style={{
        background: `linear-gradient(135deg, ${airline.brandColor}, ${airline.brandColor}cc)`,
        width: size,
        height: size,
        fontSize: size / 2.8,
      }}
      title={airline.name}
    >
      {airline.iataCode}
    </div>
  )
}
