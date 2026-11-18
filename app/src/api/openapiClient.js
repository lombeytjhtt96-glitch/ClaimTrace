import createClient from 'openapi-fetch';
import { API_BASE_URL, getDeviceFingerprint, getStoredAuthToken } from '../services/apiConfig';

/**
 * Strongly-typed OpenAPI-TS (`openapi-fetch` + `openapi-typescript`) client for ClaimTrace FastAPI.
 * Schema types are generated into `src/api/schema.d.ts` via:
 *   npm run generate:api
 *
 * @type {import('openapi-fetch').Client<import('./schema').paths>}
 */
export const openapiClient = createClient({
  baseUrl: API_BASE_URL || '',
});

openapiClient.use({
  async onRequest({ request }) {
    const token = getStoredAuthToken();
    const fp = getDeviceFingerprint();
    if (token && !request.headers.has('Authorization')) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    if (fp && !request.headers.has('X-Device-Fingerprint')) {
      request.headers.set('X-Device-Fingerprint', fp);
    }
    return request;
  },
});

export default openapiClient;
