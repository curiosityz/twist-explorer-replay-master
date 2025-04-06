
import React from 'react';
import { Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisStartButtonProps {
  onStartAnalysis: () => void;
}

const AnalysisStartButton: React.FC<AnalysisStartButtonProps> = ({ onStartAnalysis }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Button 
        onClick={onStartAnalysis}
        className="bg-crypto-accent hover:bg-crypto-accent/80"
      >
        <Cpu className="mr-2 h-4 w-4" />
        Start Vulnerability Analysis
      </Button>
    </div>
  );
};

export default AnalysisStartButton;
