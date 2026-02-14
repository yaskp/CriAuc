// API Configuration
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const getApiUrl = (path) => `${API_URL}${path}`;
export const getImageUrl = (path) => path ? `${API_URL}${path}` : '';

export default API_URL;
