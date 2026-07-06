export interface GeocodingResult {
  address: string;
  coordinates: [number, number];
  city?: string;
  country?: string;
}

const GEOAPIFY_ENDPOINT = "https://api.geoapify.com/v1/geocode/search";
const CACHE_KEY = "voyage-mobilite:geocoding-cache";

function getApiKey() {
  return import.meta.env.VITE_GEOAPIFY_API_KEY as string | undefined;
}

function normalizeQuery(query: string) {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

export function roundCoordinate(value: number) {
  return Number(value.toFixed(4));
}

function readCache(): Record<string, GeocodingResult> {
  try {
    const rawCache = window.localStorage.getItem(CACHE_KEY);
    if (!rawCache) return {};
    const parsed = JSON.parse(rawCache);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, GeocodingResult>) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // The app can still geocode if storage is unavailable.
  }
}

export async function geocodeAddress(query: string): Promise<GeocodingResult> {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) throw new Error("Indique une adresse ou un lieu a rechercher.");

  const cache = readCache();
  const cachedResult = cache[normalizedQuery];
  if (cachedResult) return cachedResult;

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Ajoute VITE_GEOAPIFY_API_KEY dans .env.local pour activer la recherche d'adresse.");
  }

  const params = new URLSearchParams({
    apiKey,
    format: "json",
    limit: "1",
    text: query.trim(),
  });

  const response = await fetch(`${GEOAPIFY_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Recherche d'adresse indisponible pour le moment.");
  }

  const data = await response.json() as {
    results?: Array<{
      city?: string;
      country?: string;
      formatted?: string;
      lat?: number;
      lon?: number;
      name?: string;
    }>;
  };
  const result = data.results?.[0];
  if (typeof result?.lat !== "number" || typeof result.lon !== "number") {
    throw new Error("Aucun resultat trouve pour cette adresse.");
  }

  const geocodingResult: GeocodingResult = {
    address: result.formatted ?? query.trim(),
    city: result.city ?? result.name,
    coordinates: [roundCoordinate(result.lat), roundCoordinate(result.lon)],
    country: result.country,
  };

  writeCache({ ...cache, [normalizedQuery]: geocodingResult });
  return geocodingResult;
}
