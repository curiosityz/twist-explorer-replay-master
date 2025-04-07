
import React from 'react';

interface PrivateKeyInputProps {
  privateKey: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const PrivateKeyInput: React.FC<PrivateKeyInputProps> = ({ privateKey, onChange }) => {
  return (
    <div className="grid gap-2">
      <label htmlFor="privateKey" className="text-sm font-medium leading-none text-crypto-foreground">
        Private Key
      </label>
      <textarea
        id="privateKey"
        className="flex h-24 w-full rounded-md border border-crypto-border bg-crypto-background px-3 py-2 text-sm placeholder:text-crypto-foreground/50 focus:outline-none focus:ring-2 focus:ring-crypto-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-crypto-foreground"
        placeholder="Enter your private key"
        value={privateKey}
        onChange={onChange}
      />
    </div>
  );
};

export default PrivateKeyInput;
