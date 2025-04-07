
import { useState, useEffect } from 'react';
import { testCrtImplementation } from '@/lib/crypto/crtUtils';
import { Button } from '@/components/ui/button';
import { Check, X, AlertTriangle } from 'lucide-react';

export const CrtTester = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const runTest = () => {
    setIsRunning(true);
    try {
      const result = testCrtImplementation();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        error: String(error),
        passed: false
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  useEffect(() => {
    // Run the test once when component mounts
    runTest();
  }, []);
  
  if (!testResult) {
    return (
      <div className="p-4 border rounded-md bg-cyan-500/10 border-cyan-500/30">
        <p className="text-sm">Running CRT validation test...</p>
      </div>
    );
  }
  
  return (
    <div className={`p-4 border rounded-md ${testResult.passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium flex items-center">
          {testResult.passed ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <X className="h-4 w-4 mr-2 text-red-500" />
          )}
          CRT Implementation Test
        </h3>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={runTest}
          disabled={isRunning}
        >
          Run Test
        </Button>
      </div>
      
      <div className="space-y-2 text-sm">
        {testResult.error ? (
          <div className="flex items-start text-red-500">
            <AlertTriangle className="h-4 w-4 mr-2 mt-0.5" />
            <p>{testResult.error}</p>
          </div>
        ) : (
          <>
            <div>
              <span className="font-medium">Expected:</span> {testResult.expectedBigInt}
            </div>
            <div>
              <span className="font-medium">Actual:</span> {testResult.resultBigInt}
            </div>
            <div>
              <span className="font-medium">Expected Hex:</span> <code className="text-xs bg-crypto-background px-1 py-0.5 rounded">{testResult.expectedHex}</code>
            </div>
            <div>
              <span className="font-medium">Actual Hex:</span> <code className="text-xs bg-crypto-background px-1 py-0.5 rounded">{testResult.actualHex}</code>
            </div>
            <div>
              <span className="font-medium">Match:</span> {testResult.exactMatch ? 'Yes ✅' : 'No ❌'}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CrtTester;
