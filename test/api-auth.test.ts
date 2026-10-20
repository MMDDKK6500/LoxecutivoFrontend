import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiCore } from '../src/services/apiCore';
import { apiExport } from '../src/services/apiExport';

function requestInterceptor(client: typeof apiCore) {
  return client.interceptors.request.handlers[0]?.fulfilled as ((config: { headers: Record<string, string> }) => { headers: Record<string, string> });
}

describe('authenticated API clients', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'signed-token'),
      removeItem: vi.fn(),
    });
  });

  it('adds the JWT to every Core request', () => {
    const config = requestInterceptor(apiCore)({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer signed-token');
  });

  it('adds the JWT to every export request', () => {
    const config = requestInterceptor(apiExport)({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer signed-token');
  });

  it('does not invent an Authorization header without a session token', () => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => null), removeItem: vi.fn() });
    const config = requestInterceptor(apiCore)({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('clears the session and redirects after a 401 response', async () => {
    const removeItem = vi.fn();
    const assign = vi.fn();
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'expired-token'), removeItem });
    vi.stubGlobal('window', { location: { pathname: '/dashboard', assign } });
    const rejected = apiCore.interceptors.response.handlers[0]?.rejected as (error: unknown) => Promise<never>;

    await expect(rejected({ isAxiosError: true, response: { status: 401 } })).rejects.toBeTruthy();
    expect(removeItem).toHaveBeenCalledWith('token');
    expect(assign).toHaveBeenCalledWith('/login');
  });
});
