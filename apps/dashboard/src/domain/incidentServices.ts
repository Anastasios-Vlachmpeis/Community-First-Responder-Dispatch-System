import type { IncidentType, ServiceType } from "~/domain/types";

export const INCIDENT_SERVICES: Record<IncidentType, ServiceType[]> = {
	"cardiac-arrest": ["ambulance"],
	"breathing-difficulty": ["ambulance"],
	stroke: ["ambulance"],
	"severe-bleeding": ["ambulance"],
	seizure: ["ambulance"],
	overdose: ["ambulance"],
	drowning: ["ambulance", "police", "fire-engine"],
	"diabetic-emergency": ["ambulance"],
	choking: ["ambulance"],
	anaphylaxis: ["ambulance"],
	childbirth: ["ambulance"],
	"mental-health-crisis": ["ambulance"],
	"language-barrier": ["ambulance"],
	"building-fire": ["fire-engine"],
	"gas-leak": ["fire-engine", "police"],
	"vehicle-fire": ["fire-engine"],
	assault: ["police"],
	robbery: ["police"],
	"traffic-accident": ["ambulance", "police"],
	"suicide-attempt": ["ambulance", "police", "fire-engine"],
};

export const INCIDENT_TYPES = Object.keys(INCIDENT_SERVICES) as IncidentType[];

export const TYPE_LABEL: Record<IncidentType, string> = {
	"cardiac-arrest": "Cardiac Arrest",
	"breathing-difficulty": "Breathing Difficulty",
	stroke: "Stroke",
	"severe-bleeding": "Severe Bleeding",
	seizure: "Seizure",
	overdose: "Overdose / Poisoning",
	drowning: "Drowning",
	"diabetic-emergency": "Diabetic Emergency",
	choking: "Choking",
	anaphylaxis: "Anaphylaxis",
	childbirth: "Childbirth Emergency",
	"mental-health-crisis": "Mental Health Crisis",
	"language-barrier": "Language Barrier",
	"building-fire": "Building Fire",
	"gas-leak": "Gas Leak",
	"vehicle-fire": "Vehicle Fire",
	assault: "Assault",
	robbery: "Robbery",
	"traffic-accident": "Traffic Accident",
	"suicide-attempt": "Suicide Attempt",
};
