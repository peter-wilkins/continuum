const publicClientInstanceStorageKey = 'continuum.publicClientInstanceId';

export function getPublicClientInstanceId() {
  const existing = readPublicClientInstanceId();
  if (existing) return existing;

  const next = `public-client:${createRandomId()}`;
  try {
    window.localStorage.setItem(publicClientInstanceStorageKey, next);
  } catch {
    return next;
  }

  return next;
}

function readPublicClientInstanceId() {
  try {
    const value = window.localStorage.getItem(publicClientInstanceStorageKey);
    return value && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
}

function createRandomId() {
  if (window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
