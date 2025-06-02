import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useUser } from '../../context/UserContext';
import { createWonder } from '../../services/api';
import './AddWonderForm.css';

// Category configuration with colors and subcategories
const CATEGORIES = {
  nature: {
    label: 'Nature & Landscapes',
    color: '#4CAF50',
    subcategories: [
      { value: 'waterfall', label: 'Waterfall', icon: '💧' },
      { value: 'lake', label: 'Lake', icon: '🌊' },
      { value: 'river', label: 'River', icon: '🏞️' },
      { value: 'beach', label: 'Beach', icon: '🏖️' },
      { value: 'mountain', label: 'Mountain', icon: '⛰️' },
      { value: 'forest', label: 'Forest', icon: '🌲' },
      { value: 'quarry', label: 'Quarry', icon: '⛰️' }
    ]
  },
  historical: {
    label: 'Historical Sites',
    color: '#FFC107',
    subcategories: [
      { value: 'building', label: 'Building & Ruins', icon: '🏛️' },
      { value: 'landmark', label: 'Landmark', icon: '🗿' },
      { value: 'ancient', label: 'Ancient Site', icon: '🏺' },
      { value: 'monument', label: 'Monument', icon: '🗽' }
    ]
  },
  caves: {
    label: 'Caves & Underground',
    color: '#795548',
    subcategories: [
      { value: 'cave', label: 'Cave', icon: '🕳️' },
      { value: 'mine', label: 'Mine', icon: '⛏️' },
      { value: 'tunnel', label: 'Tunnel', icon: '🚇' }
    ]
  },
  urban: {
    label: 'Urban Discoveries',
    color: '#9C27B0',
    subcategories: [
      { value: 'architecture', label: 'Unique Architecture', icon: '🏢' },
      { value: 'alley', label: 'Hidden Alley', icon: '🛣️' },
      { value: 'art', label: 'Public Art', icon: '🎨' }
    ]
  },
  viewpoints: {
    label: 'Scenic Viewpoints',
    color: '#2196F3',
    subcategories: [
      { value: 'overlook', label: 'Overlook', icon: '🌄' },
      { value: 'rooftop', label: 'Rooftop View', icon: '🏙️' },
      { value: 'vista', label: 'Vista Point', icon: '🌅' }
    ]
  },
  water: {
    label: 'Water Features',
    color: '#00BCD4',
    subcategories: [
      { value: 'waterfall', label: 'Waterfall', icon: '💧' },
      { value: 'hotspring', label: 'Hot Spring', icon: '♨️' },
      { value: 'geyser', label: 'Geyser', icon: '💦' }
    ]
  }
};

const LocationPicker = ({ onLocationSelect }) => {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    }
  });

  return position ? <Marker position={position} /> : null;
};

const AddWonderForm = ({ onClose, onWonderAdded, onLocationSelectStart, onLocationSelectCancel, selectedLocation: propSelectedLocation }) => {
  const { user, token } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'nature',
    subcategory: CATEGORIES.nature.subcategories[0].value,
    country: '',
    latitude: '',
    longitude: '',
    history: '',
    difficulty: 'moderate',
    safetyWarnings: '',
    visitingTips: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [imageFiles, setImageFiles] = useState([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [isSelectingLocationOnForm, setIsSelectingLocationOnForm] = useState(false);

  useEffect(() => {
    if (propSelectedLocation && propSelectedLocation.latitude && propSelectedLocation.longitude) {
      setFormData(prev => ({
        ...prev,
        latitude: propSelectedLocation.latitude,
        longitude: propSelectedLocation.longitude
      }));
      setIsSelectingLocationOnForm(false);
      if (onLocationSelectCancel) {
        onLocationSelectCancel();
      }
    }
  }, [propSelectedLocation, onLocationSelectCancel]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
  };

  const handleCoverImageSelect = (index) => {
    setCoverImageIndex(index);
  };

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    if (coverImageIndex === index) {
      setCoverImageIndex(0);
    } else if (coverImageIndex > index) {
      setCoverImageIndex(prev => prev - 1);
    }
  };

  const handleLocationSelectToggle = () => {
    const newIsSelecting = !isSelectingLocationOnForm;
    setIsSelectingLocationOnForm(newIsSelecting);
    if (newIsSelecting) {
      if (onLocationSelectStart) {
        onLocationSelectStart();
      }
    } else {
      if (onLocationSelectCancel) {
        onLocationSelectCancel();
      }
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
        },
        (error) => {
          setError('Could not get your location. Please enter coordinates manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.country.trim()) return 'Country is required';
    if (!formData.latitude || !formData.longitude) return 'Location coordinates are required';
    
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) return 'Invalid latitude';
    if (isNaN(lng) || lng < -180 || lng > 180) return 'Invalid longitude';
    
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Reorder imageFiles to put the cover image first, if selected and not already first
      let processedImageFiles = [...imageFiles];
      if (imageFiles.length > 0 && coverImageIndex > 0 && coverImageIndex < imageFiles.length) {
        const coverFile = imageFiles[coverImageIndex];
        processedImageFiles = [coverFile, ...imageFiles.slice(0, coverImageIndex), ...imageFiles.slice(coverImageIndex + 1)];
      }

      // Appendwonder data (excluding lat/lng if selecting on map)
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Add images if any
      processedImageFiles.forEach((file) => { // Use processedImageFiles
        formDataToSend.append('images', file);
      });

      // The backend (wonderRoutes.js) already expects 'latitude' and 'longitude' as separate fields
      // formDataToSend.append('latitude', formData.latitude);
      // formDataToSend.append('longitude', formData.longitude);

      const wonder = await createWonder(formDataToSend, token);
      if (onWonderAdded) {
        onWonderAdded(wonder);
      }
      onClose();
    } catch (err) {
      console.error('Error creating wonder:', err);
      setError('Failed to add wonder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="add-wonder-form">
        <p>Please log in to add a wonder.</p>
      </div>
    );
  }

  const renderBasicInfo = () => (
    <>
      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter wonder name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category *</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          style={{ backgroundColor: CATEGORIES[formData.category].color, color: 'white' }}
        >
          {Object.entries(CATEGORIES).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="subcategory">Subcategory *</label>
        <select
          id="subcategory"
          name="subcategory"
          value={formData.subcategory}
          onChange={handleInputChange}
        >
          {CATEGORIES[formData.category].subcategories.map(({ value, label, icon }) => (
            <option key={value} value={value}>{icon} {label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe this wonder"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="country">Country *</label>
        <input
          type="text"
          id="country"
          name="country"
          value={formData.country}
          onChange={handleInputChange}
          placeholder="Enter country"
          required
        />
      </div>
    </>
  );

  const renderLocationInfo = () => (
    <div className="location-section">
      <div className="form-group location-group">
        <label>Location *</label>
        <button 
          type="button" 
          className="select-location-button"
          onClick={handleLocationSelectToggle}
        >
          {isSelectingLocationOnForm ? '✕ Cancel Selection' : '📍 Select on Map'}
        </button>
        <button 
          type="button" 
          className="select-location-button get-location-button"
          onClick={handleGetLocation}
          disabled={isSelectingLocationOnForm}
        >
          🛰️ Use My Current Location
        </button>
        <div className="coordinates-display">
          {formData.latitude && formData.longitude ? (
            <>
              <span>Selected Location:</span>
              <div className="coordinates">
                {formData.latitude}, {formData.longitude}
              </div>
            </>
          ) : (
            <span className="no-location">No location selected. Click a button above or enter manually.</span>
          )}
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="latitude">Latitude *</label>
        <input
          type="number"
          id="latitude"
          name="latitude"
          value={formData.latitude}
          onChange={handleInputChange}
          placeholder="e.g., 43.6532"
          required
          step="any"
          disabled={isSelectingLocationOnForm}
        />
      </div>
      <div className="form-group">
        <label htmlFor="longitude">Longitude *</label>
        <input
          type="number"
          id="longitude"
          name="longitude"
          value={formData.longitude}
          onChange={handleInputChange}
          placeholder="e.g., -79.3832"
          required
          step="any"
          disabled={isSelectingLocationOnForm}
        />
      </div>
    </div>
  );

  const renderImageUpload = () => (
    <div className="image-upload-section">
      <div className="form-group">
        <label>Images *</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="image-input"
        />
      </div>

      {imageFiles.length > 0 && (
        <div className="image-preview-grid">
          {imageFiles.map((file, index) => (
            <div 
              key={index} 
              className={`image-preview-item ${index === coverImageIndex ? 'cover' : ''}`}
            >
              <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} />
              <div className="image-preview-actions">
                <button
                  type="button"
                  onClick={() => handleCoverImageSelect(index)}
                  className={index === coverImageIndex ? 'active' : ''}
                >
                  {index === coverImageIndex ? '★ Cover' : 'Set as cover'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="remove"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAdditionalDetails = () => (
    <>
      <div className="form-group">
        <label htmlFor="history">History</label>
        <textarea
          id="history"
          name="history"
          value={formData.history}
          onChange={handleInputChange}
          placeholder="Share the history of this place"
        />
      </div>

      <div className="form-group">
        <label htmlFor="difficulty">Difficulty</label>
        <select
          id="difficulty"
          name="difficulty"
          value={formData.difficulty}
          onChange={handleInputChange}
        >
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="challenging">Challenging</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="safetyWarnings">Safety Warnings</label>
        <textarea
          id="safetyWarnings"
          name="safetyWarnings"
          value={formData.safetyWarnings}
          onChange={handleInputChange}
          placeholder="List any safety concerns or warnings"
        />
      </div>

      <div className="form-group">
        <label htmlFor="visitingTips">Tips for Visiting</label>
        <textarea
          id="visitingTips"
          name="visitingTips"
          value={formData.visitingTips}
          onChange={handleInputChange}
          placeholder="Share helpful tips for visitors"
        />
      </div>
    </>
  );

  return (
    <form className="add-wonder-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-tabs">
        <button
          type="button"
          className={`tab-button ${currentTab === 'basic' ? 'active' : ''}`}
          onClick={() => setCurrentTab('basic')}
        >
          Basic Info
        </button>
        <button
          type="button"
          className={`tab-button ${currentTab === 'location' ? 'active' : ''}`}
          onClick={() => setCurrentTab('location')}
        >
          Location
        </button>
        <button
          type="button"
          className={`tab-button ${currentTab === 'images' ? 'active' : ''}`}
          onClick={() => setCurrentTab('images')}
        >
          Images
        </button>
        <button
          type="button"
          className={`tab-button ${currentTab === 'details' ? 'active' : ''}`}
          onClick={() => setCurrentTab('details')}
        >
          Details
        </button>
      </div>

      <div className="tab-content">
        {currentTab === 'basic' && renderBasicInfo()}
        {currentTab === 'location' && renderLocationInfo()}
        {currentTab === 'images' && renderImageUpload()}
        {currentTab === 'details' && renderAdditionalDetails()}
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          className="cancel-button"
          onClick={onClose}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Wonder'}
        </button>
      </div>
    </form>
  );
};

export default AddWonderForm; 