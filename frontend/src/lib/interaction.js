const SESSION_KEY = "studyhub_interaction_session";

const createSessionId = () => {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const generated = typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    return "session-unavailable";
  }
};

export const interactionHeaders = () => ({
  "X-StudyHub-Session": createSessionId(),
});
