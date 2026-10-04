import React from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  alt?: string;
}

export const SankatmochanLogo: React.FC<LogoProps> = ({
  className = '',
  onClick,
  alt = 'Sankatmochan Saarthi - Official Logo'
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center cursor-pointer select-none group transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      title="Sankatmochan Saarthi - Go to Home"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <img
        src="/sankatmochan-saarthi-logo.png"
        alt={alt}
        width={2164}
        height={727}
        className="w-full h-auto max-h-full object-contain"
      />
    </div>
  );
};
