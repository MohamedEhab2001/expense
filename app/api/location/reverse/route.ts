import { NextRequest, NextResponse } from "next/server";

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  state?: string;
  county?: string;
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");
  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=12&addressdetails=1`,
      {
        headers: {
          "User-Agent": "expense-tracker-personal-app/1.0",
          "Accept-Language": "en",
        },
      }
    );
    if (!res.ok) throw new Error("Reverse geocoding failed");
    const data = await res.json();
    const address: NominatimAddress = data.address ?? {};

    return NextResponse.json({
      city: address.city ?? address.town ?? address.village ?? address.suburb,
      governorate: address.state ?? address.county,
      lat: Number(lat),
      lon: Number(lon),
    });
  } catch {
    return NextResponse.json({ error: "Could not resolve location" }, { status: 502 });
  }
}
