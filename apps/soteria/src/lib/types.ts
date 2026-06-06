export type CertificationStatus =
	| "self_reported"
	| "pending_review"
	| "verified"
	| "rejected";

export type CertificationType =
	| "cpr_aed"
	| "first_aid"
	| "medical_professional"
	| "water_rescue"
	| "mountain_rescue";

export type User = {
	id: string;
	firstName: string;
	lastName: string;
	phone: string;
	dateOfBirth: string;
	createdAt: string;
};

export type Certification = {
	id: string;
	type: CertificationType;
	status: CertificationStatus;
	documentUrl?: string;
	rejectionReason?: string;
	verifiedAt?: string;
};

export type ResponderProfile = {
	user: User;
	certifications: Certification[];
};
