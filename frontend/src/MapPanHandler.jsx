/**
 * ───────────────────────────────────────────────────────────────
 * A small invisible Leaflet component that listens for map move
 * and zoom events and calls onBBoxChange(bbox) with the new
 * visible bounding box.
 *
 * WHY THIS FILE EXISTS:
 *   Leaflet's MapContainer doesn't expose map events directly in
 *   React. You need a child component that uses useMapEvents()
 *   hook (from react-leaflet) to subscribe to move/zoom.
 *   This component is rendered inside <MapContainer> in App.jsx.
 *
 * HOW IT WORKS:
 *   - useMapEvents listens for "moveend" (fires after pan/zoom ends)
 *   - Gets the current map bounds as a BBox object
 *   - Calls onBBoxChange so App.jsx can fire the /search/map API
 *   - Uses a 300ms debounce so rapid panning doesn't spam the API
 * ───────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from "react";
import { useMapEvents } from "react-leaflet";

export default function MapPanHandler({ onBBoxChange }) {
  const debounceTimer = useRef(null);

  const map = useMapEvents({
    moveend() {
      // Debounce: wait 300ms after the last move event
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const bounds = map.getBounds();
        const bbox = {
          south: bounds.getSouth(),
          west:  bounds.getWest(),
          north: bounds.getNorth(),
          east:  bounds.getEast(),
        };
        onBBoxChange(bbox);
      }, 300);
    },
  });

  // Fire once on initial mount so the starting view loads places
  useEffect(() => {
    const bounds = map.getBounds();
    onBBoxChange({
      south: bounds.getSouth(),
      west:  bounds.getWest(),
      north: bounds.getNorth(),
      east:  bounds.getEast(),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null; // renders nothing, just hooks into map events
}
