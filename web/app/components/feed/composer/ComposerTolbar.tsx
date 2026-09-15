'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image, Video, Calendar, Music2, Smile, MapPin } from 'lucide-react';
import EmojiPicker, {
  Theme,
  EmojiStyle,
  Categories,
} from 'emoji-picker-react';

export interface ComposerToolbarProps {
  onImageSelect?: (files: FileList) => void;
  onEmojiSelect?: (emoji: string) => void;
}

export default function ComposerToolbar({ onImageSelect, onEmojiSelect }: ComposerToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ left: 0, top: 0 });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onImageSelect) {
      onImageSelect(e.target.files);
      e.target.value = '';
    }
  };

  const toggleEmojiPicker = () => {
    if (!showEmojiPicker && emojiButtonRef.current) {
      const rect = emojiButtonRef.current.getBoundingClientRect();
      setPickerPos({
        left: rect.left,
        top: rect.top - 350, // 450 de altura + 10 de margem
      });
    }
    setShowEmojiPicker((s) => !s);
  };

  return (
    <div className="flex items-center gap-0.5 md:gap-1 relative">
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
        className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl hover:bg-zinc-800 transition flex items-center justify-center text-zinc-400 hover:text-red-400"
      >
        <Image size={16} className="md:w-[18px] md:h-[18px]" />
      </button>

      {/* ── SMILE / EMOJI ── */}
      <button
        ref={emojiButtonRef}
        type="button"
        onClick={toggleEmojiPicker}
        title="Emoji"
        className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl hover:bg-zinc-800 transition flex items-center justify-center text-zinc-400 hover:text-red-400"
      >
        <Smile size={16} className="md:w-[18px] md:h-[18px]" />
      </button>

      {/* placeholder buttons */}
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

      {/* ── EMOJI PICKER (portal: escapa do overflow-hidden) ── */}
      {showEmojiPicker && createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowEmojiPicker(false)}
          />
          <div
            className="fixed z-50"
            style={{ left: pickerPos.left, top: pickerPos.top }}
          >
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                onEmojiSelect?.(emojiData.emoji);
                setShowEmojiPicker(false);
              }}
              theme={Theme.DARK}
              emojiStyle={EmojiStyle.GOOGLE}
              width={350}
              height={350}
              lazyLoadEmojis
              searchPlaceHolder="Buscar emoji"
              previewConfig={{ showPreview: false }}
              categories={[
                { category: Categories.SMILEYS_PEOPLE, name: '' },
                { category: Categories.ANIMALS_NATURE,  name: '' },
                { category: Categories.FOOD_DRINK,       name: '' },
                { category: Categories.TRAVEL_PLACES,    name: '' },
                { category: Categories.ACTIVITIES,       name: '' },
                { category: Categories.OBJECTS,          name: '' },
                { category: Categories.SYMBOLS,          name: '' },
                { category: Categories.FLAGS,            name: '' },
              ]}
            />
          </div>
        </>,
        document.body
      )}
    </div>
  );
}