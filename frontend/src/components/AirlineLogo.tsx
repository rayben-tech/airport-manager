import type { Flight } from '../data/flights'

/** Brand-colored airline badge built from the IATA code (no external image needed). */
export default function AirlineLogo({ flight, size = 40 }: { flight: Flight; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl font-extrabold tracking-tight text-white shadow-sm"
      style={{
        background: `linear-gradient(135deg, ${flight.airlineColor}, ${flight.airlineColor}cc)`,
        width: size,
        height: size,
        fontSize: size / 2.8,
      }}
      title={flight.airline}
    >
      {flight.code.slice(0, 2)}
    </div>
  )
}
