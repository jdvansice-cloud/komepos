import { supabase } from './supabase'

// Cache the timezone to avoid repeated DB calls
let cachedTimezone: string | null = null
let lastFetch: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const DEFAULT_TIMEZONE = 'America/Panama'

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
    
    const tz = data?.timezone || DEFAULT_TIMEZONE
    cachedTimezone = tz
    lastFetch = now
    return tz
  } catch (error) {
    console.error('Error fetching timezone:', error)
    return DEFAULT_TIMEZONE
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
    return date.toISOString().split('T')[0]
  }
}

/**
 * Format a date string for display (e.g., "Dec 21, 2025")
 */
export function formatDateDisplay(dateStr: string, timezone: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

/**
 * Format a date string as short date (e.g., "12/21/2025")
 */
export function formatDateShort(dateStr: string, timezone: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { timeZone: timezone })
  } catch {
    return dateStr
  }
}

/**
 * Format a time string (e.g., "2:30 PM")
 */
export function formatTime(dateStr: string, timezone: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

/**
 * Format a datetime string (e.g., "Dec 21, 2:30 PM")
 */
export function formatDateTime(dateStr: string, timezone: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

/**
 * Format a full datetime string (e.g., "Sat, Dec 21, 2025, 2:30:45 PM")
 */
export function formatDateTimeFull(dateStr: string, timezone: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return dateStr
  }
}

/**
 * Get current datetime ISO string
 */
export function getNowISO(): string {
  return new Date().toISOString()
}

/**
 * Clear the timezone cache (call when company settings change)
 */
export function clearTimezoneCache(): void {
  cachedTimezone = null
  lastFetch = 0
}
