import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Map from './components/Map/Map';
import Sidebar from './components/Sidebar/Sidebar';
import SuperAdminPage from './components/SuperAdminPage';
import WonderPage from './components/WonderPage';
import { useUser } from './context/UserContext';
import './App.css';

// A wrapper for the main app layout (Sidebar + Map)
const MainAppLayout = () => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    query: '',
    category: null
  });
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleMarkerClick = useCallback((location) => {
    console.log('App: Marker clicked:', location);
    if (!isSelectingLocation) {
      setSelectedMarker(location);
    }
  }, [isSelectingLocation]);

  const handleCoordinateClick = useCallback((lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  }, []);

  const handleWonderAdded = useCallback(() => {
    setMapRefreshKey(prev => prev + 1);
    setIsSelectingLocation(false);
    setSelectedLocation(null);
  }, []);

  const handleLocationSelect = useCallback((lat, lng) => {
    if (isSelectingLocation) {
      setSelectedLocation({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
    }
  }, [isSelectingLocation]);

  const handleSearch = useCallback((query, category) => {
    setSearchFilters({
      query,
      category
    });
  }, []);

  const handleLocationsFiltered = useCallback((locations) => {
    setFilteredLocations(locations);
  }, []);

  const handleWonderSelectFromSearch = useCallback((wonder) => {
    setSelectedMarker(wonder);
  }, []);

  const handleSelectedMarkerUpdate = useCallback((updatedMarkerData) => {
    setSelectedMarker(prev => ({ ...prev, ...updatedMarkerData }));
  }, []);

  return (
    <div className="App">
      <Sidebar 
        selectedMarker={selectedMarker}
        onCoordinateClick={handleCoordinateClick}
        onClose={() => {
          console.log('App: Closing marker details');
          setSelectedMarker(null);
        }}
        onWonderAdded={handleWonderAdded}
        onLocationSelectStart={() => setIsSelectingLocation(true)}
        onLocationSelectCancel={() => {
          setIsSelectingLocation(false);
          setSelectedLocation(null);
        }}
        onSearch={handleSearch}
        searchResults={filteredLocations}
        onWonderSelect={handleWonderSelectFromSearch}
        selectedLocation={selectedLocation}
        onMarkerUpdate={handleSelectedMarkerUpdate}
      />
      <div className="map-wrapper">
        <Map 
          onMarkerClick={handleMarkerClick} 
          shouldRefresh={mapRefreshKey}
          isSelectingLocation={isSelectingLocation}
          onLocationSelect={handleLocationSelect}
          searchFilters={searchFilters}
          onLocationsFiltered={handleLocationsFiltered}
        />
      </div>
    </div>
  );
};

// ProtectedRoute for SuperAdminPage
const SuperAdminRoute = ({ children }) => {
  const { user } = useUser();
  if (!user || user.role !== 'superadmin') {
    // Redirect them to the home page if not superadmin or not logged in
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router basename="/backyardwonders">
      <Routes>
        <Route path="/" element={<MainAppLayout />} />
        <Route 
          path="/super-admin"
          element={
            <SuperAdminRoute>
              <SuperAdminPage />
            </SuperAdminRoute>
          }
        />
        <Route path="/wonder/:slug" element={<WonderPage />} />
      </Routes>
    </Router>
  );
}

export default App; 