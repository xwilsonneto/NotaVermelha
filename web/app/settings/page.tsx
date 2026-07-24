// app/settings/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import SettingsLayout from './SettingsLayout'

export default function SettingsPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, _hasHydrated } = useAuthStore()

  useEffect(() => {
    if (!_hasHydrated) return          // aguarda Zustand reidratar do localStorage
    if (!isAuthenticated || !token) {
      router.push('/')
    }
  }, [_hasHydrated, isAuthenticated, token])

  // Enquanto hidrata, mostra spinner
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !token) return null

  return <SettingsLayout />
}
