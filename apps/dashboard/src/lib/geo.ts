import { HK_BOUNDS } from "~/config/hk";
import type { Coord } from "~/domain/types";

type Box = { minLat: number; maxLat: number; minLng: number; maxLng: number };

const inBox = ({ lat, lng }: Coord, box: Box) =>
	lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;

const WATER_ZONES: Box[] = [
	{ minLat: 22.2835, maxLat: 22.2935, minLng: 114.155, maxLng: 114.175 },
	{ minLat: 22.275, maxLat: 22.288, minLng: 114.128, maxLng: 114.155 },
	{ minLat: 22.286, maxLat: 22.295, minLng: 114.175, maxLng: 114.198 },
	{ minLat: 22.298, maxLat: 22.315, minLng: 114.198, maxLng: 114.228 },
	{ minLat: 22.26, maxLat: 22.3, minLng: 114.24, maxLng: 114.32 },
	{ minLat: 22.18, maxLat: 22.27, minLng: 114.28, maxLng: 114.42 },
	{ minLat: 22.36, maxLat: 22.48, minLng: 113.83, maxLng: 113.95 },
	{ minLat: 22.15, maxLat: 22.26, minLng: 114.05, maxLng: 114.22 },
	{ minLat: 22.22, maxLat: 22.36, minLng: 113.83, maxLng: 114.02 },
];

const LAND_FALLBACK: Coord = { lat: 22.3193, lng: 114.1694 };

export const coordFromTuple = ([lng, lat]: [number, number]): Coord => ({ lat, lng });

export const tupleFromCoord = ({ lat, lng }: Coord): [number, number] => [lng, lat];

export const isWithinHkBounds = (coord: Coord) =>
	coord.lat >= HK_BOUNDS.minLat &&
	coord.lat <= HK_BOUNDS.maxLat &&
	coord.lng >= HK_BOUNDS.minLng &&
	coord.lng <= HK_BOUNDS.maxLng;

export const isLandCoord = (coord: Coord): boolean => {
	if (!isWithinHkBounds(coord)) return false;
	if (coord.lat > 22.52) return false;
	if (coord.lng < 113.9 && coord.lat > 22.42) return false;
	return !WATER_ZONES.some((box) => inBox(coord, box));
};

export const sanitizeToLand = (coord: Coord): Coord => {
	if (isLandCoord(coord)) return coord;
	for (let ring = 1; ring <= 50; ring++) {
		const km = ring * 0.15;
		for (let i = 0; i < 24; i++) {
			const angle = (i / 24) * 2 * Math.PI;
			const candidate = {
				lat: coord.lat + (km / 111) * Math.cos(angle),
				lng: coord.lng + (km / (111 * Math.cos((coord.lat * Math.PI) / 180))) * Math.sin(angle),
			};
			if (isLandCoord(candidate)) return candidate;
		}
	}
	return LAND_FALLBACK;
};

export const sanitizeTupleToLand = ([lng, lat]: [number, number]): [number, number] =>
	tupleFromCoord(sanitizeToLand({ lat, lng }));

export const randomLandCoord = (rng: () => number = Math.random): Coord => {
	for (let i = 0; i < 64; i++) {
		const candidate = {
			lat: HK_BOUNDS.minLat + rng() * (HK_BOUNDS.maxLat - HK_BOUNDS.minLat),
			lng: HK_BOUNDS.minLng + rng() * (HK_BOUNDS.maxLng - HK_BOUNDS.minLng),
		};
		if (isLandCoord(candidate)) return candidate;
	}
	return LAND_FALLBACK;
};

export const haversineKm = (a: Coord, b: Coord): number => {
	const R = 6371;
	const dLat = ((b.lat - a.lat) * Math.PI) / 180;
	const dLng = ((b.lng - a.lng) * Math.PI) / 180;
	const lat1 = (a.lat * Math.PI) / 180;
	const lat2 = (b.lat * Math.PI) / 180;
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
