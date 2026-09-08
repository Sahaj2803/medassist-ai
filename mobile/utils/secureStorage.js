import * as SecureStore from "expo-secure-store";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../constants/config";

/**
 * Wraps expo-secure-store (Keychain on iOS, Keystore-backed EncryptedSharedPreferences
 * on Android) for the JWT and cached user object. Never use AsyncStorage for the
 * token — SecureStore is the mobile-appropriate equivalent of the web app's
 * httpOnly cookie, since React Native has no cookie jar shared with fetch/axios
 * the way a browser does.
 *
 * The backend's `protect` middleware (backend/middleware/auth.js) already accepts
 * `Authorization: Bearer <token>` as a fallback to the cookie, and
 * sendTokenResponse() already returns `token` in the JSON body — so no backend
 * change was required to support this. See mobile/README.md.
 */
export const secureStorage = {
  async getToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token) {
    try {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    } catch {
      // Non-fatal — the user will simply be prompted to log in again.
    }
  },

  async getUser() {
    try {
      const raw = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setUser(user) {
    try {
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Non-fatal
    }
  },

  async clear() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
    } catch {
      // Non-fatal
    }
  },
};

export default secureStorage;
