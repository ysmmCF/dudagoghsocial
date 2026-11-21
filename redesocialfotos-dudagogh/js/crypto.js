// crypto.js – utilities for manual authentication
// Generates a random salt (Base64) and hashes password+salt using SHA‑256

/**
 * Generate a random 16‑byte salt and return it as a Base64 string.
 */
function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array));
}

/**
 * Compute SHA‑256 hash of (salt + password) and return hex string.
 * @param {string} salt Base64‑encoded salt
 * @param {string} password Plain‑text password
 * @returns {Promise<string>} Hex‑encoded hash
 */
async function hashPassword(salt, password) {
  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  const pwdBytes = new TextEncoder().encode(password);
  const combined = new Uint8Array(saltBytes.length + pwdBytes.length);
  combined.set(saltBytes);
  combined.set(pwdBytes, saltBytes.length);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Export for inclusion via <script type="module"> if needed (fallback for older browsers)
if (typeof window !== 'undefined') {
  window.cryptoUtils = { generateSalt, hashPassword };
}
