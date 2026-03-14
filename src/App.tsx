import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <h1 className="text-3xl font-semibold text-foreground tracking-tight">
        SaaS Analytics System
      </h1>
      <p className="mt-2 text-primary">
        Frontend infrastructure initialized with semantic styling.
      </p>
      
      {/* Test a primary button using the variables */}
      <button className="mt-6 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
        Initialize Systems
      </button>
    </div>
  );
};

export default App;