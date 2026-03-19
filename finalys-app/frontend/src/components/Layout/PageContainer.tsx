// /frontend/src/components/Layout/PageContainer.tsx
import type { FC, ReactNode } from 'react';

interface PageContainerProps {
  title: string; 
  description?: ReactNode | string; 
  children: ReactNode;
  /** Optional class overrides for the title typography */
  titleClassName?: string;
  /** Optional class overrides for the description typography */
  descriptionClassName?: string;
}

export const PageContainer: FC<PageContainerProps> = ({ 
  title, 
  description, 
  children,
  titleClassName,
  descriptionClassName
}) => {
  return (
    <div className="flex flex-col h-full w-full text-left">
      <div className="mb-6 shrink-0">
        {/* text-2xl is now permanently locked. titleClassName can only add extra rules. */}
        <h2 className={`text-2xl font-bold text-foreground tracking-tight ${titleClassName || ''}`}>
          {title}
        </h2>
          {/* text-base is permanently locked. descriptionClassName can only add extra rules. */}        
        {description && (
          <div className={`text-xl text-muted-foreground mt-1 ${descriptionClassName || ''}`}>
            {description}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 w-full">
        {children}
      </div>
    </div>
  );
};