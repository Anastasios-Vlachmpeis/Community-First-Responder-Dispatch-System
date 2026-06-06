import { Check } from "lucide-react";

import { SkillIcon } from "~/components/skill-icon";
import type { CertificationType } from "~/lib/types";

type CertCardProps = {
	type: CertificationType;
	label: string;
	selected: boolean;
	onToggle: () => void;
};

export const CertCard = ({ type, label, selected, onToggle }: CertCardProps) => (
	<button
		type="button"
		onClick={onToggle}
		aria-pressed={selected}
		aria-label={label}
		className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${
			selected
				? "border-brand bg-brand/5"
				: "border-transparent bg-card hover:bg-brand/5"
		}`}
	>
		<span
			className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
				selected ? "bg-brand text-white" : "bg-input text-brand"
			}`}
		>
			<SkillIcon type={type} size={18} />
		</span>
		<span className="flex-1 text-sm font-medium text-ink">{label}</span>
		<span
			className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
				selected ? "border-brand bg-brand text-white" : "border-surface bg-white"
			}`}
			aria-hidden="true"
		>
			{selected && <Check size={12} strokeWidth={3} />}
		</span>
	</button>
);
