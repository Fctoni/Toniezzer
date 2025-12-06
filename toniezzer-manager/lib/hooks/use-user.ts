'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types/database'
import type { User as AuthUser } from '@supabase/supabase-js'

interface UseUserReturn {
  user: User | null
  authUser: AuthUser | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook to get current authenticated user with profile data
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createClient()

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get auth user
      const { data: { user: currentAuthUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) throw authError
      
      if (!currentAuthUser) {
        setUser(null)
        setAuthUser(null)
        return
      }

      setAuthUser(currentAuthUser)

      // Get profile from users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentAuthUser.id)
        .single()

      if (profileError) {
        // User might not have profile yet (first login)
        console.warn('Profile not found:', profileError.message)
        setUser(null)
        return
      }

      setUser(profile)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAuthUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    authUser,
    isLoading,
    error,
    refetch: fetchUser,
  }
}

