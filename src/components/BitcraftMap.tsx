import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const BitcraftMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Circle[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const imageWidth = 7676;
    const imageHeight = 7676;
    const imageBounds: L.LatLngBoundsLiteral = [[0, 0], [imageHeight, imageWidth]];

    // Initialize the map
    const map = L.map(mapRef.current, {
      crs: L.CRS.Simple,
      minZoom: -3,
      maxZoom: 5,
      zoomSnap: 0.1,
      attributionControl: false,
      zoomControl: false,      // hides + / - buttons
      scrollWheelZoom: true,  // enables zooming with mouse wheel
      dragging: true          // enables panning
    }).setView(
      [imageHeight / 2, imageWidth / 2],
      0
    );

    // Add the image overlay
    L.imageOverlay('https://bitcraftmap.com/assets/maps/map.png', imageBounds).addTo(map);

    // Add click event to place red circles (only when holding Ctrl)
    map.on('click', (e: L.LeafletMouseEvent) => {
      // Only place marker if Ctrl key is held down
      if (e.originalEvent.ctrlKey) {
        const circle = L.circle(e.latlng, {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0.5,
          radius: 7  // Much smaller radius
        }).addTo(map);
        
        setMarkers(prev => [...prev, circle]);
      }
    });

    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Function to clear all markers
  const clearMarkers = () => {
    markers.forEach(marker => marker.remove());
    setMarkers([]);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div 
        ref={mapRef} 
        style={{ 
          height: '100vh', 
          width: '100vw',
          backgroundColor: '#222d44'
        }} 
      />
      {markers.length > 0 && (
        <button
          onClick={clearMarkers}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Clear All Markers ({markers.length})
        </button>
      )}
    </div>
  );
};

export default BitcraftMap;