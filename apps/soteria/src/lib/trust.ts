import type { Certification, ResponderProfile, TrustLevel, User } from "~/lib/types";

export const computeTrustLevel = (
	accountStatus: User["accountStatus"],
	certifications: Certification[],
): TrustLevel => {
	const accountVerified = accountStatus === "verified";
	const allSelfReported =
		certifications.length === 0 || certifications.every((c) => c.status === "self_reported");
	const anyVerifiedCert = certifications.some((c) => c.status === "verified");
	const allCertsVerified =
		certifications.length > 0 && certifications.every((c) => c.status === "verified");

	if (!accountVerified && allSelfReported) return "unverified";
	if (!accountVerified && anyVerifiedCert) return "partial";
	if (accountVerified && allCertsVerified) return "fully_verified";
	if (accountVerified) return "id_verified";
	return "unverified";
};

export const buildResponderProfile = (
	user: User,
	certifications: Certification[],
): ResponderProfile => ({
	user,
	certifications,
	trustLevel: computeTrustLevel(user.accountStatus, certifications),
});
