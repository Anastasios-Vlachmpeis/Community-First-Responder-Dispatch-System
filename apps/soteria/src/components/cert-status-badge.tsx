import type { CertificationStatus } from "~/lib/types";

type CertStatusBadgeProps = {
	status: CertificationStatus;
};

const statusDisplay: Record<
	CertificationStatus,
	{ icon: string; label: string; className: string }
> = {
	unverified: { icon: "🔘", label: "Unverified", className: "text-muted" },
	verified: { icon: "✅", label: "Verified", className: "text-green-700" },
};

export const CertStatusBadge = ({ status }: CertStatusBadgeProps) => {
	const display = statusDisplay[status];
	return (
		<span className={`text-xs font-medium ${display.className}`}>
			<span aria-hidden="true">{display.icon}</span> {display.label}
		</span>
	);
};
