
import React from 'react';
import { Loader2 } from 'lucide-react';

const AnalysisLoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[280px]">
      <Loader2 className="h-16 w-16 animate-spin text-crypto-primary mb-4" />
      <p className="text-crypto-foreground/70 text-center">
        Computing modular congruences and applying Chinese Remainder Theorem...
      </p>
    </div>
  );
};

export default AnalysisLoadingState;
