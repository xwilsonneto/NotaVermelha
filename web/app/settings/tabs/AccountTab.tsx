// app/settings/tabs/AccountTab.tsx
'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'

type Status = 'idle' | 'saving' | 'success' | 'error'

export default function AccountTab() {
  const { user, token } = useAuthStore()

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [show,     setShow]     = useState({ current: false, next: false, confirm: false })
  const [status,   setStatus]   = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      setErrorMsg('As senhas não coincidem'); setStatus('error'); return
    }
    if (form.newPassword.length < 6) {
      setErrorMsg('A nova senha precisa ter ao menos 6 caracteres'); setStatus('error'); return
    }
    if (!token) return

    setStatus('saving')
    try {
      const res = await fetch(`${API_URL}/users/me/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      })
      if (!res.ok) throw new Error((await res.json()).message)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao alterar senha')
      setStatus('error')
    }
  }

  const busy = status === 'saving'

  return (
    <div className="space-y-8">
      {/* Email */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 space-y-1">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">E-mail</p>
        <p className="text-sm text-white">{user?.email}</p>
        <p className="text-xs text-zinc-600">O e-mail não pode ser alterado por aqui.</p>
      </div>

      {/* Subscription */}
      <div className="bg-red-950/30 border border-red-800/30 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Plano</p>
          <p className="text-sm font-semibold text-white">
            {user?.subscription?.type === 'premium' ? '✦ Premium' : 'Gratuito'}
          </p>
        </div>
        {user?.subscription?.type !== 'premium' && (
          <button className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold transition-colors">
            Upgrade
          </button>
        )}
      </div>

      {/* Password */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-5">Alterar senha</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {([
            { key: 'current', label: 'Senha atual',           field: 'currentPassword' },
            { key: 'next',    label: 'Nova senha',             field: 'newPassword'     },
            { key: 'confirm', label: 'Confirmar nova senha',   field: 'confirmPassword' },
          ] as const).map(({ key, label, field }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
              <div className="flex items-center bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-red-500/60 transition-colors">
                <input
                  type={show[key] ? 'text' : 'password'}
                  value={form[field]}
                  onChange={(e) => { setStatus('idle'); setForm({ ...form, [field]: e.target.value }) }}
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow({ ...show, [key]: !show[key] })}
                  className="px-3 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {show[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} /><span>Senha alterada com sucesso!</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
              <AlertCircle size={16} /><span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? 'Salvando…' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
