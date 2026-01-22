'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-xl' },
    md: { icon: 'w-10 h-10', text: 'text-2xl' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl' },
  };

  return (
    <div className="flex items-center gap-2">
      {/* Rounded blob icon like screenshot */}
      <div className={`${sizes[size].icon} bg-white rounded-full flex items-center justify-center relative`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Organic blob shape */}
          <path
            d="M20 5C25 5 30 7 33 12C36 17 36 23 33 28C30 33 25 35 20 35C15 35 10 33 7 28C4 23 4 17 7 12C10 7 15 5 20 5Z"
            fill="#5B6FEE"
            className="animate-pulse"
          />
          {/* Inner blob for depth */}
          <ellipse
            cx="20"
            cy="20"
            rx="12"
            ry="8"
            fill="#7B8FFF"
            opacity="0.8"
          />
        </svg>
      </div>
      
      {/* Logo Text - Bold rounded font like screenshot */}
      {showText && (
        <span 
          className={`${sizes[size].text} text-blue-600 dark:text-white`}
          style={{ 
            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 800,
            letterSpacing: '-0.01em'
          }}
        >
          Stretch
        </span>
      )}
    </div>
  );
}
