
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook for managing clipboard operations
 */
export const useClipboard = () => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = (text: string | null, successMessage = "Copied to clipboard") => {
    if (!text) return;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(successMessage);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return {
    copied,
    copyToClipboard
  };
};
