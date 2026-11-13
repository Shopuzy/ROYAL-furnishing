interface BrandLogoProps {
  variant?: 'light' | 'dark';
  compact?: boolean;
}

export function BrandLogo({ variant = 'light', compact = false }: BrandLogoProps) {
  const textColor = variant === 'light' ? 'text-[#F5EFE6]' : 'text-[#1C1917]';
  const subColor = variant === 'light' ? 'text-[#D6B87A]' : 'text-[#8C6D32]';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        width={compact ? 26 : 32}
        height={compact ? 24 : 28}
        viewBox="0 0 40 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="rfGoldGrad" x1="0" y1="0" x2="40" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E6CE97" />
            <stop offset="50%" stopColor="#C8A45D" />
            <stop offset="100%" stopColor="#9A7632" />
          </linearGradient>
        </defs>
        <path
          d="M5 24L2.5 9.5L12.5 16.5L20 4.5L27.5 16.5L37.5 9.5L35 24H5Z"
          fill="url(#rfGoldGrad)"
        />
        <circle cx="20" cy="3.2" r="2" fill="#E6CE97" />
        <circle cx="2.5" cy="8.2" r="1.6" fill="#C8A45D" />
        <circle cx="37.5" cy="8.2" r="1.6" fill="#C8A45D" />
        <rect x="6" y="26.5" width="28" height="2.6" rx="1.3" fill="url(#rfGoldGrad)" />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-semibold tracking-[0.14em] ${
            compact ? 'text-[17px]' : 'text-[21px]'
          } ${textColor}`}
        >
          ROYAL
        </span>
        <span
          className={`text-[9px] font-medium tracking-[0.28em] mt-0.5 ${subColor}`}
        >
          FURNISHING
        </span>
      </span>
    </span>
  );
}
