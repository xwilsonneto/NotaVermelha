'use client'

import { LucideIcon } from 'lucide-react'

interface NavItemProps {
  icon: LucideIcon
  label: string
  active?: boolean
  soon?: boolean
  onClick?: () => void
}

export default function NavItem({
  icon: Icon,
  label,
  active,
  soon,
  onClick,
}: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl
        transition-all text-left
        ${
          active
            ? 'bg-red-950/60 text-red-300 border border-red-800/50'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
        }
      `}
    >
      <Icon size={18} />

      <span className="font-medium">{label}</span>

      {soon && (
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
          em breve
        </span>
      )}
    </button>
  )
}