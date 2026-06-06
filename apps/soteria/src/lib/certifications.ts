import type { CertificationType } from "~/lib/types";

export type CertificationOption = {
	type: CertificationType;
	label: string;
};

export type CertificationGroup = {
	label: string;
	options: CertificationOption[];
};

export const CERTIFICATION_GROUPS: CertificationGroup[] = [
	{
		label: "Medical",
		options: [
			{ type: "cpr_aed", label: "CPR / AED" },
			{ type: "first_aid", label: "First Aid" },
			{ type: "medical_professional", label: "Medical Professional" },
		],
	},
	{
		label: "Rescue",
		options: [
			{ type: "water_rescue", label: "Water Rescue" },
			{ type: "mountain_rescue", label: "Mountain Rescue" },
		],
	},
];

export const ALL_CERTIFICATION_OPTIONS = CERTIFICATION_GROUPS.flatMap((g) => g.options);

const labels: Record<CertificationType, string> = {
	cpr_aed: "CPR / AED",
	first_aid: "First Aid",
	medical_professional: "Medical Professional",
	water_rescue: "Water Rescue",
	mountain_rescue: "Mountain Rescue",
};

export const certificationLabel = (type: CertificationType) => labels[type];
