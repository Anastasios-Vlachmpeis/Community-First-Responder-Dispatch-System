import type { CertificationType } from "~/lib/types";

export type CertificationOption = {
	type: CertificationType;
	icon: string;
	label: string;
};

export const CERTIFICATION_OPTIONS: CertificationOption[] = [
	{ type: "cpr_aed", icon: "🫀", label: "CPR / AED Certified" },
	{ type: "medical_professional", icon: "🩺", label: "Medical Professional" },
	{ type: "water_rescue", icon: "🌊", label: "Water Rescue" },
	{ type: "mountain_wilderness_rescue", icon: "🏔️", label: "Mountain / Wilderness Rescue" },
	{ type: "fire_safety", icon: "🔥", label: "Fire Safety / First Responder" },
	{ type: "road_accident_response", icon: "🚗", label: "Road Traffic Accident Response" },
	{ type: "mental_health_first_aid", icon: "🧠", label: "Mental Health First Aid" },
];

export const certificationLabel = (type: CertificationType, customLabel?: string) => {
	if (type === "other") return customLabel?.trim() || "Other";
	return CERTIFICATION_OPTIONS.find((c) => c.type === type)?.label ?? type;
};

export const certificationIcon = (type: CertificationType) => {
	if (type === "other") return "➕";
	return CERTIFICATION_OPTIONS.find((c) => c.type === type)?.icon ?? "📋";
};
