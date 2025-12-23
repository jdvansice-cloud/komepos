import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  company_id: string
  role: 'admin' | 'supervisor' | 'operator'
  full_name: string
  email: string
}

interface UserLocation {
  id: string
  name: string
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  locations: UserLocation[]
  activeLocation: UserLocation | null
  setActiveLocation: (location: UserLocation | null) => void
  loading: boolean
  needsLocationSelect: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [locations, setLocations] = useState<UserLocation[]>([])
  const [activeLocation, setActiveLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user needs to select a location (non-admin with multiple locations)
  const needsLocationSelect = !!(
    profile && 
    profile.role !== 'admin' && 
    locations.length > 1 && 
    !activeLocation
  )

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth error:', error)
          if (mounted) setLoading(false)
          return
        }

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
        }

        if (session?.user && mounted) {
          await fetchUserData(session.user.id)
        }
      } catch (error) {
        console.error('Init auth error:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserData(session.user.id)
        } else {
          setProfile(null)
          setLocations([])
          setActiveLocation(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchUserData(userId: string) {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, company_id, role, full_name, email')
        .eq('id', userId)
        .single()
      
      if (profileError || !profileData) {
        // Not a POS user - sign them out
        await supabase.auth.signOut()
        setProfile(null)
        setLoading(false)
        return
      }

      setProfile(profileData as UserProfile)
      
      // Fetch user's assigned locations
      const { data: userLocations } = await supabase
        .from('user_locations')
        .select('location:locations(id, name)')
        .eq('user_id', userId)
      
      const locs = userLocations?.map((ul: any) => ul.location).filter(Boolean) || []
      setLocations(locs)
      
      // Auto-select if only one location
      if (locs.length === 1) {
        setActiveLocation(locs[0])
      }
      
      // Admins don't need location selection - they see all
      if (profileData.role === 'admin') {
        setActiveLocation(null) // null means "all locations" for admins
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // Check if this is a POS user (has a profile in users table)
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (userError || !userData) {
          await supabase.auth.signOut()
          throw new Error('This account is not registered as staff. Please use the customer delivery app.')
        }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setLocations([])
    setActiveLocation(null)
  }

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      locations,
      activeLocation,
      setActiveLocation,
      loading, 
      needsLocationSelect,
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
