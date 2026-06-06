import { RESPONDER_MAX_RADIUS_KM } from "~/config/hk";
import type { MatchedCert } from "~/domain/certMapping";
import { certRelevanceScore, getMatchedCerts } from "~/domain/certMapping";
import type { Ally, IncidentType } from "~/domain/types";
import { haversineKm } from "~/lib/geo";

const DISTANCE_WEIGHT = 0.7;
const CERT_WEIGHT = 0.3;

export type AllyScore = {
	score: number;
	distanceKm: number;
	distanceScore: number;
	certScore: number;
	verifiedMultiplier: number;
	matchedCerts: MatchedCert[];
};

const legacyScore = (
	incidentType: IncidentType,
	ally: Ally,
	distanceScore: number,
): AllyScore | null => {
	if (!ally.skills.includes(incidentType)) return null;
	const skillScore = ally.credentialScore / 100;
	const score = DISTANCE_WEIGHT * distanceScore + CERT_WEIGHT * skillScore;
	return {
		score,
		distanceKm: 0,
		distanceScore,
		certScore: skillScore,
		verifiedMultiplier: 1,
		matchedCerts: [],
	};
};

export const scoreAlly = (
	incidentType: IncidentType,
	incidentCoords: [number, number],
	ally: Ally,
): AllyScore | null => {
	const [lng, lat] = incidentCoords;
	const distanceKm = haversineKm(
		{ lat: ally.coords[1], lng: ally.coords[0] },
		{ lat, lng },
	);
	if (distanceKm > RESPONDER_MAX_RADIUS_KM) return null;

	const distanceScore = 1 / (1 + distanceKm);

	if (!ally.certifications?.length) {
		const res = legacyScore(incidentType, ally, distanceScore);
		if (res) res.distanceKm = distanceKm;
		return res;
	}

	const matchedCerts = getMatchedCerts(incidentType, ally.certifications);
	if (matchedCerts.length === 0) {
		const res = legacyScore(incidentType, ally, distanceScore);
		if (res) res.distanceKm = distanceKm;
		return res;
	}

	const certScore = matchedCerts.reduce((sum, m) => sum + m.weight, 0);
	const verifiedMultiplier =
		matchedCerts.reduce((sum, m) => sum + (m.verified ? 1 : 0.5), 0) / matchedCerts.length;
	const { score: relevanceScore } = certRelevanceScore(incidentType, ally.certifications);
	const score =
		DISTANCE_WEIGHT * distanceScore + CERT_WEIGHT * certScore * verifiedMultiplier * relevanceScore;

	return { score, distanceKm, distanceScore, certScore, verifiedMultiplier, matchedCerts };
};
