process.env.NODE_ENV = 'test'

// Deterministic, non-production secrets for the test process. dotenv does not
// override variables that are already set, so a local .env cannot make tests
// depend on real secrets.
process.env.JWT_ACCESS_SECRET =
  'test-access-secret-that-is-at-least-32-characters-long'
process.env.JWT_REFRESH_SECRET =
  'test-refresh-secret-that-is-at-least-32-characters-long'
