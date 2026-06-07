import type { CertificationType } from "~/domain/types";

export const NEW_CERTIFICATION_TYPES: CertificationType[] = [
	"law_enforcement_background",
	"military_veteran",
	"retired_firefighter",
	"licensed_security",
	"crisis_negotiation",
	"off_duty_paramedic",
];

export const CERTIFICATION_TYPES: CertificationType[] = [
	"cpr_aed",
	"medical_professional",
	"water_rescue",
	"mountain_wilderness_rescue",
	"fire_safety",
	"road_accident_response",
	"mental_health_first_aid",
	...NEW_CERTIFICATION_TYPES,
	"other",
];

export const CERTIFICATION_LABELS: Record<CertificationType, string> = {
	cpr_aed: "CPR / AED",
	medical_professional: "Medical Professional",
	water_rescue: "Water Rescue",
	mountain_wilderness_rescue: "Mountain / Wilderness Rescue",
	fire_safety: "Fire Safety / First Responder",
	road_accident_response: "Road Traffic Accident Response",
	mental_health_first_aid: "Mental Health First Aid",
	law_enforcement_background: "Ex-Police / Law Enforcement",
	military_veteran: "Military Veteran",
	retired_firefighter: "Retired Firefighter",
	licensed_security: "Licensed Security",
	crisis_negotiation: "Crisis Negotiator",
	off_duty_paramedic: "Off-Duty Paramedic",
	other: "Other",
};
