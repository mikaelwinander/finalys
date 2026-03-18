// /frontend/src/components/Layout/Header.tsx
import type { FC } from 'react';

export const Header: FC = () => {
  return (
    <header className="h-16 bg-muted border-b border-border flex items-center px-6 shrink-0 justify-between z-20">
      <div className="flex items-center gap-4">
        {/* Adjusted Logo to match the scale of the reference UI */}
        <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-xl font-bold">
          F
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-primary leading-tight uppercase tracking-tight">
            FINALYS
          </h1>
        </div>

          <span className="text-xl font-medium text-foreground/60 leading-tight">
            - AI powered financial analysis and simluation
          </span>


      </div>

      {/* Placeholder for User Profile found in the top right of your image */}
      <div className="flex items-center gap-2 text-sm text-primary font-medium">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          👤
        </div>
        <span className="hidden md:block">User Admin, Finalys</span>
      </div>
    </header>
  );
};