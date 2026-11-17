/**
 * ClaimTrace JKN Enterprise Telemetry, Feature Flags & Experimentation Suite
 * Integrasi resmi:
 * 1. Statsig (Feature Gates, Experiments, Session Replay, Auto-Capture Events)
 * 2. GrowthBook (Feature Flags, Remote Config, A/B Testing)
 * 3. LaunchDarkly (Enterprise Feature Management & Safe Rollouts)
 */
import { growthbook } from './growthbook';

export const STATSIG_CLIENT_KEY = 'client-xuGhZIFcJXG4W5mMcIvGmf72EuWFy93Ezdbd3F9nXU6';
export const GROWTHBOOK_CLIENT_KEY = 'sdk-rqlBt32gkZkhGZV7';
export const GROWTHBOOK_API_HOST = 'https://cdn.growthbook.io';
export const LAUNCHDARKLY_PROD_CLIENT_ID = '6afc1e074dc6f50743d0afb9';
export const LAUNCHDARKLY_TEST_CLIENT_ID = '6afc1e074dc6f50743d0afb8';
export const LAUNCHDARKLY_PROJECT_KEY = 'default';

/**
 * Log a high-fidelity business or audit event to Statsig and telemetry streams
 */
export function logTelemetryEvent(statsigClient, eventName, value = null, metadata = {}) {
  try {
    if (statsigClient && typeof statsigClient.logEvent === 'function') {
      statsigClient.logEvent(eventName, value ? String(value) : undefined, {
        app: 'ClaimTrace JKN',
        env: import.meta.env.MODE || 'production',
        timestamp: new Date().toISOString(),
        ...metadata,
      });
    }
  } catch (err) {
    console.warn('[Telemetry Event Log Notice]:', err);
  }
}
