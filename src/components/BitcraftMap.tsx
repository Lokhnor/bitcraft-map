import { useEffect, useRef, useState } from "react";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import bitcraftMapPng from "../assets/map.png";

// 1) import your custom icon files
import cavePng     from "../assets/cave.png";
import claimPng    from "../assets/claim.png";
import resourcePng from "../assets/resource.png";

// 2) build a lookup of Leaflet Icons
const iconMap: Record<"cave" | "claim" | "resource", L.Icon> = {
  cave:     L.icon({ iconUrl: cavePng,     iconSize: [32,32], iconAnchor: [16,32] }),
  claim:    L.icon({ iconUrl: claimPng,    iconSize: [32,32], iconAnchor: [16,32] }),
  resource: L.icon({ iconUrl: resourcePng, iconSize: [32,32], iconAnchor: [16,32] }),
};

const BitcraftMap = () => {
  // 3) track which icon type is active
  const [selectedType, setSelectedType] = useState<"cave" | "claim" | "resource">("cave");
  const mapRef        = useRef<HTMLDivElement>(null);
  const mapInstance  = useRef<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const imageWidth  = 7676;
    const imageHeight = 7676;
    const imageBounds: L.LatLngBoundsLiteral = [
      [0, 0],
      [imageHeight, imageWidth],
    ];

    // initialize the map
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

    // add the PNG overlay
    L.imageOverlay(bitcraftMapPng, imageBounds).addTo(map);

    // load saved markers from localStorage
    const saved = localStorage.getItem("bitcraftMarkers");
    if (saved) {
      const items: { lat: number; lng: number; type: "cave" | "claim" | "resource" }[] =
        JSON.parse(saved);
      items.forEach(({ lat, lng, type }) => {
        const m = L.marker([lat, lng], { icon: iconMap[type], draggable: true }).addTo(map);
        m.on("click", () => {
          if (window.confirm("Delete this marker?")) {
            m.remove();
            setMarkers((prev) => {
              const next = prev.filter((x) => x !== m);
              localStorage.setItem(
                "bitcraftMarkers",
                JSON.stringify(
                  next.map((x) => {
                    const p = x.getLatLng();
                    const t = (Object.entries(iconMap).find(([, ic]) => ic === x.options.icon)?.[0]) as any;
                    return { lat: p.lat, lng: p.lng, type: t };
                  })
                )
              );
              return next;
            });
          }
        });
        setMarkers((prev) => [...prev, m]);
      });
    }

    // ctrl+click to add a new marker
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (!e.originalEvent.ctrlKey) return;
      const m = L.marker(e.latlng, { icon: iconMap[selectedType], draggable: true }).addTo(map);
      m.on("click", () => {
        if (window.confirm("Delete this marker?")) {
          m.remove();
          setMarkers((prev) => {
            const next = prev.filter((x) => x !== m);
            localStorage.setItem(
              "bitcraftMarkers",
              JSON.stringify(
                next.map((x) => {
                  const p = x.getLatLng();
                  const t = (Object.entries(iconMap).find(([, ic]) => ic === x.options.icon)?.[0]) as any;
                  return { lat: p.lat, lng: p.lng, type: t };
                })
              )
            );
            return next;
          });
        }
      });
      setMarkers((prev) => {
        const next = [...prev, m];
        localStorage.setItem(
          "bitcraftMarkers",
          JSON.stringify(
            next.map((x) => {
              const p = x.getLatLng();
              const t = (Object.entries(iconMap).find(([, ic]) => ic === x.options.icon)?.[0]) as any;
              return { lat: p.lat, lng: p.lng, type: t };
            })
          )
        );
        return next;
      });
    });

    mapInstance.current = map;
    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [selectedType]);

  // clears all markers
  const clearMarkers = () => {
    markers.forEach((m) => m.remove());
    setMarkers([]);
    localStorage.removeItem("bitcraftMarkers");
  };

  const handleZoomIn  = () => mapInstance.current?.zoomIn();
  const handleZoomOut = () => mapInstance.current?.zoomOut();

  return (
    <div style={{ position: "relative" }}>
      {/* map container */}
      <div
        ref={mapRef}
        style={{ height: "100vh", width: "100vw", backgroundColor: "#222d44" }}
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
        <button onClick={handleZoomIn} style={{ padding: "8px 16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "18px" }}>
          +
        </button>
        <button onClick={handleZoomOut} style={{ padding: "8px 16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "18px" }}>
          −
        </button>
      </div>

      {/* Clear markers button */}
      {markers.length > 0 && (
        <div style={{ position: "fixed", top: "10px", right: "10px", zIndex: 1000 }}>
          <button onClick={clearMarkers} style={{ padding: "8px 16px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>
            Clear All Markers ({markers.length})
          </button>
        </div>
      )}

      {/* Icon selection toolbar */}
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          background: "rgba(255,255,255,0.9)",
          padding: 8,
          borderRadius: 4,
          zIndex: 1000,
          display: "flex",
          gap: 6,
        }}
      >
        {(["cave", "claim", "resource"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            style={{
              padding: "4px 8px",
              border: selectedType === type ? "2px solid #007bff" : "1px solid #ccc",
              borderRadius: 4,
              background: "white",
              cursor: "pointer",
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BitcraftMap;
