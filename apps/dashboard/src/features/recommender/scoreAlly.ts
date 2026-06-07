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

const credentialScore = (incidentType: IncidentType, ally: Ally): number => {
	if (ally.certifications?.length) return certRelevanceScore(incidentType, ally.certifications).score;
	if (ally.skills.includes(incidentType)) return ally.credentialScore / 100;
	return 0;
};

export const scoreAlly = (
	incidentType: IncidentType,
	incidentCoords: [number, number],
	ally: Ally,
	pathDistanceKm?: number,
): AllyScore | null => {
	const [lng, lat] = incidentCoords;
	const straightKm = haversineKm(
		{ lat: ally.coords[1], lng: ally.coords[0] },
		{ lat, lng },
	);
	const distanceKm = pathDistanceKm ?? straightKm;
	if (distanceKm > RESPONDER_MAX_RADIUS_KM) return null;

	const distanceScore = 1 / (1 + distanceKm);
	const certScore = credentialScore(incidentType, ally);
	const matchedCerts = ally.certifications?.length
		? getMatchedCerts(incidentType, ally.certifications)
		: [];

	return {
		score: DISTANCE_WEIGHT * distanceScore + CERT_WEIGHT * certScore,
		distanceKm,
		distanceScore,
		certScore,
		verifiedMultiplier: 1,
		matchedCerts,
	};
};
