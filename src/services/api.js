import { getToken } from '../utils/auth';

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
  try {
    // Add initial contributor info to formData
    formData.append('initialContributor', JSON.parse(atob(token.split('.')[1])).userId);
    formData.append('contributedAt', new Date().toISOString());

    const response = await fetch(`${API_URL}/wonders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to create wonder');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating wonder:', error);
    throw error;
  }
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

export const deleteWonder = async (wonderId, token, images = []) => {
  try {
    const response = await fetch(`${API_URL}/wonders/${wonderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ images })
    });

    if (!response.ok) {
      throw new Error('Failed to delete wonder');
    }

    return true;
  } catch (error) {
    console.error('Error deleting wonder:', error);
    throw error;
  }
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
    const response = await fetch(`${API_URL}/wonders/${wonderId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wonder details');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching wonder:', error);
    throw error;
  }
};

export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteRating = async (wonderId, ratingId, token) => {
  try {
    const response = await fetch(`${API_URL}/wonders/${wonderId}/ratings/${ratingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete rating');
    }

    return response.json();
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw error;
  }
};

// Wonder Revisions
export const getWonderRevisions = async (wonderId) => {
  try {
    const response = await fetch(`${API_URL}/wonders/${wonderId}/revisions`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch revisions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching revisions:', error);
    throw error;
  }
};

export const submitWonderEdit = async (wonderId, editData) => {
  try {
    const response = await fetch(`${API_URL}/wonders/${wonderId}/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(editData)
    });

    if (!response.ok) {
      throw new Error('Failed to submit edit');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting edit:', error);
    throw error;
  }
};

export const approveRevision = async (wonderId, revisionId) => {
  try {
    const response = await fetch(`${API_URL}/wonders/${wonderId}/revisions/${revisionId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to approve revision');
    }

    return await response.json();
  } catch (error) {
    console.error('Error approving revision:', error);
    throw error;
  }
};

export const rejectRevision = async (wonderId, revisionId, reason) => {
  try {
    const response = await fetch(`${API_URL}/wonders/${wonderId}/revisions/${revisionId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      throw new Error('Failed to reject revision');
    }

    return await response.json();
  } catch (error) {
    console.error('Error rejecting revision:', error);
    throw error;
  }
};

export const addRevisionComment = async (wonderId, revisionId, comment) => {
  try {
    const response = await fetch(`${API_URL}/wonders/${wonderId}/revisions/${revisionId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ comment })
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// User Reputation
export const getUserReputation = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/reputation`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user reputation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user reputation:', error);
    throw error;
  }
};

export const getWonderDiscussions = async (wonderId) => {
  try {
    const response = await fetch(`${API_URL}/wonders/${wonderId}/discussions`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch discussions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching discussions:', error);
    throw error;
  }
};

export const createDiscussion = async (wonderId, discussionData) => {
  try {
    const response = await fetch(`${API_URL}/wonders/${wonderId}/discussions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(discussionData)
    });

    if (!response.ok) {
      throw new Error('Failed to create discussion');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating discussion:', error);
    throw error;
  }
};

export const addDiscussionComment = async (wonderId, discussionId, comment) => {
  try {
    const response = await fetch(`${API_URL}/wonders/${wonderId}/discussions/${discussionId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ comment })
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}; 