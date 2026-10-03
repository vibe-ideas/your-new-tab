// Keep the page response deadline longer than the complete fallback sequence.
export const BACKGROUND_SOURCE_TIMEOUT_MS = 5000;
export const BACKGROUND_MAX_SOURCES = 3;
export const BACKGROUND_RESPONSE_TIMEOUT_MS = BACKGROUND_SOURCE_TIMEOUT_MS * BACKGROUND_MAX_SOURCES + 2000;
