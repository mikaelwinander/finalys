import type { FC } from 'react';

interface SpinnerProps {
  /** Optional tailwind classes for custom sizing or margins */
  className?: string;
  /** Whether to use the light foreground color (for primary buttons) */
  light?: boolean;
}

export const Spinner: FC<SpinnerProps> = ({ className = "h-6 w-6", light = false }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`
          animate-spin rounded-full border-2 border-t-transparent
          ${light ? 'border-primary-foreground' : 'border-interactive'}
        `}
        style={{ borderRightColor: 'transparent' }}
        role="status"
        aria-label="loading"
      />
    </div>
  );
};