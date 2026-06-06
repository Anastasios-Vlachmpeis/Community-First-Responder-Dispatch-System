import { Link } from "react-router-dom";

import { AppLayout } from "~/components/app-layout";
import { TrustBadge } from "~/components/trust-badge";
import { certificationIcon, certificationLabel } from "~/lib/certifications";
import { useSession } from "~/lib/session";
import { buildResponderProfile } from "~/lib/trust";
import { useRequireAuth } from "~/lib/use-require-auth";

const certStatusStyles: Record<string, string> = {
	self_reported: "text-muted",
	pending_review: "text-yellow-700",
	verified: "text-green-700",
	rejected: "text-red-600",
};

const certStatusLabels: Record<string, string> = {
	self_reported: "Self-reported",
	pending_review: "Under review",
	verified: "Verified",
	rejected: "Rejected",
};

export const ProfilePage = () => {
	const { session } = useSession();
	useRequireAuth(session);
	if (!session.user) return null;

	const profile = buildResponderProfile(session.user, session.certifications);
	const { user } = profile;
	const showVerifyBanner =
		user.accountStatus === "unverified" || user.accountStatus === "pending_review";

	return (
		<AppLayout title="Profile">
			<div className="flex flex-col gap-6">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-navy">{user.displayName}</h1>
						{user.email && <p className="text-sm text-muted">{user.email}</p>}
					</div>
					<TrustBadge
						accountStatus={user.accountStatus}
						certifications={session.certifications}
						variant="inline"
					/>
				</div>

				{showVerifyBanner && (
					<Link
						to="/profile/verify"
						className="block rounded-2xl bg-teal/10 p-4 transition-colors hover:bg-teal/15"
						aria-label="get verified"
					>
						<p className="mb-1 text-sm font-semibold text-navy">
							{user.accountStatus === "pending_review"
								? "Verification in progress"
								: "Get Verified"}
						</p>
						<p className="text-xs leading-relaxed text-muted">
							{user.accountStatus === "pending_review"
								? "Your identity documents are being reviewed — usually within 24 hours."
								: "Confirm your identity with a government ID to build operator trust."}
						</p>
					</Link>
				)}

				<TrustBadge
					accountStatus={user.accountStatus}
					certifications={session.certifications}
					variant="large"
				/>

				{session.certifications.length > 0 && (
					<div className="flex flex-col gap-3">
						<h2 className="text-sm font-semibold text-navy">Your qualifications</h2>
						{session.certifications.map((cert) => (
							<div
								key={cert.id}
								className="flex items-center justify-between rounded-2xl bg-card px-4 py-3"
							>
								<div className="flex items-center gap-2">
									<span aria-hidden="true">{certificationIcon(cert.type)}</span>
									<span className="text-sm text-navy">
										{certificationLabel(cert.type, cert.customLabel)}
									</span>
								</div>
								<span className={`text-xs font-medium ${certStatusStyles[cert.status]}`}>
									{certStatusLabels[cert.status]}
								</span>
							</div>
						))}
					</div>
				)}

				{user.accountStatus === "verified" && user.verifiedAt && (
					<p className="text-xs text-muted">
						Identity verified on {new Date(user.verifiedAt).toLocaleDateString()}
					</p>
				)}
			</div>
		</AppLayout>
	);
};
