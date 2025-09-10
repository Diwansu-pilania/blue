const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to make API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
};

// NGO Registration interface
export interface NGORegistrationData {
  organizationName: string;
  registrationNumber: string;
  email: string;
  password: string;
  contactPerson: {
    name: string;
    phone: string;
    email?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  yearEstablished?: number;
  focusAreas?: string[];
  description?: string;
}

// Admin Login interface
export interface AdminLoginData {
  email: string;
  password: string;
}

// NGO Login interface
export interface NGOLoginData {
  email: string;
  password: string;
}

// API functions
export const api = {
  // Health check
  health: () => apiCall('/health'),

  // NGO Registration
  registerNGO: (data: NGORegistrationData) =>
    apiCall('/auth/ngo/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // NGO Login
  loginNGO: (data: NGOLoginData) =>
    apiCall('/auth/ngo/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin Login
  loginAdmin: (data: AdminLoginData) =>
    apiCall('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get all NGOs (Admin only)
  getNGOs: () => apiCall('/admin/ngos'),
};

export default api;
