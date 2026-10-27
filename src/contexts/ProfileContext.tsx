import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface ProfileContextValue {
  profile: Profile | null
  profiles: Profile[]
  loading: boolean
  refreshProfile: () => Promise<void>
  refreshProfiles: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchProfile() {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function fetchProfiles() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .order('full_name')
    setProfiles(data ?? [])
  }

  useEffect(() => {
    fetchProfile()
    fetchProfiles()
  }, [user?.id])

  async function refreshProfile() {
    await fetchProfile()
  }

  async function refreshProfiles() {
    await fetchProfiles()
  }

  return (
    <ProfileContext.Provider value={{ profile, profiles, loading, refreshProfile, refreshProfiles }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
