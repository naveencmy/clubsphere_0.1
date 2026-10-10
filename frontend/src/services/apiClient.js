export function createApiClient(baseUrl, session) {
  return async (path, { method = 'GET', body, signal } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: { 'Content-Type': 'application/json', 'x-club-slug': session.clubId },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok)
      throw Object.assign(new Error(result.message || 'Request failed'), {
        code: result.code || 'API_ERROR',
      });
    return result;
  };
}
