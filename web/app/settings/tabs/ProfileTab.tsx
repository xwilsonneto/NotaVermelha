// app/settings/tabs/ProfileTab.tsx
'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'

type Status = 'idle' | 'uploading' | 'saving' | 'success' | 'error'

export default function ProfileTab() {
  const { user, token, setHasHydrated } = useAuthStore()

  // Atualiza o user no store sem um setter dedicado — usamos a técnica
  // de chamar setState diretamente via getState (padrão Zustand)
  const updateStoreUser = (updated: any) => {
    useAuthStore.setState({ user: updated })
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [status,     setStatus]     = useState<Status>('idle')
  const [errorMsg,   setErrorMsg]   = useState('')

  const [form, setForm] = useState({
    name:     user?.name     || '',
    username: user?.username || '',
    bio:      user?.bio      || '',
  })

  // ── avatar ──────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function uploadAvatar() {
    if (!avatarFile || !token) return
    const formData = new FormData()
    formData.append('avatar', avatarFile)

    setStatus('uploading')
    try {
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error((await res.json()).message)
      const data = await res.json()
      updateStoreUser(data.user)
      setAvatarFile(null)
      setPreview(null)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar imagem')
      setStatus('error')
    }
  }

  // ── profile fields ───────────────────────────────────────────────────────
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setStatus('saving')
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).message)
      const updated = await res.json()
      updateStoreUser(updated)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar')
      setStatus('error')
    }
  }

  const busy = status === 'uploading' || status === 'saving'
  const currentAvatar = preview || user?.avatar

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-zinc-700 group-hover:ring-red-500/60 transition-all">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-500">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg transition-colors"
          >
            <Camera size={16} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {avatarFile && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 truncate max-w-[140px]">{avatarFile.name}</span>
            <button
              type="button"
              onClick={uploadAvatar}
              disabled={busy}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              {status === 'uploading' && <Loader2 size={14} className="animate-spin" />}
              {status === 'uploading' ? 'Enviando…' : 'Salvar foto'}
            </button>
            <button
              type="button"
              onClick={() => { setPreview(null); setAvatarFile(null) }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        <p className="text-xs text-zinc-600">JPG, PNG ou WebP · máx. 5 MB</p>
      </div>

      <div className="border-t border-zinc-800/60" />

      {/* Profile Form */}
      <form onSubmit={saveProfile} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nome</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors"
            placeholder="Seu nome"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nome de usuário</label>
          <div className="flex items-center bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-red-500/60 transition-colors">
            <span className="pl-4 text-zinc-600 text-sm">@</span>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="flex-1 bg-transparent px-2 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none"
              placeholder="nomedeusuario"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            maxLength={200}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors resize-none"
            placeholder="Conte algo sobre você…"
          />
          <p className="text-right text-xs text-zinc-600">{form.bio.length}/200</p>
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} /><span>Alterações salvas!</span>
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
          {status === 'saving' && <Loader2 size={16} className="animate-spin" />}
          {status === 'saving' ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
