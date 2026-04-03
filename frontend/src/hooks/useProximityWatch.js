import { useEffect, useRef, useCallback } from "react";
import API_BASE_URL from "./config/api";


/**
 * useProximityWatch
 *
 * Watches the device's GPS position and fires `onNearbyPlace` whenever
 * the user enters within `radius` metres of a recommended place.
 *
 * The hook hits GET /api/location/nearby (your new TypeScript endpoint).
 * Each place is only notified ONCE per browser session (tracked via notifiedIds).
 *
 * @param enabled       - Toggle via the Settings checkbox
 * @param radius        - Search radius in metres (default 500)
 * @param onNearbyPlace - Called with the nearby place object
 */
export function useProximityWatch({
  enabled = true,
  radius = 500,
  onNearbyPlace,
}) {
  const watchId = useRef(null);
  const notifiedIds = useRef(new Set());

  const check = useCallback(
    async ({ coords }) => {
      const { latitude, longitude } = coords;
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/location/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        for (const place of data.places ?? []) {
          if (!notifiedIds.current.has(place.place_id)) {
            notifiedIds.current.add(place.place_id);
            onNearbyPlace(place);
          }
        }
      } catch (err) {
        console.error("[useProximityWatch] fetch error:", err);
      }
    },
    [radius, onNearbyPlace],
  );

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    watchId.current = navigator.geolocation.watchPosition(check, null, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
    });

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [enabled, check]);
}
