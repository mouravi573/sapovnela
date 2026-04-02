import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { address } = await request.json();
    if (!address) return NextResponse.json({ lat: null, lng: null });

    const fullAddress = `${address}, Tbilisi, Georgia`;
    const key = process.env.GOOGLE_MAPS_KEY;
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${key}`,
    );
    const data = await res.json();

    if (data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      return NextResponse.json({ lat, lng });
    }
    return NextResponse.json({ lat: null, lng: null });
  } catch (err) {
    console.error("Geocode error:", err);
    return NextResponse.json({ lat: null, lng: null });
  }
}
