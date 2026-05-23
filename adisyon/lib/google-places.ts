const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = "https://places.googleapis.com/v1";

interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  city?: string;
  latitude: number;
  longitude: number;
  photoRef?: string;
}

export async function searchRestaurant(name: string, city?: string): Promise<PlaceDetails | null> {
  if (!PLACES_API_KEY) return null;

  const query = city ? `${name} restaurant ${city}` : `${name} restaurant`;

  const res = await fetch(`${BASE_URL}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.photos",
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return null;

  return {
    placeId: place.id,
    name: place.displayName?.text ?? name,
    address: place.formattedAddress ?? "",
    city: extractCity(place.formattedAddress),
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    photoRef: place.photos?.[0]?.name,
  };
}

function extractCity(address: string): string | undefined {
  const parts = address?.split(",") ?? [];
  return parts.length >= 2 ? parts[parts.length - 2].trim() : undefined;
}
