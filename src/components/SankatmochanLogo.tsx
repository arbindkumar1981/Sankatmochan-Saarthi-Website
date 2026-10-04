import React from 'react';
import { useWebsite } from '../context/WebsiteContext';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  alt?: string;
}

export const SankatmochanLogo: React.FC<LogoProps> = ({
  className = '',
  onClick,
  alt
}) => {
  const { config } = useWebsite();
  if (!config.logoVisible || !config.logoUrl) return onClick ? <button type="button" className={`font-bold text-orange-900 ${className}`} onClick={onClick}>{config.name}</button> : <span className={`font-bold text-orange-900 ${className}`}>{config.name}</span>;
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center cursor-pointer select-none group transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      title={`${config.name} - Go to Home`}
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
        src={config.logoUrl}
        alt={alt || `${config.name} - Official Logo`}
        width={2164}
        height={727}
        className="w-full h-auto max-h-full object-contain"
      />
    </div>
  );
};
