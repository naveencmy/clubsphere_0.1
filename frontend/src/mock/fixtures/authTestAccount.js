// Test-only account factory. Real test accounts are deleted after browser verification.
export function createAuthTestAccount(suffix) {
  return {
    name: 'Authentication Test',
    email: `clubsphere-auth-qa-${suffix}@example.test`,
    password: `Auth-${suffix}-Pass!`,
  };
}
