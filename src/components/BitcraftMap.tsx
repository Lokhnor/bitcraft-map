import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import bitcraftMapPng from "../assets/map.png";

const BitcraftMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Circle[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const imageWidth = 7676;
    const imageHeight = 7676;
    const imageBounds: L.LatLngBoundsLiteral = [
      [0, 0],
      [imageHeight, imageWidth],
    ];

    const map = L.map(mapRef.current, {
      crs: L.CRS.Simple,
      minZoom: -3,
      maxZoom: 5,
      zoomSnap: 0.1,
      attributionControl: false,
      zoomControl: false,
      scrollWheelZoom: true,
      dragging: true,
    }).setView([imageHeight / 2, imageWidth / 2], 0);

    L.imageOverlay(bitcraftMapPng, imageBounds).addTo(map);

    // Load markers from localStorage
    const savedMarkers = localStorage.getItem("bitcraftMarkers");
    if (savedMarkers) {
      const markerPositions: [number, number][] = JSON.parse(savedMarkers);
      const loadedMarkers: L.Circle[] = markerPositions.map((pos) =>
        L.circle(pos, {
          color: "black",
          fillColor: "blue",
          fillOpacity: 0.5,
          radius: 7,
        }).addTo(map)
      );
      setMarkers(loadedMarkers);
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (e.originalEvent.ctrlKey) {
        const circle = L.circle(e.latlng, {
          color: "black",
          fillColor: "blue",
          fillOpacity: 0.5,
          radius: 7,
        }).addTo(map);

        setMarkers((prev) => {
          const newMarkers = [...prev, circle];
          // Save marker positions to localStorage
          const positions = newMarkers.map((marker) => [
            marker.getLatLng().lat,
            marker.getLatLng().lng,
          ]);
          localStorage.setItem("bitcraftMarkers", JSON.stringify(positions));
          return newMarkers;
        });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update localStorage when markers are cleared
  const clearMarkers = () => {
    markers.forEach((marker) => marker.remove());
    setMarkers([]);
    localStorage.removeItem("bitcraftMarkers");
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapRef}
        style={{
          height: "100vh",
          width: "100vw",
          backgroundColor: "#222d44",
        }}
      />
      {markers.length > 0 && (
        <button
          onClick={clearMarkers}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1000,
            padding: "8px 16px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Clear All Markers ({markers.length})
        </button>
      )}
    </div>
  );
};

export default BitcraftMap;
