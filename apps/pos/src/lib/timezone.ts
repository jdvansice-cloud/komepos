import { supabase } from './supabase'

// Cache the timezone to avoid repeated DB calls
let cachedTimezone: string | null = null
let lastFetch: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get the company's configured timezone
 */
export async function getCompanyTimezone(): Promise<string> {
  const now = Date.now()
  
  // Return cached value if fresh
  if (cachedTimezone && (now - lastFetch) < CACHE_DURATION) {
    return cachedTimezone
  }
  
  try {
    const { data } = await supabase
      .from('companies')
      .select('timezone')
      .single()
    
    cachedTimezone = data?.timezone || 'America/Panama'
    lastFetch = now
    return cachedTimezone
  } catch (error) {
    console.error('Error fetching timezone:', error)
    return 'America/Panama' // Default fallback
  }
}

/**
 * Get today's date string (YYYY-MM-DD) in the company timezone
 */
export async function getTodayInTimezone(): Promise<string> {
  const timezone = await getCompanyTimezone()
  return getDateInTimezone(new Date(), timezone)
}

/**
 * Get a date string (YYYY-MM-DD) in a specific timezone
 */
export function getDateInTimezone(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    return formatter.format(date)
  } catch {
    // Fallback if timezone is invalid
    return date.toISOString().split('T')[0]
  }
}

/**
 * Get current datetime in company timezone formatted for display
 */
export async function getCurrentDateTimeFormatted(): Promise<string> {
  const timezone = await getCompanyTimezone()
  try {
    return new Date().toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return new Date().toLocaleString()
  }
}

/**
 * Check if a promo is currently active based on dates
 */
export function isPromoActive(
  startDate: string,
  endDate: string | null,
  todayStr: string
): boolean {
  // Start date must be today or before
  if (startDate > todayStr + 'T23:59:59') return false
  
  // End date must be null (no end) or today or later
  if (endDate && endDate.split('T')[0] < todayStr) return false
  
  return true
}

/**
 * Get promo status label and color
 */
export function getPromoStatus(
  isActive: boolean,
  startDate: string,
  endDate: string | null,
  todayStr: string
): { label: string; color: string } {
  if (!isActive) {
    return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' }
  }
  
  const startDateOnly = startDate.split('T')[0]
  const endDateOnly = endDate?.split('T')[0]
  
  if (todayStr < startDateOnly) {
    return { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' }
  }
  
  if (endDateOnly && todayStr > endDateOnly) {
    return { label: 'Expired', color: 'bg-red-100 text-red-700' }
  }
  
  return { label: 'Active', color: 'bg-green-100 text-green-700' }
}

/**
 * Clear the timezone cache (call when company settings change)
 */
export function clearTimezoneCache(): void {
  cachedTimezone = null
  lastFetch = 0
}
