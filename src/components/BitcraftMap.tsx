import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import bitcraftMapPng from "../assets/map.png";

interface MarkerData {
  position: [number, number];
  color: string;
}

const BitcraftMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Circle[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("#d3d3d3");

  // Define 10 colors for the color picker
  const colors = [
    "#57565D", // Light grey
    "#875F45", // Light brown
    "#5C6F4D", // Green
    "#3388ff", // Blue
    "#8a2be2", // Purple
    "#ff3333", // Red
    "#ff8833", // Orange
    "#ffff33", // Yellow
    "#ff33ff", // Magenta
    "#33ffff", // Cyan
  ];

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
      const parsedData = JSON.parse(savedMarkers);
      // Migrate old format (array of positions) to new format (array of MarkerData)
      const markerData: MarkerData[] = Array.isArray(parsedData[0]) && typeof parsedData[0][0] === 'number'
        ? parsedData.map((pos: [number, number]) => ({ position: pos, color: "#3388ff" }))
        : parsedData;
      
      const loadedMarkers: L.Circle[] = markerData.map((data) => {
        const circle = L.circle(data.position, {
          color: "black",
          fillColor: data.color,
          fillOpacity: 1.0,
                     radius: 3.5,
        }).addTo(map);

        // Add click handler for confirmation and deletion
        circle.on("click", () => {
          if (window.confirm("Delete this marker?")) {
            circle.remove();
            setMarkers((prev) => {
              const newMarkers = prev.filter((m) => m !== circle);
              const markerData: MarkerData[] = newMarkers.map((marker) => ({
                position: [marker.getLatLng().lat, marker.getLatLng().lng],
                color: (marker.options as any).fillColor,
              }));
              localStorage.setItem(
                "bitcraftMarkers",
                JSON.stringify(markerData)
              );
              return newMarkers;
            });
          }
        });

        return circle;
      });
      setMarkers(loadedMarkers);
    }



    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Separate useEffect for click handler that depends on selectedColor
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (e.originalEvent.ctrlKey) {
        const circle = L.circle(e.latlng, {
          color: "black",
          fillColor: selectedColor,
          fillOpacity: 1.0,
                     radius: 3.5,
        }).addTo(map);

        // Add click handler for confirmation and deletion
        circle.on("click", () => {
          if (window.confirm("Delete this marker?")) {
            circle.remove();
            setMarkers((prev) => {
              const newMarkers = prev.filter((m) => m !== circle);
              const markerData: MarkerData[] = newMarkers.map((marker) => ({
                position: [marker.getLatLng().lat, marker.getLatLng().lng],
                color: (marker.options as any).fillColor,
              }));
              localStorage.setItem(
                "bitcraftMarkers",
                JSON.stringify(markerData)
              );
              return newMarkers;
            });
          }
        });

        setMarkers((prev) => {
          const newMarkers = [...prev, circle];
          const markerData: MarkerData[] = newMarkers.map((marker) => ({
            position: [marker.getLatLng().lat, marker.getLatLng().lng],
            color: (marker.options as any).fillColor,
          }));
          localStorage.setItem("bitcraftMarkers", JSON.stringify(markerData));
          return newMarkers;
        });
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [selectedColor]);

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
      {/* Color picker */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color:"black" }}>
          Marker Color:
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "6px",
          }}
        >
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                width: "30px",
                height: "30px",
                backgroundColor: color,
                border: selectedColor === color ? "3px solid #333" : "2px solid #fff",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: selectedColor === color ? "0 0 8px rgba(0, 0, 0, 0.3)" : "0 1px 3px rgba(0, 0, 0, 0.2)",
              }}
              title={`Select ${color}`}
            />
          ))}
        </div>
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
          Ctrl+Click to place marker
        </div>
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
