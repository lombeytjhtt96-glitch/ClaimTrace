import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, authFetch, cachedAuthGetJson, getCachedJsonSync } from '../services/apiConfig';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const claimtraceQueryKeys = {
  sidebarBadges: ['system', 'sidebar-badges'],
  redisWorkerStatus: ['system', 'redis-worker-status'],
  claims: (limit = 15) => ['claims', { limit }],
  auditLogs: ['audit-logs'],
  interventions: ['operations', 'interventions'],
  mobileTelemetry: ['operations', 'mobile-telemetry'],
  asyncJobs: (limit = 20) => ['jobs', { limit }],
  asyncJob: (jobId) => ['jobs', jobId],
};

export function useSidebarBadgesQuery(enabled = true) {
  const badgesUrl = `${API_BASE_URL}/api/v1/system/sidebar-badges`;
  return useQuery({
    queryKey: claimtraceQueryKeys.sidebarBadges,
    enabled,
    staleTime: 15_000,
    refetchInterval: enabled ? 30_000 : false,
    initialData: () => {
      const mem = getCachedJsonSync(badgesUrl);
      if (mem) return mem;
      try {
        const saved = JSON.parse(sessionStorage.getItem('claimtrace_sidebar_badges_v1') || 'null');
        if (saved && typeof saved === 'object') return saved;
      } catch {}
      return undefined;
    },
    queryFn: async () => {
      const data = await cachedAuthGetJson(badgesUrl, { force: true });
      if (data) {
        try {
          sessionStorage.setItem('claimtrace_sidebar_badges_v1', JSON.stringify(data));
        } catch {}
      }
      return data;
    },
  });
}

export function useClaimsQuery(limit = 15, enabled = true) {
  return useQuery({
    queryKey: claimtraceQueryKeys.claims(limit),
    enabled,
    staleTime: 25_000,
    queryFn: () => cachedAuthGetJson(`${API_BASE_URL}/api/v1/claims?limit=${limit}`),
  });
}

export function useAuditLogsQuery(enabled = true) {
  return useQuery({
    queryKey: claimtraceQueryKeys.auditLogs,
    enabled,
    staleTime: 15_000,
    queryFn: () => cachedAuthGetJson(`${API_BASE_URL}/api/v1/audit-logs`),
  });
}

export function useRedisWorkerStatusQuery(enabled = true) {
  return useQuery({
    queryKey: claimtraceQueryKeys.redisWorkerStatus,
    enabled,
    staleTime: 10_000,
    refetchInterval: enabled ? 15_000 : false,
    queryFn: () => cachedAuthGetJson(`${API_BASE_URL}/api/v1/system/redis-worker/status`, { force: true }),
  });
}

export function useAsyncJobsQuery(limit = 20, enabled = true) {
  return useQuery({
    queryKey: claimtraceQueryKeys.asyncJobs(limit),
    enabled,
    staleTime: 5_000,
    refetchInterval: enabled ? 10_000 : false,
    queryFn: () => cachedAuthGetJson(`${API_BASE_URL}/api/v1/jobs?limit=${limit}`, { force: true }),
  });
}

export function useEnqueueAsyncJobMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobType, claimIds = null }) => {
      const res = await authFetch(`${API_BASE_URL}/api/v1/jobs/enqueue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_type: jobType, claim_ids: claimIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || `Gagal mengirim job asinkron (HTTP ${res.status})`);
      }
      return data;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: claimtraceQueryKeys.redisWorkerStatus });
      qc.invalidateQueries({ queryKey: claimtraceQueryKeys.sidebarBadges });
    },
  });
}
