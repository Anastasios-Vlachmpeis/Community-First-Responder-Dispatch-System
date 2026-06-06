export type AccountVerificationStatus = "unverified" | "pending_review" | "verified";

export type CertificationStatus = "self_reported" | "pending_review" | "verified" | "rejected";

export type CertificationType =
	| "cpr_aed"
	| "medical_professional"
	| "water_rescue"
	| "mountain_wilderness_rescue"
	| "fire_safety"
	| "road_accident_response"
	| "mental_health_first_aid"
	| "other";

export type TrustLevel = "unverified" | "partial" | "id_verified" | "fully_verified";

export type User = {
	id: string;
	displayName: string;
	email?: string;
	phone?: string;
	accountStatus: AccountVerificationStatus;
	verifiedAt?: string;
	createdAt: string;
};

export type Certification = {
	id: string;
	type: CertificationType;
	customLabel?: string;
	status: CertificationStatus;
	documentUrl?: string;
	verifiedAt?: string;
	verifiedBy?: string;
	rejectionReason?: string;
};

export type ResponderProfile = {
	user: User;
	certifications: Certification[];
	trustLevel: TrustLevel;
};
