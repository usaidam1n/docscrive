import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../theme-config';

interface LoadingSpinnerProps {
  loadingMsg: string;
  className?: string;
}

export default function LoadingSpinner({
  loadingMsg,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm font-medium">{loadingMsg}</span>
    </div>
  );
}
