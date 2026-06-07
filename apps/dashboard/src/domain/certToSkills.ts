import type { CertificationType, IncidentType } from "~/domain/types";

export const CERT_TO_SKILLS: Record<CertificationType, IncidentType[]> = {
	cpr_aed: ["cardiac-arrest", "choking", "breathing-difficulty", "drowning", "anaphylaxis"],
	medical_professional: [
		"cardiac-arrest",
		"stroke",
		"breathing-difficulty",
		"severe-bleeding",
		"seizure",
		"overdose",
		"diabetic-emergency",
		"anaphylaxis",
		"childbirth",
	],
	water_rescue: ["drowning"],
	mountain_wilderness_rescue: ["severe-bleeding", "drowning"],
	fire_safety: ["severe-bleeding", "building-fire", "gas-leak", "vehicle-fire", "suicide-attempt"],
	road_accident_response: ["severe-bleeding", "cardiac-arrest", "traffic-accident"],
	mental_health_first_aid: [
		"mental-health-crisis",
		"overdose",
		"language-barrier",
		"seizure",
		"assault",
		"robbery",
		"suicide-attempt",
	],
	law_enforcement_background: ["assault", "robbery", "traffic-accident", "suicide-attempt"],
	military_veteran: ["assault", "robbery", "traffic-accident", "suicide-attempt"],
	retired_firefighter: ["building-fire", "gas-leak", "vehicle-fire"],
	licensed_security: ["assault", "robbery"],
	crisis_negotiation: ["suicide-attempt", "mental-health-crisis"],
	off_duty_paramedic: ["traffic-accident", "cardiac-arrest", "severe-bleeding"],
	other: ["language-barrier"],
};

export const skillsFromCertifications = (types: CertificationType[]): IncidentType[] => {
	const set = new Set<IncidentType>();
	for (const type of types) for (const skill of CERT_TO_SKILLS[type]) set.add(skill);
	return [...set];
};
