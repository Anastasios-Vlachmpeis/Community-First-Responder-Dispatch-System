import type { CertificationStatus } from "~/lib/types";

type CertStatusBadgeProps = {
	status: CertificationStatus;
};

const statusDisplay: Record<
	CertificationStatus,
	{ label: string; className: string }
> = {
	self_reported: { label: "Self-reported", className: "bg-surface text-ink" },
	pending_review: { label: "Pending review", className: "bg-accent/10 text-accent" },
	verified: { label: "Verified", className: "bg-emerald-100 text-emerald-800" },
	rejected: { label: "Rejected", className: "bg-danger/10 text-danger" },
};

export const CertStatusBadge = ({ status }: CertStatusBadgeProps) => {
	const display = statusDisplay[status];
	return (
		<span
			className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${display.className}`}
		>
			{display.label}
		</span>
	);
};
