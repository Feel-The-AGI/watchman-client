'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const dimension = sizeMap[size];
  
  return (
    <Image
      src="/logo.png"
      alt="Watchman"
      width={dimension}
      height={dimension}
      className={`rounded-full ${className}`}
      priority
    />
  );
}

export default Logo;
