"use client";
import { useEffect, useRef } from "react";

export default function MapView({ pharmacies, userLocation }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = require("leaflet");
    require("leaflet/dist/leaflet.css");

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    const center = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [41.6941, 44.8015];

    const map = L.map(mapRef.current).setView(center, 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    if (userLocation) {
      const userIcon = L.divIcon({
        html: '<div style="width:14px;height:14px;background:#2A7A6E;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        className: "",
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup("You are here");
    }

    pharmacies.forEach((ph, i) => {
      if (!ph.lat || !ph.lng) return;
      const isFirst = i === 0;
      const pinIcon = L.divIcon({
        html: `<div style="background:${isFirst ? "#F5A623" : "#2A7A6E"};color:white;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2)">${ph.price?.toFixed(2)} ₾</div>`,
        iconSize: [70, 24],
        iconAnchor: [35, 12],
        className: "",
      });
      L.marker([ph.lat, ph.lng], { icon: pinIcon })
        .addTo(map)
        .bindPopup(
          `<strong>${ph.name}</strong><br>${ph.address}<br>${ph.hours}`,
        );
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pharmacies, userLocation]);

  return <div ref={mapRef} style={{ width: "100%", height: "320px" }} />;
}
