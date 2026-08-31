"use client";

import { useEffect, useState } from "react";
import type { TransactionLocationDTO } from "@/lib/types";

export function useDetectedLocation() {
  const [location, setLocation] = useState<TransactionLocationDTO | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "resolved" | "denied" | "error">("idle");

  // Subscribes to the browser Geolocation API (an external system) and syncs its result into state.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external system (geolocation) on mount
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/location/reverse?lat=${latitude}&lon=${longitude}`);
          if (!res.ok) throw new Error("Failed to resolve location");
          const data = await res.json();
          setLocation({ city: data.city, governorate: data.governorate, lat: latitude, lon: longitude });
          setStatus("resolved");
        } catch {
          setStatus("error");
        }
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return { location, status, setLocation };
}
