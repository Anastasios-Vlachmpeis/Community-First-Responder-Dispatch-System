import { HK_BOUNDS } from "~/config/hk";
import type { Coord } from "~/domain/types";

type Box = { minLat: number; maxLat: number; minLng: number; maxLng: number };

const inBox = ({ lat, lng }: Coord, box: Box) =>
	lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;

const WATER_ZONES: Box[] = [
	{ minLat: 22.279, maxLat: 22.302, minLng: 114.162, maxLng: 114.182 },
	{ minLat: 22.272, maxLat: 22.294, minLng: 114.118, maxLng: 114.162 },
	{ minLat: 22.296, maxLat: 22.318, minLng: 114.192, maxLng: 114.222 },
	{ minLat: 22.18, maxLat: 22.275, minLng: 114.3, maxLng: 114.42 },
	{ minLat: 22.36, maxLat: 22.48, minLng: 113.83, maxLng: 113.95 },
];

const SHORE_LAND: Box[] = [
	{ minLat: 22.294, maxLat: 22.34, minLng: 114.158, maxLng: 114.185 },
	{ minLat: 22.265, maxLat: 22.288, minLng: 114.15, maxLng: 114.22 },
	{ minLat: 22.278, maxLat: 22.29, minLng: 114.148, maxLng: 114.158 },
];

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
	if (SHORE_LAND.some((box) => inBox(coord, box))) return true;
	return !WATER_ZONES.some((box) => inBox(coord, box));
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
