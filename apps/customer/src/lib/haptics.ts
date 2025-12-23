// Haptic feedback utility for native-like feel

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 20],
  warning: [20, 100, 20],
  error: [30, 50, 30, 50, 30],
}

export function haptic(type: HapticType = 'light') {
  if ('vibrate' in navigator) {
    navigator.vibrate(hapticPatterns[type])
  }
}

// Specific haptic events
export const haptics = {
  tap: () => haptic('light'),
  press: () => haptic('medium'),
  impact: () => haptic('heavy'),
  success: () => haptic('success'),
  warning: () => haptic('warning'),
  error: () => haptic('error'),
  
  // For add to cart
  addToCart: () => haptic('success'),
  
  // For delete/remove
  delete: () => haptic('warning'),
  
  // For button press
  buttonPress: () => haptic('light'),
}
