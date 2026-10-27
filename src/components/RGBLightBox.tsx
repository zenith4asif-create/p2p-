import React from 'react';

interface RGBLightBoxProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  active?: boolean;
}

/**
 * RGBLightBox: Displays continuous moving RGB light ONLY on the 2px outline line.
 * The card interior remains 100% colorless transparent liquid glass ("aar-paar") with zero RGB fill inside.
 */
export const RGBLightBox: React.FC<RGBLightBoxProps> = ({
  children,
  className = '',
  innerClassName = '',
  active = true,
}) => {
  return (
    <div className={`relative rounded-3xl liquid-glass-card overflow-hidden ${className}`}>
      {/* Continuous Moving RGB Light ONLY on the Outline Border Line (masked center) */}
      {active && (
        <div 
          className="rgb-outline-line-runner pointer-events-none"
          aria-hidden="true"
        >
          <div className="rgb-outline-spinner" />
        </div>
      )}

      {/* Card Body: 100% colorless transparent glass, zero RGB fill inside */}
      <div className={`relative z-10 w-full h-full ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};
