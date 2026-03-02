// Centralized feature flags for the app.
// Toggle flags here to enable/disable experimental or optional features.

export const FEATURE_FLAGS = {
  // When false, hide all UI affordances for local/on-device LLMs (Ollama, LocalAI, etc.)
  // The underlying client and proxy code remain in the repo but will be inaccessible
  // via the UI when this flag is false.
  ENABLE_LOCAL_MODE: false,
};

export default FEATURE_FLAGS;
