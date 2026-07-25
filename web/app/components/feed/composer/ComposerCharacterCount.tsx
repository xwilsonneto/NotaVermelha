interface Props {
  remaining: number;
  max:       number;
}

export default function ComposerCharacterCount({ remaining, max }: Props) {
  const used    = max - remaining;
  const percent = Math.min(used / max, 1);
  const radius  = 13;
  const circumference = 2 * Math.PI * radius;

  const isWarning  = remaining <= 50 && remaining > 20;
  const isDanger   = remaining <= 20;

  const strokeColor = isDanger ? '#ef4444' : isWarning ? '#f97316' : '#ef4444';
  const trackColor  = '#27272a';

  return (
    <div className="flex items-center gap-2 md:gap-3">

      <div className="relative w-7 h-7 md:w-8 md:h-8">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="rotate-[-90deg] w-full h-full"
        >
          <circle
            cx="16"
            cy="16"
            r={radius}
            stroke={trackColor}
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx="16"
            cy="16"
            r={radius}
            stroke={strokeColor}
            strokeWidth="3"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.15s ease, stroke 0.15s ease' }}
          />
        </svg>
      </div>

      {isDanger && (
        <span className="text-xs text-red-400 tabular-nums">
          {remaining}
        </span>
      )}

    </div>
  );
}