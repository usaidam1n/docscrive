import React, { useState, useEffect } from 'react';
import { useSettings } from './providers/SettingsProvider';
import { modelOptions } from '@/utils/utils';
import { Badge } from './ui/badge';

interface ModelSelectorDisplayProps {
  className?: string;
}

/**
 * A component that displays the currently selected model (API or local)
 */
export default function ModelSelectorDisplay({
  className,
}: ModelSelectorDisplayProps) {
  const { selectedModel } = useSettings();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const getModelName = () => {
    const modelInfo = modelOptions.find(
      opt => opt.value === selectedModel.value
    );
    return modelInfo?.label || 'Unknown';
  };

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 px-2 py-1 ${className}`}
    >
      API: {getModelName()}
    </Badge>
  );
}
