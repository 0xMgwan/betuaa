'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-12 h-12', text: 'text-xl' },
    md: { icon: 'w-14 h-14', text: 'text-2xl' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl' },
  };

  const iconSizes = {
    sm: 48,
    md: 56,
    lg: 64,
  };

  return (
    <div className="flex items-center">
      {/* Logo image from public assets */}
      <div className={`${sizes[size].icon} relative`}>
        <Image
          src="/stretch3.png"
          alt="Stretch Logo"
          width={iconSizes[size]}
          height={iconSizes[size]}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
