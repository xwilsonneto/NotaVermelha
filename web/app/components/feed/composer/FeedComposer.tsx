// components/feed/composer/FeedComposer.tsx
'use client';

import { useState } from 'react';

import ComposerToolbar        from './ComposerTolbar';
import ComposerCharacterCount from './ComposerCharacterCount';
import ComposerAttachments    from './ComposerAttachments';
import ComposerPostButton     from './ComposerPostButton';

const MAX_CHARACTERS = 280;

interface FeedComposerProps {
  /** Retorna true se o post foi criado com sucesso */
  onPost: (text: string) => Promise<boolean>;
}

export default function FeedComposer({ onPost }: FeedComposerProps) {
  const [content,    setContent]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const remaining = MAX_CHARACTERS - content.length;

  async function handlePost() {
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const ok = await onPost(content.trim());

      if (ok) {
        setContent('');
      } else {
        setError('Não foi possível publicar. Tente novamente.');
      }
    } catch {
      setError('Erro ao publicar. Verifique sua conexão.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl w-full bg-zinc-950 border border-zinc-800 overflow-hidden">

      <div className="p-5 pb-2">
        <textarea
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARACTERS) {
              setContent(e.target.value);
              if (error) setError(null);
            }
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handlePost();
          }}
          placeholder="O que está acontecendo?"
          rows={3}
          className="
            w-full
            bg-transparent
            resize-none
            outline-none
            text-[15px]
            text-zinc-100
            placeholder:text-zinc-500
            leading-relaxed
          "
        />

        <ComposerAttachments />
      </div>

      {error && (
        <p className="px-5 pb-2 text-xs text-red-400">{error}</p>
      )}

      <div className="px-2 py-2 border-t border-zinc-800 flex items-center justify-between">
        <ComposerToolbar />

        <div className="flex items-center gap-4">
          <ComposerCharacterCount remaining={remaining} max={MAX_CHARACTERS} />
          <ComposerPostButton
            disabled={!content.trim() || submitting}
            loading={submitting}
            onClick={handlePost}
          />
        </div>
      </div>

    </div>
  );
}
