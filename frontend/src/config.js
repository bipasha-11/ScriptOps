const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:8000' : 'https://scriptops-1.onrender.com');

export default API_BASE_URL;
