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
    <div className="flex items-center gap-3">
      {/* Creative Logo Icon - Dynamic S with Prediction Wave */}
      <div className="relative group">
        <div className={`${sizes[size].icon} bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 relative overflow-hidden`}>
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 via-transparent to-yellow-400/20 animate-pulse"></div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/50 to-purple-600/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <svg
            viewBox="0 0 32 32"
            fill="none"
            className="w-6 h-6 relative z-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Creative S shape with prediction wave */}
            <path
              d="M20 8C20 8 18 6 14 6C10 6 8 8 8 11C8 14 10 15 14 15C18 15 20 16 20 19C20 22 18 24 14 24C10 24 8 22 8 22"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-lg"
            />
            {/* Prediction wave accent */}
            <path
              d="M22 10C23 11 24 12 25 13M22 18C23 19 24 20 25 21"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
              className="animate-pulse"
            />
            {/* Data points */}
            <circle cx="6" cy="11" r="1.5" fill="white" opacity="0.8" />
            <circle cx="6" cy="19" r="1.5" fill="white" opacity="0.8" />
          </svg>
        </div>
        
        {/* Orbiting particles effect */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-150"></div>
      </div>
      
      {/* Logo Text with gradient and effects */}
      {showText && (
        <div className="relative">
          <span className={`${sizes[size].text} font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm tracking-tight`}>
            Stretch
          </span>
          {/* Subtle underline accent */}
          <div className="h-0.5 w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mt-0.5"></div>
        </div>
      )}
    </div>
  );
}
