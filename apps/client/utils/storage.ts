/**
 * Gets the API key from either session storage or local storage
 * Prioritizes session storage if available (for security)
 */
export function getApiKey(): string {
  if (typeof window === 'undefined') return '';

  // First try session storage
  const sessionKey = sessionStorage.getItem('apiKey');
  if (sessionKey) return sessionKey;

  // Fall back to local storage
  const localKey = localStorage.getItem('apiKey');
  return localKey || '';
}

/**
 * Saves the API key to the appropriate storage based on user preference
 */
export function saveApiKey(
  key: string,
  useSessionStorage: boolean = false
): void {
  if (typeof window === 'undefined') return;

  if (useSessionStorage) {
    sessionStorage.setItem('apiKey', key);
    localStorage.removeItem('apiKey'); // Clear from the other storage
  } else {
    localStorage.setItem('apiKey', key);
    sessionStorage.removeItem('apiKey'); // Clear from the other storage
  }
}

/**
 * Removes the API key from both storage locations
 */
export function removeApiKey(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('apiKey');
  sessionStorage.removeItem('apiKey');
}

/**
 * Gets the user's preference for using session storage
 */
export function getStoragePreference(): boolean {
  if (typeof window === 'undefined') return false;

  return localStorage.getItem('useSessionStorage') === 'true';
}

export function getSelectedModel(): string {
  if (typeof window === 'undefined') return 'no model selected';

  const selectedModel = localStorage.getItem('selectedModel');
  if (!selectedModel) return 'no model selected';

  try {
    return JSON.parse(selectedModel).value;
  } catch (error) {
    console.error('Error parsing selected model:', error);
    return 'no model selected';
  }
}
