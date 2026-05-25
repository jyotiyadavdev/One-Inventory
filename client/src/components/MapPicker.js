import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const Routing = ({ origin, destination, onDistanceCalculated }) => {
  const map = useMap();

  React.useEffect(() => {
    if (!map || !origin || !destination) return;

    let routingControl = null;
    let isMounted = true;

    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(origin.lat, origin.lng),
        L.latLng(destination.lat, destination.lng),
      ],
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      createMarker: () => null,
    });

    routingControl.on("routesfound", (e) => {
      if (!isMounted) return;

      const route = e.routes?.[0];

      if (route?.summary?.totalDistance) {
        const distanceKm = (route.summary.totalDistance / 1000).toFixed(2);

        if (typeof onDistanceCalculated === "function") {
          onDistanceCalculated(distanceKm);
        }
      }
    });

    routingControl.on("routingerror", () => {
      if (!isMounted) return;

      if (typeof onDistanceCalculated === "function") {
        onDistanceCalculated("0");
      }
    });

    routingControl.addTo(map);

    return () => {
      isMounted = false;

      if (routingControl) {
        routingControl.off();

        try {
          if (routingControl._line && map.hasLayer(routingControl._line)) {
            map.removeLayer(routingControl._line);
          }

          if (routingControl._alternatives) {
            routingControl._alternatives.forEach((layer) => {
              if (layer && map.hasLayer(layer)) {
                map.removeLayer(layer);
              }
            });
          }

          map.removeControl(routingControl);
        } catch (err) {
          console.debug("Routing cleanup suppressed:", err);
        }

        routingControl = null;
      }
    };
  }, [map, origin, destination, onDistanceCalculated]);

  return null;
};

export default function MapPicker({ onSelect }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        if (!origin) {
          setOrigin(e.latlng);
        } else if (!destination) {
          setDestination(e.latlng);
          setIsCalculating(true);
        } else {
          // Reset if both are set and user clicks again
          setOrigin(e.latlng);
          setDestination(null);
          setDistance(0);
          setIsCalculating(false);
        }
      },
    });
    return null;
  };

 const handleRouteFound = useCallback((distanceKm) => {
  setDistance(distanceKm || "0.00");
  setIsCalculating(false);
}, []);

  useEffect(() => {
    if (origin && destination && !isCalculating && distance !== 0) {
      onSelect({
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        dest_lat: destination.lat,
        dest_lng: destination.lng,
        distance_km: distance
      });
    }
  }, [origin, destination, distance, isCalculating, onSelect]);

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "12px", overflow: "hidden", marginBottom: "1rem", border: "1px solid var(--border)" }}>
      <div style={{ position: "absolute", zIndex: 1000, background: "rgba(255,255,255,0.9)", padding: "8px 12px", borderRadius: "8px", margin: "10px", fontSize: "12px", color: "#333", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        {!origin && "Click to set Origin"}
        {origin && !destination && "Click to set Destination"}
        {origin && destination && `Distance: ${distance} km`}
        <button 
          onClick={(e) => {
  e.stopPropagation();
  setOrigin(null);
  setDestination(null);
  setDistance(0);
  setIsCalculating(false);
}}
          style={{ marginLeft: "10px", border: "none", background: "var(--accent)", color: "white", padding: "2px 8px", borderRadius: "4px", cursor: "pointer" }}
        >
          Reset
        </button>
      </div>
  <MapContainer
  key={
    origin && destination
      ? `${origin.lat}-${origin.lng}-${destination.lat}-${destination.lng}`
      : "map-picker-default"
  }
  center={
    origin
      ? [origin.lat, origin.lng]
      : [18.5204, 73.8567]
  }
  zoom={13}
  style={{ height: "100%", width: "100%" }}
>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

  <MapEvents />

  {origin && <Marker position={[origin.lat, origin.lng]} />}

  {destination && (
    <Marker position={[destination.lat, destination.lng]} />
  )}

  {origin && destination && (
    <Routing
      origin={origin}
      destination={destination}
      onDistanceCalculated={handleRouteFound}
    />
  )}
</MapContainer>
    </div>
  );
}
