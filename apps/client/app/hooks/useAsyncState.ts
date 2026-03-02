import { useState, useCallback } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseAsyncStateReturn<T> extends AsyncState<T> {
  execute: (asyncFn: () => Promise<T>) => Promise<T | void>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for managing async operations with standardized loading/error states
 */
export function useAsyncState<T = any>(
  initialData: T | null = null
): UseAsyncStateReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (asyncFn: () => Promise<T>): Promise<T | void> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await asyncFn();
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        throw error;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}

/**
 * Custom hook for form submission with standardized loading/error states
 */
export function useAsyncSubmit<T = any>() {
  const asyncState = useAsyncState<T>();

  const submit = useCallback(
    async (
      submitFn: () => Promise<T>,
      onSuccess?: (data: T) => void,
      onError?: (error: string) => void
    ) => {
      try {
        const result = await asyncState.execute(submitFn);
        if (result && onSuccess) {
          onSuccess(result);
        }
      } catch (error) {
        if (onError) {
          const errorMessage =
            error instanceof Error ? error.message : 'Submission failed';
          onError(errorMessage);
        }
      }
    },
    [asyncState]
  );

  return {
    ...asyncState,
    submit,
  };
}

/**
 * Custom hook for API calls with standardized loading/error states
 */
export function useApiCall<T = any>() {
  const asyncState = useAsyncState<T>();

  const call = useCallback(
    async (
      apiFn: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: string) => void;
        showErrorToast?: boolean;
      }
    ) => {
      try {
        const result = await asyncState.execute(apiFn);
        if (result && options?.onSuccess) {
          options.onSuccess(result);
        }
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'API call failed';

        if (options?.onError) {
          options.onError(errorMessage);
        }

        // Could integrate with toast notifications here
        if (options?.showErrorToast) {
          console.error('API Error:', errorMessage);
        }

        throw error;
      }
    },
    [asyncState]
  );

  return {
    ...asyncState,
    call,
  };
}
