import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { getWonders } from '../../services/api'; // Assuming you have a way to get wonders by user
import './UserProfile.css'; // We will create/update this CSS file

const UserProfile = ({ onClose }) => {
  const { user, updateProfile, logout, token } = useUser();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    explorerLocation: user?.explorerLocation || '',
  });
  const [activeTab, setActiveTab] = useState('myWonders'); // 'myWonders', 'myReviews' etc.
  const [userWonders, setUserWonders] = useState([]);
  const [loadingWonders, setLoadingWonders] = useState(false);

  useEffect(() => {
    if (user && activeTab === 'myWonders') {
      const fetchUserWonders = async () => {
        setLoadingWonders(true);
        try {
          // Assuming getWonders can be filtered or you have a specific endpoint
          const allWonders = await getWonders(); // In a real app, filter by user.createdBy === user._id
          const filteredWonders = allWonders.filter(wonder => wonder.createdBy._id === user._id || wonder.createdBy === user._id); // Handle populated and non-populated createdBy
          setUserWonders(filteredWonders);
        } catch (err) {
          console.error("Failed to fetch user's wonders", err);
          setError("Could not load your wonders.");
        }
        setLoadingWonders(false);
      };
      fetchUserWonders();
    }
  }, [user, activeTab, token]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleRankClick = () => {
    if (user?.role === 'superadmin') {
      navigate('/super-admin');
      if (onClose) onClose();
    }
  };

  // Placeholder for other tab content
  const renderMyReviews = () => <div className="tab-panel-placeholder">Your reviews will appear here.</div>;
  const renderMyPhotos = () => <div className="tab-panel-placeholder">Your photos will appear here.</div>;
  const renderActivity = () => <div className="tab-panel-placeholder">Your activity feed will appear here.</div>;
  const renderSaved = () => <div className="tab-panel-placeholder">Your saved items will appear here.</div>;

  const renderMyWonders = () => {
    if (loadingWonders) return <div className="loading-placeholder">Loading your wonders...</div>;
    if (!userWonders.length) {
      return (
        <div className="no-content-placeholder">
          <span className="no-content-icon">🏞️</span>
          <h3>No Wonders Added Yet</h3>
          <p>Share your discoveries with the community!</p>
          {/* Optional: Add a button to navigate to Add Wonder form */}
        </div>
      );
    }
    return (
      <div className="user-content-grid">
        {userWonders.map(wonder => (
          <div key={wonder.id || wonder._id} className="wonder-card-profile">
            {wonder.coverImage?.url ? 
              <img src={wonder.coverImage.url} alt={wonder.name} className="wonder-card-image-profile" /> :
              <div className="wonder-card-placeholder-image-profile">{wonder.category?.charAt(0).toUpperCase() || 'W'}</div>
            }
            <h4>{wonder.name}</h4>
            <p>{wonder.category}</p>
          </div>
        ))}
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="user-profile-edit-container">
        <h3>Edit Profile</h3>
        {error && (
          <div style={{ color: '#e74c3c', marginBottom: '15px', fontSize: '14px' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label htmlFor="displayName" style={{ display: 'block', marginBottom: '5px' }}>Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              disabled={loading}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div>
            <label htmlFor="explorerLocation" style={{ display: 'block', marginBottom: '5px' }}>Home Location</label>
            <input
              type="text"
              id="explorerLocation"
              name="explorerLocation"
              value={formData.explorerLocation}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="e.g., New York, USA"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: '#9b59b6',
                color: 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: '#95a5a6',
                color: 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="user-profile-sidebar">
        <img 
          src={user?.picture} 
          alt="Profile" 
          className="profile-picture-large" 
        />
        <h2>{user?.displayName}</h2>
        <p>{user?.explorerLocation || 'Location not set'}</p>
        {user?.role && (
          <p 
            className={`profile-rank ${user.role.toLowerCase().replace(' ', '-')}`}
            onClick={handleRankClick}
            style={{ cursor: user.role === 'superadmin' ? 'pointer' : 'default' }}
          >
            Rank: {user.role}
          </p>
        )}
        <p>Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        
        <div className="profile-stats">
          <div>
            <span>{user?.wondersCount || 0}</span>
            <p>Wonders</p>
          </div>
          <div>
            <span>0</span> {/* Placeholder */}
            <p>Reviews</p>
          </div>
        </div>

        <button onClick={() => setIsEditing(true)} className="profile-action-button edit-profile-button">
          Edit Profile
        </button>
        <button onClick={handleLogout} className="profile-action-button logout-button">
          Sign Out
        </button>
      </div>

      <div className="user-profile-main">
        <div className="profile-tabs">
          <button onClick={() => setActiveTab('myWonders')} className={activeTab === 'myWonders' ? 'active' : ''}>My Wonders</button>
          <button onClick={() => setActiveTab('myPhotos')} className={activeTab === 'myPhotos' ? 'active' : ''}>Photos</button>
          <button onClick={() => setActiveTab('myReviews')} className={activeTab === 'myReviews' ? 'active' : ''}>Reviews</button>
          <button onClick={() => setActiveTab('activity')} className={activeTab === 'activity' ? 'active' : ''}>Activity</button>
          <button onClick={() => setActiveTab('saved')} className={activeTab === 'saved' ? 'active' : ''}>Saved</button>
        </div>
        <div className="profile-tab-content">
          {activeTab === 'myWonders' && renderMyWonders()}
          {activeTab === 'myPhotos' && renderMyPhotos()}
          {activeTab === 'myReviews' && renderMyReviews()}
          {activeTab === 'activity' && renderActivity()}
          {activeTab === 'saved' && renderSaved()}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 