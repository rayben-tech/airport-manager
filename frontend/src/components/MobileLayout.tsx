import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

/** Background variant of the phone frame, per route. Every other passenger screen uses the soft variant. */
const frameBackgrounds: Record<string, string> = {
  '/': 'photo-frame',
  '/profil': 'photo-frame-profile',
}

export default function MobileLayout() {
  const { pathname } = useLocation()
  const background = frameBackgrounds[pathname] ?? 'photo-frame-deep'

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* decorative blurred photo around the frame (desktop only) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden min-[501px]:block">
        <div className="photo-backdrop absolute -inset-12 blur-[24px]" />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative h-full w-full overflow-hidden min-[501px]:h-[min(844px,calc(100vh-32px))] min-[501px]:w-[390px] min-[501px]:rounded-frame min-[501px]:border min-[501px]:border-white/30 min-[501px]:shadow-frame">
        <div className={`${background} absolute inset-0`} />
        {/* scroll area stops at the navbar's bottom edge: only the background shows below the bar */}
        <div className="no-scrollbar absolute inset-x-0 top-0 bottom-4 overflow-y-auto pb-[100px]">
          <Outlet />
        </div>
        <Navbar />
      </div>
    </div>
  )
}
