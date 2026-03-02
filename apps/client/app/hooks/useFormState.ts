import { useState, useCallback, useEffect } from 'react';

export interface FormField<T> {
  value: T;
  error: string | null;
  touched: boolean;
}

export interface FormState<T extends Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  submitError: string | null;
}

export interface UseFormStateReturn<T extends Record<string, any>>
  extends FormState<T> {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string | null) => void;
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string | null) => void;
  reset: () => void;
  validateField: <K extends keyof T>(field: K) => boolean;
  validateForm: () => boolean;
  getFieldProps: <K extends keyof T>(
    field: K
  ) => {
    value: T[K];
    onChange: (value: T[K]) => void;
    onBlur: () => void;
    error: string | null;
    touched: boolean;
  };
}

export type FormValidationRules<T extends Record<string, any>> = {
  [K in keyof T]?: Array<{
    validate: (value: T[K], allValues: T) => boolean;
    message: string;
  }>;
};

/**
 * Custom hook for managing form state with validation
 */
export function useFormState<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: FormValidationRules<T>
): UseFormStateReturn<T> {
  const [state, setState] = useState<FormState<T>>(() => {
    const fields = Object.keys(initialValues).reduce(
      (acc, key) => {
        acc[key as keyof T] = {
          value: initialValues[key as keyof T],
          error: null,
          touched: false,
        };
        return acc;
      },
      {} as { [K in keyof T]: FormField<T[K]> }
    );

    return {
      fields,
      isValid: true,
      isDirty: false,
      isSubmitting: false,
      submitError: null,
    };
  });

  // Calculate derived state
  useEffect(() => {
    const isValid = Object.values(state.fields).every(field => !field.error);
    const isDirty = Object.keys(initialValues).some(key => {
      const field = state.fields[key as keyof T];
      return field.value !== initialValues[key as keyof T];
    });

    setState(prev => ({ ...prev, isValid, isDirty }));
  }, [state.fields, initialValues]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: {
          ...prev.fields[field],
          value,
          error: null, // Clear error when value changes
        },
      },
      submitError: null, // Clear submit error when any field changes
    }));
  }, []);

  const setError = useCallback(
    <K extends keyof T>(field: K, error: string | null) => {
      setState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [field]: {
            ...prev.fields[field],
            error,
          },
        },
      }));
    },
    []
  );

  const setFieldTouched = useCallback(
    <K extends keyof T>(field: K, touched: boolean = true) => {
      setState(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          [field]: {
            ...prev.fields[field],
            touched,
          },
        },
      }));
    },
    []
  );

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({ ...prev, isSubmitting }));
  }, []);

  const setSubmitError = useCallback((submitError: string | null) => {
    setState(prev => ({ ...prev, submitError }));
  }, []);

  const reset = useCallback(() => {
    const fields = Object.keys(initialValues).reduce(
      (acc, key) => {
        acc[key as keyof T] = {
          value: initialValues[key as keyof T],
          error: null,
          touched: false,
        };
        return acc;
      },
      {} as { [K in keyof T]: FormField<T[K]> }
    );

    setState({
      fields,
      isValid: true,
      isDirty: false,
      isSubmitting: false,
      submitError: null,
    });
  }, [initialValues]);

  const validateField = useCallback(
    <K extends keyof T>(field: K): boolean => {
      if (!validationRules?.[field]) return true;

      const fieldValue = state.fields[field].value;
      const allValues = Object.keys(state.fields).reduce((acc, key) => {
        acc[key as keyof T] = state.fields[key as keyof T].value;
        return acc;
      }, {} as T);

      for (const rule of validationRules[field]!) {
        if (!rule.validate(fieldValue, allValues)) {
          setError(field, rule.message);
          return false;
        }
      }

      setError(field, null);
      return true;
    },
    [state.fields, validationRules, setError]
  );

  const validateForm = useCallback((): boolean => {
    let isFormValid = true;

    Object.keys(state.fields).forEach(key => {
      const field = key as keyof T;
      const isFieldValid = validateField(field);
      if (!isFieldValid) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }, [state.fields, validateField]);

  const getFieldProps = useCallback(
    <K extends keyof T>(field: K) => ({
      value: state.fields[field].value,
      onChange: (value: T[K]) => setValue(field, value),
      onBlur: () => {
        setFieldTouched(field);
        validateField(field);
      },
      error: state.fields[field].error,
      touched: state.fields[field].touched,
    }),
    [state.fields, setValue, setFieldTouched, validateField]
  );

  return {
    ...state,
    setValue,
    setError,
    setFieldTouched,
    setSubmitting,
    setSubmitError,
    reset,
    validateField,
    validateForm,
    getFieldProps,
  };
}
