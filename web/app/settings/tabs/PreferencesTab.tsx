// app/settings/tabs/PreferencesTab.tsx
'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'

type Status = 'idle' | 'saving' | 'success' | 'error'

const qualityOptions = [
  { value: 'low',    label: 'Baixa',  description: '96 kbps — economiza dados'   },
  { value: 'medium', label: 'Normal', description: '160 kbps — padrão'            },
  { value: 'high',   label: 'Alta',   description: '320 kbps — melhor qualidade'  },
]

export default function PreferencesTab() {
  const { user, token } = useAuthStore()

  const [audioQuality,    setAudioQuality]    = useState(user?.preferences?.audioQuality    ?? 'medium')
  const [explicitContent, setExplicitContent] = useState(user?.preferences?.explicitContent ?? true)
  const [status,          setStatus]          = useState<Status>('idle')
  const [errorMsg,        setErrorMsg]        = useState('')

  async function savePreferences(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setStatus('saving')
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferences: { audioQuality, explicitContent } }),
      })
      if (!res.ok) throw new Error((await res.json()).message)
      const updated = await res.json()
      useAuthStore.setState({ user: updated })
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar preferências')
      setStatus('error')
    }
  }

  const busy = status === 'saving'

  return (
    <form onSubmit={savePreferences} className="space-y-8">
      {/* Qualidade */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Qualidade de áudio</h2>
        <div className="space-y-2">
          {qualityOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                audioQuality === opt.value
                  ? 'border-red-500/60 bg-red-600/10'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
              }`}
            >
              <input
                type="radio"
                name="audioQuality"
                value={opt.value}
                checked={audioQuality === opt.value}
                onChange={() => setAudioQuality(opt.value)}
                className="accent-red-500"
              />
              <div>
                <p className="text-sm font-medium text-white">{opt.label}</p>
                <p className="text-xs text-zinc-500">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Conteúdo explícito */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Conteúdo explícito</h2>
        <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 cursor-pointer hover:border-zinc-700 transition-all">
          <div>
            <p className="text-sm text-white">Exibir músicas com conteúdo explícito</p>
            <p className="text-xs text-zinc-500">Inclui palavras e temas adultos</p>
          </div>
          <div
            onClick={() => setExplicitContent(!explicitContent)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${explicitContent ? 'bg-red-600' : 'bg-zinc-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${explicitContent ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </label>
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 rounded-xl px-4 py-3">
          <CheckCircle2 size={16} /><span>Preferências salvas!</span>
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
        {busy ? 'Salvando…' : 'Salvar preferências'}
      </button>
    </form>
  )
}
