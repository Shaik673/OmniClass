import axios from 'axios';

const apiRoot = import.meta.env.VITE_API_URL || '';
export const api = axios.create({ baseURL: `${apiRoot.replace(/\/$/, '')}/api/v1`, withCredentials: true });
api.interceptors.response.use((response) => response.data, (error) => {
  return Promise.reject(error);
});

export const getError = (error) => error.response?.data?.error?.message || error.message || 'Something went wrong. Please try again.';
