import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// 1. Interceptor de Petición: Pone el token en cada llamada [cite: 2026-03-05]
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Interceptor de Respuesta: Maneja el refresco automático [cite: 2026-03-02]
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (Expirado) y no hemos reintentado aún [cite: 2026-03-02]
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Llamamos a tu endpoint ya existente en urls.py [cite: 2026-03-02]
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Reintentamos la petición original con el nuevo token [cite: 2026-03-05]
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Si el refresh también falló (pasó 1 día), cerramos sesión [cite: 2026-03-02]
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;