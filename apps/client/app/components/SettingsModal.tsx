'use client';

import React, { useEffect, useState } from 'react';
import { useSettings } from './providers/SettingsProvider';
import { modelOptions } from '@/utils/utils';
import {
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  Save,
  Settings,
  Brain,
  LogOut,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  message: initialMessage = '',
}) => {
  const {
    apiKey,
    selectedModel,
    useSessionStorage,
    updateApiKey,
    updateSelectedModel,
    clearApiKey,
  } = useSettings();

  const [showKey, setShowKey] = useState(false);
  const [localMessage, setLocalMessage] = useState(initialMessage);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);
  useEffect(() => setLocalMessage(initialMessage), [initialMessage]);

  function handleSave(): void {
    if (!apiKey) {
      setLocalMessage('Please enter an API key.');
      return;
    }
    onClose();
  }

  function handleRemoveApiKey() {
    clearApiKey();
    onClose();
  }

  if (!isMounted) return null;

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent className="flex w-full flex-col overflow-y-auto border-l border-white/10 bg-[#0a0a0c]/80 p-0 backdrop-blur-2xl sm:max-w-md">
        <SheetHeader className="shrink-0 border-b border-white/5 bg-white/5 px-6 py-6">
          <SheetTitle className="flex items-center gap-2 text-xl text-white">
            <Settings className="h-5 w-5 text-[#2ecc71]" />
            Configuration
          </SheetTitle>
          <SheetDescription className="text-zinc-400">
            Provide your API key and select preferred model.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {localMessage && (
            <Alert
              variant="destructive"
              className="border-red-500/50 bg-red-500/10 text-red-400"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{localMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-sm font-medium text-zinc-200">
              <Brain className="h-4 w-4 text-[#2ecc71]" />
              AI Settings
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="model"
                className="text-sm font-medium text-zinc-300"
              >
                Provider & Model
              </Label>
              <Select
                value={selectedModel.value}
                onValueChange={value => {
                  const option = modelOptions.find(opt => opt.value === value);
                  if (option) {
                    updateSelectedModel({
                      key: option.key,
                      value: option.value,
                    });
                  }
                }}
              >
                <SelectTrigger className="h-11 border-white/10 bg-white/5 text-white focus:ring-[#2ecc71] focus:ring-offset-0">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#1a1c23] text-zinc-200">
                  <SelectGroup>
                    <SelectLabel className="text-zinc-500">OpenAI</SelectLabel>
                    {modelOptions
                      .filter(option => option.key === 'openai')
                      .map(option => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="focus:bg-white/10 focus:text-white"
                        >
                          <div className="flex items-center gap-2">
                            <span>{option.label}</span>
                            {option.value.includes('o1') && (
                              <Badge
                                variant="secondary"
                                className="h-5 bg-[#2ecc71]/20 px-1.5 text-[10px] text-[#2ecc71] hover:bg-[#2ecc71]/30"
                              >
                                New
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-zinc-500">
                      Anthropic
                    </SelectLabel>
                    {modelOptions
                      .filter(option => option.key === 'anthropic')
                      .map(option => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="focus:bg-white/10 focus:text-white"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-zinc-500">Google</SelectLabel>
                    {modelOptions
                      .filter(option => option.key === 'google')
                      .map(option => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="focus:bg-white/10 focus:text-white"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="api-key"
                className="text-sm font-medium text-zinc-300"
              >
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e =>
                    updateApiKey(e.target.value, useSessionStorage)
                  }
                  placeholder={`Enter your ${selectedModel.key.charAt(0).toUpperCase() + selectedModel.key.slice(1)} key`}
                  className="h-11 border-white/10 bg-white/5 pr-10 font-mono text-white placeholder:text-zinc-600 focus-visible:ring-[#2ecc71] focus-visible:ring-offset-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-9 w-9 text-zinc-400 hover:bg-white/10 hover:text-white"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
              <div className="space-y-1 pr-4">
                <Label className="flex items-center gap-2 font-medium text-zinc-200">
                  <Shield className="h-4 w-4 text-[#2ecc71]" />
                  Session Storage
                </Label>
                <p className="text-xs leading-relaxed text-zinc-500">
                  Store key temporarily. It will be cleared when you close the
                  browser.
                </p>
              </div>
              <Switch
                checked={useSessionStorage}
                onCheckedChange={checked => updateApiKey(apiKey, checked)}
                className="data-[state=checked]:bg-[#2ecc71] data-[state=unchecked]:bg-zinc-700"
              />
            </div>
          </div>
        </div>

        <SheetFooter className="shrink-0 flex-col gap-3 border-t border-white/5 bg-white/5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          {apiKey ? (
            <Button
              variant="ghost"
              onClick={handleRemoveApiKey}
              className="w-full text-zinc-400 hover:bg-red-400/10 hover:text-red-400 sm:w-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Clear Key
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full border-white/10 bg-transparent text-zinc-300 hover:bg-white/10 hover:text-white sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="w-full bg-[#2ecc71] font-semibold text-black hover:bg-[#27ae60] sm:w-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsModal;
