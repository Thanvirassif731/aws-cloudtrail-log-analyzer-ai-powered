const BASE_URL = '/api';

export function getToken() {
  return localStorage.getItem('cloudtrail_admin_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('cloudtrail_admin_token', token);
  } else {
    localStorage.removeItem('cloudtrail_admin_token');
  }
}

async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized. Please sign in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const api = {
  login: async (username, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  logout: async () => {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    } finally {
      setToken(null);
    }
  },

  getMe: async () => {
    return fetchWithAuth('/auth/me');
  },

  getStats: async () => {
    return fetchWithAuth('/stats');
  },

  getFilterOptions: async () => {
    return fetchWithAuth('/filter-options');
  },

  getEvents: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return fetchWithAuth(`/events?${query.toString()}`);
  },

  getEventDetail: async (eventId) => {
    return fetchWithAuth(`/events/${encodeURIComponent(eventId)}`);
  },

  rescanLogs: async () => {
    return fetchWithAuth('/rescan', { method: 'POST' });
  },

  // Sources management API
  getSources: async () => {
    return fetchWithAuth('/sources');
  },

  getFetchStatus: async () => {
    return fetchWithAuth('/sources/fetch-status');
  },

  addLocalSource: async (path, name) => {
    return fetchWithAuth('/sources/local', {
      method: 'POST',
      body: JSON.stringify({ path, name })
    });
  },

  addS3Source: async (config) => {
    return fetchWithAuth('/sources/s3', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  refreshSource: async (id) => {
    return fetchWithAuth(`/sources/${encodeURIComponent(id)}/refresh`, {
      method: 'POST'
    });
  },

  deleteSource: async (id) => {
    return fetchWithAuth(`/sources/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  // Legacy path methods
  getLogPath: async () => {
    return fetchWithAuth('/logs/path');
  },

  updateLogPath: async (newPath) => {
    return fetchWithAuth('/logs/path', {
      method: 'POST',
      body: JSON.stringify({ path: newPath })
    });
  },

  getExportUrl: (params = {}, format = 'csv') => {
    const token = getToken();
    const query = new URLSearchParams();
    query.append('format', format);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return `${BASE_URL}/export?${query.toString()}&token=${token || ''}`;
  }
};
