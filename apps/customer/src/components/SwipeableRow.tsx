import { useState, useRef, ReactNode } from 'react'

interface SwipeableRowProps {
  children: ReactNode
  onDelete: () => void
  className?: string
}

export function SwipeableRow({ children, onDelete, className = '' }: SwipeableRowProps) {
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)

  const deleteThreshold = -80
  const maxSwipe = -100

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    setSwiping(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping) return
    
    currentX.current = e.touches[0].clientX
    const diff = currentX.current - startX.current

    // Only allow left swipe
    if (diff < 0) {
      setOffset(Math.max(diff, maxSwipe))
    } else {
      setOffset(0)
    }
  }

  function handleTouchEnd() {
    setSwiping(false)
    
    if (offset <= deleteThreshold) {
      // Trigger haptic feedback
      navigator.vibrate?.(10)
      onDelete()
    }
    setOffset(0)
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Delete action background */}
      <div 
        className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-end px-4"
        style={{ width: Math.abs(offset) + 20 }}
      >
        <span className="text-white font-semibold text-sm">Delete</span>
      </div>
      
      {/* Swipeable content */}
      <div
        className="relative bg-white transition-transform duration-150"
        style={{ 
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
