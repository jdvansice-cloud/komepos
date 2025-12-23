import { useState, useRef, ReactNode } from 'react'

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  className?: string
}

export function PullToRefresh({ children, onRefresh, className = '' }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const threshold = 80
  const maxPull = 120

  function handleTouchStart(e: React.TouchEvent) {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      setPulling(true)
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!pulling || refreshing) return
    
    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current

    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Apply resistance
      const distance = Math.min(diff * 0.5, maxPull)
      setPullDistance(distance)
    }
  }

  async function handleTouchEnd() {
    if (!pulling) return
    setPulling(false)

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true)
      setPullDistance(60) // Keep some distance while refreshing
      
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto scroll-momentum ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className="flex justify-center items-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance }}
      >
        {refreshing ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
        ) : (
          <div 
            className={`text-gray-400 transition-transform duration-200 ${pullDistance >= threshold ? 'rotate-180' : ''}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        )}
      </div>
      
      {children}
    </div>
  )
}
