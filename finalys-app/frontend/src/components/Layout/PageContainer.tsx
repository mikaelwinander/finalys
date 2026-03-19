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
      
      {/* Page Header Area */}
      <div className="mb-6 shrink-0">
        <h2 className={titleClassName || 'text-2xl font-bold text-foreground tracking-tight'}>
          {title}
        </h2>
        {description && (
          <div className={descriptionClassName || 'text-sm text-muted-foreground mt-1'}>
            {description}
          </div>
        )}
      </div>

      {/* Page Content Area */}
      <div className="flex-1 min-h-0 w-full">
        {children}
      </div>
      
    </div>
  );
};