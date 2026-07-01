import axios from 'axios';
import { pushNotification } from './notifications';
import { authStorage } from './auth';

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
axios.defaults.baseURL = rawApiUrl
  ? /^https?:\/\//i.test(rawApiUrl)
    ? rawApiUrl.replace(/\/+$/, '')
    : `/${rawApiUrl.replace(/^\/+|\/+$/g, '')}`
  : '/api';
axios.defaults.withCredentials = false;

axios.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let handledUnauthorized = false;

const shouldNotifyOperationalError = (error: any) => {
  const status = Number(error?.response?.status ?? 0);
  const message = String(error?.response?.data?.message || error?.message || '').toLowerCase();

  // Evita ensuciar el centro de notificaciones con fallos técnicos/sistema.
  if (!status) return false; // network / CORS / timeout sin respuesta del backend
  if (status >= 500) return false;
  if (message.includes('internal server error')) return false;

  // Errores funcionales que sí pueden ser útiles para el usuario.
  return status >= 400 && status < 500;
};

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      authStorage.clear();
      if (!handledUnauthorized) {
        handledUnauthorized = true;
        pushNotification({
          title: 'Sesion expirada',
          message: 'Inicia sesion nuevamente para continuar.',
          severity: 'warning'
        });

        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
      return Promise.reject(error);
    }

    if (shouldNotifyOperationalError(error)) {
      const message = error?.response?.data?.message || error.message || 'No se pudo completar la operación.';
      pushNotification({
        title: 'Error de operación',
        message,
        severity: 'error'
      });
    }

    return Promise.reject(error);
  }
);

export default axios;
