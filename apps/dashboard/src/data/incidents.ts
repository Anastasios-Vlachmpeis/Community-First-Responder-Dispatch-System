import { capDispatchAgeMs } from "~/data/dispatch";
import type { EmergencyService, Incident } from "~/domain/types";

type SeedService = Omit<EmergencyService, "createdAt"> & { dispatchAgeMs: number };

type SeedIncident = Omit<Incident, "receivedAt" | "emergencyServices"> & {
	receivedAgeMs: number;
	emergencyServices: SeedService[];
};

const SEED_TEMPLATES: SeedIncident[] = [
	{
		id: "inc-001",
		type: "cardiac-arrest",
		status: "incoming",
		coords: [114.1628, 22.2824],
		address: "8 Finance St, Central",
		receivedAgeMs: 45_000,
		callerPhone: "+852 9123 4567",
		emergencyServices: [
			{ id: "svc-001a", type: "ambulance", callsign: "AMB-09", coords: [114.1553, 22.2819], etaMinutes: 7, dispatchAgeMs: 45_000 },
			{ id: "svc-001b", type: "police", callsign: "BRAVO-3", coords: [114.1583, 22.2776], etaMinutes: 5, dispatchAgeMs: 45_000 },
		],
		allyStatuses: {},
		handled: false,
		source: "seed",
	},
	{
		id: "inc-002",
		type: "drowning",
		status: "incoming",
		coords: [114.1720, 22.2960],
		address: "TST Promenade, Tsim Sha Tsui",
		receivedAgeMs: 90_000,
		callerPhone: "+852 9456 7890",
		emergencyServices: [
			{ id: "svc-002a", type: "ambulance", callsign: "AMB-05", coords: [114.1652, 22.3045], etaMinutes: 5, dispatchAgeMs: 90_000 },
			{ id: "svc-002b", type: "police", callsign: "CHARLIE-2", coords: [114.1718, 22.3010], etaMinutes: 5, dispatchAgeMs: 90_000 },
			{ id: "svc-002c", type: "fire-engine", callsign: "FIRE-01", coords: [114.1700, 22.2990], etaMinutes: 6, dispatchAgeMs: 90_000 },
		],
		allyStatuses: {},
		handled: false,
		source: "seed",
	},
	{
		id: "inc-003",
		type: "severe-bleeding",
		status: "active",
		coords: [114.1694, 22.3213],
		address: "Mong Kok Rd / Nathan Rd",
		receivedAgeMs: 185_000,
		callerPhone: "+852 9234 5678",
		emergencyServices: [
			{ id: "svc-003a", type: "ambulance", callsign: "AMB-14", coords: [114.1741, 22.3099], etaMinutes: 5, dispatchAgeMs: 185_000 },
			{ id: "svc-003b", type: "police", callsign: "ALPHA-7", coords: [114.1621, 22.3156], etaMinutes: 5, dispatchAgeMs: 185_000 },
		],
		allyStatuses: {},
		handled: false,
		source: "seed",
	},
	{
		id: "inc-004",
		type: "mental-health-crisis",
		status: "active",
		coords: [114.1849, 22.2804],
		address: "Causeway Bay MTR Exit D",
		receivedAgeMs: 360_000,
		callerPhone: "+852 9345 6789",
		emergencyServices: [
			{ id: "svc-004a", type: "ambulance", callsign: "AMB-22", coords: [114.1673, 22.2783], etaMinutes: 6, dispatchAgeMs: 360_000 },
			{ id: "svc-004b", type: "police", callsign: "ECHO-3", coords: [114.1826, 22.2756], etaMinutes: 5, dispatchAgeMs: 360_000 },
		],
		allyStatuses: {},
		handled: false,
		source: "seed",
	},
	{
		id: "inc-005",
		type: "stroke",
		status: "active",
		coords: [114.1742, 22.2831],
		address: "Wan Chai Waterfront Promenade, HKCEC",
		receivedAgeMs: 130_000,
		callerPhone: "+852 9567 8901",
		emergencyServices: [
			{ id: "svc-005a", type: "ambulance", callsign: "AMB-17", coords: [114.1729, 22.2810], etaMinutes: 5, dispatchAgeMs: 130_000 },
			{ id: "svc-005b", type: "police", callsign: "DELTA-4", coords: [114.1783, 22.2838], etaMinutes: 5, dispatchAgeMs: 130_000 },
		],
		allyStatuses: {},
		handled: false,
		source: "seed",
	},
	{
		id: "inc-006",
		type: "choking",
		status: "incoming",
		coords: [114.1716, 22.2985],
		address: "Canton Rd / Haiphong Rd, Tsim Sha Tsui",
		receivedAgeMs: 18_000,
		callerPhone: "+852 9678 9012",
		emergencyServices: [
			{ id: "svc-006a", type: "ambulance", callsign: "AMB-03", coords: [114.1652, 22.3045], etaMinutes: 5, dispatchAgeMs: 18_000 },
			{ id: "svc-006b", type: "police", callsign: "CHARLIE-5", coords: [114.1680, 22.2990], etaMinutes: 5, dispatchAgeMs: 18_000 },
		],
		allyStatuses: {},
		handled: false,
		source: "seed",
	},
	{
		id: "inc-007",
		type: "seizure",
		status: "incoming",
		coords: [114.1824, 22.2779],
		address: "Times Square, 1 Matheson St, Causeway Bay",
		receivedAgeMs: 75_000,
		callerPhone: "+852 9789 0123",
		emergencyServices: [
			{ id: "svc-007a", type: "ambulance", callsign: "AMB-18", coords: [114.1863, 22.2814], etaMinutes: 5, dispatchAgeMs: 75_000 },
			{ id: "svc-007b", type: "police", callsign: "ECHO-7", coords: [114.1840, 22.2750], etaMinutes: 5, dispatchAgeMs: 75_000 },
		],
		allyStatuses: {},
		handled: false,
		source: "seed",
	},
	{
		id: "inc-008",
		type: "anaphylaxis",
		status: "dispatched",
		coords: [114.1645, 22.2787],
		address: "Pacific Place L3, 88 Queensway, Admiralty",
		receivedAgeMs: 1_080_000,
		callerPhone: "+852 9890 1234",
		emergencyServices: [
			{ id: "svc-008a", type: "ambulance", callsign: "AMB-11", coords: [114.1609, 22.2803], etaMinutes: 5, dispatchAgeMs: 1_080_000 },
			{ id: "svc-008b", type: "police", callsign: "FOXTROT-2", coords: [114.1583, 22.2776], etaMinutes: 6, dispatchAgeMs: 1_080_000 },
		],
		allyStatuses: {},
		handled: false,
		source: "seed",
	},
];

export const getSeedIncidents = (): Incident[] => {
	const now = Date.now();
	return SEED_TEMPLATES.map((inc) => {
		const minEta = Math.min(...inc.emergencyServices.map((svc) => svc.etaMinutes));
		return {
			...inc,
			receivedAt: now - capDispatchAgeMs(inc.receivedAgeMs, minEta),
			emergencyServices: inc.emergencyServices.map(({ dispatchAgeMs, ...svc }) => ({
				...svc,
				createdAt: now - capDispatchAgeMs(dispatchAgeMs, svc.etaMinutes),
			})),
			allyStatuses: { ...inc.allyStatuses },
		};
	});
};
