import { useCallback, useState } from "react";

import {
	availabilityUntil,
	inferAvailableSince,
	isAvailable,
	type AvailabilityDuration,
} from "~/lib/availability";
import type { Certification, CertificationType, User } from "~/lib/types";

const STORAGE_KEY = "soteria-session";

const VALID_TYPES = new Set<CertificationType>([
	"cpr_aed",
	"first_aid",
	"medical_professional",
	"water_rescue",
	"mountain_rescue",
]);

const TYPE_MIGRATIONS: Record<string, CertificationType | null> = {
	mountain_wilderness_rescue: "mountain_rescue",
	fire_safety: null,
	road_accident_response: null,
	mental_health_first_aid: null,
	other: null,
};

export type SignupState = {
	phone: string;
	phoneVerified: boolean;
};

export type SessionData = {
	user: User | null;
	certifications: Certification[];
	onboardingComplete: boolean;
	signup: SignupState | null;
	availableUntil: string | null;
	availableSince: string | null;
	availabilityDuration: AvailabilityDuration | null;
};

const initialSession = (): SessionData => ({
	user: null,
	certifications: [],
	onboardingComplete: false,
	signup: null,
	availableUntil: null,
	availableSince: null,
	availabilityDuration: null,
});

const expireAvailability = (until: string | null | undefined): string | null =>
	until && isAvailable(until) ? until : null;

type LegacyCertificationStatus =
	| Certification["status"]
	| "unverified"
	| "verified";

const migrateCertification = (raw: unknown): Certification | null => {
	const cert = raw as {
		id: string;
		status: LegacyCertificationStatus;
		customLabel?: string;
		type: string;
		documentUrl?: string;
		rejectionReason?: string;
		verifiedAt?: string;
	};
	const migratedType = TYPE_MIGRATIONS[cert.type] ?? cert.type;
	if (!VALID_TYPES.has(migratedType as CertificationType)) return null;

	const status: Certification["status"] =
		cert.status === "unverified"
			? cert.documentUrl
				? "pending_review"
				: "self_reported"
			: cert.status === "verified" ||
				  cert.status === "self_reported" ||
				  cert.status === "pending_review" ||
				  cert.status === "rejected"
				? cert.status
				: "self_reported";

	const { customLabel: _, ...rest } = cert;
	return { ...rest, type: migratedType as CertificationType, status };
};

const migrateUser = (raw: unknown): User | null => {
	if (!raw) return null;
	const user = raw as User & {
		email?: string;
		nationality?: string;
		passportNumber?: string;
		address?: string;
		dateOfBirth?: string;
		phone?: string;
	};
	if (user.dateOfBirth && user.phone)
		return {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			phone: user.phone,
			dateOfBirth: user.dateOfBirth,
			createdAt: user.createdAt,
		};
	return null;
};

export const loadSession = (): SessionData => {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return initialSession();
		const parsed = JSON.parse(raw) as Partial<SessionData> & {
			pendingFirstName?: string;
			pendingLastName?: string;
			authProvider?: string;
		};
		const certifications =
			parsed.certifications?.map(migrateCertification).filter((c) => c !== null) ?? [];
		const user = migrateUser(parsed.user);
		const availableUntil = expireAvailability(parsed.availableUntil);
		const availabilityDuration = availableUntil
			? (parsed.availabilityDuration ?? null)
			: null;
		const availableSince = availableUntil
			? (parsed.availableSince ??
				inferAvailableSince(availableUntil, availabilityDuration))
			: null;
		return {
			...initialSession(),
			...parsed,
			user,
			certifications,
			signup: parsed.signup ?? null,
			availableUntil,
			availableSince,
			availabilityDuration,
		};
	} catch {
		return initialSession();
	}
};

export const saveSession = (data: SessionData) => {
	sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const useSession = () => {
	const [session, setSession] = useState(loadSession);

	const update = useCallback((patch: Partial<SessionData>) => {
		setSession((prev) => {
			const next = { ...prev, ...patch };
			saveSession(next);
			return next;
		});
	}, []);

	const updateUser = useCallback((patch: Partial<User>) => {
		setSession((prev) => {
			if (!prev.user) return prev;
			const next = { ...prev, user: { ...prev.user, ...patch } };
			saveSession(next);
			return next;
		});
	}, []);

	const setCertifications = useCallback((certifications: Certification[]) => {
		setSession((prev) => {
			const next = { ...prev, certifications };
			saveSession(next);
			return next;
		});
	}, []);

	const addCertification = useCallback((type: CertificationType) => {
		setSession((prev) => {
			if (prev.certifications.some((c) => c.type === type)) return prev;
			const certifications = [
				...prev.certifications,
				{ id: crypto.randomUUID(), type, status: "self_reported" as const },
			];
			const next = { ...prev, certifications };
			saveSession(next);
			return next;
		});
	}, []);

	const setAvailability = useCallback((duration: AvailabilityDuration) => {
		setSession((prev) => {
			const next = {
				...prev,
				availableUntil: availabilityUntil(duration),
				availableSince: new Date().toISOString(),
				availabilityDuration: duration,
			};
			saveSession(next);
			return next;
		});
	}, []);

	const clearAvailability = useCallback(() => {
		setSession((prev) => {
			const next = {
				...prev,
				availableUntil: null,
				availableSince: null,
				availabilityDuration: null,
			};
			saveSession(next);
			return next;
		});
	}, []);

	const submitCertificationDocument = useCallback((certId: string, documentUrl: string) => {
		setSession((prev) => {
			const certifications = prev.certifications.map((cert) =>
				cert.id === certId
					? {
							...cert,
							status: "pending_review" as const,
							documentUrl,
							rejectionReason: undefined,
						}
					: cert,
			);
			const next = { ...prev, certifications };
			saveSession(next);
			return next;
		});
	}, []);

	return {
		session,
		update,
		updateUser,
		setCertifications,
		addCertification,
		setAvailability,
		clearAvailability,
		submitCertificationDocument,
	};
};
