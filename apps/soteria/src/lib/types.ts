export type CertificationStatus = "unverified" | "verified";

export type CertificationType =
	| "cpr_aed"
	| "medical_professional"
	| "water_rescue"
	| "mountain_wilderness_rescue"
	| "fire_safety"
	| "road_accident_response"
	| "mental_health_first_aid"
	| "other";

export type User = {
	id: string;
	firstName: string;
	lastName: string;
	email?: string;
	phone?: string;
	createdAt: string;
};

export type Certification = {
	id: string;
	type: CertificationType;
	customLabel?: string;
	status: CertificationStatus;
	documentUrl?: string;
	verifiedAt?: string;
};

export type ResponderProfile = {
	user: User;
	certifications: Certification[];
};
