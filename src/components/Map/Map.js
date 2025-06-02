import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { getWonders, getNearbyWonders } from '../../services/api';
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
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Standard'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    name: 'Satellite'
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
    name: 'Hybrid'
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

const MapStyleControl = ({ currentStyle, onStyleChange, isOpen, setIsOpen }) => {
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
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.flyTo([position.coords.latitude, position.coords.longitude], 14);
        }
      );
    }
  };

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
      {isOpen && (
        <div className="map-style-selector visible" onClick={(e) => e.stopPropagation()}>
          <div className="style-options">
            {Object.entries(MAP_LAYERS).map(([style, { name }]) => (
              <div 
                key={style}
                className={`style-option ${currentStyle === style ? 'active' : ''}`}
                onClick={(e) => handleStyleSelect(e, style)}
              >
                <div className="style-preview">
                  <img src={`${process.env.PUBLIC_URL}/images/map-${style}.svg`} alt={`${name} map style`} />
                </div>
                <div className="style-label">{name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// Helper function to get category icon
const getCategoryIcon = (category) => {
  const icons = {
    nature: '🌲',
    historical: '🏛️',
    caves: '🕳️',
    urban: '🏢',
    viewpoints: '🌄',
    water: '💧'
  };
  return icons[category] || '📍';
};

function Map({ onMarkerClick, shouldRefresh, isSelectingLocation, onLocationSelect, searchFilters, onLocationsFiltered }) {
  const [userPosition, setUserPosition] = useState(null);
  const [defaultPosition, setDefaultPosition] = useState([0, 0]);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);
  const [currentMapStyle, setCurrentMapStyle] = useState('standard');
  const [currentZoom, setCurrentZoom] = useState(13);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isStyleSelectorOpen, setIsStyleSelectorOpen] = useState(false);
  const [isLoadingPosition, setIsLoadingPosition] = useState(true);

  // Memoize filtered locations
  const filteredLocations = useMemo(() => {
    if (!locations.length) return [];

    let filtered = [...locations];

    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      filtered = filtered.filter(location => 
        (location.name?.toLowerCase() || '').includes(query) ||
        (location.description?.toLowerCase() || '').includes(query) ||
        (location.country?.toLowerCase() || '').includes(query)
      );
    }

    if (searchFilters.category) {
      filtered = filtered.filter(location => 
        location.category === searchFilters.category
      );
    }

    return filtered;
  }, [locations, searchFilters]);

  // Update filtered locations in parent component
  useEffect(() => {
    if (onLocationsFiltered) {
      onLocationsFiltered(filteredLocations);
    }
  }, [filteredLocations, onLocationsFiltered]);

  // Get user's location
  useEffect(() => {
    setIsLoadingPosition(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = [position.coords.latitude, position.coords.longitude];
          setUserPosition(pos);
          setDefaultPosition(pos);
          setIsLoadingPosition(false);
        },
        (geoError) => {
          console.error("Error getting location:", geoError);
          setError("Could not get your location. Showing default location.");
          setDefaultPosition([43.6532, -79.3832]);
          setIsLoadingPosition(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser. Showing default location.");
      setDefaultPosition([43.6532, -79.3832]);
      setIsLoadingPosition(false);
    }
  }, []);

  // Fetch wonders
  useEffect(() => {
    const fetchWonders = async () => {
      try {
        let wonders;
        if (userPosition) {
          wonders = await getNearbyWonders(userPosition[0], userPosition[1], 50);
        } else {
          wonders = await getWonders();
        }
        
        const mappedWonders = wonders.map(wonder => ({
          id: wonder._id,
          name: wonder.name,
          description: wonder.description,
          category: wonder.category,
          subcategory: wonder.subcategory,
          country: wonder.country,
          latitude: wonder.location.coordinates[1],
          longitude: wonder.location.coordinates[0],
          createdBy: wonder.createdBy,
          coverImage: wonder.coverImage,
          history: wonder.history,
          accessibility: wonder.accessibility,
          difficulty: wonder.difficulty,
          safetyWarnings: wonder.safetyWarnings,
          visitingTips: wonder.visitingTips
        }));

        setLocations(mappedWonders);
      } catch (err) {
        console.error('Error fetching wonders:', err);
        setError('Failed to load wonders');
      }
    };

    fetchWonders();
  }, [userPosition, shouldRefresh]);

  const handleMarkerClick = (location) => {
    if (!isSelectingLocation && onMarkerClick) {
      console.log('Marker clicked:', location);
      onMarkerClick(location);
    }
  };

  const handleZoomEnd = (e) => {
    setCurrentZoom(e.target.getZoom());
  };

  const handleMapClick = (e) => {
    if (isSelectingLocation) {
      const { lat, lng } = e.latlng;
      setSelectedLocation([lat, lng]);
      if (onLocationSelect) {
        onLocationSelect(lat, lng);
      }
    }
  };

  if (isLoadingPosition) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>Loading map data...</div>;
  }

  if (error && defaultPosition[0] === 0 && defaultPosition[1] === 0) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={`map-container ${isSelectingLocation ? 'selecting-location-cursor' : ''}`}>
      <MapContainer
        center={defaultPosition}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        onZoomEnd={handleZoomEnd}
        onClick={handleMapClick}
      >
        <TileLayer
          attribution={MAP_LAYERS[currentMapStyle].attribution}
          url={MAP_LAYERS[currentMapStyle].url}
        />
        
        <MapClickHandler onMapClick={handleMapClick} />
        
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
          {filteredLocations.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={L.divIcon({
                html: `
                  <div class="custom-marker">
                    <span class="marker-icon">${getCategoryIcon(location.category)}</span>
                  </div>
                  <div class="marker-label-container">
                    <span class="marker-label-text">${location.name}</span>
                  </div>
                `,
                className: 'custom-marker-wrapper',
                iconSize: L.point(30, 30, true),
                iconAnchor: L.point(15, 30),
              })}
              eventHandlers={{
                click: () => {
                  console.log('Marker clicked, data:', location);
                  handleMarkerClick(location);
                }
              }}
            >
              <Popup className="custom-popup">
                <div className="marker-popup">
                  <h3>{location.name}</h3>
                  <p>{location.description}</p>
                  {location.subcategory && (
                    <p className="subcategory">{location.subcategory}</p>
                  )}
                  {location.country && (
                    <p className="country">{location.country}</p>
                  )}
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

        {isSelectingLocation && selectedLocation && (
          <Marker
            position={selectedLocation}
            icon={L.divIcon({
              html: `<div class="custom-marker"><span class="marker-icon">📌</span></div>`,
              className: '',
              iconSize: L.point(30, 30, true),
            })}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                setSelectedLocation([position.lat, position.lng]);
                if (onLocationSelect) {
                  onLocationSelect(position.lat, position.lng);
                }
              }
            }}
          >
            <Popup>New Wonder Location</Popup>
          </Marker>
        )}

        <ZoomControl />
        <MapStyleControl 
          currentStyle={currentMapStyle} 
          onStyleChange={setCurrentMapStyle}
          isOpen={isStyleSelectorOpen}
          setIsOpen={setIsStyleSelectorOpen}
        />
      </MapContainer>
    </div>
  );
}

// Add this component to handle map clicks
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: onMapClick
  });
  return null;
};

export default Map; 