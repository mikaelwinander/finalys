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
  /** Optional: If provided, the popover becomes a controlled component */
  isOpen?: boolean;
  /** Optional: Callback fired when the popover requests to open or close */
  onOpenChange?: (open: boolean) => void;
}

export const Popover: FC<PopoverProps> = ({ 
  trigger, 
  content, 
  align = 'right',
  className = '',
  isOpen: controlledIsOpen,
  onOpenChange
}) => {
  // 1. Internal state for fallback (uncontrolled usage)
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 2. Determine if the parent is controlling the state
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // 3. Handlers that respect both controlled and uncontrolled patterns
  const handleToggle = () => {
    const nextState = !isOpen;
    if (!isControlled) {
      setInternalIsOpen(nextState);
    }
    if (onOpenChange) {
      onOpenChange(nextState);
    }
  };

  const handleClose = () => {
    if (!isControlled) {
      setInternalIsOpen(false);
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isControlled, onOpenChange]);

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Area */}
      <div onClick={handleToggle} className="cursor-pointer">
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