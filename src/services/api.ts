import axios, { AxiosRequestConfig } from 'axios';

// Create a base axios instance with default settings
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://ai-calc-backend-cira.onrender.com',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Set to true if you need to send cookies with requests
});

// Request interceptor for adding tokens or other auth headers
apiClient.interceptors.request.use(
  (config) => {
    // You can add authorization headers here if needed in the future
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors (e.g. 401, 403, etc.)
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error: No response received', error.request);
    } else {
      // Something happened in setting up the request
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Define types for your API request data
interface CalculateRequestData {
  image: string;
  dict_of_vars: Record<string, string>;
}

// API functions
export const calculateApi = {
  calculate: (data: CalculateRequestData, config?: AxiosRequestConfig) => {
    return apiClient.post('/calculate', data, config);
  }
};

export default apiClient;
