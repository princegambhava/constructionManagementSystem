import api from './api';

export const authService = {
  // PUBLIC SIGNUP
  register: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // LOGIN
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // GET CURRENT USER
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // LOGOUT
  logout: () => {
    localStorage.removeItem('token');
  },
};