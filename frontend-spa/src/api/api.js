import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor de Petición: Inyecta el token en cada llamada [cite: 2026-03-05]
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuesta: Maneja el refresco silencioso [cite: 2026-03-02, 2026-03-05]
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si hay un error 401 y no hemos reintentado la petición [cite: 2026-03-02]
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Llamada directa a axios para el refresco [cite: 2026-03-05]
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access, refresh } = response.data;
          
          localStorage.setItem('access_token', access);
          // Actualizamos el refresh token si Django aplicó rotación [cite: 2026-03-02]
          if (refresh) localStorage.setItem('refresh_token', refresh);

          // Reintento de la petición original con el nuevo acceso [cite: 2026-03-05]
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Si el refresh falla (sesión expirada de verdad), limpiamos y redirigimos
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;