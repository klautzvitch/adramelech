import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: Bun.env.SENTRY_DSN,
  enabled: Bun.env.NODE_ENV === 'production',
  debug: Bun.env.NODE_ENV !== 'production',
  tracesSampleRate: 1.0, // Adjust in the future
});
