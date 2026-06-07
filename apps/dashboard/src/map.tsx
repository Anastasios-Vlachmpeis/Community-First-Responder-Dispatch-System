import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
	Cross,
	Download,
	Flame,
	Footprints,
	MapPin,
	Phone,
	PhoneOff,
	Shield,
	Star,
	User,
} from "lucide-react";
import type { MapRef } from "react-map-gl/mapbox";
import { Layer, Map as MapGL, Marker, Source, useMap } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAP_MAX_BOUNDS } from "~/config/hk";
import { getAllyPool } from "~/data/allies";
import {
	computeRemainingEtaMinutes,
	computeServiceProgress,
	createEmergencyServices,
	randomIncidentCoord,
	sanitizeServiceOrigin,
} from "~/data/dispatch";
import { HK_HOTSPOTS } from "~/data/hotspots";
import { getSeedIncidents } from "~/data/incidents";
import { loadPersistedState, mergeIncidents, savePersistedState } from "~/data/incidentStorage";
import { CERTIFICATION_LABELS } from "~/domain/certLabels";
import type { MatchedCert } from "~/domain/certMapping";
import { INCIDENT_TYPES, TYPE_LABEL } from "~/domain/incidentServices";
import type {
	Ally,
	AllyResponseStatus,
	EmergencyService,
	Incident,
	IncidentStatus,
	IncidentType,
	RouteData,
	ServiceType,
} from "~/domain/types";
import {
	countRankedAllies,
	rankAllies,
	routeFetchCandidates,
	type RankedAlly,
} from "~/features/recommender/rankAllies";
import { coordFromTuple, sanitizeTupleToLand, tupleFromCoord } from "~/lib/geo";

// ── Design tokens ─────────────────────────────────────────────────────────────

const Z = {
	primary: "#EC0016",
	secondary: "#3B82F6",
	green: "#32a832",
	gold: "#D4AF37",
	text: "#FFFFFF",
	muted: "rgba(255, 255, 255, 0.5)",
	bg: "#1a1d23",
	cardBg: "#242830",
	border: "rgba(255, 255, 255, 0.08)",
	borderSubtle: "rgba(255, 255, 255, 0.05)",
	font: '"Montserrat", sans-serif',
	fontHead: '"Montserrat", sans-serif',
	ambulance: "#EF4444",
	police: "#3B82F6",
	fire: "#F97316",
	radius: 10,
} as const;

const ICON_OPACITY = 0.93;
const PANEL_CLOSE_MS = 280;
const PANEL_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const MOCK_RING_MS_MIN = 2400;
const MOCK_RING_MS_MAX = 3600;

type CallPhase = "ready" | "calling" | "in-call" | "wrap-up";

const mockRingMs = (allyId: string): number => {
	let h = 0;
	for (const c of allyId) h = (h * 31 + c.charCodeAt(0)) | 0;
	const base = MOCK_RING_MS_MIN + (Math.abs(h) % (MOCK_RING_MS_MAX - MOCK_RING_MS_MIN + 1));
	const jitter = Math.floor(Math.random() * 500) - 250;
	return Math.max(MOCK_RING_MS_MIN, Math.min(MOCK_RING_MS_MAX, base + jitter));
};

const formatPhoneDisplay = (raw: string): string => {
	const digits = raw.replace(/\D/g, "");
	if (digits.startsWith("852") && digits.length === 11)
		return `+852 ${digits.slice(3, 7)} ${digits.slice(7)}`;
	return raw;
};

const mockDialAlly = (signal: AbortSignal, ringMs: number): Promise<void> =>
	new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(new DOMException("aborted", "AbortError"));
			return;
		}
		const id = setTimeout(resolve, ringMs);
		signal.addEventListener("abort", () => {
			clearTimeout(id);
			reject(new DOMException("aborted", "AbortError"));
		});
	});

const allyResponseCode = (status?: AllyResponseStatus): number =>
	status === "accepted" ? 1 : status === "declined" ? 2 : 0;

const AllyResponseButtons = ({
	status,
	onAccept,
	onDecline,
	compact,
}: {
	status?: AllyResponseStatus;
	onAccept: () => void;
	onDecline: () => void;
	compact?: boolean;
}) => (
	<div style={{ display: "flex", gap: compact ? 4 : 6, width: compact ? undefined : "100%" }}>
		<button
			type="button"
			onClick={onAccept}
			style={{
				flex: compact ? undefined : 1,
				padding: compact ? "4px 8px" : "8px 0",
				borderRadius: compact ? 6 : 8,
				border: `1px solid ${status === "accepted" ? Z.gold : Z.border}`,
				background: status === "accepted" ? `${Z.gold}22` : "rgba(255,255,255,0.04)",
				color: status === "accepted" ? Z.gold : Z.muted,
				fontSize: compact ? 8 : 11,
				fontWeight: 600,
				cursor: "pointer",
				fontFamily: Z.font,
			}}
		>
			Will Help
		</button>
		<button
			type="button"
			onClick={onDecline}
			style={{
				flex: compact ? undefined : 1,
				padding: compact ? "4px 8px" : "8px 0",
				borderRadius: compact ? 6 : 8,
				border: `1px solid ${status === "declined" ? "#555" : Z.border}`,
				background: status === "declined" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.04)",
				color: status === "declined" ? Z.text : Z.muted,
				fontSize: compact ? 8 : 11,
				fontWeight: 600,
				cursor: "pointer",
				fontFamily: Z.font,
			}}
		>
			Declined
		</button>
	</div>
);

// ── Labels, icons & colors per type ──────────────────────────────────────────

// Each incident type maps to a clinical category colour.
// These drive the marker centre and sidebar icon — separate from the status ring.
const TYPE_COLOR: Record<IncidentType, string> = {
	"cardiac-arrest":       "#EF4444",
	"breathing-difficulty": "#F97316",
	"stroke":               "#7C3AED",
	"severe-bleeding":      "#DC2626",
	"seizure":              "#9333EA",
	"overdose":             "#0891B2",
	"drowning":             "#0284C7",
	"diabetic-emergency":   "#D97706",
	"choking":              "#EA580C",
	"anaphylaxis":          "#BE123C",
	"childbirth":           "#BE185D",
	"mental-health-crisis": "#4338CA",
	"language-barrier":     "#475569",
	"building-fire":        "#DC2626",
	"gas-leak":             "#B45309",
	"vehicle-fire":         "#EA580C",
	assault:                "#1D4ED8",
	robbery:                "#1E3A8A",
	"traffic-accident":     "#CA8A04",
	"suicide-attempt":      "#6366F1",
};

const TYPE_CODE: Record<IncidentType, string> = {
	"cardiac-arrest":       "CA",
	"breathing-difficulty": "BD",
	"stroke":               "ST",
	"severe-bleeding":      "SB",
	"seizure":              "SZ",
	"overdose":             "OD",
	"drowning":             "DR",
	"diabetic-emergency":   "DI",
	"choking":              "CK",
	"anaphylaxis":          "AX",
	"childbirth":           "CB",
	"mental-health-crisis": "MH",
	"language-barrier":     "LB",
	"building-fire":        "BF",
	"gas-leak":             "GL",
	"vehicle-fire":         "VF",
	assault:                "AS",
	robbery:                "RB",
	"traffic-accident":     "TA",
	"suicide-attempt":      "SA",
};

const STATUS_COLOR: Record<IncidentStatus, string> = {
	incoming:   "#EF4444",
	active:     "#F97316",
	dispatched: "#22C55E",
};

// Pulse speed signals urgency: incoming is faster than active.
const STATUS_PULSE: Record<IncidentStatus, string> = {
	incoming:   "1.5s",
	active:     "2.8s",
	dispatched: "none",
};

const SVC_ICON: Record<ServiceType, ReactNode> = {
	ambulance:     <Cross    size={13} color="white" strokeWidth={2.5} style={{ opacity: ICON_OPACITY }} />,
	police:        <Shield   size={13} color="white" strokeWidth={2.5} style={{ opacity: ICON_OPACITY }} />,
	"fire-engine": <Flame    size={13} color="white" strokeWidth={2.5} style={{ opacity: ICON_OPACITY }} />,
};

const SVC_LABEL: Record<ServiceType, string> = {
	ambulance:     "Ambulance",
	police:        "Police",
	"fire-engine": "Fire Truck",
};

const svcColor = (type: ServiceType): string => {
	if (type === "ambulance") return Z.ambulance;
	if (type === "police") return Z.police;
	if (type === "fire-engine") return Z.fire;
	const _: never = type;
	return _;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatElapsed = (epochMs: number): string => {
	const secs = Math.floor((Date.now() - epochMs) / 1000);
	if (secs < 60) return `${secs}s`;
	if (secs < 3600) return `${Math.floor(secs / 60)}m`;
	return `${Math.floor(secs / 3600)}h`;
};

const formatDuration = (secs: number): string =>
	secs < 90 ? `<1 min` : `${Math.round(secs / 60)} min`;

const formatDist = (m: number): string =>
	m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;

const allyInitials = (name: string): string =>
	name.replace(/^Dr\s+/, "").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

const shortIncidentId = (id: string): string => `#${id.replace(/-/g, "").slice(-4).toUpperCase()}`;

const avatarColor = (name: string): string => {
	const hues = [210, 160, 280, 30, 350, 190];
	let hash = 0;
	for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
	return `hsl(${hues[Math.abs(hash) % hues.length]}, 42%, 40%)`;
};

const AllyAvatar = ({ ally, size }: { ally: Ally; size: number }) =>
	ally.pictureUrl ? (
		<img
			src={ally.pictureUrl}
			alt=""
			style={{
				width: size,
				height: size,
				borderRadius: "50%",
				objectFit: "cover",
				flexShrink: 0,
			}}
		/>
	) : (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: "50%",
				background: avatarColor(ally.name),
				color: "#fff",
				fontSize: size * 0.32,
				fontWeight: 700,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flexShrink: 0,
			}}
		>
			{allyInitials(ally.name)}
		</div>
	);

const formatEtaDuration = (totalSeconds: number): string => {
	const secs = Math.max(0, Math.round(totalSeconds));
	const min = Math.floor(secs / 60);
	const sec = secs % 60;
	return `${min}:${sec.toString().padStart(2, "0")}`;
};

const allyRoleLabel = (ally: Ally, certs: MatchedCert[]): string => {
	if (certs[0]) return certs[0].label;
	const cert = ally.certifications?.[0];
	if (cert) return cert.customLabel ?? CERTIFICATION_LABELS[cert.type];
	return "Responder";
};

const routeKey = (from: [number, number], to: [number, number], profile: string) =>
	`${from[0].toFixed(4)},${from[1].toFixed(4)};${to[0].toFixed(4)},${to[1].toFixed(4)};${profile};full`;

function haversineM([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]): number {
	const R = 6_371_000;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const isValidRouteGeometry = (
	route: RouteData,
	from: [number, number],
	to: [number, number],
): boolean => {
	if (route.coords.length < 2) return false;
	// a 2-point route over a real distance means Mapbox fell back to a straight line
	if (route.coords.length === 2 && haversineM(from, to) > 400) return false;
	return true;
};

async function fetchRoute(
	from: [number, number],
	to: [number, number],
	profile: "walking" | "driving",
	token: string,
): Promise<RouteData | null> {
	const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full&radiuses=unlimited;unlimited&access_token=${token}`;
	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		const json = (await res.json()) as {
			routes?: Array<{
				geometry: { coordinates: [number, number][] };
				distance: number;
				duration: number;
			}>;
		};
		const route = json.routes?.[0];
		if (!route) return null;
		const data = {
			coords: route.geometry.coordinates,
			distanceM: route.distance,
			durationS: route.duration,
		};
		if (!isValidRouteGeometry(data, from, to)) return null;
		return data;
	} catch {
		return null;
	}
}

const serviceRouteOrigins = (
	svc: EmergencyService,
	incident: [number, number],
): [number, number][] => {
	const incidentCoord = coordFromTuple(incident);
	return [
		tupleFromCoord(sanitizeServiceOrigin(coordFromTuple(svc.coords), incidentCoord, svc.type)),
	];
};

async function resolveServiceRoute(
	svc: EmergencyService,
	incident: [number, number],
	token: string,
): Promise<RouteData | null> {
	for (const from of serviceRouteOrigins(svc, incident)) {
		const key = routeKey(from, incident, "driving");
		const cached = routeCache.get(key);
		if (cached && isValidRouteGeometry(cached, from, incident)) return cached;
		const data = await fetchRoute(from, incident, "driving", token);
		if (!data) continue;
		routeCache.set(key, data);
		return data;
	}
	return null;
}

const nearestHotspotName = ([lng, lat]: [number, number]): string => {
	let best = HK_HOTSPOTS[0]!;
	let bestD = Infinity;
	for (const h of HK_HOTSPOTS) {
		const d = (h.lng - lng) ** 2 + (h.lat - lat) ** 2;
		if (d >= bestD) continue;
		bestD = d;
		best = h;
	}
	return best.name;
};

async function reverseGeocode([lng, lat]: [number, number], token: string): Promise<string | null> {
	try {
		const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,poi&limit=1&access_token=${token}`;
		const res = await fetch(url);
		const json = (await res.json()) as { features?: Array<{ place_name?: string; text?: string }> };
		const f = json.features?.[0];
		if (!f) return null;
		return (f.place_name ?? f.text ?? "").split(",").slice(0, 2).join(",").trim() || null;
	} catch {
		return null;
	}
}

function interpolateRoute(coords: [number, number][], t: number): [number, number] {
	if (coords.length < 2) return coords[0] ?? [0, 0];
	if (t <= 0) return coords[0];
	if (t >= 1) return coords[coords.length - 1];
	let totalLen = 0;
	const segLens: number[] = [];
	for (let i = 1; i < coords.length; i++) {
		const len = haversineM(coords[i - 1], coords[i]);
		segLens.push(len);
		totalLen += len;
	}
	if (totalLen <= 0) return coords[0];
	let acc = 0;
	const target = t * totalLen;
	for (let i = 0; i < segLens.length; i++) {
		if (acc + segLens[i] >= target) {
			const segT = (target - acc) / segLens[i];
			return [
				coords[i][0] + segT * (coords[i + 1][0] - coords[i][0]),
				coords[i][1] + segT * (coords[i + 1][1] - coords[i][1]),
			];
		}
		acc += segLens[i];
	}
	return coords[coords.length - 1];
}

const serviceMapPosition = (
	svc: EmergencyService,
	incidentCoords: [number, number],
	serviceRoutes: Record<string, RouteData>,
	serviceProgress: Record<string, number>,
): [number, number] => {
	const route = serviceRoutes[svc.id];
	const fallback = tupleFromCoord(
		sanitizeServiceOrigin(
			coordFromTuple(svc.coords),
			coordFromTuple(incidentCoords),
			svc.type,
		),
	);
	if (!route?.coords?.length) return fallback;
	return interpolateRoute(route.coords, serviceProgress[svc.id] ?? 0);
};

const buildRadiusGeoJSON = (
	[lng, lat]: [number, number],
	radiusKm: number,
): GeoJSON.Feature<GeoJSON.Polygon> => {
	const steps = 64;
	const coords = Array.from({ length: steps + 1 }, (_, i) => {
		const angle = ((i % steps) / steps) * 2 * Math.PI;
		return [
			lng + (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle),
			lat + (radiusKm / 111.32) * Math.cos(angle),
		] as [number, number];
	});
	return { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: {} };
};

// ── Module-level route cache ───────────────────────────────────────────────────
const routeCache = new Map<string, RouteData>();

// ── Components ────────────────────────────────────────────────────────────────

const AppHeader = ({ onAddIncident }: { onAddIncident: () => void }) => (
	<header
		style={{
			height: 52,
			flexShrink: 0,
			display: "flex",
			alignItems: "center",
			padding: "0 20px",
			background: "transparent",
			borderBottom: `1px solid ${Z.border}`,
			fontFamily: Z.font,
			zIndex: 20,
		}}
	>
		<img
			src="/logo.jpeg"
			alt="Soteria"
			style={{ height: 20, width: "auto", display: "block" }}
		/>

		<div
			style={{
				position: "absolute",
				left: "50%",
				transform: "translateX(-50%)",
				display: "flex",
				alignItems: "center",
				gap: 8,
			}}
			aria-label="Live data"
		>
			<div className="live-indicator-bulb" aria-hidden />
			<span
				style={{
					color: "#22C55E",
					fontSize: 10,
					fontWeight: 600,
					letterSpacing: "0.12em",
					textTransform: "uppercase",
				}}
			>
				Live
			</span>
		</div>

		<button
			type="button"
			onClick={onAddIncident}
			style={{
				marginLeft: "auto",
				display: "flex",
				alignItems: "center",
				gap: 8,
				background: Z.cardBg,
				border: `1px solid ${Z.border}`,
				color: Z.text,
				fontSize: 12,
				fontWeight: 600,
				padding: "8px 14px",
				borderRadius: Z.radius,
				cursor: "pointer",
				fontFamily: Z.font,
			}}
		>
			<Download size={14} style={{ opacity: ICON_OPACITY }} />
			Fetch incident
		</button>
	</header>
);

const ETA_SVC_TYPE: Record<ServiceType, string> = {
	ambulance: "Ambulance",
	police: "Police",
	"fire-engine": "Fire Department",
};

const ETA_SVC_ICON: Record<ServiceType, ReactNode> = {
	ambulance:     <Cross  size={22} color={Z.ambulance} strokeWidth={2.5} style={{ opacity: ICON_OPACITY }} />,
	police:        <Shield size={22} color={Z.police} strokeWidth={2} style={{ opacity: ICON_OPACITY }} />,
	"fire-engine": <Flame  size={22} color={Z.fire} strokeWidth={2.5} style={{ opacity: ICON_OPACITY }} />,
};

const FloatingStatusCards = ({
	services,
	selectedServiceId,
	onSelectService,
}: {
	services: EmergencyService[];
	selectedServiceId?: string | null;
	onSelectService: (serviceId: string) => void;
}) => (
	<div
		style={{
			display: "flex",
			gap: 12,
			marginBottom: 12,
			width: "100%",
			fontFamily: Z.font,
		}}
	>
		{services.map((svc) => {
			const color = svcColor(svc.type);
			const etaSec = computeRemainingEtaMinutes(svc) * 60;
			const etaColor = svc.type === "police" ? Z.police : svc.type === "ambulance" ? Z.ambulance : color;
			const selected = selectedServiceId === svc.id;
			return (
				<button
					key={svc.id}
					type="button"
					onClick={() => onSelectService(svc.id)}
					style={{
						flex: 1,
						display: "flex",
						alignItems: "center",
						gap: 16,
						minHeight: 64,
						background: selected ? "#323640" : "#2a2d35",
						borderRadius: 10,
						padding: "16px 18px",
						border: `1px solid ${selected ? etaColor + "88" : "transparent"}`,
						cursor: "pointer",
						fontFamily: Z.font,
						textAlign: "left",
					}}
				>
					<div
						style={{
							width: 36,
							height: 36,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
						}}
					>
						{ETA_SVC_ICON[svc.type]}
					</div>
					<span
						style={{
							color: Z.text,
							fontSize: 15,
							fontWeight: 500,
							whiteSpace: "nowrap",
							flexShrink: 0,
						}}
					>
						{ETA_SVC_TYPE[svc.type]}
					</span>
					<div
						style={{
							marginLeft: "auto",
							display: "flex",
							alignItems: "baseline",
							gap: 0,
							flexShrink: 0,
							fontSize: 19.8,
						}}
					>
						<span style={{ color: Z.text, fontWeight: 400, flexShrink: 0 }}>ETA :</span>
						<span
							style={{
								color: etaColor,
								fontWeight: 400,
								letterSpacing: "-0.02em",
								width: "5ch",
								textAlign: "right",
								fontVariantNumeric: "tabular-nums",
								flexShrink: 0,
							}}
						>
							{formatEtaDuration(etaSec)}
						</span>
					</div>
				</button>
			);
		})}
	</div>
);

const IncidentSidebar = ({
	incidents,
	selectedId,
	allyCountById,
	onSelect,
	onAddIncident,
}: {
	incidents: Incident[];
	selectedId: string | null;
	allyCountById: Map<string, number>;
	onSelect: (id: string) => void;
	onAddIncident: () => void;
}) => (
	<div
		style={{
			display: "none",
			position: "absolute",
			top: 0,
			left: 0,
			width: 272,
			height: "100%",
			background: "transparent",
			borderRight: `1px solid ${Z.border}`,
			backdropFilter: "blur(20px)",
			flexDirection: "column",
			zIndex: 10,
			fontFamily: Z.font,
		}}
	>
		{/* Header */}
		<div
			style={{
				padding: "14px 16px 12px",
				borderBottom: `1px solid ${Z.border}`,
				display: "flex",
				alignItems: "center",
			}}
		>
			<span
				style={{
					fontFamily: Z.fontHead,
					fontSize: 15,
					fontWeight: 900,
					color: Z.text,
					letterSpacing: "0.05em",
					textTransform: "uppercase",
				}}
			>
				Soteria
			</span>
			<span
				style={{
					marginLeft: "auto",
					display: "flex",
					alignItems: "center",
					gap: 5,
					color: "#22C55E",
					fontSize: 10,
					fontWeight: 600,
					letterSpacing: "0.08em",
					textTransform: "uppercase",
				}}
			>
				<span
					style={{
						width: 6,
						height: 6,
						borderRadius: "50%",
						background: "#22C55E",
						animation: "liveBlip 1.8s ease-in-out infinite",
						display: "inline-block",
					}}
				/>
				Live
			</span>
		</div>

		{/* Incidents count */}
		<div
			style={{
				padding: "7px 16px 5px",
				color: Z.muted,
				fontSize: 10,
				fontWeight: 600,
				letterSpacing: "0.1em",
				textTransform: "uppercase",
				display: "flex",
				alignItems: "center",
				gap: 6,
			}}
		>
			<span>Incidents</span>
			<span
				style={{
					background: STATUS_COLOR.incoming + "22",
					color: STATUS_COLOR.incoming,
					fontWeight: 700,
					fontSize: 9,
					padding: "1px 5px",
					borderRadius: 3,
				}}
			>
				{incidents.filter((i) => i.status === "incoming").length} incoming
			</span>
		</div>

		{/* List — sorted by status then age: incoming → active → dispatched */}
		<div style={{ flex: 1, overflowY: "auto" }}>
			{incidents.map((inc) => (
				<IncidentCard
					key={inc.id}
					incident={inc}
					selected={inc.id === selectedId}
					nearbyAllies={allyCountById.get(inc.id) ?? 0}
					onSelect={() => onSelect(inc.id)}
				/>
			))}
		</div>

		<div
			style={{
				padding: "10px 16px",
				borderTop: `1px solid ${Z.borderSubtle}`,
			}}
		>
			<button
				type="button"
				onClick={onAddIncident}
				style={{
					width: "100%",
					background: Z.secondary + "18",
					border: `1px solid ${Z.secondary}44`,
					color: Z.text,
					fontSize: 11,
					fontWeight: 700,
					padding: "9px 0",
					borderRadius: 5,
					cursor: "pointer",
					letterSpacing: "0.06em",
					textTransform: "uppercase",
					fontFamily: Z.font,
				}}
			>
				+ New incident
			</button>
		</div>

		<div
			style={{
				padding: "8px 16px",
				borderTop: `1px solid ${Z.borderSubtle}`,
				color: Z.muted,
				fontSize: 10,
				letterSpacing: "0.03em",
			}}
		>
			HK 999 Dispatch · Operator View
		</div>
	</div>
);

const IncidentCard = ({
	incident,
	selected,
	nearbyAllies,
	onSelect,
}: {
	incident: Incident;
	selected: boolean;
	nearbyAllies: number;
	onSelect: () => void;
}) => {
	const typeColor = TYPE_COLOR[incident.type];
	const statusColor = STATUS_COLOR[incident.status];
	const acceptedCount = Object.values(incident.allyStatuses).filter((s) => s === "accepted").length;
	return (
		<button
			type="button"
			onClick={onSelect}
			style={{
				width: "100%",
				background: selected ? "rgba(12, 57, 146, 0.12)" : "transparent",
				border: "none",
				borderLeft: selected ? `2.5px solid ${Z.secondary}` : "2.5px solid transparent",
				borderBottom: `1px solid ${Z.borderSubtle}`,
				padding: "10px 16px 10px 13px",
				cursor: "pointer",
				textAlign: "left",
				display: "flex",
				alignItems: "flex-start",
				gap: 10,
			}}
		>
			{/* Type icon — uses type colour, not status colour */}
			<div
				style={{
					width: 32,
					height: 32,
					borderRadius: 6,
					background: typeColor + "20",
					border: `1px solid ${typeColor}50`,
					flexShrink: 0,
					marginTop: 1,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 1,
				}}
			>
				<span
					style={{
						color: typeColor,
						fontSize: 7,
						fontWeight: 800,
						letterSpacing: "-0.3px",
						lineHeight: 1,
					}}
				>
					{TYPE_CODE[incident.type]}
				</span>
			</div>

			<div style={{ flex: 1, minWidth: 0 }}>
				{/* Type + status */}
				<div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
					<span style={{ color: Z.text, fontSize: 12, fontWeight: 600 }}>
						{TYPE_LABEL[incident.type]}
					</span>
					<span
						style={{
							background: statusColor + "22",
							color: statusColor,
							fontSize: 9,
							fontWeight: 700,
							padding: "1px 5px",
							borderRadius: 3,
							textTransform: "uppercase",
							letterSpacing: "0.08em",
							flexShrink: 0,
						}}
					>
						{incident.status}
					</span>
					{incident.handled && (
						<span
							style={{
								background: "#22C55E22",
								color: "#22C55E",
								fontSize: 9,
								fontWeight: 700,
								padding: "1px 5px",
								borderRadius: 3,
								textTransform: "uppercase",
								letterSpacing: "0.08em",
								flexShrink: 0,
							}}
						>
							done
						</span>
					)}
				</div>

				{/* Address */}
				<div
					style={{
						color: Z.muted,
						fontSize: 11,
						lineHeight: 1.4,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{incident.address}
				</div>

				{/* Meta row: elapsed · allies · phone */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 5,
						marginTop: 3,
						color: Z.muted,
						fontSize: 10,
					}}
				>
					<span
						style={{
							color: incident.status === "incoming" ? STATUS_COLOR.incoming : Z.muted,
							fontWeight: incident.status === "incoming" ? 600 : 400,
						}}
					>
						{formatElapsed(incident.receivedAt)} ago
					</span>
					<span style={{ opacity: 0.35 }}>·</span>
					<span
						style={{
							color: acceptedCount > 0 ? Z.gold : Z.muted,
							fontWeight: acceptedCount > 0 ? 600 : 400,
						}}
					>
						{acceptedCount} accepted
					</span>
					<span style={{ opacity: 0.35 }}>·</span>
					<span style={{ color: nearbyAllies > 0 ? Z.secondary : Z.muted }}>
						{nearbyAllies} nearby
					</span>
				</div>
			</div>
		</button>
	);
};

const IncidentMarker = ({
	incident,
	selected,
	dimmed,
	interactive,
	onClick,
}: {
	incident: Incident;
	selected: boolean;
	dimmed: boolean;
	interactive: boolean;
	onClick: () => void;
}) => {
	const typeColor = TYPE_COLOR[incident.type];
	const statusColor = STATUS_COLOR[incident.status];
	const pulseDuration = STATUS_PULSE[incident.status];
	const showPulse = pulseDuration !== "none" && !incident.handled;
	// keep the selected incident clickable so its panel can still be toggled closed
	const clickable = interactive || selected;
	const opacity = selected
		? 1
		: incident.handled
			? 0.1
			: !interactive
				? 0.3
				: dimmed
					? 0.35
					: 1;
	return (
		<Marker longitude={incident.coords[0]} latitude={incident.coords[1]} anchor="center">
			<button
				type="button"
				onClick={clickable ? onClick : undefined}
				disabled={!clickable}
				style={{
					background: "none",
					border: "none",
					padding: 0,
					cursor: clickable ? "pointer" : "default",
					pointerEvents: clickable ? "auto" : "none",
					width: 54,
					height: 54,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
					opacity,
					transition: "opacity 0.2s",
				}}
				aria-label={`${TYPE_LABEL[incident.type]} incident`}
			>
				{/* Status-coloured pulsing rings — speed varies by urgency */}
				{showPulse && (
					<>
						<span
							style={{
								position: "absolute",
								inset: 0,
								borderRadius: "50%",
								border: `1.5px solid ${statusColor}`,
								animation: `pulseRing ${pulseDuration} cubic-bezier(0.215, 0.61, 0.355, 1) infinite`,
							}}
						/>
						<span
							style={{
								position: "absolute",
								inset: 0,
								borderRadius: "50%",
								border: `1.5px solid ${statusColor}`,
								animation: `pulseRing ${pulseDuration} cubic-bezier(0.215, 0.61, 0.355, 1) infinite`,
								animationDelay: `${parseFloat(pulseDuration) * 0.5}s`,
							}}
						/>
					</>
				)}

				<span
					style={{
						position: "relative",
						zIndex: 1,
						minWidth: 28,
						height: 28,
						borderRadius: "50%",
						background: selected ? Z.primary : typeColor,
						color: "#fff",
						fontSize: 8,
						fontWeight: 800,
						fontFamily: Z.font,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: "0 4px",
						outline: selected ? `2px solid #fff` : "none",
						outlineOffset: 2,
						boxShadow: selected
							? `0 0 24px ${Z.primary}90, 0 0 8px ${Z.primary}`
							: `0 0 10px ${typeColor}60`,
					}}
				>
					{shortIncidentId(incident.id).replace("#", "")}
				</span>
			</button>
		</Marker>
	);
};

const AllyMarker = ({
	ally,
	rank,
	response,
	active,
	onClick,
}: {
	ally: Ally;
	rank: number;
	response?: AllyResponseStatus;
	active: boolean;
	onClick: () => void;
}) => {
	const size = rank === 0 ? 28 : rank === 1 ? 22 : 18;
	const starSize = rank === 0 ? 22 : rank === 1 ? 17 : 14;
	const pinColor = response === "accepted" ? Z.gold : response === "declined" ? "#000" : "#32a832";
	const pinStroke = response === "accepted" ? Z.gold : response === "declined" ? "#333" : "#4ade4a";
	const rankOpacity = active || rank === 0 ? 1 : rank === 1 ? 0.75 : 0.5;
	return (
		<Marker
			longitude={ally.coords[0]}
			latitude={ally.coords[1]}
			anchor="center"
			style={{ zIndex: active ? 11 : 1 }}
		>
			<div
				title={ally.name}
				onClick={(e) => {
					e.stopPropagation();
					onClick();
				}}
				style={{
					width: size,
					height: size,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					cursor: "pointer",
					opacity: response === "declined" ? 0.5 : rankOpacity,
					animation: rank === 0 && response !== "declined" ? "starPulse 2s ease-in-out infinite" : "none",
					filter: response === "accepted"
						? `drop-shadow(0 0 10px ${Z.gold})`
						: response === "declined"
							? undefined
							: active
								? "drop-shadow(0 0 8px #4ade4a)"
								: undefined,
				}}
			>
				<Star
					size={starSize}
					fill={pinColor}
					color={pinStroke}
					strokeWidth={1.5}
					style={{ opacity: ICON_OPACITY }}
				/>
			</div>
		</Marker>
	);
};

const VEHICLE_SVC_ICON: Record<ServiceType, ReactNode> = {
	ambulance:     <Cross    size={14} color="#000" strokeWidth={2.5} style={{ opacity: ICON_OPACITY }} />,
	police:        <Shield   size={14} color="#000" strokeWidth={2} style={{ opacity: ICON_OPACITY }} />,
	"fire-engine": <Flame    size={14} color="#000" strokeWidth={2.5} style={{ opacity: ICON_OPACITY }} />,
};

const VehicleMarker = ({ svc, pos }: { svc: EmergencyService; pos: [number, number] }) => {
	const [infoOpen, setInfoOpen] = useState(false);
	const color = svc.type === "police" ? Z.secondary : svc.type === "ambulance" ? "#fff" : svcColor(svc.type);
	const bg = svc.type === "ambulance" ? "rgba(255,255,255,0.95)" : color;
	return (
		<Marker longitude={pos[0]} latitude={pos[1]} anchor="center">
			<div style={{ position: "relative", pointerEvents: "auto" }}>
				{infoOpen && (
					<div
						style={{
							position: "absolute",
							bottom: "calc(100% + 8px)",
							left: "50%",
							transform: "translateX(-50%)",
							minWidth: 100,
							background: Z.cardBg,
							border: `1px solid ${Z.border}`,
							borderRadius: 8,
							padding: "8px 10px",
							boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
							fontFamily: Z.font,
							whiteSpace: "nowrap",
							zIndex: 2,
						}}
					>
						<div style={{ color: Z.muted, fontSize: 10, fontWeight: 500 }}>
							{SVC_LABEL[svc.type]}
						</div>
						<div style={{ color: Z.text, fontSize: 12, fontWeight: 400, marginTop: 2 }}>
							{svc.callsign}
						</div>
					</div>
				)}
				<button
					type="button"
					onClick={() => setInfoOpen((open) => !open)}
					aria-label={`${SVC_LABEL[svc.type]} ${svc.callsign}`}
					style={{
						width: 32,
						height: 32,
						borderRadius: "50%",
						background: bg,
						border: `2px solid ${svc.type === "ambulance" ? "#fff" : color}`,
						boxShadow: `0 0 16px ${color}80, 0 2px 8px rgba(0,0,0,0.5)`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontFamily: Z.font,
						cursor: "pointer",
						padding: 0,
					}}
				>
					{VEHICLE_SVC_ICON[svc.type]}
				</button>
			</div>
		</Marker>
	);
};

// Fixed source/layer IDs — only data updates when the selected incident changes.
const RouteLayer = ({
	allies,
	allyRoutes,
	services,
	serviceRoutes,
	showVehicleRoutes,
	incident,
	allyStatuses,
}: {
	allies: Ally[];
	allyRoutes: Record<string, RouteData>;
	services: EmergencyService[];
	serviceRoutes: Record<string, RouteData>;
	showVehicleRoutes: boolean;
	incident: Incident;
	allyStatuses: Partial<Record<string, AllyResponseStatus>>;
}) => {
	const data = useMemo(
		(): GeoJSON.FeatureCollection => ({
			type: "FeatureCollection",
			features: [
				...allies.flatMap((ally, rank) => {
					const coords = allyRoutes[ally.id]?.coords;
					if (!coords || coords.length < 2) return [];
					return [
						{
							type: "Feature" as const,
							geometry: { type: "LineString" as const, coordinates: coords },
							properties: {
								routeType: "ally",
								rank,
								response: allyResponseCode(allyStatuses[ally.id]),
							},
						},
					];
				}),
				...(showVehicleRoutes
					? services.flatMap((svc) => {
							const coords = serviceRoutes[svc.id]?.coords;
							if (!coords || coords.length < 2) return [];
							return [
								{
									type: "Feature" as const,
									geometry: { type: "LineString" as const, coordinates: coords },
									properties: { routeType: "service", svcType: svc.type },
								},
							];
						})
					: []),
			],
		}),
		[allies, allyRoutes, services, serviceRoutes, showVehicleRoutes],
	);

	const allyLineWidth = 2;
	const topAllyLineWidth = allyLineWidth * 1.15;
	const allyRouteColor: mapboxgl.Expression = [
		"case",
		["==", ["get", "response"], 1], Z.gold,
		["==", ["get", "response"], 2], "#000000",
		Z.green,
	];
	const allyRouteOpacity: mapboxgl.Expression = [
		"case",
		["==", ["get", "response"], 2], 0.5,
		["==", ["get", "rank"], 0], 0.95,
		["==", ["get", "rank"], 1], 0.7,
		0.45,
	];

	return (
		<Source id="sel-routes" type="geojson" data={data}>
			<Layer
				id="sel-ally-routes-glow"
				type="line"
				filter={["all", ["==", ["get", "routeType"], "ally"], ["==", ["get", "rank"], 0]]}
				layout={{ "line-join": "round", "line-cap": "round" }}
				paint={{
					"line-color": allyRouteColor,
					"line-width": topAllyLineWidth + 4,
					"line-blur": 8,
					"line-opacity": [
						"case",
						["==", ["get", "response"], 2], 0.25,
						0.45,
					],
					"line-dasharray": [2, 2],
				}}
			/>
			<Layer
				id="sel-ally-routes"
				type="line"
				filter={["==", ["get", "routeType"], "ally"]}
				layout={{ "line-join": "round", "line-cap": "round" }}
				paint={{
					"line-color": allyRouteColor,
					"line-width": ["case", ["==", ["get", "rank"], 0], topAllyLineWidth, allyLineWidth],
					"line-dasharray": [2, 2],
					"line-opacity": allyRouteOpacity,
				}}
			/>
			<Layer
				id="sel-svc-routes"
				type="line"
				filter={["==", ["get", "routeType"], "service"]}
				layout={{ "line-join": "round", "line-cap": "round" }}
				paint={{
					"line-color": [
						"match", ["get", "svcType"],
						"ambulance", "#ffffff",
						"police", Z.secondary,
						"fire-engine", Z.fire,
						"#888",
					],
					"line-width": 2.5,
					"line-opacity": 0.8,
				}}
			/>
		</Source>
	);
};

const RadiusCircle = ({ coords }: { coords: [number, number] }) => (
	<>
		<Source id="sel-radius-outer" type="geojson" data={buildRadiusGeoJSON(coords, 0.8)}>
			<Layer
				id="sel-radius-outer-fill"
				type="fill"
				paint={{ "fill-color": Z.primary, "fill-opacity": 0.18 }}
			/>
		</Source>
		<Source id="sel-radius" type="geojson" data={buildRadiusGeoJSON(coords, 0.35)}>
			<Layer
				id="sel-radius-fill"
				type="fill"
				paint={{ "fill-color": Z.primary, "fill-opacity": 0.35 }}
			/>
			<Layer
				id="sel-radius-line"
				type="line"
				paint={{
					"line-color": Z.primary,
					"line-width": 1.5,
					"line-opacity": 0.5,
				}}
			/>
		</Source>
	</>
);

const VehicleRoutesToggle = ({
	on,
	onToggle,
}: {
	on: boolean;
	onToggle: () => void;
}) => (
	<button
		type="button"
		onClick={onToggle}
		aria-pressed={on}
		aria-label={on ? "Hide vehicle routes" : "Show vehicle routes"}
		style={{
			display: "flex",
			alignItems: "center",
			gap: 8,
			padding: "7px 11px",
			background: Z.cardBg,
			border: `1px solid ${on ? `${Z.secondary}66` : Z.border}`,
			borderRadius: 8,
			color: on ? Z.text : Z.muted,
			fontSize: 11,
			fontWeight: 600,
			cursor: "pointer",
			fontFamily: Z.font,
			boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
		}}
	>
		<span
			style={{
				width: 30,
				height: 16,
				borderRadius: 999,
				background: on ? Z.secondary : "rgba(255,255,255,0.12)",
				position: "relative",
				flexShrink: 0,
				transition: "background 0.2s",
			}}
		>
			<span
				style={{
					position: "absolute",
					top: 2,
					left: on ? 16 : 2,
					width: 12,
					height: 12,
					borderRadius: "50%",
					background: "#fff",
					transition: "left 0.2s",
				}}
			/>
		</span>
		Vehicle routes
	</button>
);

// static on-foot ETA: actual walking-route distance ÷ 8 km/h
const WALK_KMH = 8;
const walkEtaMinutes = (distanceM: number) => (distanceM / 1000 / WALK_KMH) * 60;

const allServicesArrived = (incident: Incident, now = Date.now()) =>
	incident.emergencyServices.length > 0 &&
	incident.emergencyServices.every((svc) => computeServiceProgress(svc, now) >= 1);

// "closed" = manually marked done, or every responding vehicle has arrived
const isIncidentClosed = (incident: Incident, now = Date.now()) =>
	incident.handled || allServicesArrived(incident, now);

// Only incidents pulled up via the Fetch button (operator source) are clickable, and only
// while still open. Seed/CAD incidents and closed incidents are greyed out and not selectable.
const isIncidentInteractive = (incident: Incident, now = Date.now()) =>
	incident.source === "operator" && !isIncidentClosed(incident, now);

type MapPopupAnchor =
	| "center"
	| "top"
	| "bottom"
	| "left"
	| "right"
	| "top-left"
	| "top-right"
	| "bottom-left"
	| "bottom-right";

// gap from the star to the card edge; > star radius so the star never touches the card
const POPUP_GAP = 28;

// Simple rule: the card sits directly above or below the star, on the side away from the
// incident. Compared in SCREEN space (map.project) so "above/below" is correct under pitch/bearing.
const allyPopupPlacement = (
	allyPt: { x: number; y: number },
	incidentPt: { x: number; y: number },
): { anchor: MapPopupAnchor; offset: [number, number] } =>
	incidentPt.y > allyPt.y
		? { anchor: "bottom", offset: [0, -POPUP_GAP] } // incident is lower → card above the star
		: { anchor: "top", offset: [0, POPUP_GAP] }; // incident is higher → card below the star

const AllyCallDock = ({
	ally,
	phase,
	callStartedAt,
	response,
	onEndCall,
	onAccept,
	onDecline,
}: {
	ally: Ally;
	phase: Exclude<CallPhase, "ready">;
	callStartedAt: number | null;
	response?: AllyResponseStatus;
	onEndCall: () => void;
	onAccept: () => void;
	onDecline: () => void;
}) => {
	const cardStyle: CSSProperties = {
		background: Z.cardBg,
		border: `1px solid ${Z.border}`,
		borderRadius: Z.radius,
		padding: "16px 18px",
		width: "100%",
		pointerEvents: "auto",
		animation: "slideInUp 0.18s ease-out",
		boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
		fontFamily: Z.font,
	};

	if (phase === "calling") {
		return (
			<div style={cardStyle}>
				<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<span
						style={{
							width: 6,
							height: 6,
							borderRadius: "50%",
							background: Z.green,
							animation: "liveBlip 1.2s ease infinite",
						}}
					/>
					<span style={{ color: Z.text, fontSize: 13, fontWeight: 600 }}>Calling…</span>
				</div>
				<div style={{ color: Z.text, fontSize: 15, fontWeight: 400 }}>{ally.name}</div>
				<div style={{ color: Z.muted, fontSize: 11, marginTop: 4 }}>{formatPhoneDisplay(ally.phone)}</div>
			</div>
		);
	}

	if (phase === "in-call") {
		return (
			<div style={{ ...cardStyle, borderColor: `${Z.green}44` }}>
				<div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
							<span
								style={{
									width: 6,
									height: 6,
									borderRadius: "50%",
									background: Z.green,
									animation: "liveBlip 1.2s ease infinite",
								}}
							/>
							<span style={{ color: Z.green, fontSize: 13, fontWeight: 600 }}>In call</span>
							{callStartedAt && (
								<span style={{ color: Z.muted, fontSize: 11 }}>· {formatElapsed(callStartedAt)}</span>
							)}
						</div>
						<div style={{ color: Z.text, fontSize: 15, fontWeight: 400 }}>{ally.name}</div>
						<div style={{ color: Z.muted, fontSize: 11, marginTop: 4 }}>{formatPhoneDisplay(ally.phone)}</div>
					</div>
					<button
						type="button"
						onClick={onEndCall}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							background: "rgba(236, 0, 22, 0.12)",
							color: Z.primary,
							fontSize: 12,
							fontWeight: 600,
							padding: "8px 12px",
							borderRadius: 8,
							border: "1px solid rgba(236, 0, 22, 0.25)",
							cursor: "pointer",
							flexShrink: 0,
							fontFamily: Z.font,
						}}
					>
						<PhoneOff size={14} style={{ opacity: ICON_OPACITY }} />
						End call
					</button>
				</div>
			</div>
		);
	}

	return (
		<div style={cardStyle}>
			<div style={{ color: Z.muted, fontSize: 11, marginBottom: 10 }}>How did the call go?</div>
			<div style={{ color: Z.text, fontSize: 14, fontWeight: 400, marginBottom: 12 }}>
				{ally.name}
				<span style={{ color: Z.muted }}> · {formatPhoneDisplay(ally.phone)}</span>
			</div>
			<AllyResponseButtons status={response} onAccept={onAccept} onDecline={onDecline} />
		</div>
	);
};

const AllyMapPopup = ({
	ally,
	incidentCoords,
	matchedCerts,
	walkEtaMin,
	callBusy,
	onCall,
}: {
	ally: Ally;
	incidentCoords: [number, number];
	matchedCerts: MatchedCert[];
	walkEtaMin: number | null;
	callBusy: boolean;
	onCall: () => void;
}) => {
	const { current: map } = useMap();
	const { anchor, offset } = map
		? allyPopupPlacement(map.project(ally.coords), map.project(incidentCoords))
		: { anchor: "left" as MapPopupAnchor, offset: [POPUP_GAP, 0] as [number, number] };
	return (
	// key on anchor: react-map-gl doesn't reliably re-apply a Marker's anchor after mount,
	// so when the side flips we remount to keep anchor+offset consistent (no overlap on the star)
	<Marker
		key={anchor}
		longitude={ally.coords[0]}
		latitude={ally.coords[1]}
		anchor={anchor}
		offset={offset}
		style={{ zIndex: 10 }}
	>
		<div
			style={{
				width: 220,
				background: Z.cardBg,
				border: `1px solid ${Z.border}`,
				borderRadius: Z.radius,
				padding: "14px 14px 12px",
				boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
				fontFamily: Z.font,
				pointerEvents: "auto",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
				<AllyAvatar ally={ally} size={44} />
				<div style={{ minWidth: 0 }}>
					<div style={{ color: Z.text, fontSize: 14, fontWeight: 400 }}>{ally.name}</div>
					<div style={{ color: Z.muted, fontSize: 11, marginTop: 2 }}>
						{allyRoleLabel(ally, matchedCerts)}
					</div>
				</div>
			</div>
			{walkEtaMin !== null && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						color: Z.text,
						fontSize: 12,
						fontWeight: 600,
						marginBottom: 12,
					}}
				>
					<Footprints size={13} color={Z.muted} style={{ opacity: ICON_OPACITY }} />
					<span>~{walkEtaMin} min on foot</span>
				</div>
			)}
			{matchedCerts.length > 0 && (
				<ul
					style={{
						margin: "0 0 12px",
						padding: "0 0 0 16px",
						color: Z.muted,
						fontSize: 11,
						lineHeight: 1.6,
					}}
				>
					{matchedCerts.slice(0, 4).map((cert) => (
						<li key={cert.type + cert.label}>{cert.label}</li>
					))}
				</ul>
			)}
			<button
				type="button"
				disabled={callBusy}
				onClick={onCall}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 8,
					width: "100%",
					background: callBusy ? "rgba(50, 168, 50, 0.35)" : Z.green,
					color: "#fff",
					fontSize: 13,
					fontWeight: 700,
					padding: "10px 0",
					borderRadius: 8,
					border: "none",
					cursor: callBusy ? "default" : "pointer",
					fontFamily: Z.font,
				}}
			>
				<Phone size={14} style={{ opacity: ICON_OPACITY }} />
				Call
			</button>
		</div>
	</Marker>
	);
};

const IncidentDetailRow = ({
	icon,
	children,
}: {
	icon: ReactNode;
	children: ReactNode;
}) => (
	<div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
		<span style={{ color: Z.muted, flexShrink: 0, marginTop: 1, opacity: ICON_OPACITY }}>{icon}</span>
		<span style={{ color: Z.muted, fontSize: 12, lineHeight: 1.5 }}>{children}</span>
	</div>
);

const AllyPanel = ({
	incident,
	rankedAllies,
	allyRoutes,
	serviceRoutes: _serviceRoutes,
	serviceProgress: _serviceProgress,
	incidentClosed,
	focusedAllyId,
	activeAllyId,
	callBusy,
	closing,
	onClose,
	onFocusAlly,
	onCallAlly,
	onSetHandled,
}: {
	incident: Incident;
	rankedAllies: RankedAlly[];
	allyRoutes: Record<string, RouteData>;
	serviceRoutes: Record<string, RouteData>;
	serviceProgress: Record<string, number>;
	incidentClosed: boolean;
	focusedAllyId: string | null;
	activeAllyId: string | null;
	callBusy: boolean;
	closing: boolean;
	onClose: () => void;
	onFocusAlly: (allyId: string) => void;
	onCallAlly: (allyId: string) => void;
	onSetHandled: (handled: boolean) => void;
}) => {
	const typeColor = TYPE_COLOR[incident.type];
	const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

	useEffect(() => {
		if (!activeAllyId) return;
		cardRefs.current[activeAllyId]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
	}, [activeAllyId]);

	return (
		<aside
			style={{
				width: "100%",
				minWidth: 300,
				height: "100%",
				background: "transparent",
				display: "flex",
				flexDirection: "column",
				fontFamily: Z.font,
				transform: closing ? "translateX(12%)" : "translateX(0)",
				opacity: closing ? 0 : 1,
				transition: `transform ${PANEL_CLOSE_MS}ms ${PANEL_EASE}, opacity ${PANEL_CLOSE_MS}ms ${PANEL_EASE}`,
				animation: closing ? undefined : `slideInRight ${PANEL_CLOSE_MS}ms ${PANEL_EASE}`,
			}}
		>
			<div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
				<div
					style={{
						background: Z.cardBg,
						border: `1px solid ${Z.border}`,
						borderRadius: Z.radius,
						padding: "16px 14px",
						marginBottom: 14,
					}}
				>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
						<span style={{ color: Z.text, fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
							{TYPE_LABEL[incident.type]}
						</span>
						<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<span style={{ color: Z.muted, fontSize: 13, fontWeight: 600 }}>
								{shortIncidentId(incident.id)}
							</span>
							<button
								type="button"
								onClick={onClose}
								style={{
									background: "none",
									border: "none",
									color: Z.muted,
									cursor: "pointer",
									fontSize: 16,
									padding: 0,
									lineHeight: 1,
								}}
								aria-label="Close"
							>
								×
							</button>
						</div>
					</div>

					<IncidentDetailRow icon={<MapPin size={14} />}>{incident.address}</IncidentDetailRow>
					<IncidentDetailRow icon={<User size={14} />}>
						<span style={{ fontWeight: 400 }}>{incident.callerPhone}</span>
					</IncidentDetailRow>
					<IncidentDetailRow icon={<Cross size={14} color={typeColor} />}>
						{TYPE_LABEL[incident.type]} — {formatElapsed(incident.receivedAt)} ago
					</IncidentDetailRow>

					<button
						type="button"
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							background: "none",
							border: "none",
							color: Z.muted,
							fontSize: 11,
							cursor: "pointer",
							padding: 0,
							marginTop: 4,
							fontFamily: Z.font,
						}}
					>
						<Download size={12} style={{ opacity: ICON_OPACITY }} />
						Conversation transcript
					</button>

					<button
						type="button"
						disabled={incidentClosed}
						onClick={() => {
							if (incidentClosed) return;
							onSetHandled(!incident.handled);
						}}
						style={{
							width: "100%",
							marginTop: 12,
							background: incidentClosed
								? `${Z.gold}22`
								: incident.handled
									? "rgba(50, 168, 50, 0.15)"
									: "rgba(255,255,255,0.04)",
							border: `1px solid ${incidentClosed ? Z.gold + "66" : incident.handled ? Z.green + "44" : Z.border}`,
							color: incidentClosed ? Z.gold : incident.handled ? Z.green : Z.muted,
							fontSize: 10,
							fontWeight: 600,
							padding: "7px 0",
							borderRadius: 8,
							cursor: incidentClosed ? "default" : "pointer",
							textTransform: "uppercase",
							letterSpacing: "0.06em",
							opacity: incidentClosed ? 1 : undefined,
						}}
					>
						{incidentClosed ? "Incident Closed" : incident.handled ? "Reopen incident" : "Mark done"}
					</button>
				</div>

				{rankedAllies.length === 0 ? (
					<div style={{ color: Z.muted, fontSize: 12, padding: "8px 4px", lineHeight: 1.5 }}>
						No allies within 10 km walking distance
					</div>
				) : (
					rankedAllies.map((ranked) => (
						<AllyResponderCard
							key={ranked.ally.id}
							cardRef={(el) => { cardRefs.current[ranked.ally.id] = el; }}
							ally={ranked.ally}
							route={allyRoutes[ranked.ally.id]}
							matchedCerts={ranked.matchedCerts}
							response={incident.allyStatuses[ranked.ally.id]}
							active={focusedAllyId === ranked.ally.id}
							callBusy={callBusy}
							onFocus={() => onFocusAlly(ranked.ally.id)}
							onCall={() => onCallAlly(ranked.ally.id)}
						/>
					))
				)}
			</div>

			<div
				style={{
					padding: "12px 14px 16px",
					borderTop: `1px solid ${Z.borderSubtle}`,
				}}
			>
				<button
					type="button"
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						background: "none",
						border: "none",
						color: Z.muted,
						fontSize: 11,
						cursor: "pointer",
						padding: 0,
						fontFamily: Z.font,
					}}
				>
					<Download size={12} style={{ opacity: ICON_OPACITY }} />
					Load more
				</button>
			</div>
		</aside>
	);
};

const AllyResponderCard = ({
	cardRef,
	ally,
	route,
	matchedCerts,
	response,
	active,
	callBusy,
	onFocus,
	onCall,
}: {
	cardRef?: (el: HTMLDivElement | null) => void;
	ally: Ally;
	route?: RouteData;
	matchedCerts: MatchedCert[];
	response?: AllyResponseStatus;
	active: boolean;
	callBusy: boolean;
	onFocus: () => void;
	onCall: () => void;
}) => {
	const borderColor = !active ? Z.border : response === "accepted" ? `${Z.gold}44` : response === "declined" ? "#333" : Z.border;
	const nameColor = !active ? Z.text : response === "accepted" ? Z.gold : response === "declined" ? Z.muted : Z.text;
	return (
		<div
			ref={cardRef}
			role="button"
			tabIndex={0}
			onClick={onFocus}
			onKeyDown={(e) => {
				if (e.key !== "Enter" && e.key !== " ") return;
				e.preventDefault();
				onFocus();
			}}
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 8,
				background: active ? "rgba(50, 168, 50, 0.1)" : Z.cardBg,
				border: `1px solid ${active ? Z.green + "66" : borderColor}`,
				borderLeft: active ? `3px solid ${Z.green}` : undefined,
				borderRadius: Z.radius,
				padding: "12px 12px",
				marginBottom: 8,
				opacity: active && response === "declined" ? 0.85 : 1,
				boxShadow: active ? `0 0 14px ${Z.green}28` : undefined,
				transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
				cursor: "pointer",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
				<AllyAvatar ally={ally} size={40} />
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
						<span
							style={{
								color: nameColor,
								fontSize: 13,
								fontWeight: 400,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
								flex: 1,
								minWidth: 0,
							}}
						>
							{ally.name}
						</span>
						{route && (
							<span
								style={{
									display: "flex",
									alignItems: "center",
									gap: 3,
									flexShrink: 0,
									color: Z.muted,
									fontSize: 11,
									fontWeight: 600,
								}}
							>
								<Footprints size={11} style={{ opacity: ICON_OPACITY }} />
								{Math.ceil(walkEtaMinutes(route.distanceM))} mins away
							</span>
						)}
					</div>
					{active && (
						<div style={{ color: Z.muted, fontSize: 11, marginTop: 2 }}>
							{allyRoleLabel(ally, matchedCerts)}
						</div>
					)}
					<div style={{ color: Z.muted, fontSize: 10, marginTop: 3, lineHeight: 1.4 }}>
						{matchedCerts.length > 0
							? matchedCerts.slice(0, 3).map((c) => c.label).join(" · ")
							: route
								? `${formatDuration(route.durationS)} · ${formatDist(route.distanceM)}`
								: "Loading route…"}
					</div>
				</div>
				<button
					type="button"
					disabled={callBusy}
					onClick={(e) => {
						e.stopPropagation();
						onCall();
					}}
					style={{
						width: 40,
						height: 40,
						borderRadius: 8,
						background: callBusy ? "rgba(50, 168, 50, 0.35)" : Z.green,
						color: "#fff",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						border: "none",
						cursor: callBusy ? "default" : "pointer",
						boxShadow: callBusy ? "none" : `0 2px 8px ${Z.green}40`,
						flexShrink: 0,
					}}
					aria-label={`Call ${ally.name}`}
				>
					<Phone size={16} style={{ opacity: ICON_OPACITY }} />
				</button>
			</div>
		</div>
	);
};

// ── Root ──────────────────────────────────────────────────────────────────────

export const SoteriaMap = () => {
	const mapRef = useRef<MapRef>(null);
	const selectedIdRef = useRef<string | null>(null);
	const allyPool = useMemo(() => getAllyPool(), []);
	const [incidents, setIncidents] = useState<Incident[]>(() =>
		mergeIncidents(getSeedIncidents(), loadPersistedState()),
	);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [panelClosing, setPanelClosing] = useState(false);
	const [activeAllyId, setActiveAllyId] = useState<string | null>(null);
	const [allyRoutes, setAllyRoutes] = useState<Record<string, RouteData>>({});
	const [rankedAllies, setRankedAllies] = useState<RankedAlly[]>([]);
	const [serviceRoutes, setServiceRoutes] = useState<Record<string, RouteData>>({});
	const [serviceProgress, setServiceProgress] = useState<Record<string, number>>({});
	const [, setTick] = useState(0);
	const [callPhase, setCallPhase] = useState<CallPhase>("ready");
	const [callAllyId, setCallAllyId] = useState<string | null>(null);
	const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
	const [focusedServiceId, setFocusedServiceId] = useState<string | null>(null);
	const [showVehicleRoutes, setShowVehicleRoutes] = useState(false);
	const dialAbortRef = useRef<AbortController | null>(null);

	const resetCallFlow = useCallback(() => {
		dialAbortRef.current?.abort();
		dialAbortRef.current = null;
		setCallPhase("ready");
		setCallAllyId(null);
		setCallStartedAt(null);
	}, []);

	useEffect(() => {
		savePersistedState(incidents);
	}, [incidents]);

	const sortedIncidents = useMemo(
		() =>
			[...incidents].sort((a, b) => {
				const ord: Record<IncidentStatus, number> = { incoming: 0, active: 1, dispatched: 2 };
				return ord[a.status] - ord[b.status] || a.receivedAt - b.receivedAt;
			}),
		[incidents],
	);

	const allyCountById = useMemo(() => {
		const res = new Map<string, number>();
		for (const inc of incidents) res.set(inc.id, countRankedAllies(inc, allyPool));
		return res;
	}, [incidents, allyPool]);

	const selectedIncident = useMemo(
		() => incidents.find((i) => i.id === selectedId) ?? null,
		[incidents, selectedId],
	);

	const topAllies = useMemo(() => rankedAllies.map((r) => r.ally), [rankedAllies]);

	// popup defaults to the top-ranked responder; clicking a responder icon overrides it
	const activeRanked = useMemo(
		() => rankedAllies.find((r) => r.ally.id === activeAllyId) ?? rankedAllies[0] ?? null,
		[rankedAllies, activeAllyId],
	);

	useEffect(() => setActiveAllyId(null), [selectedId]);

	useEffect(() => {
		resetCallFlow();
		setFocusedServiceId(null);
		setShowVehicleRoutes(false);
	}, [selectedId, resetCallFlow]);

	const fitMapToService = useCallback(
		(serviceId: string) => {
			if (!selectedIncident) return;
			const svc = selectedIncident.emergencyServices.find((s) => s.id === serviceId);
			if (!svc) return;
			const map = mapRef.current?.getMap();
			if (!map) return;
			const [vehLng, vehLat] = serviceMapPosition(
				svc,
				selectedIncident.coords,
				serviceRoutes,
				serviceProgress,
			);
			const [incLng, incLat] = selectedIncident.coords;
			map.fitBounds(
				[
					[Math.min(incLng, vehLng), Math.min(incLat, vehLat)],
					[Math.max(incLng, vehLng), Math.max(incLat, vehLat)],
				],
				{
					padding: { top: 120, bottom: 60, left: 60, right: 60 },
					duration: 650,
					pitch: 52,
					bearing: -12,
					maxZoom: 14,
				},
			);
			setFocusedServiceId(serviceId);
		},
		[selectedIncident, serviceRoutes, serviceProgress],
	);

	useEffect(() => {
		const id = setInterval(() => {
			setTick((t) => t + 1);
			setIncidents((prev) => {
				let changed = false;
				const next = prev.map((inc) => {
					if (inc.handled || !allServicesArrived(inc)) return inc;
					changed = true;
					return { ...inc, handled: true };
				});
				return changed ? next : prev;
			});
		}, 1000);
		return () => clearInterval(id);
	}, []);

	useEffect(() => {
		selectedIdRef.current = selectedId;
		setAllyRoutes({});
		setServiceRoutes({});
		setRankedAllies([]);

		if (!selectedId) {
			setServiceProgress({});
			return;
		}

		const incident = incidents.find((i) => i.id === selectedId);
		if (!incident) return;

		setServiceProgress(
			Object.fromEntries(
				incident.emergencyServices.map((s) => [s.id, computeServiceProgress(s)]),
			),
		);

		const token = import.meta.env.VITE_MAPBOX_TOKEN as string;
		setRankedAllies(rankAllies(incident, allyPool));

		const pathKmByAllyId: Record<string, number> = {};
		let pending = 0;

		const applyPathRanking = () => {
			if (selectedIdRef.current !== selectedId) return;
			const ranked =
				Object.keys(pathKmByAllyId).length > 0
					? rankAllies(incident, allyPool, pathKmByAllyId)
					: rankAllies(incident, allyPool);
			setRankedAllies(ranked);
			const routes: Record<string, RouteData> = {};
			for (const { ally } of ranked) {
				const key = routeKey(ally.coords, incident.coords, "walking");
				const cached = routeCache.get(key);
				if (cached) routes[ally.id] = cached;
			}
			setAllyRoutes(routes);
		};

		for (const ally of routeFetchCandidates(incident, allyPool)) {
			const key = routeKey(ally.coords, incident.coords, "walking");
			const cached = routeCache.get(key);
			if (cached) {
				pathKmByAllyId[ally.id] = cached.distanceM / 1000;
				continue;
			}
			pending++;
			fetchRoute(ally.coords, incident.coords, "walking", token).then((data) => {
				pending--;
				if (!data || selectedIdRef.current !== selectedId) {
					if (pending === 0) applyPathRanking();
					return;
				}
				routeCache.set(key, data);
				pathKmByAllyId[ally.id] = data.distanceM / 1000;
				if (pending === 0) applyPathRanking();
			});
		}
		if (pending === 0) applyPathRanking();

		for (const svc of incident.emergencyServices) {
			resolveServiceRoute(svc, incident.coords, token).then((data) => {
				if (!data || selectedIdRef.current !== selectedId) return;
				setServiceRoutes((prev) => ({ ...prev, [svc.id]: data }));
			});
		}
	}, [selectedId, incidents, allyPool]);

	useEffect(() => {
		if (!selectedIncident) return;
		let frameId = 0;
		const tick = () => {
			setServiceProgress(
				Object.fromEntries(
					selectedIncident.emergencyServices.map((svc) => [
						svc.id,
						computeServiceProgress(svc),
					]),
				),
			);
			frameId = requestAnimationFrame(tick);
		};
		frameId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frameId);
	}, [selectedIncident]);

	useEffect(() => {
		if (!selectedIncident) return;
		mapRef.current?.flyTo({
			center: selectedIncident.coords,
			zoom: 14.5,
			pitch: 52,
			bearing: -12,
			duration: 900,
			essential: true,
		});
	}, [selectedId]);

	useEffect(() => {
		if (!selectedIncident || !activeAllyId) return;
		const ally = rankedAllies.find((r) => r.ally.id === activeAllyId)?.ally;
		if (!ally) return;
		const map = mapRef.current?.getMap();
		if (!map) return;

		const [incLng, incLat] = selectedIncident.coords;
		const [allyLng, allyLat] = ally.coords;
		map.fitBounds(
			[
				[Math.min(incLng, allyLng), Math.min(incLat, allyLat)],
				[Math.max(incLng, allyLng), Math.max(incLat, allyLat)],
			],
			{
				padding: { top: 100, bottom: 60, left: 60, right: 380 },
				duration: 650,
				pitch: 52,
				bearing: -12,
				maxZoom: 14.5,
			},
		);
	}, [activeAllyId, selectedIncident, rankedAllies]);

	const startPanelClose = useCallback(() => {
		if (panelClosing || !selectedId) return;
		setPanelClosing(true);
		window.setTimeout(() => {
			setSelectedId(null);
			setPanelClosing(false);
		}, PANEL_CLOSE_MS);
	}, [panelClosing, selectedId]);

	const handleSelect = useCallback(
		(id: string) => {
			if (selectedId === id) {
				startPanelClose();
				return;
			}
			const incident = incidents.find((i) => i.id === id);
			if (!incident || !isIncidentInteractive(incident)) return;
			setPanelClosing(false);
			setSelectedId(id);
		},
		[selectedId, startPanelClose, incidents],
	);

	const detailOpen = !!selectedIncident && !panelClosing;

	const setAllyResponse = useCallback((incidentId: string, allyId: string, status: AllyResponseStatus) => {
		setIncidents((prev) =>
			prev.map((inc) =>
				inc.id !== incidentId
					? inc
					: { ...inc, allyStatuses: { ...inc.allyStatuses, [allyId]: status } },
			),
		);
	}, []);

	const setIncidentHandled = useCallback((incidentId: string, handled: boolean) => {
		setIncidents((prev) =>
			prev.map((inc) => (inc.id === incidentId ? { ...inc, handled } : inc)),
		);
	}, []);

	const callAlly = useMemo(() => {
		if (!callAllyId) return null;
		return rankedAllies.find((r) => r.ally.id === callAllyId)?.ally ?? allyPool.find((a) => a.id === callAllyId) ?? null;
	}, [callAllyId, rankedAllies, allyPool]);

	const callBusy = callPhase !== "ready";

	const handleDial = useCallback(async (allyId: string) => {
		if (callPhase === "calling" || callPhase === "in-call") return;
		if (callPhase === "wrap-up") return;
		dialAbortRef.current?.abort();
		const ctrl = new AbortController();
		dialAbortRef.current = ctrl;
		setCallAllyId(allyId);
		setActiveAllyId(allyId);
		setCallStartedAt(null);
		setCallPhase("calling");
		try {
			await mockDialAlly(ctrl.signal, mockRingMs(allyId));
			if (ctrl.signal.aborted) return;
			setCallStartedAt(Date.now());
			setCallPhase("in-call");
		} catch (err) {
			if (err instanceof DOMException && err.name === "AbortError") return;
			resetCallFlow();
		} finally {
			if (dialAbortRef.current === ctrl) dialAbortRef.current = null;
		}
	}, [callPhase, resetCallFlow]);

	const handleEndCall = useCallback(() => {
		if (callPhase !== "in-call") return;
		setCallStartedAt(null);
		setCallPhase("wrap-up");
	}, [callPhase]);

	const handleCallAccept = useCallback(() => {
		if (callPhase !== "wrap-up" || !callAllyId || !selectedId) return;
		setAllyResponse(selectedId, callAllyId, "accepted");
		resetCallFlow();
	}, [callPhase, callAllyId, selectedId, setAllyResponse, resetCallFlow]);

	const handleCallDecline = useCallback(() => {
		if (callPhase !== "wrap-up" || !callAllyId || !selectedId) return;
		setAllyResponse(selectedId, callAllyId, "declined");
		resetCallFlow();
	}, [callPhase, callAllyId, selectedId, setAllyResponse, resetCallFlow]);

	const addIncident = useCallback(() => {
		const receivedAt = Date.now();
		const type = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)]!;
		// random on-land spot, kept clear of every existing incident (never the same position twice)
		const c = randomIncidentCoord(incidents.map((i) => ({ lat: i.coords[1], lng: i.coords[0] })));
		const coords = sanitizeTupleToLand([c.lng, c.lat]);
		const incident: Incident = {
			id: crypto.randomUUID(),
			type,
			status: "incoming",
			coords,
			address: nearestHotspotName(coords),
			receivedAt,
			callerPhone: `+852 9${Math.floor(Math.random() * 9000000 + 1000000)}`,
			emergencyServices: createEmergencyServices(coords, type, Date.now()),
			allyStatuses: {},
			handled: false,
			source: "operator",
		};
		setIncidents((prev) => [...prev, incident]);
		setSelectedId(incident.id);
		reverseGeocode(coords, import.meta.env.VITE_MAPBOX_TOKEN as string).then((addr) => {
			if (!addr) return;
			setIncidents((prev) => prev.map((i) => (i.id === incident.id ? { ...i, address: addr } : i)));
		});
	}, [incidents]);

	return (
		<div
			style={{
				width: "100vw",
				height: "100vh",
				display: "flex",
				flexDirection: "column",
				background: "transparent",
				overflow: "hidden",
				fontFamily: Z.font,
				fontWeight: 300,
			}}
		>
			<AppHeader onAddIncident={addIncident} />

			<div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, background: "transparent" }}>
				<div
					style={{
						flex: 1,
						minWidth: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: 20,
						background: "transparent",
						transition: `flex ${PANEL_CLOSE_MS}ms ${PANEL_EASE}`,
					}}
				>
					<div
						style={{
							width: "93%",
							height: "93%",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<div
							style={{
								display: "grid",
								gridTemplateRows: detailOpen ? "1fr" : "0fr",
								marginBottom: detailOpen ? 12 : 0,
								transition: `grid-template-rows ${PANEL_CLOSE_MS}ms ${PANEL_EASE}, margin-bottom ${PANEL_CLOSE_MS}ms ${PANEL_EASE}`,
							}}
						>
							<div style={{ overflow: "hidden" }}>
								<div
									style={{
										opacity: detailOpen ? 1 : 0,
										transition: `opacity ${PANEL_CLOSE_MS}ms ${PANEL_EASE}`,
									}}
								>
									{selectedIncident && (
										<FloatingStatusCards
											services={selectedIncident.emergencyServices}
											selectedServiceId={focusedServiceId}
											onSelectService={fitMapToService}
										/>
									)}
								</div>
							</div>
						</div>

						<div
							style={{
								flex: 1,
								minHeight: 0,
								position: "relative",
								borderRadius: 14,
								overflow: "hidden",
								boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
								transition: `flex ${PANEL_CLOSE_MS}ms ${PANEL_EASE}`,
							}}
						>
						<MapGL
							ref={mapRef}
							mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
							mapStyle="mapbox://styles/mapbox/dark-v11"
							style={{ width: "100%", height: "100%" }}
							maxBounds={MAP_MAX_BOUNDS}
							minZoom={8}
						initialViewState={{ longitude: 114.175, latitude: 22.29, zoom: 10, pitch: 0, bearing: 0 }}
						onLoad={() => {
							mapRef.current?.getMap().setMaxBounds(MAP_MAX_BOUNDS);
							mapRef.current?.flyTo({
								center: [114.175, 22.295],
								zoom: 12.5,
								pitch: 38,
								bearing: -8,
								duration: 2400,
								essential: true,
								curve: 1.2,
							});
						}}
						fog={{
							color: "#0a0f14",
							"high-color": "#111827",
							"horizon-blend": 0.06,
							"space-color": "#000008",
							"star-intensity": 0.08,
							range: [0.5, 8],
						}}
					>
						<Layer
							id="3d-buildings"
							source="composite"
							source-layer="building"
							type="fill-extrusion"
							minzoom={14}
							filter={["==", "extrude", "true"]}
							paint={{
								"fill-extrusion-color": "#111827",
								"fill-extrusion-height": [
									"interpolate", ["linear"], ["zoom"],
									14, 0, 14.05, ["get", "height"],
								],
								"fill-extrusion-base": [
									"interpolate", ["linear"], ["zoom"],
									14, 0, 14.05, ["get", "min_height"],
								],
								"fill-extrusion-opacity": 0.8,
							}}
						/>

						{selectedIncident && (
							<>
								<RadiusCircle coords={selectedIncident.coords} />
								<RouteLayer
									allies={topAllies}
									allyRoutes={allyRoutes}
									services={selectedIncident.emergencyServices}
									serviceRoutes={serviceRoutes}
									showVehicleRoutes={showVehicleRoutes}
									incident={selectedIncident}
									allyStatuses={selectedIncident.allyStatuses}
								/>
							</>
						)}

						{incidents.map((inc) => (
							<IncidentMarker
								key={inc.id}
								incident={inc}
								selected={inc.id === selectedId}
								dimmed={!!selectedId && inc.id !== selectedId}
								interactive={isIncidentInteractive(inc)}
								onClick={() => handleSelect(inc.id)}
							/>
						))}

						{selectedIncident &&
							topAllies
								.filter((ally) => ally.id !== activeRanked?.ally.id)
								.map((ally) => {
									const rank = topAllies.findIndex((a) => a.id === ally.id);
									return (
										<AllyMarker
											key={ally.id}
											ally={ally}
											rank={rank}
											response={selectedIncident.allyStatuses[ally.id]}
											active={false}
											onClick={() => setActiveAllyId(ally.id)}
										/>
									);
								})}

						{selectedIncident &&
							selectedIncident.emergencyServices.map((svc) => {
								const pos = serviceMapPosition(
									svc,
									selectedIncident.coords,
									serviceRoutes,
									serviceProgress,
								);
								return <VehicleMarker key={svc.id} svc={svc} pos={pos} />;
							})}

						{selectedIncident && activeRanked && (
							<>
								<AllyMapPopup
									ally={activeRanked.ally}
									incidentCoords={selectedIncident.coords}
									matchedCerts={activeRanked.matchedCerts}
									walkEtaMin={
										allyRoutes[activeRanked.ally.id]
											? Math.ceil(walkEtaMinutes(allyRoutes[activeRanked.ally.id].distanceM))
											: null
									}
									callBusy={callBusy}
									onCall={() => handleDial(activeRanked.ally.id)}
								/>
								<AllyMarker
									ally={activeRanked.ally}
									rank={topAllies.findIndex((a) => a.id === activeRanked.ally.id)}
									response={selectedIncident.allyStatuses[activeRanked.ally.id]}
									active
									onClick={() => setActiveAllyId(activeRanked.ally.id)}
								/>
							</>
						)}
						</MapGL>
						{selectedIncident && (
							<div
								style={{
									position: "absolute",
									top: 12,
									left: 12,
									zIndex: 15,
									pointerEvents: "auto",
								}}
							>
								<VehicleRoutesToggle
									on={showVehicleRoutes}
									onToggle={() => setShowVehicleRoutes((v) => !v)}
								/>
							</div>
						)}
						{callAlly && callPhase !== "ready" && (
							<div
								style={{
									position: "absolute",
									bottom: 20,
									left: "50%",
									transform: "translateX(-50%)",
									width: "min(480px, calc(100% - 32px))",
									zIndex: 25,
									pointerEvents: "none",
								}}
							>
								<AllyCallDock
									ally={callAlly}
									phase={callPhase}
									callStartedAt={callStartedAt}
									response={selectedIncident?.allyStatuses[callAlly.id]}
									onEndCall={handleEndCall}
									onAccept={handleCallAccept}
									onDecline={handleCallDecline}
								/>
							</div>
						)}
						</div>
					</div>
				</div>

				<div
					style={{
						width: detailOpen ? "30%" : 0,
						minWidth: detailOpen ? 300 : 0,
						maxWidth: detailOpen ? 380 : 0,
						height: "100%",
						flexShrink: 0,
						overflow: "hidden",
						borderLeft: detailOpen ? `1px solid ${Z.border}` : "none",
						transition: `width ${PANEL_CLOSE_MS}ms ${PANEL_EASE}, min-width ${PANEL_CLOSE_MS}ms ${PANEL_EASE}, max-width ${PANEL_CLOSE_MS}ms ${PANEL_EASE}, border-color ${PANEL_CLOSE_MS}ms ${PANEL_EASE}`,
					}}
				>
					{selectedIncident && (
						<AllyPanel
							incident={selectedIncident}
							rankedAllies={rankedAllies}
							allyRoutes={allyRoutes}
							serviceRoutes={serviceRoutes}
							serviceProgress={serviceProgress}
							incidentClosed={allServicesArrived(selectedIncident)}
							focusedAllyId={activeRanked?.ally.id ?? null}
							activeAllyId={activeAllyId}
							callBusy={callBusy}
							closing={panelClosing}
							onClose={startPanelClose}
							onFocusAlly={setActiveAllyId}
							onCallAlly={handleDial}
							onSetHandled={(handled) => setIncidentHandled(selectedIncident.id, handled)}
						/>
					)}
				</div>
			</div>

			<IncidentSidebar
				incidents={sortedIncidents}
				selectedId={selectedId}
				allyCountById={allyCountById}
				onSelect={handleSelect}
				onAddIncident={addIncident}
			/>
		</div>
	);
};
