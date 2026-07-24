// components/navigation/AppSidebar.tsx

'use client'

import {
  Music2,
  ListMusic,
  User,
  CalendarDays,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  Disc3,
} from 'lucide-react'

import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction } from 'react'

export type ActiveSection =
  | 'discover'
  | 'library'
  | 'profile'

interface AppSidebarProps {
  activeSection: string
  setActiveSection: Dispatch<SetStateAction<ActiveSection>>
  isArtist?: boolean
  logout: () => void
  user?: any
}

interface NavItemProps {
  icon: React.ElementType
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

function NavItem({ icon: Icon, label, active, disabled, onClick }: NavItemProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`
        flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
        ${active
          ? 'bg-red-600/20 text-red-400'
          : disabled
            ? 'text-zinc-600 cursor-default'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
        }
      `}
    >
      <Icon size={18} className={active ? 'text-red-400' : disabled ? 'text-zinc-700' : ''} />
      <span>{label}</span>
    </button>
  )
}

export default function AppSidebar({
  activeSection,
  setActiveSection,
  isArtist,
  logout,
  user,
}: AppSidebarProps) {
  const router = useRouter()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r custom-scroll border-zinc-800/60 px-3 py-6 gap-1 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 px-3 mb-2">
          Navegar
        </p>

        <NavItem
          icon={Music2}
          label="Descobrir"
          active={activeSection === 'discover'}
          onClick={() => setActiveSection('discover')}
        />

        <NavItem
          icon={ListMusic}
          label="Biblioteca"
          active={activeSection === 'library'}
          onClick={() => setActiveSection('library')}
        />

        <NavItem
          icon={User}
          label="Perfil"
          active={activeSection === 'profile'}
          onClick={() => setActiveSection('profile')}
        />

        <NavItem icon={CalendarDays} label="Eventos" disabled />
        <NavItem icon={MessageCircle} label="Mensagens" disabled />
        <NavItem icon={Bell} label="Notificações" disabled />

        <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 px-3 mt-4">
          Conta
        </p>

        {isArtist && (
          <NavItem
            icon={Disc3}
            label="Meu perfil artístico"
            onClick={() => router.push('/profile')}
          />
        )}

        {/* Configurações → /settings  */}
        <NavItem
          icon={Settings}
          label="Configurações"
          onClick={() => router.push('/settings')}
        />

        <NavItem
          icon={LogOut}
          label="Sair"
          onClick={logout}
        />

        {/* User info / subscription card */}
        <div className="mt-auto pt-4">
          {/* Mini user card */}
          {user && (
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 transition-colors mb-2 text-left"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-zinc-700">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                    {user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name || user.username}
                </p>
                <p className="text-xs text-zinc-500 truncate">@{user.username}</p>
              </div>
            </button>
          )}

          <div className="rounded-xl bg-red-950/30 border border-red-800/30 p-3">
            <p className="text-xs font-bold text-red-300 mb-1">
              {user?.subscription?.type === 'premium' ? '✦ Premium' : 'Plano gratuito'}
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {user?.subscription?.type === 'premium'
                ? 'Obrigado por nos apoiar!'
                : 'Mude para o premium.'}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed left-0 right-0 bottom-0 h-14 z-[70] border-t border-zinc-800 bg-black/95 backdrop-blur-xl">
        <div className="grid grid-cols-4 h-14">
          <button
            onClick={() => setActiveSection('discover')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
              activeSection === 'discover' ? 'text-red-400' : 'text-zinc-500'
            }`}
          >
            <Music2 size={18} />
            <span>Descobrir</span>
          </button>

          <button
            onClick={() => setActiveSection('library')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
              activeSection === 'library' ? 'text-red-400' : 'text-zinc-500'
            }`}
          >
            <ListMusic size={18} />
            <span>Biblioteca</span>
          </button>

          <button
            onClick={() => setActiveSection('profile')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
              activeSection === 'profile' ? 'text-red-400' : 'text-zinc-500'
            }`}
          >
            <User size={18} />
            <span>Perfil</span>
          </button>

          {/* Mobile: Settings em vez de Bell (que já estava disabled) */}
          <button
            onClick={() => router.push('/settings')}
            className="flex flex-col items-center justify-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Settings size={18} />
            <span>Config.</span>
          </button>
        </div>
      </nav>
    </>
  )
}
