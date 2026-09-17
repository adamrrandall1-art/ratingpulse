/**
 * Centralized Workspace and Session Lifecycle Cleanup Utility
 * Ensures all business-specific keys, cached tokens, and in-memory data
 * are automatically and completely cleared on logout, company switching,
 * or business disconnection.
 */

export const WORKSPACE_STORAGE_KEYS = [
  'ratingpulse_profile_v1',
  'ratingpulse_settings_v1',
  'ratingpulse_reviews_v1',
  'ratingpulse_invites_v1',
  'ratingpulse_demo_mode_v1',
  'ratingpulse_is_pro',
  'ratingpulse_demo_auth',
  'ratingpulse_places_recent',
  'ratingpulse_active_business_id',
  'ratingpulse_selected_place',
] as const;

// Global memory cache reset callbacks registry (for store / in-memory states)
type CacheResetCallback = () => void;
const cacheResetListeners = new Set<CacheResetCallback>();

/**
 * Register a listener to be called whenever workspace state is cleared
 */
export function registerCacheResetListener(listener: CacheResetCallback) {
  cacheResetListeners.add(listener);
  return () => {
    cacheResetListeners.delete(listener);
  };
}

/**
 * Clears all business-specific keys from localStorage, sessionStorage,
 * and notifies in-memory stores/caches to reset to empty defaults.
 */
export function clearLocalWorkspaceState() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Explicit known localStorage keys
    WORKSPACE_STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });

    // 2. Pattern-based localStorage cleanup for dynamic keys
    const localKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('ratingpulse_') || key.startsWith('rp_'))) {
        localKeysToRemove.push(key);
      }
    }
    localKeysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });

    // 3. Clear sessionStorage business-specific keys
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('ratingpulse_') || key.startsWith('rp_') || key.includes('business') || key.includes('profile'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach((key) => {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
  } catch (err) {
    console.warn('[clearLocalWorkspaceState Storage Warning]:', err);
  }

  // 4. Notify all registered in-memory store/cache reset listeners
  cacheResetListeners.forEach((callback) => {
    try {
      callback();
    } catch (err) {
      console.warn('[clearLocalWorkspaceState Callback Error]:', err);
    }
  });
}
