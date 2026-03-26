"use client";
import { useEffect, useState } from "react";

export default function MapView({ pharmacies, userLocation }) {
  const [MapComponents, setMapComponents] = useState(null);

  useEffect(() => {
    Promise.all([
      import("leaflet"),
      import("react-leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([L, RL]) => {
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      setMapComponents({ L: L.default, ...RL });
    });
  }, []);

  if (!MapComponents)
    return (
      <div
        style={{
          width: "100%",
          height: "320px",
          background: "#EBF6F4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#2A7A6E",
          fontSize: "14px",
        }}
      >
        Loading map...
      </div>
    );

  const { MapContainer, TileLayer, Marker, Popup, CircleMarker } =
    MapComponents;
  const { L } = MapComponents;

  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : pharmacies.length > 0 && pharmacies[0].lat
      ? [pharmacies[0].lat, pharmacies[0].lng]
      : [41.6941, 44.8015];

  const priceIcon = (price, isFirst) =>
    L.divIcon({
      html: `<div style="background:${isFirst ? "#F5A623" : "#2A7A6E"};color:white;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2)">${price?.toFixed(2)} ₾</div>`,
      iconSize: [70, 24],
      iconAnchor: [35, 12],
      className: "",
    });

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: "100%", height: "320px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          fillColor="#2A7A6E"
          color="white"
          weight={3}
          fillOpacity={1}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}
      {pharmacies
        .filter((ph) => ph.lat && ph.lng)
        .map((ph, i) => (
          <Marker
            key={ph.id}
            position={[ph.lat, ph.lng]}
            icon={priceIcon(ph.price, i === 0)}
          >
            <Popup>
              <strong>{ph.name}</strong>
              <br />
              {ph.address}
              <br />
              {ph.hours}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
