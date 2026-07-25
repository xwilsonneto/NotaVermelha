'use client';

import { useRef, useState } from 'react';
import {
    Image,
    Video,
    Calendar,
    Music2,
    Smile,
    MapPin
} from 'lucide-react';

/* ── emoji set nativo (sem lib externa) ─────────────────────────── */
const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
  '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
  '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
  '🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
  '😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮',
  '🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓',
  '🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺',
  '😦','😧','😨','😰','😥','😢','😭','😱','😖','😣',
  '😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈',
  '👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾',
  '🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
  '❣️','💕','💞','💓','💗','💖','💘','💝','🔥','✨',
  '🎵','🎶','🎸','🎤','🎧','🥁','🎹','🎺','🎻','🎼',
  '👍','👎','👏','🙌','🤝','🤞','✌️','🤟','🤘','👌',
];

export interface ComposerToolbarProps {
  /** chamado quando o usuário seleciona imagens do disco/câmera */
  onImageSelect?: (files: FileList) => void;
  /** chamado quando o usuário clica em um emoji */
  onEmojiSelect?: (emoji: string) => void;
}

export default function ComposerToolbar({ onImageSelect, onEmojiSelect }: ComposerToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onImageSelect) {
      onImageSelect(e.target.files);
      e.target.value = '';          // permite re-selecionar o mesmo arquivo
    }
  };

  const handleEmojiPick = (emoji: string) => {
    onEmojiSelect?.(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex items-center gap-0.5 md:gap-1 relative">
      {/* input invisível para galeria / câmera */}
      <input
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── IMAGE ── */}
      <button
        type="button"
        onClick={handleImageClick}
        title="Adicionar imagem"
        className="
          w-9 h-9 md:w-10 md:h-10
          rounded-lg md:rounded-xl
          hover:bg-zinc-800
          transition
          flex items-center justify-center
          text-zinc-400 hover:text-red-400
        "
      >
        <Image size={16} className="md:w-[18px] md:h-[18px]" />
      </button>

      {/* ── SMILE / EMOJI ── */}
      <button
        type="button"
        onClick={() => setShowEmojiPicker((s) => !s)}
        title="Emoji"
        className="
          w-9 h-9 md:w-10 md:h-10
          rounded-lg md:rounded-xl
          hover:bg-zinc-800
          transition
          flex items-center justify-center
          text-zinc-400 hover:text-red-400
        "
      >
        <Smile size={16} className="md:w-[18px] md:h-[18px]" />
      </button>

      {/* ── placeholder buttons (ainda não funcionais) ── */}
      <button type="button" className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl hover:bg-zinc-800 transition flex items-center justify-center text-zinc-400 hover:text-red-400">
        <Video size={16} className="md:w-[18px] md:h-[18px]" />
      </button>
      <button type="button" className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl hover:bg-zinc-800 transition flex items-center justify-center text-zinc-400 hover:text-red-400">
        <Music2 size={16} className="md:w-[18px] md:h-[18px]" />
      </button>
      <button type="button" className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl hover:bg-zinc-800 transition flex items-center justify-center text-zinc-400 hover:text-red-400">
        <Calendar size={16} className="md:w-[18px] md:h-[18px]" />
      </button>
      <button type="button" className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl hover:bg-zinc-800 transition flex items-center justify-center text-zinc-400 hover:text-red-400">
        <MapPin size={16} className="md:w-[18px] md:h-[18px]" />
      </button>

      {/* ── EMOJI PICKER POPOVER ── */}
      {showEmojiPicker && (
        <>
          {/* overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowEmojiPicker(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 z-50 w-[260px] md:w-[320px] max-h-[220px] md:max-h-[260px] overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 md:p-3 shadow-2xl custom-scroll">
            <div className="grid grid-cols-8 gap-1 md:gap-1.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiPick(emoji)}
                  className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center text-base md:text-xl hover:bg-zinc-800 rounded-md md:rounded-lg transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}