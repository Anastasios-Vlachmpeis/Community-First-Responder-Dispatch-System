import {
	Bandage,
	HeartPulse,
	Mountain,
	Stethoscope,
	Waves,
	type LucideProps,
} from "lucide-react";

import type { CertificationType } from "~/lib/types";

const icons = {
	cpr_aed: HeartPulse,
	first_aid: Bandage,
	medical_professional: Stethoscope,
	water_rescue: Waves,
	mountain_rescue: Mountain,
} as const;

type SkillIconProps = LucideProps & {
	type: CertificationType;
};

export const SkillIcon = ({ type, size = 20, strokeWidth = 1.75, ...props }: SkillIconProps) => {
	const Icon = icons[type];
	return <Icon size={size} strokeWidth={strokeWidth} aria-hidden {...props} />;
};
