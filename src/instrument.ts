import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  debug: process.env.NODE_ENV === 'development',
  tracesSampleRate: 1.0, // Adjust in the future
});
