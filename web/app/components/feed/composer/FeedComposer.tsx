// components/feed/composer/FeedComposer.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

import ComposerToolbar        from './ComposerTolbar';
import ComposerCharacterCount from './ComposerCharacterCount';
import ComposerAttachments    from './ComposerAttachments';
import ComposerPostButton     from './ComposerPostButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
const MAX_CHARACTERS = 280;
const MAX_IMAGES = 4;

interface ImagePreview {
  id: string;
  file: File;
  previewUrl: string;
}

export interface FeedComposerProps {
  /**
   * Recebe o texto + array de attachments prontos para salvar no banco.
   * Ajuste seu hook useFeed / createPost para aceitar o segundo parâmetro.
   */
  onPost: (text: string, attachments?: { kind: string; url: string; meta?: any }[]) => Promise<boolean>;
}

/** Faz upload de uma imagem pro Cloudinary via seu backend */
async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/upload/image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Falha no upload da imagem');
  }

  const data = await res.json();
  return data.url ?? data.secure_url ?? data.data?.url;
}

export default function FeedComposer({ onPost }: FeedComposerProps) {
  const [content,    setContent]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [images,     setImages]     = useState<ImagePreview[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remaining = MAX_CHARACTERS - content.length;

  /* ── Emoji: insere no cursor ──────────────────────────────────── */
  const handleEmojiSelect = useCallback((emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart ?? content.length;
    const end   = ta.selectionEnd   ?? content.length;
    const before = content.slice(0, start);
    const after  = content.slice(end);
    const next   = before + emoji + after;

    if (next.length <= MAX_CHARACTERS) {
      setContent(next);
      // reposiciona cursor após o emoji
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + emoji.length;
        ta.focus();
      });
    }
  }, [content]);

  /* ── Imagem: preview local ────────────────────────────────────── */
  const handleImageSelect = useCallback((files: FileList) => {
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Máximo ${MAX_IMAGES} imagens por post.`);
      return;
    }

    const newImages: ImagePreview[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    if (error) setError(null);
  }, [images.length, error]);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      return filtered;
    });
  };

  /* ── Publicar ─────────────────────────────────────────────────── */
  async function handlePost() {
    if (!content.trim() && images.length === 0) return;
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      let attachments: { kind: string; url: string }[] | undefined;

      // 1) faz upload das imagens pro Cloudinary
      if (images.length > 0) {
        const urls = await Promise.all(images.map((img) => uploadImageToCloudinary(img.file)));
        attachments = urls.map((url) => ({ kind: 'image', url }));
      }

      // 2) cria o post
      const ok = await onPost(content.trim(), attachments);

      if (ok) {
        setContent('');
        setImages([]);
      } else {
        setError('Não foi possível publicar. Tente novamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao publicar. Verifique sua conexão.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl md:rounded-2xl w-full bg-zinc-950 border border-zinc-800 overflow-hidden">

      <div className="p-3 md:p-5 pb-2">
        <textarea
          ref={textareaRef}
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
          rows={images.length > 0 ? 2 : 3}
          className="
            w-full
            bg-transparent
            resize-none
            outline-none
            text-sm md:text-[15px]
            text-zinc-100
            placeholder:text-zinc-500
            leading-relaxed
          "
        />

        {/* ── Preview de imagens selecionadas ────────────────────── */}
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                className={`relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 ${
                  images.length === 1 ? 'col-span-2' : ''
                }`}
              >
                <img
                  src={img.previewUrl}
                  alt="Preview"
                  className="w-full h-28 md:h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <ComposerAttachments />
      </div>

      {error && (
        <p className="px-3 md:px-5 pb-2 text-xs text-red-400">{error}</p>
      )}

      <div className="px-2 md:px-2 py-2 border-t border-zinc-800 flex items-center justify-between gap-2">
        <ComposerToolbar
          onImageSelect={handleImageSelect}
          onEmojiSelect={handleEmojiSelect}
        />

        <div className="flex items-center gap-2 md:gap-4">
          <ComposerCharacterCount remaining={remaining} max={MAX_CHARACTERS} />
          <ComposerPostButton
            disabled={(!content.trim() && images.length === 0) || submitting}
            loading={submitting}
            onClick={handlePost}
          />
        </div>
      </div>

    </div>
  );
}