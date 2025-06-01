const API_URL = process.env.REACT_APP_API_URL || 'https://backend-91pf.onrender.com/api';

// Add CORS headers to all fetch requests
const fetchWithConfig = (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    mode: 'cors'
  });
};

export const authenticateWithGoogle = async (credential) => {
  const response = await fetchWithConfig(`${API_URL}/users/google-signin`, {
    method: 'POST',
    body: JSON.stringify({ token: credential }),
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  return response.json();
};

export const updateUserProfile = async (updates, token) => {
  const response = await fetchWithConfig(`${API_URL}/users/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  
  return response.json();
};

export const getUserProfile = async (token) => {
  const response = await fetch(`${API_URL}/users/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  
  return response.json();
};

// Wonder API endpoints
export const createWonder = async (formData, token) => {
  const response = await fetch(`${API_URL}/wonders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type header - it will be automatically set with boundary for FormData
    },
    body: formData // FormData object containing all fields including files
  });

  if (!response.ok) {
    throw new Error('Failed to create wonder');
  }

  return response.json();
};

export const getWonders = async () => {
  const response = await fetch(`${API_URL}/wonders`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch wonders');
  }

  return response.json();
};

export const getNearbyWonders = async (lat, lng, radius) => {
  const response = await fetch(
    `${API_URL}/wonders/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch nearby wonders');
  }

  return response.json();
};

export const updateWonder = async (wonderId, wonderData, token) => {
  const response = await fetch(`${API_URL}/wonders/${wonderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(wonderData)
  });

  if (!response.ok) {
    throw new Error('Failed to update wonder');
  }

  return response.json();
};

export const deleteWonder = async (wonderId, token) => {
  const response = await fetch(`${API_URL}/wonders/${wonderId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete wonder');
  }

  return response.json();
};

export const addRatingToWonder = async (wonderId, ratingData, token) => {
  const response = await fetch(`${API_URL}/wonders/${wonderId}/ratings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(ratingData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to add rating' }));
    throw new Error(errorData.message);
  }

  return response.json();
};

export const getWonderById = async (wonderId) => {
  try {
    const response = await fetchWithConfig(`/wonders/${wonderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching wonder:', error);
    throw error;
  }
}; 