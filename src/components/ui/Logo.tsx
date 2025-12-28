'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export function Logo({ size = 'md', className = '', showText = false }: LogoProps) {
  const dimension = sizeMap[size];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/watchman-logo.png"
        alt="Watchman"
        width={dimension}
        height={dimension}
        className="object-contain rounded-full"
        priority
      />
      {showText && (
        <span className="font-bold text-watchman-text tracking-tight">
          Watchman
        </span>
      )}
    </div>
  );
}

// Alias for backwards compatibility
export const LogoIcon = Logo;

export default Logo;
