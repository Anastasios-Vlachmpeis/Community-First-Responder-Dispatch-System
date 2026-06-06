import { certificationLabel } from "~/lib/certifications";
import { computeTrustLevel } from "~/lib/trust";
import type { Certification, TrustLevel, User } from "~/lib/types";

type TrustBadgeVariant = "inline" | "large";

type TrustBadgeProps = {
	accountStatus: User["accountStatus"];
	certifications: Certification[];
	variant?: TrustBadgeVariant;
};

type TrustStyle = {
	icon: string;
	label: string;
	container: string;
};

const trustStyles: Record<TrustLevel, TrustStyle> = {
	unverified: {
		icon: "⚠️",
		label: "Unverified",
		container: "bg-gray-100 text-gray-700 border-gray-200",
	},
	partial: {
		icon: "🟡",
		label: "Partially verified",
		container: "bg-yellow-50 text-yellow-800 border-yellow-200",
	},
	id_verified: {
		icon: "🔵",
		label: "ID Verified",
		container: "bg-blue-50 text-blue-800 border-blue-200",
	},
	fully_verified: {
		icon: "✅",
		label: "Fully Verified",
		container: "bg-green-50 text-green-800 border-green-200",
	},
};

const certStatusLabel: Record<Certification["status"], string> = {
	self_reported: "Self-reported",
	pending_review: "Pending review",
	verified: "Verified",
	rejected: "Rejected",
};

export const TrustBadge = ({
	accountStatus,
	certifications,
	variant = "inline",
}: TrustBadgeProps) => {
	const level = computeTrustLevel(accountStatus, certifications);
	const style = trustStyles[level];

	if (variant === "inline")
		return (
			<span
				className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.container}`}
				aria-label={`trust level: ${style.label}`}
			>
				<span aria-hidden="true">{style.icon}</span>
				{style.label}
			</span>
		);

	return (
		<div className="flex flex-col gap-4">
			<div
				className={`inline-flex items-center gap-2 self-start rounded-2xl border px-4 py-3 text-base font-semibold ${style.container}`}
				aria-label={`trust level: ${style.label}`}
			>
				<span className="text-xl" aria-hidden="true">
					{style.icon}
				</span>
				{style.label}
			</div>
			<div className="rounded-2xl bg-card p-4">
				<p className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">Account</p>
				<p className="text-sm text-navy capitalize">{accountStatus.replace("_", " ")}</p>
			</div>
			{certifications.length > 0 && (
				<div className="rounded-2xl bg-card p-4">
					<p className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">
						Certifications
					</p>
					<ul className="flex flex-col gap-2">
						{certifications.map((cert) => (
							<li key={cert.id} className="flex items-center justify-between text-sm text-navy">
								<span>{certificationLabel(cert.type, cert.customLabel)}</span>
								<span className="text-muted">{certStatusLabel[cert.status]}</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};
