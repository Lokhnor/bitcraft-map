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

  const clearMarkers = () => {
    markers.forEach((marker) => marker.remove());
    setMarkers([]);
    localStorage.removeItem("bitcraftMarkers");
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
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
      {/* Zoom controls */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          left: "10px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          onClick={handleZoomIn}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          −
        </button>
      </div>
      {markers.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            zIndex: 1000,
          }}
        >
          <button
            onClick={clearMarkers}
            style={{
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
        </div>
      )}
    </div>
  );
};

export default BitcraftMap;
