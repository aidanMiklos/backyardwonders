import React, { useState, useEffect, useCallback } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { CATEGORIES } from '../../constants/categories';
import UserProfile from './UserProfile';
import AddWonderForm from './AddWonderForm';
import Search from './Search';
import { addRatingToWonder, getWonders } from '../../services/api';
import './Sidebar.css';

const StarRating = ({ rating, setRating, disabled }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${rating >= star ? 'filled' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && setRating(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const ReviewsSection = ({ wonder, onReviewSubmitted }) => {
  const { user, token } = useUser();
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const currentUserReview = wonder.ratings?.find(r => r.user?._id === user?._id || r.user === user?._id);

  useEffect(() => {
    if (currentUserReview) {
      setNewRating(currentUserReview.rating);
      setNewComment(currentUserReview.comment || '');
    } else {
      setNewRating(0);
      setNewComment('');
    }
  }, [currentUserReview]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setReviewError('You must be logged in to leave a review.');
      return;
    }
    if (newRating === 0) {
      setReviewError('Please select a star rating.');
      return;
    }
    setIsSubmittingReview(true);
    setReviewError('');
    try {
      const updatedWonder = await addRatingToWonder(wonder.id || wonder._id, { rating: newRating, comment: newComment }, token);
      onReviewSubmitted(updatedWonder);
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <section className="marker-section reviews-section">
      <h3>Reviews ({wonder.ratingCount || 0})</h3>
      {wonder.averageRating > 0 && (
        <div className="average-rating-display">
          Average: <StarRating rating={wonder.averageRating} disabled={true} /> ({wonder.averageRating.toFixed(1)})
        </div>
      )}
      <div className="existing-reviews">
        {wonder.ratings && wonder.ratings.length > 0 ? (
          wonder.ratings.map(review => (
            <div key={review._id || review.user?._id || review.user} className="review-item">
              <div className="review-header">
                <img src={review.user?.picture || '/default-profile.png'} alt={review.user?.displayName} className="reviewer-avatar"/>
                <strong>{review.user?.displayName || 'User'}</strong>
                <StarRating rating={review.rating} disabled={true} />
              </div>
              <p className="review-comment">{review.comment}</p>
              <p className="review-date">{new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p>No reviews yet. Be the first!</p>
        )}
      </div>

      {user && (
        <form onSubmit={handleReviewSubmit} className="review-form">
          <h4>{currentUserReview ? 'Update Your Review' : 'Leave a Review'}</h4>
          {reviewError && <p className="error-message review-error">{reviewError}</p>}
          <StarRating rating={newRating} setRating={setNewRating} />
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows="3"
          />
          <button type="submit" disabled={isSubmittingReview} className="submit-review-button">
            {isSubmittingReview ? 'Submitting...' : (currentUserReview ? 'Update Review' : 'Submit Review')}
          </button>
        </form>
      )}
      {!user && <p>Please log in to leave a review.</p>}
    </section>
  );
};

const MarkerDetails = ({ marker: initialMarker, onClose, onCoordinateClick, onMarkerUpdate }) => {
  const [marker, setMarker] = useState(initialMarker);

  useEffect(() => {
    setMarker(initialMarker);
  }, [initialMarker]);

  const handleReviewSubmitted = (updatedWonder) => {
    setMarker(prevMarker => ({ ...prevMarker, ...updatedWonder }));
    if (onMarkerUpdate) {
      onMarkerUpdate(updatedWonder);
    }
  };

  if (!marker) return null;
  
  console.log('Rendering marker details:', marker);
  
  return (
    <div className="marker-details">
      <div className="marker-cover-image">
        {marker.coverImage?.url ? (
          <img src={marker.coverImage.url} alt={marker.name} />
        ) : (
          <div className="placeholder-image-container">
            <div className="placeholder-image-text">
              Be the first to upload an image for this wonder
            </div>
          </div>
        )}
      </div>
      <div className="marker-details-header">
        <h2 className="marker-details-title">{marker.name}</h2>
        <div className="marker-details-meta">
          <span className="marker-details-category">{CATEGORIES[marker.category]?.label}</span>
          <span>•</span>
          <span 
            className="marker-details-coordinates"
            onClick={() => onCoordinateClick(marker.latitude, marker.longitude)}
          >
            {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
          </span>
        </div>
      </div>
      
      <div className="marker-details-content">
        <p className="marker-description">{marker.description}</p>
        
        {marker.slug && (
          <Link to={`/wonder/${marker.slug}`} className="button-style view-full-page-button">
            View Full Page
          </Link>
        )}

        {marker.history && (
          <section className="marker-section">
            <h3>History</h3>
            <p>{marker.history}</p>
          </section>
        )}

        {marker.accessibility && (
          <section className="marker-section">
            <h3>Accessibility</h3>
            <p>{marker.accessibility}</p>
          </section>
        )}

        <section className="marker-section">
          <h3>Details</h3>
          <div className="marker-details-grid">
            {marker.difficulty && (
              <div className="detail-item">
                <span className="detail-label">Difficulty</span>
                <span className="detail-value">{marker.difficulty}</span>
              </div>
            )}
            {marker.country && (
              <div className="detail-item">
                <span className="detail-label">Country</span>
                <span className="detail-value">{marker.country}</span>
              </div>
            )}
          </div>
        </section>

        {marker.safetyWarnings && (
          <section className="marker-section warning">
            <h3>Safety Warnings</h3>
            <p>{marker.safetyWarnings}</p>
          </section>
        )}

        {marker.visitingTips && (
          <section className="marker-section">
            <h3>Tips for Visiting</h3>
            <p>{marker.visitingTips}</p>
          </section>
        )}

        <ReviewsSection 
          wonder={{
            ...marker,
            ratings: marker.ratings || [],
            ratingCount: marker.ratingCount || 0,
            averageRating: marker.averageRating || 0
          }} 
          onReviewSubmitted={handleReviewSubmitted}
        />
      </div>
    </div>
  );
};

const SlideContainer = ({ title, isOpen, onClose, children, className }) => {
  return (
    <div className={`slide-container ${isOpen ? 'open' : ''} ${className || ''}`}>
      <div className="slide-header">
        <h2>{title}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="slide-content">
        {children}
      </div>
    </div>
  );
};

const LoginForm = () => {
  const { login } = useUser();

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3>Sign in with Google</h3>
      <div style={{ marginTop: '20px' }}>
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={() => {
            console.log('Login Failed');
          }}
          useOneTap
          theme="filled_purple"
          shape="pill"
          size="large"
          text="signin_with"
          locale="en"
        />
      </div>
      <p style={{ marginTop: '20px', color: '#666', textAlign: 'center' }}>
        Sign in with your Google account to save your favorite locations and contribute to the community.
      </p>
    </div>
  );
};

const Sidebar = ({ 
  selectedMarker, 
  onCoordinateClick, 
  onClose, 
  onSearch, 
  searchResults, 
  onWonderSelect, 
  onWonderAdded, 
  onLocationSelectStart, 
  onLocationSelectCancel, 
  selectedLocation,
  onMarkerUpdate
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSlide, setActiveSlide] = useState(null);
  const { user } = useUser();

  const handleSearchCallback = (query, category) => {
    if (onSearch) {
      onSearch(query, category);
    }
  };

  const handleCategorySelectCallback = (category) => {
    if (onSearch) {
      onSearch('', category);
    }
  };

  const handleWonderSelectCallback = (wonder) => {
    if (onWonderSelect) {
      onWonderSelect(wonder);
    }
  };

  const handleButtonClick = (slideName) => {
    if (slideName === 'add' && !user) {
      setActiveSlide('profile');
      return;
    }
    setIsCollapsed(true);
    setActiveSlide(slideName);
    if (onClose) onClose();
  };

  const handleCloseSlide = () => {
    setActiveSlide(null);
    if (onClose) onClose();
  };

  const handleMarkerDetailsUpdateCallback = useCallback((updatedMarkerData) => {
    if (onMarkerUpdate) {
      onMarkerUpdate(updatedMarkerData);
    }
  }, [onMarkerUpdate]);

  useEffect(() => {
    if (selectedMarker && activeSlide !== 'markerDetails') {
      console.log('Sidebar: Selected marker changed, opening details:', selectedMarker);
      setActiveSlide('markerDetails');
    }
  }, [selectedMarker, activeSlide]);

  return (
    <>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="logo-container">
              <img src={process.env.PUBLIC_URL + '/images/demo-logo.svg'} alt="BackyardWonders Logo" className="logo" />
            </div>
          )}
          <button 
            className="collapse-button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? '⌲' : '⌳'}
          </button>
        </div>
        <div className="sidebar-buttons">
          <button className="search-button" onClick={() => handleButtonClick('search')}>
            <span className="search-icon">🔍</span>
            {!isCollapsed && <span>Search Wonders</span>}
          </button>
          <button className="add-button" onClick={() => handleButtonClick('add')}>
            <span className="add-icon">➕</span>
            {!isCollapsed && <span>Add Wonder</span>}
          </button>
          <button className="guides-button" onClick={() => handleButtonClick('guides')}>
            <span className="guides-icon">📖</span>
            {!isCollapsed && <span>Guides</span>}
          </button>
          <button 
            className="login-button" 
            onClick={() => handleButtonClick('profile')}
            style={user ? { backgroundColor: '#27ae60' } : {}}
          >
            <span className="login-icon">
              {user ? (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                />
              ) : '👤'}
            </span>
            {!isCollapsed && <span>{user ? user.displayName : 'Login'}</span>}
          </button>
        </div>
      </div>
      <SlideContainer
        title="Search Wonders"
        isOpen={activeSlide === 'search'}
        onClose={handleCloseSlide}
        className="search-slide"
      >
        <Search 
          onSearch={handleSearchCallback} 
          onCategorySelect={handleCategorySelectCallback} 
          searchResults={searchResults}
          onWonderSelect={handleWonderSelectCallback}
        />
      </SlideContainer>
      <SlideContainer
        title="Add Wonder"
        isOpen={activeSlide === 'add'}
        onClose={handleCloseSlide}
      >
        <AddWonderForm 
          onClose={handleCloseSlide} 
          onWonderAdded={onWonderAdded} 
          onLocationSelectStart={onLocationSelectStart} 
          onLocationSelectCancel={onLocationSelectCancel} 
          selectedLocation={selectedLocation}
        />
      </SlideContainer>
      <SlideContainer
        title="Guides"
        isOpen={activeSlide === 'guides'}
        onClose={handleCloseSlide}
      />
      <SlideContainer
        title={selectedMarker?.name || ''}
        isOpen={activeSlide === 'markerDetails'}
        onClose={handleCloseSlide}
      >
        <MarkerDetails
          marker={selectedMarker}
          onClose={handleCloseSlide}
          onCoordinateClick={onCoordinateClick}
          onMarkerUpdate={handleMarkerDetailsUpdateCallback}
        />
      </SlideContainer>
      <SlideContainer
        title={user ? 'Profile' : 'Login'}
        isOpen={activeSlide === 'profile'}
        onClose={handleCloseSlide}
        className="profile-slide-container"
      >
        {user ? (
          <UserProfile onClose={handleCloseSlide} />
        ) : (
          <LoginForm />
        )}
      </SlideContainer>
    </>
  );
};

export default Sidebar; 