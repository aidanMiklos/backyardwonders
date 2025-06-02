import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { CATEGORIES } from '../../constants/categories';
import UserProfile from './UserProfile';
import AddWonderForm from './AddWonderForm';
import Search from './Search';
import { addRatingToWonder, getWonderById } from '../../services/api';
import './Sidebar.css';

const StarRating = ({ rating, setRating, disabled }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${rating >= star ? 'filled' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && setRating?.(star)}
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  // Initialize reviews and calculate average rating
  useEffect(() => {
    if (wonder?.ratings) {
      setReviews(wonder.ratings);
      if (wonder.ratings.length > 0) {
        const avg = wonder.ratings.reduce((acc, curr) => acc + curr.rating, 0) / wonder.ratings.length;
        setAverageRating(avg);
      }
    }
  }, [wonder?.ratings]);

  // Find the current user's review if it exists
  const currentUserReview = useMemo(() => {
    if (!user || !reviews.length) return null;
    return reviews.find(review => 
      review.user?._id === user._id || review.user === user._id
    );
  }, [user, reviews]);

  // Reset form when current user's review changes
  useEffect(() => {
    if (currentUserReview) {
      setNewRating(currentUserReview.rating);
      setNewComment(currentUserReview.comment || '');
    } else {
      setNewRating(0);
      setNewComment('');
    }
  }, [currentUserReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to leave a review');
      return;
    }
    if (newRating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const wonderId = wonder.id || wonder._id;
      const updatedWonder = await addRatingToWonder(
        wonderId,
        { rating: newRating, comment: newComment },
        token
      );

      if (onReviewSubmitted) {
        onReviewSubmitted(updatedWonder);
      }

      // Update local state
      setReviews(updatedWonder.ratings || []);
      if (updatedWonder.ratings?.length > 0) {
        const avg = updatedWonder.ratings.reduce((acc, curr) => acc + curr.rating, 0) / updatedWonder.ratings.length;
        setAverageRating(avg);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="marker-section reviews-section">
      <h3>Reviews ({reviews.length || 0})</h3>
      
      {/* Average Rating Display */}
      {reviews.length > 0 && (
        <div className="average-rating-display">
          <span>Average Rating:</span>
          <StarRating rating={Math.round(averageRating)} disabled={true} />
          <span>({averageRating.toFixed(1)})</span>
        </div>
      )}

      {/* Review Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="review-form">
          <h4>{currentUserReview ? 'Update Your Review' : 'Write a Review'}</h4>
          {error && <p className="error-message review-error">{error}</p>}
          
          <div className="rating-input">
            <label>Your Rating:</label>
            <StarRating rating={newRating} setRating={setNewRating} />
          </div>

          <div className="comment-input">
            <label>Your Comment:</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience..."
              rows="3"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="submit-review-button"
          >
            {isSubmitting 
              ? 'Submitting...' 
              : (currentUserReview ? 'Update Review' : 'Submit Review')
            }
          </button>
        </form>
      ) : (
        <div className="login-prompt">
          <p>Please log in to leave a review.</p>
        </div>
      )}

      {/* Existing Reviews */}
      <div className="existing-reviews">
        <h4>All Reviews</h4>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div 
              key={review._id || `${review.user?._id}-${review.createdAt}`} 
              className="review-item"
            >
              <div className="review-header">
                <div className="reviewer-info">
                  <img 
                    src={review.user?.picture || '/default-profile.png'} 
                    alt={review.user?.displayName || 'User'} 
                    className="reviewer-avatar"
                  />
                  <strong>{review.user?.displayName || 'Anonymous User'}</strong>
                </div>
                <StarRating rating={review.rating} disabled={true} />
              </div>
              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}
              <p className="review-date">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <p className="no-reviews">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </section>
  );
};

const MarkerDetails = ({ marker: initialMarker, onClose, onCoordinateClick, onMarkerUpdate }) => {
  const [marker, setMarker] = useState(initialMarker);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageCarousel, setShowImageCarousel] = useState(false);

  useEffect(() => {
    setMarker(initialMarker);
  }, [initialMarker]);

  useEffect(() => {
    const fetchWonderDetails = async () => {
      try {
        const wonderId = marker?.id || marker?._id;
        if (!wonderId) return;

        const wonderData = await getWonderById(wonderId);
        if (wonderData) {
          setMarker(prevMarker => ({ ...prevMarker, ...wonderData }));
          if (onMarkerUpdate) {
            onMarkerUpdate(wonderData);
          }
        }
      } catch (err) {
        console.error('Error fetching wonder details:', err);
      }
    };

    fetchWonderDetails();
  }, [marker?.id, marker?._id, onMarkerUpdate]);

  const handleReviewSubmitted = useCallback((updatedWonder) => {
    setMarker(prevMarker => ({ ...prevMarker, ...updatedWonder }));
    if (onMarkerUpdate) {
      onMarkerUpdate(updatedWonder);
    }
  }, [onMarkerUpdate]);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (marker.photos?.length || 0) - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (marker.photos?.length || 0) - 1 : prev - 1
    );
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      parking: '🅿️',
      accessible: '♿',
      familyFriendly: '👨‍👩‍👧‍👦',
      petFriendly: '🐾',
      scenic: '🌄',
      hiking: '🥾',
      camping: '⛺',
      photography: '📸'
    };
    return icons[amenity] || '•';
  };

  if (!marker) return null;

  const allImages = [
    ...(marker.coverImage ? [marker.coverImage] : []),
    ...(marker.photos || [])
  ];

  return (
    <div className="marker-details">
      {/* Header Section */}
      <div className="marker-details-header">
        <button className="back-button" onClick={onClose}>←</button>
        <div className="header-content">
          <h2 className="marker-details-title">{marker.name}</h2>
          <div className="marker-details-subtitle">
            <span className="category">{CATEGORIES[marker.category]?.label}</span>
            <span className="location">{marker.country}</span>
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="marker-image-section">
        {allImages.length > 0 ? (
          <>
            <div className="main-image-container">
              <img 
                src={allImages[currentImageIndex].url} 
                alt={marker.name}
                className="main-image"
                onError={(e) => {
                  e.target.src = '/images/placeholder-wonder.jpg';
                }}
              />
              {allImages.length > 1 && (
                <>
                  <button className="image-nav prev" onClick={handlePrevImage}>‹</button>
                  <button className="image-nav next" onClick={handleNextImage}>›</button>
                  <div className="image-counter">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="image-thumbnails">
                {allImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className={`thumbnail ${idx === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img 
                      src={img.url} 
                      alt={`${marker.name} ${idx + 1}`}
                      onError={(e) => {
                        e.target.src = '/images/placeholder-wonder.jpg';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="placeholder-image-container">
            <img 
              src="/images/placeholder-wonder.jpg" 
              alt="Placeholder"
              className="placeholder-image"
            />
          </div>
        )}
      </div>

      {/* Good to Know Section */}
      <section className="good-to-know-section">
        <h3>Good to Know</h3>
        <div className="amenities-grid">

          {marker.difficulty && (
            <div className="amenity-item">
              <span className="amenity-icon">🥾</span>
              <span>Difficulty: {marker.difficulty}</span>
            </div>
          )}
          {marker.visitingTips && (
            <div className="amenity-item">
              <span className="amenity-icon">ℹ️</span>
              <span>Visiting Tips Available</span>
            </div>
          )}
          {marker.safetyWarnings && (
            <div className="amenity-item">
              <span className="amenity-icon">⚠️</span>
              <span>Safety Information</span>
            </div>
          )}
        </div>
      </section>

      {/* Details Section */}
      <section className="details-section">
        <h3>Details</h3>
        <div className="details-content">
          <div className="detail-item">
            <h4>Description</h4>
            <p>{marker.description}</p>
          </div>
          {marker.history && (
            <section>
              <h2>History</h2>
              <p>{marker.history}</p>
            </section>
          )}

          {marker.visitingTips && (
            <section>
              <h2>Tips for Visiting</h2>
              <p>{marker.visitingTips}</p>
            </section>
          )}

          {marker.safetyWarnings && (
            <section className="warning">
              <h2>Safety Warnings</h2>
              <p>{marker.safetyWarnings}</p>
            </section>
          )}
        </div>
      </section>

      <ReviewsSection
        wonder={{
          ...marker,
          ratings: marker.ratings || [],
          ratingCount: marker.ratingCount || 0,
          averageRating: marker.averageRating || 0
        }} 
        onReviewSubmitted={handleReviewSubmitted}
      />

      {marker.slug && (
        <Link to={`/wonder/${marker.slug}`} className="view-full-page-button">
          View Full Page
        </Link>
      )}
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