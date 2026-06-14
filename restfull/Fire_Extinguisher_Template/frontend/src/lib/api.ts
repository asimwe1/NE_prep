import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  login:    (data: { email: string; password: string }) => api.post('/auth/login', data),
  verifyOtp:(data: { email: string; code: string; purpose: string }) => api.post('/auth/verify-otp', data),
  resendOtp:(data: { email: string; purpose: string }) => api.post('/auth/resend-otp', data),
};

// ── Customers ───────────────────────────────────────────────────────
export const customersApi = {
  list:   (params?: Record<string, unknown>) => api.get('/customers', { params }),
  get:    (id: string) => api.get(`/customers/${id}`),
};

// ── Extinguishers ───────────────────────────────────────────────────
export const extinguishersApi = {
  list:    (params?: Record<string, unknown>) => api.get('/extinguishers', { params }),
  create:  (data: Record<string, unknown>) => api.post('/extinguishers', data),
  update:  (id: string, data: Record<string, unknown>) => api.patch(`/extinguishers/${id}`, data),
  expiring:(days?: number) => api.get('/extinguishers/expiring', { params: { days } }),
};

// ── Notifications ───────────────────────────────────────────────────
export const notificationsApi = {
  list:       (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  acknowledge:(id: string) => api.patch(`/notifications/${id}/acknowledge`),
  stats:      () => api.get('/notifications/stats'),
};

// ── Escalations ─────────────────────────────────────────────────────
export const escalationsApi = {
  list:   (params?: Record<string, unknown>) => api.get('/escalations', { params }),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/escalations/${id}`, data),
  stats:  () => api.get('/escalations/stats'),
};
