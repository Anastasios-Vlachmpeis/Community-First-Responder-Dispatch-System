import { pickRandomPicture } from "~/data/allyPictures";
import {
	ALLY_EXTRA_SEED,
	ALLY_EXTRA_UNCREDENTIALLED_SIZE,
	generateAllies,
} from "~/data/generateAllies";
import type { Ally, Certification, IncidentType } from "~/domain/types";
import { sanitizeTupleToLand } from "~/lib/geo";
import { mulberry32 } from "~/lib/rng";

const cert = (
	id: string,
	type: Certification["type"],
	verified: boolean,
	customLabel?: string,
): Certification => ({ id, type, verified, customLabel });

const seedCerts = (allyId: string, types: Certification["type"][]): Certification[] =>
	types.map((type, i) => cert(`${allyId}-cert-${i}`, type, true));

const SEED_ALLIES = [
	{
		id: "ally-001",
		name: "Chan Siu Ming",
		phone: "+85291234567",
		skills: ["cardiac-arrest", "severe-bleeding", "choking", "anaphylaxis"] as IncidentType[],
		coords: [114.1590, 22.2791] as [number, number],
		credentialScore: 94,
		certifications: seedCerts("ally-001", ["cpr_aed", "medical_professional"]),
	},
	{
		id: "ally-002",
		name: "Dr Lee Wai Yee",
		phone: "+85294567890",
		skills: ["cardiac-arrest", "stroke", "breathing-difficulty", "diabetic-emergency", "seizure"] as IncidentType[],
		coords: [114.1683, 22.2798] as [number, number],
		credentialScore: 98,
		certifications: seedCerts("ally-002", ["medical_professional", "cpr_aed"]),
	},
	{
		id: "ally-003",
		name: "Priya Nair",
		phone: "+85292345678",
		skills: ["mental-health-crisis", "overdose", "language-barrier"] as IncidentType[],
		coords: [114.1822, 22.2783] as [number, number],
		credentialScore: 71,
		certifications: seedCerts("ally-003", ["mental_health_first_aid", "other"]),
	},
	{
		id: "ally-004",
		name: "James Cheung",
		phone: "+85295678901",
		skills: ["drowning", "severe-bleeding", "childbirth", "cardiac-arrest"] as IncidentType[],
		coords: [114.1731, 22.3015] as [number, number],
		credentialScore: 83,
		certifications: seedCerts("ally-004", ["water_rescue", "medical_professional", "cpr_aed"]),
	},
	{
		id: "ally-005",
		name: "Wong Ka Wai",
		phone: "+85293456789",
		skills: ["cardiac-arrest", "seizure", "anaphylaxis", "breathing-difficulty"] as IncidentType[],
		coords: [114.1729, 22.2988] as [number, number],
		credentialScore: 88,
		certifications: seedCerts("ally-005", ["medical_professional", "cpr_aed"]),
	},
	{
		id: "ally-006",
		name: "Mei Lin Wong",
		phone: "+85296789012",
		skills: ["cardiac-arrest", "stroke", "language-barrier", "mental-health-crisis"] as IncidentType[],
		coords: [114.1601, 22.2850] as [number, number],
		credentialScore: 76,
		certifications: seedCerts("ally-006", ["medical_professional", "mental_health_first_aid", "other"]),
	},
	{
		id: "ally-007",
		name: "Ali Hassan",
		phone: "+85297890123",
		skills: ["language-barrier", "mental-health-crisis", "seizure", "overdose"] as IncidentType[],
		coords: [114.1671, 22.3078] as [number, number],
		credentialScore: 79,
		certifications: seedCerts("ally-007", ["mental_health_first_aid", "other"]),
	},
	{
		id: "ally-008",
		name: "Sarah Ng",
		phone: "+85298901234",
		skills: ["childbirth", "breathing-difficulty", "anaphylaxis", "diabetic-emergency"] as IncidentType[],
		coords: [114.1693, 22.2995] as [number, number],
		credentialScore: 85,
		certifications: seedCerts("ally-008", ["medical_professional"]),
	},
	{
		id: "ally-009",
		name: "David Chan",
		phone: "+85299012345",
		skills: ["choking", "cardiac-arrest", "severe-bleeding", "anaphylaxis"] as IncidentType[],
		coords: [114.1703, 22.3021] as [number, number],
		credentialScore: 91,
		certifications: seedCerts("ally-009", ["cpr_aed", "medical_professional"]),
	},
	{
		id: "ally-010",
		name: "Maria Santos",
		phone: "+85290123456",
		skills: ["language-barrier", "childbirth", "mental-health-crisis"] as IncidentType[],
		coords: [114.1736, 22.2861] as [number, number],
		credentialScore: 77,
		certifications: seedCerts("ally-010", ["other", "mental_health_first_aid", "medical_professional"]),
	},
	{
		id: "ally-011",
		name: "Kevin Lam",
		phone: "+85291122334",
		skills: ["drowning", "cardiac-arrest", "breathing-difficulty", "seizure"] as IncidentType[],
		coords: [114.1748, 22.2954] as [number, number],
		credentialScore: 86,
		certifications: seedCerts("ally-011", ["water_rescue", "cpr_aed", "medical_professional"]),
	},
];

let pool: Ally[] | null = null;

export const getAllyPool = (): Ally[] => {
	if (pool) return pool;
	const pictureRng = mulberry32(7);
	const withRandomPicture = (ally: Omit<Ally, "pictureUrl">): Ally => ({
		...ally,
		coords: sanitizeTupleToLand(ally.coords),
		pictureUrl: pickRandomPicture(pictureRng),
	});
	const seedIds = new Set(SEED_ALLIES.map((a) => a.id));
	pool = [
		...SEED_ALLIES.map(withRandomPicture),
		...generateAllies()
			.filter((a) => !seedIds.has(a.id))
			.map(withRandomPicture),
		...generateAllies(ALLY_EXTRA_UNCREDENTIALLED_SIZE, ALLY_EXTRA_SEED, { uncredentialledOnly: true }).map(
			withRandomPicture,
		),
	];
	return pool;
};
