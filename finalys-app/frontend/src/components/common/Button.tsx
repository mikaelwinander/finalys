import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';
import { Spinner } from './Spinner'; // Adhering to Centralized Assets rule

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes utilizing the blue-tinted interactive focus ring from index.css
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    // Primary: Uses semantic primary tokens for maximum contrast
    primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
    
    // Outline: Implements blue interactive nuance via semantic tokens
    outline: "border border-border text-interactive hover:bg-interactive-muted hover:text-interactive-hover ring-interactive",
    
    // Ghost: Subtle interactive styling for secondary navigation
    ghost: "text-interactive hover:bg-interactive-muted hover:text-interactive-hover",
    
    // Destructive: For high-risk actions
    destructive: "bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm",
  };

  const sizes = {
    // Adhering to the typography scale: 0.75rem, 0.875rem, 1rem
    sm: "h-8 px-3 text-xs", 
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
};