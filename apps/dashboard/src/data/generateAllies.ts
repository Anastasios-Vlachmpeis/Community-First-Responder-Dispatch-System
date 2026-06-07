import { pickRandomPicture } from "~/data/allyPictures";
import { HK_BOUNDS } from "~/config/hk";
import { CERTIFICATION_TYPES } from "~/domain/certLabels";
import { skillsFromCertifications } from "~/domain/certToSkills";
import type { Ally, Certification, Coord } from "~/domain/types";
import { isLandCoord, randomLandCoord, tupleFromCoord } from "~/lib/geo";

export const ALLY_POOL_SIZE = 5000;
export const ALLY_SEED = 42;

const FIRST_NAMES = [
	"Wing", "Ka", "Ho", "Man", "Ying", "Chi", "Mei", "Kit", "Sum", "Wai",
	"Jun", "Hin", "Tsz", "Lok", "Chun", "Yui", "Long", "Ping", "Siu", "Fai",
];

const LAST_NAMES = [
	"Chan", "Wong", "Lee", "Lam", "Cheung", "Ng", "Leung", "Tang", "Ho", "Yip",
	"Cheng", "Chow", "Tsang", "Kwok", "Tam", "Au", "Fung", "Ma", "Yuen", "Lo",
];

const mulberry32 = (seed: number) => {
	let s = seed;
	return () => {
		s |= 0;
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

const pick = <T>(rng: () => number, items: T[]): T =>
	items[Math.floor(rng() * items.length)] ?? items[0]!;

const formatPhone = (rng: () => number): string =>
	`+8529${Math.floor(rng() * 9000000 + 1000000)}`;

export const generateAllies = (count = ALLY_POOL_SIZE, seed = ALLY_SEED): Ally[] => {
	const rng = mulberry32(seed);
	const cols = Math.ceil(Math.sqrt(count * 1.2));
	const rows = Math.ceil(count / cols);
	const latStep = (HK_BOUNDS.maxLat - HK_BOUNDS.minLat) / rows;
	const lngStep = (HK_BOUNDS.maxLng - HK_BOUNDS.minLng) / cols;
	const res: Ally[] = [];

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
		const hasCerts = rng() < 0.3;
		const certifications: Certification[] = [];

		if (hasCerts) {
			const certCount = Math.floor(rng() * 3) + 1;
			const types = [...CERTIFICATION_TYPES];
			for (let j = 0; j < certCount; j++) {
				const idx = Math.floor(rng() * types.length);
				const type = types.splice(idx, 1)[0];
				if (!type) break;
				certifications.push({
					id: `cert-${seed}-${i}-${j}`,
					type,
					customLabel:
						type === "other"
							? pick(rng, ["Community First Aid", "Red Cross Volunteer", "Multilingual Support"])
							: undefined,
					verified: rng() < 0.7,
				});
			}
		}

		const certTypes = certifications.map((c) => c.type);
		const skills = hasCerts ? skillsFromCertifications(certTypes) : [];

		res.push({
			id: `ally-${seed}-${i}`,
			name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
			phone: formatPhone(rng),
			skills,
			coords: tupleFromCoord(coord),
			credentialScore: Math.floor(rng() * 35) + 55,
			certifications: hasCerts ? certifications : undefined,
			pictureUrl: pickRandomPicture(rng),
		});
	}

	return res;
};
