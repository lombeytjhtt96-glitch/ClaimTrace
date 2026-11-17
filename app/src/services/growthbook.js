import { GrowthBook } from '@growthbook/growthbook-react';

export const growthbook = new GrowthBook({
  apiHost: import.meta.env.VITE_GROWTHBOOK_API_HOST || 'https://cdn.growthbook.io',
  clientKey: import.meta.env.VITE_GROWTHBOOK_CLIENT_KEY || 'sdk-rqlBt32gkZkhGZV7',
  enableDevMode: Boolean(import.meta.env.DEV),
  trackingCallback: (experiment, result) => {
    console.log('[GrowthBook Experiment Viewed]:', {
      experimentId: experiment?.key,
      variationId: result?.key,
      value: result?.value,
    });
  },
});
