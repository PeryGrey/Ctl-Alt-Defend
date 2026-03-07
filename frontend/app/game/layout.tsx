'use client'
import { useEffect, useState } from 'react'

function RotatePrompt() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-4 p-8 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
        <path d="M9 7l3-3 3 3" />
        <path d="M12 4v6" />
      </svg>
      <p className="text-lg font-semibold">Please rotate your device to landscape</p>
      <p className="text-sm text-muted-foreground">This game is designed for landscape mode.</p>
    </div>
  )
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isPortrait) return <RotatePrompt />
  return <>{children}</>
}
