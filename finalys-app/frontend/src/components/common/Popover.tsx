// /frontend/src/components/common/Popover.tsx
import { useState, useRef, useEffect, type FC, type ReactNode } from 'react';

interface PopoverProps {
  /** The actionable element that triggers the popover (e.g., a Button) */
  trigger: ReactNode;
  /** The content to display inside the popover */
  content: ReactNode;
  /** Alignment relative to the trigger */
  align?: 'left' | 'right' | 'center';
  /** Optional extra classes for the popover container */
  className?: string;
}

export const Popover: FC<PopoverProps> = ({ 
  trigger, 
  content, 
  align = 'right',
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Area */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Popover Content */}
      {isOpen && (
        <div 
          className={`
            absolute top-[calc(100%+8px)] ${alignmentClasses[align]} z-50
            min-w-[200px] p-2 bg-surface border border-border rounded-md shadow-md
            animate-in fade-in zoom-in-95 duration-200
            ${className}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
};