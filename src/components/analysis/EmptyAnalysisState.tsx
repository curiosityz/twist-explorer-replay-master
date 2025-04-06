
import React from 'react';
import { Lock } from 'lucide-react';

interface EmptyAnalysisStateProps {
  message?: string;
}

const EmptyAnalysisState: React.FC<EmptyAnalysisStateProps> = ({ 
  message = "Fetch a transaction to begin analysis" 
}) => {
  return (
    <div className="text-center text-crypto-foreground/60">
      <Lock className="h-16 w-16 mx-auto mb-4 opacity-20" />
      <p>{message}</p>
    </div>
  );
};

export default EmptyAnalysisState;
