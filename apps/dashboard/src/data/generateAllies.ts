import { HK_BOUNDS } from "~/config/hk";
import { CERTIFICATION_TYPES, NEW_CERTIFICATION_TYPES } from "~/domain/certLabels";
import { skillsFromCertifications } from "~/domain/certToSkills";
import type { Ally, Certification, CertificationType, Coord } from "~/domain/types";
import { isLandCoord, randomLandCoord, sanitizeToLand, tupleFromCoord } from "~/lib/geo";
import { mulberry32 } from "~/lib/rng";

export const ALLY_POOL_SIZE = 5000;
export const ALLY_SEED = 42;
export const ALLY_EXTRA_UNCREDENTIALLED_SIZE = 2000;
export const ALLY_EXTRA_SEED = 43;
const CREDENTIALLED_RATE = 0.3;
// Share of uncredentialled pool that gets one of the new specialty cert types
const NON_CREDENTIALLED_NEW_CERT_RATE = 0.22;

const FIRST_NAMES = [
	"Wing", "Ka", "Ho", "Man", "Ying", "Chi", "Mei", "Kit", "Sum", "Wai",
	"Jun", "Hin", "Tsz", "Lok", "Chun", "Yui", "Long", "Ping", "Siu", "Fai",
];

const LAST_NAMES = [
	"Chan", "Wong", "Lee", "Lam", "Cheung", "Ng", "Leung", "Tang", "Ho", "Yip",
	"Cheng", "Chow", "Tsang", "Kwok", "Tam", "Au", "Fung", "Ma", "Yuen", "Lo",
];

const OTHER_CERT_LABELS = ["Community First Aid", "Red Cross Volunteer", "Multilingual Support"];

const pick = <T>(rng: () => number, items: T[]): T =>
	items[Math.floor(rng() * items.length)] ?? items[0]!;

const formatPhone = (rng: () => number): string =>
	`+8529${Math.floor(rng() * 9000000 + 1000000)}`;

const pickCertifications = (
	rng: () => number,
	seed: number,
	index: number,
	types: CertificationType[],
	minCount: number,
	maxCount: number,
): Certification[] => {
	const certCount = Math.floor(rng() * (maxCount - minCount + 1)) + minCount;
	const pool = [...types];
	const res: Certification[] = [];
	for (let j = 0; j < certCount; j++) {
		const idx = Math.floor(rng() * pool.length);
		const type = pool.splice(idx, 1)[0];
		if (!type) break;
		res.push({
			id: `cert-${seed}-${index}-${j}`,
			type,
			customLabel: type === "other" ? pick(rng, OTHER_CERT_LABELS) : undefined,
			verified: rng() < 0.7,
		});
	}
	return res;
};

export type GenerateAlliesOpts = {
	uncredentialledOnly?: boolean;
};

export type GeneratedAlly = Omit<Ally, "pictureUrl">;

export const generateAllies = (
	count = ALLY_POOL_SIZE,
	seed = ALLY_SEED,
	opts?: GenerateAlliesOpts,
): GeneratedAlly[] => {
	const rng = mulberry32(seed);
	const cols = Math.ceil(Math.sqrt(count * 1.2));
	const rows = Math.ceil(count / cols);
	const latStep = (HK_BOUNDS.maxLat - HK_BOUNDS.minLat) / rows;
	const lngStep = (HK_BOUNDS.maxLng - HK_BOUNDS.minLng) / cols;
	const res: GeneratedAlly[] = [];

	for (let i = 0; i < count; i++) {
		const row = Math.floor(i / cols);
		const col = i % cols;
		let coord: Coord | null = null;
		for (let attempt = 0; attempt < 48; attempt++) {
			const candidate = {
				lat: HK_BOUNDS.minLat + latStep * (row + 0.5) + (rng() - 0.5) * latStep * 0.8,
				lng: HK_BOUNDS.minLng + lngStep * (col + 0.5) + (rng() - 0.5) * lngStep * 0.8,
			};
			if (isLandCoord(candidate)) {
				coord = candidate;
				break;
			}
		}
		if (!coord) coord = randomLandCoord(rng);
		coord = sanitizeToLand(coord);

		let certifications: Certification[] | undefined;
		if (!opts?.uncredentialledOnly) {
			if (rng() < CREDENTIALLED_RATE) {
				certifications = pickCertifications(rng, seed, i, CERTIFICATION_TYPES, 1, 3);
			} else if (rng() < NON_CREDENTIALLED_NEW_CERT_RATE) {
				certifications = pickCertifications(rng, seed, i, NEW_CERTIFICATION_TYPES, 1, 2);
			}
		}

		const certTypes = certifications?.map((c) => c.type) ?? [];
		const skills = certTypes.length ? skillsFromCertifications(certTypes) : [];

		res.push({
			id: `ally-${seed}-${i}`,
			name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
			phone: formatPhone(rng),
			skills,
			coords: tupleFromCoord(coord),
			credentialScore: Math.floor(rng() * 35) + 55,
			certifications,
		});
	}

	return res;
};
