'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import FEATURE_FLAGS from '../../../lib/featureFlags';

export interface SelectedModel {
  key: string;
  value: string;
}

interface SettingsState {
  apiKey: string;
  selectedModel: SelectedModel;
  useSessionStorage: boolean;
  isModalOpen: boolean;
  modalMessage: string;
}

interface SettingsContextType extends SettingsState {
  updateApiKey: (key: string, useSession?: boolean) => void;
  updateSelectedModel: (model: SelectedModel) => void;
  clearApiKey: () => void;
  isConfigured: boolean;
  openModal: (message?: string) => void;
  closeModal: () => void;
  setModalMessage: (message: string) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<SettingsState>({
    apiKey: '',
    selectedModel: { key: 'openai', value: 'gpt-4o' },
    useSessionStorage: false,
    isModalOpen: false,
    modalMessage: '',
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const sessionKey = sessionStorage.getItem('apiKey');
      const localKey = localStorage.getItem('apiKey');
      const apiKey = sessionKey || localKey || '';

      const storedModel = localStorage.getItem('selectedModel');
      let selectedModel = { key: 'openai', value: 'gpt-4o' };
      if (storedModel) {
        try {
          selectedModel = JSON.parse(storedModel);
        } catch (error) {
          console.error(
            'Error parsing selected model from localStorage',
            error
          );
        }
      }

      const useSessionStorage =
        localStorage.getItem('useSessionStorage') === 'true';

      setSettings({
        apiKey,
        selectedModel,
        useSessionStorage,
        isModalOpen: false,
        modalMessage: '',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }

    setMounted(true);
  }, []);

  const updateApiKey = useCallback(
    (key: string, useSession: boolean = false) => {
      if (typeof window === 'undefined') return;

      try {
        if (useSession) {
          sessionStorage.setItem('apiKey', key);
          localStorage.removeItem('apiKey');
        } else {
          localStorage.setItem('apiKey', key);
          sessionStorage.removeItem('apiKey');
        }

        localStorage.setItem('useSessionStorage', String(useSession));

        setSettings(prev => ({
          ...prev,
          apiKey: key,
          useSessionStorage: useSession,
        }));
      } catch (error) {
        console.error('Error saving API key:', error);
      }
    },
    []
  );

  const updateSelectedModel = useCallback((model: SelectedModel) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('selectedModel', JSON.stringify(model));
      setSettings(prev => ({ ...prev, selectedModel: model }));
    } catch (error) {
      console.error('Error saving selected model:', error);
    }
  }, []);

  const clearApiKey = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('apiKey');
      sessionStorage.removeItem('apiKey');
      setSettings(prev => ({ ...prev, apiKey: '' }));
    } catch (error) {
      console.error('Error clearing API key:', error);
    }
  }, []);

  const openModal = useCallback((message: string = '') => {
    setSettings(prev => ({
      ...prev,
      isModalOpen: true,
      modalMessage: message,
    }));
  }, []);

  const closeModal = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      isModalOpen: false,
      modalMessage: '',
    }));
  }, []);

  const setModalMessage = useCallback((message: string) => {
    setSettings(prev => ({ ...prev, modalMessage: message }));
  }, []);

  const isConfigured = !!settings.apiKey;

  const contextValue: SettingsContextType = {
    ...settings,
    updateApiKey,
    updateSelectedModel,
    clearApiKey,
    isConfigured,
    openModal,
    closeModal,
    setModalMessage,
  };

  if (!mounted) {
    return null;
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
}

export function useApiSettings() {
  const {
    apiKey,
    selectedModel,
    updateApiKey,
    updateSelectedModel,
    clearApiKey,
  } = useSettings();
  return {
    apiKey,
    selectedModel,
    updateApiKey,
    updateSelectedModel,
    clearApiKey,
  };
}


export function useSettingsModal() {
  const { isModalOpen, modalMessage, openModal, closeModal, setModalMessage } =
    useSettings();
  return {
    isModalOpen,
    modalMessage,
    openModal,
    closeModal,
    setModalMessage,
  };
}
