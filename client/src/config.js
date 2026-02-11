// Helper to construct API URLs
import API_URL from './config';

export const getApiUrl = (path) => `${API_URL}${path}`;
export const getImageUrl = (path) => path ? `${API_URL}${path}` : '';

export default API_URL;
