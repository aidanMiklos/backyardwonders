import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const MarkerDetails = ({ marker, onClose, onCoordinateClick }) => {
  if (!marker) return null;
  
  return (
    <div className="marker-details">
      <div className="marker-details-header">
        <h2 className="marker-details-title">{marker.name}</h2>
        <div className="marker-details-meta">
          <span className="marker-details-category">{marker.category}</span>
          <span>•</span>
          <span 
            className="marker-details-coordinates"
            onClick={() => onCoordinateClick(marker.latitude, marker.longitude)}
          >
            {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
          </span>
        </div>
      </div>
      <p>{marker.description}</p>
    </div>
  );
};

const SlideContainer = ({ title, isOpen, onClose, children }) => {
  return (
    <div className={`slide-container ${isOpen ? 'open' : ''}`}>
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

const Sidebar = ({ selectedMarker, onCoordinateClick, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSlide, setActiveSlide] = useState(null);

  useEffect(() => {
    if (selectedMarker) {
      setActiveSlide('markerDetails');
    }
  }, [selectedMarker]);

  const handleButtonClick = (slideName) => {
    setIsCollapsed(true);
    setActiveSlide(slideName);
    if (onClose) onClose();
  };

  const handleCloseSlide = () => {
    setActiveSlide(null);
    if (onClose) onClose();
  };

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
        </div>
      </div>
      <SlideContainer
        title="Search Wonders"
        isOpen={activeSlide === 'search'}
        onClose={handleCloseSlide}
      />
      <SlideContainer
        title="Add Wonder"
        isOpen={activeSlide === 'add'}
        onClose={handleCloseSlide}
      />
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
        />
      </SlideContainer>
    </>
  );
};

export default Sidebar; 