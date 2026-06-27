import axios from "axios";

/**
 * The one axios instance the whole app uses.
 *
 * `baseURL` is the **same-origin BFF** (`/api`), never the backend directly.
 * The browser calls `/api/...`; the Route Handlers under `app/api/` forward to
 * the real backend with the auth cookie attached. This keeps the backend URL
 * and tokens out of the browser entirely.
 *
 * `withCredentials` ensures the httpOnly auth cookies ride along with requests
 * to our own origin.
 */
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// --- Refresh-token rotation (default ON) ---------------------------------
// On a 401 from the BFF, try the refresh endpoint once, then replay the
// original request. The refresh endpoint is a Route Handler that rotates the
// httpOnly cookies server-side — no token ever touches client JS.
// If you chose "no refresh rotation" at scaffold time, delete this block.
let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        refreshing ??= api.post("/auth/refresh").then(() => undefined);
        await refreshing;
        refreshing = null;
        return api(original);
      } catch (refreshError) {
        refreshing = null;
        // Refresh failed — let the caller handle the 401 (e.g. redirect to login).
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
