import { CERTIFICATION_LABELS } from "~/domain/certLabels";
import type { Certification, CertificationType, IncidentType } from "~/domain/types";

export type MatchedCert = {
	type: CertificationType;
	label: string;
	weight: number;
	verified: boolean;
};

export const INCIDENT_TYPE_CERT_WEIGHTS: Record<
	IncidentType,
	Partial<Record<CertificationType, number>>
> = {
	"cardiac-arrest": { medical_professional: 1.0, cpr_aed: 0.9, off_duty_paramedic: 0.95 },
	"breathing-difficulty": { medical_professional: 1.0, cpr_aed: 0.8 },
	stroke: { medical_professional: 1.0, cpr_aed: 0.7 },
	"severe-bleeding": { medical_professional: 1.0, cpr_aed: 0.7, off_duty_paramedic: 0.9 },
	seizure: { medical_professional: 0.9, cpr_aed: 0.6, mental_health_first_aid: 0.5 },
	overdose: { medical_professional: 0.9, mental_health_first_aid: 0.8, cpr_aed: 0.6 },
	drowning: { water_rescue: 1.0, medical_professional: 0.7, cpr_aed: 0.8 },
	"diabetic-emergency": { medical_professional: 1.0, cpr_aed: 0.5 },
	choking: { cpr_aed: 1.0, medical_professional: 0.8 },
	anaphylaxis: { medical_professional: 1.0, cpr_aed: 0.7 },
	childbirth: { medical_professional: 1.0, cpr_aed: 0.4 },
	"mental-health-crisis": {
		mental_health_first_aid: 1.0,
		crisis_negotiation: 0.95,
		medical_professional: 0.5,
		cpr_aed: 0.4,
	},
	"language-barrier": { mental_health_first_aid: 0.6, other: 0.5, medical_professional: 0.4 },
	"building-fire": { fire_safety: 1.0, retired_firefighter: 1.0, cpr_aed: 0.4 },
	"gas-leak": { fire_safety: 1.0, retired_firefighter: 0.95, cpr_aed: 0.4 },
	"vehicle-fire": { fire_safety: 1.0, retired_firefighter: 1.0, cpr_aed: 0.4 },
	assault: {
		mental_health_first_aid: 0.8,
		law_enforcement_background: 0.95,
		licensed_security: 0.9,
		military_veteran: 0.85,
		cpr_aed: 0.5,
	},
	robbery: {
		mental_health_first_aid: 0.8,
		law_enforcement_background: 0.95,
		licensed_security: 0.95,
		military_veteran: 0.8,
		cpr_aed: 0.5,
	},
	"traffic-accident": {
		road_accident_response: 1.0,
		off_duty_paramedic: 0.95,
		medical_professional: 0.7,
		law_enforcement_background: 0.7,
		military_veteran: 0.75,
		cpr_aed: 0.6,
	},
	"suicide-attempt": {
		mental_health_first_aid: 1.0,
		crisis_negotiation: 1.0,
		medical_professional: 0.8,
		law_enforcement_background: 0.6,
		military_veteran: 0.7,
		cpr_aed: 0.6,
		fire_safety: 0.4,
	},
};

export const getMatchedCerts = (
	incidentType: IncidentType,
	certifications: Certification[],
): MatchedCert[] => {
	const weights = INCIDENT_TYPE_CERT_WEIGHTS[incidentType];
	const res: MatchedCert[] = [];
	for (const cert of certifications) {
		const weight = weights[cert.type];
		if (weight == null) continue;
		res.push({
			type: cert.type,
			label:
				cert.type === "other"
					? (cert.customLabel ?? CERTIFICATION_LABELS.other)
					: CERTIFICATION_LABELS[cert.type],
			weight,
			verified: cert.verified,
		});
	}
	return res;
};

export const certRelevanceScore = (
	incidentType: IncidentType,
	certifications: Certification[],
): { score: number; matched: MatchedCert[] } => {
	const matched = getMatchedCerts(incidentType, certifications);
	if (matched.length === 0) return { score: 0, matched };
	let weightedSum = 0;
	let verifiedWeight = 0;
	for (const m of matched) {
		weightedSum += m.weight * (m.verified ? 1 : 0.5);
		verifiedWeight += m.weight;
	}
	return { score: weightedSum / Math.max(1, verifiedWeight), matched };
};
