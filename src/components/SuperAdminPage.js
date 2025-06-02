import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getWonders, deleteWonder, deleteRating } from '../services/api';
import './SuperAdminPage.css';

const SuperAdminPage = () => {
  const [wonders, setWonders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
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

  const handleDeleteWonder = async (wonderId, images) => {
    if (window.confirm('Are you sure you want to delete this wonder? This action cannot be undone.')) {
      try {
        await deleteWonder(wonderId, token, images);
        setWonders(wonders.filter(w => w._id !== wonderId));
      } catch (err) {
        setError('Failed to delete wonder');
      }
    }
  };

  const handleDeleteRating = async (wonderId, ratingId) => {
    if (window.confirm('Are you sure you want to delete this rating?')) {
      try {
        const updatedWonder = await deleteRating(wonderId, ratingId, token);
        setWonders(wonders.map(w => w._id === wonderId ? updatedWonder : w));
      } catch (err) {
        setError('Failed to delete rating');
      }
    }
  };

  const handleVerifyWonder = async (wonderId) => {
    // Implement wonder verification logic
  };

  const handleFeatureWonder = async (wonderId) => {
    // Implement featuring wonder logic
  };

  const filteredWonders = wonders
    .filter(wonder => {
      const matchesSearch = wonder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wonder.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || wonder.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'reviews':
          return (b.ratings?.length || 0) - (a.ratings?.length || 0);
        default:
          return 0;
      }
    });

  const getStats = () => {
    return {
      totalWonders: wonders.length,
      totalRatings: wonders.reduce((acc, w) => acc + (w.ratings?.length || 0), 0),
      averageRating: (wonders.reduce((acc, w) => acc + (w.averageRating || 0), 0) / wonders.length).toFixed(1),
      pendingVerification: wonders.filter(w => !w.isVerified).length
    };
  };

  const stats = getStats();

  if (loading) return (
    <div className="super-admin-loading">
      <div className="loading-spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  );

  return (
    <div className="super-admin-page">
      <div className="super-admin-sidebar">
        <div className="admin-logo">
          <img src="/images/demo-logo.svg" alt="BackyardWonders Admin" />
          <h2>Super Admin</h2>
        </div>
        
        <nav className="admin-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'wonders' ? 'active' : ''}`}
            onClick={() => setActiveTab('wonders')}
          >
            🌟 Wonders
          </button>
          <button 
            className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            ⭐ Reviews
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        <Link to="/" className="back-to-site">
          ← Back to Site
        </Link>
      </div>

      <div className="super-admin-main">
        <div className="admin-header">
          <h1>
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'wonders' && 'Manage Wonders'}
            {activeTab === 'reviews' && 'Review Management'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'settings' && 'System Settings'}
          </h1>
          
          {activeTab === 'wonders' && (
            <div className="wonder-filters">
              <input
                type="text"
                placeholder="Search wonders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                <option value="all">All Categories</option>
                <option value="nature">Nature</option>
                <option value="historical">Historical</option>
                <option value="urban">Urban</option>
                <option value="viewpoints">Viewpoints</option>
              </select>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviewed</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            <div className="stat-cards">
              <div className="stat-card">
                <h3>Total Wonders</h3>
                <div className="stat-value">{stats.totalWonders}</div>
              </div>
              <div className="stat-card">
                <h3>Total Reviews</h3>
                <div className="stat-value">{stats.totalRatings}</div>
              </div>
              <div className="stat-card">
                <h3>Average Rating</h3>
                <div className="stat-value">⭐ {stats.averageRating}</div>
              </div>
              <div className="stat-card">
                <h3>Pending Verification</h3>
                <div className="stat-value">{stats.pendingVerification}</div>
              </div>
            </div>

            <div className="recent-activity">
              <h2>Recent Activity</h2>
              {/* Add recent activity feed here */}
            </div>
          </div>
        )}

        {activeTab === 'wonders' && (
          <div className="wonders-grid">
            {filteredWonders.map(wonder => (
              <div key={wonder._id} className="wonder-card">
                <div className="wonder-image">
                  {wonder.coverImage?.url ? (
                    <img src={wonder.coverImage.url} alt={wonder.name} />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                  {!wonder.isVerified && (
                    <div className="pending-badge">Pending Verification</div>
                  )}
                </div>
                
                <div className="wonder-content">
                  <h3>{wonder.name}</h3>
                  <p className="wonder-category">{wonder.category}</p>
                  <p className="wonder-description">{wonder.description}</p>
                  
                  <div className="wonder-stats">
                    <span>⭐ {wonder.averageRating?.toFixed(1) || 'No ratings'}</span>
                    <span>📝 {wonder.ratings?.length || 0} reviews</span>
                    <span>📅 {new Date(wonder.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="wonder-actions">
                    <button 
                      className="verify-button"
                      onClick={() => handleVerifyWonder(wonder._id)}
                      disabled={wonder.isVerified}
                    >
                      {wonder.isVerified ? '✓ Verified' : 'Verify'}
                    </button>
                    <button 
                      className="feature-button"
                      onClick={() => handleFeatureWonder(wonder._id)}
                    >
                      {wonder.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteWonder(
                        wonder._id,
                        [
                          wonder.coverImage?.url,
                          ...(wonder.photos?.map(photo => photo.url) || [])
                        ].filter(Boolean)
                      )}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {wonder.ratings && wonder.ratings.length > 0 && (
                  <div className="wonder-reviews">
                    <h4>Recent Reviews</h4>
                    <div className="reviews-carousel">
                      {wonder.ratings.map(rating => (
                        <div key={rating._id} className="review-card">
                          <div className="review-header">
                            <img 
                              src={rating.user?.picture || '/default-avatar.png'} 
                              alt={rating.user?.displayName || 'User'} 
                              className="reviewer-avatar"
                            />
                            <div className="reviewer-info">
                              <strong>{rating.user?.displayName || 'Anonymous'}</strong>
                              <div className="rating-stars">
                                {'★'.repeat(rating.rating)}
                                {'☆'.repeat(5 - rating.rating)}
                              </div>
                            </div>
                            <button
                              className="delete-review"
                              onClick={() => handleDeleteRating(wonder._id, rating._id)}
                            >
                              ×
                            </button>
                          </div>
                          <p className="review-comment">{rating.comment}</p>
                          <div className="review-date">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-management">
            <h2>Review Management coming soon...</h2>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-management">
            <h2>User Management coming soon...</h2>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="admin-settings">
            <h2>System Settings coming soon...</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage; 