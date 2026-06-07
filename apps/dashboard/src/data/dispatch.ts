import { DEMO_TIME_SCALE } from "~/config/hk";
import { STATIONS } from "~/data/stations";
import { INCIDENT_SERVICES } from "~/domain/incidentServices";
import type { Coord, EmergencyService, IncidentType, ServiceType, Station } from "~/domain/types";
import { haversineKm, isLandCoord, sanitizeToLand, tupleFromCoord } from "~/lib/geo";

const URBAN_KMH = 28;
const ETA_MIN_MINUTES = 5;
const ETA_MAX_MINUTES = 65;
const SEED_MAX_PROGRESS = 0.35;
const MIN_ORIGIN_KM = 2.5;
const MAX_FIELD_KM = 9;

const CENTRAL_BAND = { minLat: 22.27, maxLat: 22.4, minLng: 114.14, maxLng: 114.28 };

const CALLSIGN_PREFIX: Record<ServiceType, string[]> = {
	ambulance: ["AMB"],
	police: ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT"],
	"fire-engine": ["FIRE"],
};

let callsignCounter = 0;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const clampEtaMinutes = (minutes: number) =>
	clamp(minutes, ETA_MIN_MINUTES, ETA_MAX_MINUTES);

const estimateEtaMinutes = (from: Coord, to: Coord) =>
	clampEtaMinutes((haversineKm(from, to) / URBAN_KMH) * 60);

const randomInBand = (): Coord => {
	for (let i = 0; i < 32; i++) {
		const candidate = {
			lat: CENTRAL_BAND.minLat + Math.random() * (CENTRAL_BAND.maxLat - CENTRAL_BAND.minLat),
			lng: CENTRAL_BAND.minLng + Math.random() * (CENTRAL_BAND.maxLng - CENTRAL_BAND.minLng),
		};
		if (isLandCoord(candidate)) return sanitizeToLand(candidate);
	}
	return sanitizeToLand({ lat: 22.32, lng: 114.17 });
};

/** keep two incidents at least this far apart so none ever spawn on the same spot */
const MIN_INCIDENT_SEPARATION_KM = 0.5;

/** random on-land point in the central band, kept clear of every existing incident */
export const randomIncidentCoord = (existing: Coord[]): Coord => {
	for (let i = 0; i < 60; i++) {
		const candidate = randomInBand();
		if (existing.every((e) => haversineKm(e, candidate) >= MIN_INCIDENT_SEPARATION_KM))
			return sanitizeToLand(candidate);
	}
	return sanitizeToLand(randomInBand());
};

const projectCoord = (origin: Coord, distKm: number, bearingRad: number): Coord => ({
	lat: origin.lat + (distKm / 111) * Math.cos(bearingRad),
	lng: origin.lng + (distKm / (111 * Math.cos((origin.lat * Math.PI) / 180))) * Math.sin(bearingRad),
});

const fieldOrigin = (incident: Coord): Coord => {
	for (let i = 0; i < 32; i++) {
		const candidate = randomInBand();
		const d = haversineKm(incident, candidate);
		if (d >= MIN_ORIGIN_KM && d <= MAX_FIELD_KM && isLandCoord(candidate)) return sanitizeToLand(candidate);
	}
	for (let i = 0; i < 16; i++) {
		const pushed = projectCoord(incident, MIN_ORIGIN_KM + 1.5, Math.random() * 2 * Math.PI);
		const clamped = {
			lat: clamp(pushed.lat, CENTRAL_BAND.minLat, CENTRAL_BAND.maxLat),
			lng: clamp(pushed.lng, CENTRAL_BAND.minLng, CENTRAL_BAND.maxLng),
		};
		if (isLandCoord(clamped)) return sanitizeToLand(clamped);
	}
	return sanitizeToLand(randomInBand());
};

const nearestStationBeyond = (incident: Coord, service: ServiceType): Station | null => {
	let res: Station | null = null;
	let minDist = Infinity;
	for (const station of STATIONS) {
		if (station.service !== service) continue;
		const dist = haversineKm(incident, { lat: station.lat, lng: station.lng });
		if (dist < MIN_ORIGIN_KM || dist >= minDist) continue;
		minDist = dist;
		res = station;
	}
	return res;
};

const jitterAroundStation = (station: Coord): Coord => {
	for (let i = 0; i < 12; i++) {
		const jittered = {
			lat: station.lat + (Math.random() - 0.5) * 0.0036,
			lng: station.lng + (Math.random() - 0.5) * 0.0036,
		};
		if (isLandCoord(jittered)) return sanitizeToLand(jittered);
	}
	return sanitizeToLand(station);
};

export const nearestLandStation = (incident: Coord, service: ServiceType): Station | null => {
	let res: Station | null = null;
	let minDist = Infinity;
	for (const station of STATIONS) {
		if (station.service !== service) continue;
		const coord = { lat: station.lat, lng: station.lng };
		if (!isLandCoord(coord)) continue;
		const dist = haversineKm(incident, coord);
		if (dist >= minDist) continue;
		minDist = dist;
		res = station;
	}
	return res;
};

export const sanitizeServiceOrigin = (
	origin: Coord,
	incident: Coord,
	service: ServiceType,
): Coord => {
	if (isLandCoord(origin)) return origin;
	const station = nearestStationBeyond(incident, service) ?? nearestLandStation(incident, service);
	if (station) return { lat: station.lat, lng: station.lng };
	return fieldOrigin(incident);
};

const dispatchDurationMs = (etaMinutes: number) => (etaMinutes * 60 * 1000) / DEMO_TIME_SCALE;

export const capDispatchAgeMs = (ageMs: number, etaMinutes: number) =>
	Math.min(ageMs, dispatchDurationMs(etaMinutes) * SEED_MAX_PROGRESS);

const nextCallsign = (type: ServiceType): string => {
	callsignCounter += 1;
	const prefixes = CALLSIGN_PREFIX[type];
	const prefix = prefixes[callsignCounter % prefixes.length] ?? prefixes[0]!;
	return `${prefix}-${String(callsignCounter % 20 + 1).padStart(2, "0")}`;
};

export const createEmergencyServices = (
	coords: [number, number],
	incidentType: IncidentType,
	createdAt = Date.now(),
): EmergencyService[] => {
	const incidentCoord: Coord = { lat: coords[1], lng: coords[0] };
	return INCIDENT_SERVICES[incidentType].map((type) => {
		const station = Math.random() < 0.5 ? nearestStationBeyond(incidentCoord, type) : null;
		const raw = station
			? jitterAroundStation({ lat: station.lat, lng: station.lng })
			: fieldOrigin(incidentCoord);
		const from = sanitizeServiceOrigin(raw, incidentCoord, type);
		return {
			id: crypto.randomUUID(),
			type,
			callsign: nextCallsign(type),
			coords: tupleFromCoord(sanitizeToLand(from)),
			etaMinutes: estimateEtaMinutes(from, incidentCoord),
			createdAt,
			arrived: false,
		};
	});
};

export const computeServiceProgress = (svc: EmergencyService, now = Date.now()) => {
	if (svc.arrived) return 1;
	const duration = dispatchDurationMs(svc.etaMinutes);
	if (duration <= 0) return 1;
	return Math.min(1, (now - svc.createdAt) / duration);
};

export const computeRemainingEtaMinutes = (svc: EmergencyService, now = Date.now()) => {
	if (svc.arrived) return 0;
	return svc.etaMinutes * (1 - computeServiceProgress(svc, now));
};
