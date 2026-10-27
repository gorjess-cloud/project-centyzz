import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { formatAuditLog } from './dashboardData';
import { previewAuditLogs, previewSummary } from './superadminPreviewData';

export function useDashboardSummary(token, preview, refresh) {
  const [result, setResult] = useState(null);
  const requestKey = JSON.stringify([token, preview, refresh]);

  useEffect(() => {
    if (preview || !token) return;
    let active = true;
    api.getSuperadminDashboardSummary(token)
      .then(response => {
        if (!response.data?.accounts || !response.data?.codes || !response.data?.errors) {
          throw new Error('The dashboard response is incomplete. Please try again.');
        }
        if (active) setResult({ requestKey, data: response.data, error: '' });
      })
      .catch(error => {
        if (active) setResult({ requestKey, data: null, error: error.message });
      });
    return () => { active = false; };
  }, [token, preview, refresh, requestKey]);

  if (preview) return { data: previewSummary, loading: false, error: '' };
  if (!token) return { data: null, loading: false, error: 'Sign in as a Superadmin to view system statistics.' };
  if (result?.requestKey !== requestKey) return { data: null, loading: true, error: '' };
  return { data: result.data, loading: false, error: result.error };
}

export function useAuditLogs({ token, preview, page, limit, search, action, refresh }) {
  const [result, setResult] = useState(null);
  const requestKey = JSON.stringify([token, preview, page, limit, search, action, refresh]);

  useEffect(() => {
    if (preview || !token) return;
    let active = true;
    api.getSuperadminAuditLogs(token, { page, limit, search, action })
      .then(response => {
        if (!Array.isArray(response.data)) throw new Error('The activity response is incomplete. Please try again.');
        if (active) setResult({ requestKey, logs: response.data.map(formatAuditLog), total: Number(response.pagination?.total || 0), error: '' });
      })
      .catch(error => {
        if (active) setResult({ requestKey, logs: [], total: 0, error: error.message });
      });
    return () => { active = false; };
  }, [token, preview, page, limit, search, action, refresh, requestKey]);

  if (preview) {
    const filtered = previewAuditLogs.map(formatAuditLog).filter(row =>
      (!action || row.rawAction === action) && `${row.name} ${row.subject} ${row.category}`.toLowerCase().includes(search.toLowerCase()),
    );
    return { logs: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, loading: false, error: '' };
  }
  if (!token) return { logs: [], total: 0, loading: false, error: 'Sign in as a Superadmin to view system activity.' };
  if (result?.requestKey !== requestKey) return { logs: [], total: 0, loading: true, error: '' };
  return { logs: result.logs, total: result.total, error: result.error, loading: false };
}
