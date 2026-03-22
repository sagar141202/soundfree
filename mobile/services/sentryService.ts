const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export function initSentry() {
  if (!DSN) return;
  try {
    const Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn: DSN,
      tracesSampleRate: 0.2,
      environment: __DEV__ ? 'development' : 'production',
      beforeSend(event: any) {
        if (event.user) {
          delete event.user.email;
          delete event.user.username;
          delete event.user.ip_address;
        }
        return event;
      },
    });
  } catch (_) {}
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (!DSN) { console.error('[Error]', error.message, context); return; }
  try {
    const Sentry = require('@sentry/react-native');
    Sentry.withScope((scope: any) => {
      if (context) scope.setExtras(context);
      Sentry.captureException(error);
    });
  } catch (_) {}
}

export function captureMessage(msg: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!DSN) { console.log(`[${level}]`, msg); return; }
  try {
    const Sentry = require('@sentry/react-native');
    Sentry.captureMessage(msg, level);
  } catch (_) {}
}
