/**
 * Base URL for the backend API services.
 * In development, we use relative paths to leverage the Vite proxy (port 1420).
 * In production or inside the Tauri native context, we target Kestrel's custom port directly.
 */
const isDevServer = typeof window !== 'undefined' && 
  window.location.hostname === 'localhost' && 
  window.location.port === '1420';

export const API_BASE_URL = isDevServer ? '' : 'http://localhost:18493';

/**
 * A centralized wrapper around the native fetch API for making requests to the Grabbe BFF.
 * Automatically handles the application's base URL and environment routing.
 * 
 * @param path The relative or absolute path for the API call (e.g. '/api/v1/search').
 * @param options Optional RequestInit options for the fetch request.
 * @returns The Response from the fetch call.
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${cleanPath}`;
  return fetch(url, options);
}
