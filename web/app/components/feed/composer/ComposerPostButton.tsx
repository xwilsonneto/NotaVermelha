'use client';

interface ComposerPostButtonProps {
  disabled?: boolean;
  loading?:  boolean;
  onClick?:  () => void;
}

export default function ComposerPostButton({ disabled, loading, onClick }: ComposerPostButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        px-4 py-1.5
        rounded-full
        bg-red-600
        text-white
        text-sm
        font-semibold
        transition
        hover:bg-red-500
        disabled:opacity-40
        disabled:cursor-not-allowed
        flex items-center gap-2
      "
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      )}
      Publicar
    </button>
  );
}
