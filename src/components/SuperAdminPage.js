import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWonders, deleteWonder } from '../services/api';
import { useUser } from '../context/UserContext';
import './SuperAdminPage.css';

const SuperAdminPage = () => {
  const [wonders, setWonders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useUser();

  useEffect(() => {
    fetchWonders();
  }, []);

  const fetchWonders = async () => {
    try {
      const data = await getWonders();
      setWonders(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch wonders');
      setLoading(false);
    }
  };

  const handleDeleteWonder = async (wonderId) => {
    if (window.confirm('Are you sure you want to delete this wonder? This action cannot be undone.')) {
      try {
        await deleteWonder(wonderId, token);
        setWonders(wonders.filter(w => w._id !== wonderId));
      } catch (err) {
        setError('Failed to delete wonder');
      }
    }
  };

  const handleDeleteRating = async (wonderId, ratingId) => {
    if (window.confirm('Are you sure you want to delete this rating? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/wonders/${wonderId}/ratings/${ratingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete rating');
        }

        // Update the wonders state to reflect the deleted rating
        setWonders(wonders.map(wonder => {
          if (wonder._id === wonderId) {
            return {
              ...wonder,
              ratings: wonder.ratings.filter(rating => rating._id !== ratingId)
            };
          }
          return wonder;
        }));
      } catch (err) {
        setError('Failed to delete rating');
      }
    }
  };

  if (loading) {
    return <div className="super-admin-page-container">Loading...</div>;
  }

  if (error) {
    return <div className="super-admin-page-container">Error: {error}</div>;
  }

  return (
    <div className="super-admin-page-container">
      <div className="super-admin-content">
        <h1>👑 Super Admin Panel</h1>
        <Link to="/" className="super-admin-link-back">Back to Homepage</Link>

        <div className="wonders-section">
          <h2>Manage Wonders</h2>
          <div className="wonders-grid">
            {wonders.map(wonder => (
              <div key={wonder._id} className="wonder-card">
                <div className="wonder-header">
                  <h3>{wonder.name}</h3>
                  <button 
                    onClick={() => handleDeleteWonder(wonder._id)}
                    className="delete-button"
                  >
                    Delete Wonder
                  </button>
                </div>
                <div className="ratings-section">
                  <h4>Ratings & Comments</h4>
                  {wonder.ratings && wonder.ratings.length > 0 ? (
                    <div className="ratings-list">
                      {wonder.ratings.map(rating => (
                        <div key={rating._id} className="rating-item">
                          <div className="rating-content">
                            <div className="rating-header">
                              <span className="rating-stars">{'★'.repeat(rating.rating)}{'☆'.repeat(5-rating.rating)}</span>
                              <span className="rating-date">
                                {new Date(rating.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="rating-comment">{rating.comment}</p>
                            <span className="rating-user">
                              By: {rating.user?.displayName || 'Anonymous'}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteRating(wonder._id, rating._id)}
                            className="delete-button"
                          >
                            Delete Rating
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-ratings">No ratings yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage; 