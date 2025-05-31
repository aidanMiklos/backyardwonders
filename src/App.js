import React, { useState } from 'react';
import Map from './components/Map/Map';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';

function App() {
  const [selectedMarker, setSelectedMarker] = useState(null);

  const handleMarkerClick = (location) => {
    setSelectedMarker(location);
  };

  const handleCoordinateClick = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="App">
      <Sidebar 
        selectedMarker={selectedMarker}
        onCoordinateClick={handleCoordinateClick}
        onClose={() => setSelectedMarker(null)}
      />
      <div className="map-wrapper">
        <Map onMarkerClick={handleMarkerClick} />
      </div>
    </div>
  );
}

export default App; 