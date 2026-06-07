import { TOP_ALLY_COUNT } from "~/config/hk";
import type { MatchedCert } from "~/domain/certMapping";
import type { Ally, Incident } from "~/domain/types";
import { haversineKm } from "~/lib/geo";
import { scoreAlly } from "~/features/recommender/scoreAlly";

export type RankedAlly = {
	ally: Ally;
	score: number;
	distanceKm: number;
	matchedCerts: MatchedCert[];
};

export const ROUTE_FETCH_CANDIDATE_LIMIT = 100;
export const HAVERSINE_PREFILTER_KM = 12;

export const allyStraightLineKm = (incident: Incident, ally: Ally): number => {
	const [lng, lat] = incident.coords;
	return haversineKm({ lat: ally.coords[1], lng: ally.coords[0] }, { lat, lng });
};

export const routeFetchCandidates = (
	incident: Incident,
	pool: Ally[],
	limit = ROUTE_FETCH_CANDIDATE_LIMIT,
): Ally[] =>
	pool
		.map((ally) => ({ ally, km: allyStraightLineKm(incident, ally) }))
		.filter(({ km }) => km <= HAVERSINE_PREFILTER_KM)
		.sort((a, b) => a.km - b.km)
		.slice(0, limit)
		.map(({ ally }) => ally);

export const rankAllies = (
	incident: Incident,
	pool: Ally[],
	pathDistanceKmByAllyId?: Readonly<Record<string, number>>,
): RankedAlly[] => {
	const pathOnly =
		pathDistanceKmByAllyId != null && Object.keys(pathDistanceKmByAllyId).length > 0;
	const scored = pool
		.map((ally) => {
			if (pathOnly && pathDistanceKmByAllyId[ally.id] == null) return null;
			const result = scoreAlly(
				incident.type,
				incident.coords,
				ally,
				pathDistanceKmByAllyId?.[ally.id],
			);
			if (!result) return null;
			return {
				ally,
				score: result.score,
				distanceKm: result.distanceKm,
				matchedCerts: result.matchedCerts,
			};
		})
		.filter((r): r is RankedAlly => r != null);

	scored.sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);
	return scored.slice(0, TOP_ALLY_COUNT);
};

export const countRankedAllies = (incident: Incident, pool: Ally[]): number =>
	rankAllies(incident, pool).length;
