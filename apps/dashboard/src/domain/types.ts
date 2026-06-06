export type IncidentType =
	| "cardiac-arrest"
	| "breathing-difficulty"
	| "stroke"
	| "severe-bleeding"
	| "seizure"
	| "overdose"
	| "drowning"
	| "diabetic-emergency"
	| "choking"
	| "anaphylaxis"
	| "childbirth"
	| "mental-health-crisis"
	| "language-barrier";

export type IncidentStatus = "incoming" | "active" | "dispatched";
export type ServiceType = "ambulance" | "police" | "fire-engine";

export type CertificationType =
	| "cpr_aed"
	| "medical_professional"
	| "water_rescue"
	| "mountain_wilderness_rescue"
	| "fire_safety"
	| "road_accident_response"
	| "mental_health_first_aid"
	| "other";

export type Certification = {
	id: string;
	type: CertificationType;
	customLabel?: string;
	verified: boolean;
};

export type EmergencyService = {
	id: string;
	type: ServiceType;
	callsign: string;
	coords: [number, number];
	etaMinutes: number;
	createdAt: number;
	arrived?: boolean;
};

export type Incident = {
	id: string;
	type: IncidentType;
	status: IncidentStatus;
	coords: [number, number];
	address: string;
	receivedAt: number;
	callerPhone: string;
	emergencyServices: EmergencyService[];
	contactedAllyIds: string[];
	handled: boolean;
	source?: "seed" | "operator";
};

export type Ally = {
	id: string;
	name: string;
	phone: string;
	skills: IncidentType[];
	coords: [number, number];
	credentialScore: number;
	certifications?: Certification[];
	pictureUrl: string;
};

export type RouteData = {
	coords: [number, number][];
	distanceM: number;
	durationS: number;
};

export type Coord = { lat: number; lng: number };

export type Station = {
	id: string;
	name: string;
	service: ServiceType;
	lat: number;
	lng: number;
};

export type Hotspot = Coord & { name: string };
