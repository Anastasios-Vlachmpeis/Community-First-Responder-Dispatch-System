type CertCardProps = {
	icon: string;
	label: string;
	selected: boolean;
	onToggle: () => void;
};

export const CertCard = ({ icon, label, selected, onToggle }: CertCardProps) => (
	<button
		type="button"
		onClick={onToggle}
		aria-pressed={selected}
		aria-label={label}
		className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-all ${
			selected ? "border-navy bg-navy/5 shadow-sm" : "border-transparent bg-card hover:bg-navy/5"
		}`}
	>
		<span className="text-2xl" aria-hidden="true">
			{icon}
		</span>
		<span className="text-sm leading-snug font-medium text-navy">{label}</span>
	</button>
);
