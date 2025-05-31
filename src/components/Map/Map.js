import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker icons for different categories
const categoryIcons = {
  park: new L.Icon({
    iconUrl: process.env.PUBLIC_URL + '/icons/park-marker.svg',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  garden: new L.Icon({
    iconUrl: process.env.PUBLIC_URL + '/icons/garden-marker.svg',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
};

// Map tile layers
const MAP_LAYERS = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
  }
};

// Custom Controls Components
const ZoomControl = () => {
  const map = useMap();

  const handleZoom = (e, zoomIn) => {
    e.stopPropagation();
    if (zoomIn) {
      map.zoomIn();
    } else {
      map.zoomOut();
    }
  };

  return (
    <div className="custom-zoom-control">
      <button 
        className="zoom-button" 
        onClick={(e) => handleZoom(e, true)} 
        aria-label="Zoom in"
      >
        +
      </button>
      <button 
        className="zoom-button" 
        onClick={(e) => handleZoom(e, false)} 
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  );
};

const MapStyleControl = ({ currentStyle, onStyleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const map = useMap();

  const handleStyleClick = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleStyleSelect = (e, style) => {
    e.stopPropagation();
    onStyleChange(style);
    setIsOpen(false);
  };

  const handleLocate = (e) => {
    e.stopPropagation();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        map.flyTo([position.coords.latitude, position.coords.longitude], 14);
      });
    }
  };

  // Close style selector when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isOpen) setIsOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <div className="map-style-control" onClick={(e) => e.stopPropagation()}>
        <button 
          className="style-button" 
          onClick={handleStyleClick}
          aria-label="Change map style"
        >
          🗺️
        </button>
        <button 
          className="style-button" 
          onClick={handleLocate}
          aria-label="Center to my location"
        >
          📍
        </button>
      </div>
      <div className={`map-style-selector ${isOpen ? 'visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="style-options">
          <div 
            className={`style-option ${currentStyle === 'standard' ? 'active' : ''}`}
            onClick={(e) => handleStyleSelect(e, 'standard')}
          >
            <div className="style-preview">
              <img src={process.env.PUBLIC_URL + '/images/map-standard.svg'} alt="Standard map style" />
            </div>
            <div className="style-label">Standard</div>
          </div>
          <div 
            className={`style-option ${currentStyle === 'hybrid' ? 'active' : ''}`}
            onClick={(e) => handleStyleSelect(e, 'hybrid')}
          >
            <div className="style-preview">
              <img src={process.env.PUBLIC_URL + '/images/map-hybrid.svg'} alt="Hybrid map style" />
            </div>
            <div className="style-label">Hybrid</div>
          </div>
          <div 
            className={`style-option ${currentStyle === 'satellite' ? 'active' : ''}`}
            onClick={(e) => handleStyleSelect(e, 'satellite')}
          >
            <div className="style-preview">
              <img src={process.env.PUBLIC_URL + '/images/map-satellite.svg'} alt="Satellite map style" />
            </div>
            <div className="style-label">Satellite</div>
          </div>
        </div>
      </div>
    </>
  );
};

function Map({ onMarkerClick }) {
  const [userPosition, setUserPosition] = useState(null);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);
  const [currentMapStyle, setCurrentMapStyle] = useState('standard');
  const [currentZoom, setCurrentZoom] = useState(13);

  // Get user's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Could not get your location");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  }, []);

  // Dummy data
  useEffect(() => {
    setLocations([
      {
        id: '1',
        name: 'Central Park',
        description: 'A beautiful park in the city center',
        latitude: 51.505,
        longitude: -0.09,
        category: 'park'
      },
      {
        id: '2',
        name: 'Botanical Gardens',
        description: 'Beautiful gardens with rare plants',
        latitude: 51.508,
        longitude: -0.11,
        category: 'garden'
      }
    ]);
  }, []);

  const handleMarkerClick = (location) => {
    if (onMarkerClick) {
      onMarkerClick(location);
    }
  };

  const handleZoomEnd = (e) => {
    setCurrentZoom(e.target.getZoom());
  };

  if (error) return <div>Error: {error}</div>;

  const defaultPosition = userPosition || [51.505, -0.09];

  const createCustomIcon = (category) => {
    return L.divIcon({
      html: `
        <div class="custom-marker">
          <span class="marker-icon">${category === 'park' ? '🌳' : '🌸'}</span>
        </div>
        <div class="marker-label-container">
          <span class="marker-label-text">${category}</span>
        </div>
      `,
      className: 'custom-marker-wrapper',
      iconSize: L.point(30, 30, true),
      iconAnchor: L.point(15, 30),
    });
  };

  return (
    <div className="map-container">
      <MapContainer
        center={defaultPosition}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        onZoomEnd={handleZoomEnd}
      >
        <TileLayer
          attribution={MAP_LAYERS[currentMapStyle].attribution}
          url={MAP_LAYERS[currentMapStyle].url}
        />
        
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={(cluster) => {
            return L.divIcon({
              html: `<div class="cluster-marker">${cluster.getChildCount()}</div>`,
              className: 'custom-marker-cluster',
              iconSize: L.point(40, 40, true),
            });
          }}
        >
          {locations.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={createCustomIcon(location.category)}
              eventHandlers={{
                click: () => handleMarkerClick(location)
              }}
            >
              <Popup className="custom-popup">
                <div className="marker-popup">
                  <h3>{location.name}</h3>
                  <p>{location.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {userPosition && (
          <Marker
            position={userPosition}
            icon={L.divIcon({
              html: `<div class="custom-marker"><span class="marker-icon">📍</span></div>`,
              className: '',
              iconSize: L.point(30, 30, true),
            })}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        <ZoomControl />
        <MapStyleControl currentStyle={currentMapStyle} onStyleChange={setCurrentMapStyle} />
      </MapContainer>
    </div>
  );
}

export default Map; 