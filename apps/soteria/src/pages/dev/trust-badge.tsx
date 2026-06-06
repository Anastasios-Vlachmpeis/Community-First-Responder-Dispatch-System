import { TrustBadge } from "~/components/trust-badge";
import type { Certification } from "~/lib/types";

const selfReportedCerts: Certification[] = [
	{ id: "1", type: "cpr_aed", status: "self_reported" },
	{ id: "2", type: "fire_safety", status: "self_reported" },
];

const partialCerts: Certification[] = [
	{ id: "1", type: "cpr_aed", status: "verified", verifiedAt: new Date().toISOString() },
	{ id: "2", type: "water_rescue", status: "self_reported" },
];

const idVerifiedCerts: Certification[] = [
	{ id: "1", type: "cpr_aed", status: "self_reported" },
	{ id: "2", type: "medical_professional", status: "self_reported" },
];

const fullyVerifiedCerts: Certification[] = [
	{ id: "1", type: "cpr_aed", status: "verified", verifiedAt: new Date().toISOString() },
	{
		id: "2",
		type: "medical_professional",
		status: "verified",
		verifiedAt: new Date().toISOString(),
	},
];

const scenarios = [
	{
		title: "Unverified",
		description: "unverified account + all self_reported certs",
		accountStatus: "unverified" as const,
		certifications: selfReportedCerts,
	},
	{
		title: "Partially verified",
		description: "unverified account + any verified cert",
		accountStatus: "unverified" as const,
		certifications: partialCerts,
	},
	{
		title: "ID Verified",
		description: "verified account + all self_reported certs",
		accountStatus: "verified" as const,
		certifications: idVerifiedCerts,
	},
	{
		title: "Fully Verified",
		description: "verified account + all certs verified",
		accountStatus: "verified" as const,
		certifications: fullyVerifiedCerts,
	},
];

export const TrustBadgeDevPage = () => (
	<div className="min-h-full bg-white px-4 py-8">
		<div className="mx-auto flex max-w-[480px] flex-col gap-8">
			<div>
				<h1 className="mb-1 text-2xl font-bold text-navy">TrustBadge QA</h1>
				<p className="text-sm text-muted">All four trust states for visual review.</p>
			</div>

			{scenarios.map((scenario) => (
				<section
					key={scenario.title}
					className="flex flex-col gap-4 rounded-2xl border border-navy/10 p-4"
				>
					<div>
						<h2 className="font-semibold text-navy">{scenario.title}</h2>
						<p className="text-xs text-muted">{scenario.description}</p>
					</div>
					<div>
						<p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
							Inline (dashboard list)
						</p>
						<TrustBadge
							accountStatus={scenario.accountStatus}
							certifications={scenario.certifications}
							variant="inline"
						/>
					</div>
					<div>
						<p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
							Large (profile modal)
						</p>
						<TrustBadge
							accountStatus={scenario.accountStatus}
							certifications={scenario.certifications}
							variant="large"
						/>
					</div>
				</section>
			))}
		</div>
	</div>
);
