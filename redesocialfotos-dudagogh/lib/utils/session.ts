/**
 * Session utility to uniquely identify guest devices without requiring formal login accounts.
 * Used to deduplicate photo likes and track author photo ownership.
 */

const SESSION_KEY = "duda15_guest_session_id";

export function getGuestSessionId(): string {
  if (typeof window === "undefined") {
    return "server-session";
  }

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    // Generate a simple UUID-v4 style random string
    sessionId = "guest_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}
