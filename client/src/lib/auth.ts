// Minimal auth helpers for the client
import { apiRequest } from './queryClient';

export function login() {
  // redirect to server login which starts OIDC flow
  window.location.href = '/api/login';
}

export async function logout(): Promise<void> {
  // perform logout via POST to ensure session is destroyed server-side
  try {
    await apiRequest('POST', '/api/logout');
  } catch (err) {
    // ignore errors - still redirect
    console.warn('logout failed', err);
  } finally {
    window.location.href = '/';
  }
}

export default { login, logout };
