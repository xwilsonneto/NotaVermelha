// app/settings/SettingsLayout.tsx
'use client'

import { useState } from 'react'
import { ArrowLeft, User, Lock, Sliders } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import ProfileTab from './tabs/ProfileTab'
import AccountTab from './tabs/AccountTab'
import PreferencesTab from './tabs/PreferencesTab'

type Tab = 'profile' | 'account' | 'preferences'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',     label: 'Perfil',        icon: User    },
  { id: 'account',     label: 'Conta',          icon: Lock    },
  { id: 'preferences', label: 'Preferências',   icon: Sliders },
]

export default function SettingsLayout() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-black/90 backdrop-blur-xl px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Configurações</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tab Bar */}
        <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-1 mb-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-red-600/20 text-red-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'profile'     && <ProfileTab />}
        {activeTab === 'account'     && <AccountTab />}
        {activeTab === 'preferences' && <PreferencesTab />}
      </div>
    </div>
  )
}
