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
        src="/Sankatmochan_Saarthi_Original.svg"
        alt={alt}
        className="w-auto h-full max-h-full object-contain filter drop-shadow-xs"
        style={{ aspectRatio: '1 / 1' }}
      />
    </div>
  );
};
