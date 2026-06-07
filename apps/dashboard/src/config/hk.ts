export const HK_BOUNDS = {
	minLng: 113.83,
	minLat: 22.15,
	maxLng: 114.4,
	maxLat: 22.55,
} as const;

const HK_CENTER = { lat: 22.32, lng: 114.17 } as const;
export const MAP_VIEW_RADIUS_KM = 20;

// ~111 km per degree latitude; longitude scale shrinks with cos(lat).
const kmToLatDelta = (km: number) => km / 111;
const kmToLngDelta = (km: number, lat: number) => km / (111 * Math.cos((lat * Math.PI) / 180));

const mapLatDelta = kmToLatDelta(MAP_VIEW_RADIUS_KM);
const mapLngDelta = kmToLngDelta(MAP_VIEW_RADIUS_KM, HK_CENTER.lat);

/** [[west, south], [east, north]] — pan/zoom clamp around Hong Kong */
export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
	[HK_CENTER.lng - mapLngDelta, HK_CENTER.lat - mapLatDelta],
	[HK_CENTER.lng + mapLngDelta, HK_CENTER.lat + mapLatDelta],
];

export const RESPONDER_MAX_RADIUS_KM = 10;
export const TOP_ALLY_COUNT = 10;
export const DEMO_TIME_SCALE = 1;

/** Hardcoded outbound dial target; displayed ally numbers stay unchanged in UI */
export const DIAL_PHONE_NUMBER = "+31612237615";
