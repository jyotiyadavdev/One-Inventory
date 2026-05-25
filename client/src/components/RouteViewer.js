import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

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
      const totalDistance = route?.summary?.totalDistance;

      if (typeof totalDistance === "number") {
        const distanceKm = (totalDistance / 1000).toFixed(2);

        if (typeof onDistanceCalculated === "function") {
          onDistanceCalculated(distanceKm);
        }
      }
    });

    routingControl.on("routingerror", () => {
      if (!isMounted) return;

      if (typeof onDistanceCalculated === "function") {
        onDistanceCalculated("0.00");
      }
    });

    routingControl.addTo(map);

    return () => {
      isMounted = false;

      if (routingControl) {
        routingControl.off();

        try {
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

export default function RouteViewer({ shipment, onDistanceChange }) {
  const [calculatedDistance, setCalculatedDistance] = useState(
    shipment?.distance_km || "Calculating..."
  );

  if (!shipment?.origin_lat || !shipment?.origin_lng || !shipment?.dest_lat || !shipment?.dest_lng) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
        No route data available for this shipment.
      </div>
    );
  }

  const origin = {
    lat: Number(shipment.origin_lat),
    lng: Number(shipment.origin_lng),
  };

  const destination = {
    lat: Number(shipment.dest_lat),
    lng: Number(shipment.dest_lng),
  };

  const handleDistanceCalculated = (distanceKm) => {
    setCalculatedDistance(distanceKm);

    if (typeof onDistanceChange === "function") {
      onDistanceChange(distanceKm);
    }
  };

  return (
    <>
      <div style={{ marginBottom: "10px", fontSize: "14px", fontWeight: "600" }}>
        Distance: {parseFloat(calculatedDistance).toFixed(1)} km
      </div>

      <div style={{ height: "400px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
        <MapContainer
          key={`${origin.lat}-${origin.lng}-${destination.lat}-${destination.lng}`}
          center={[origin.lat, origin.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker position={[origin.lat, origin.lng]} />
          <Marker position={[destination.lat, destination.lng]} />

          <Routing
            origin={origin}
            destination={destination}
            onDistanceCalculated={handleDistanceCalculated}
          />
        </MapContainer>
      </div>
    </>
  );
}