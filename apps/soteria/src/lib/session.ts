import { useCallback, useState } from "react";

import type { Certification, User } from "~/lib/types";

const STORAGE_KEY = "soteria-session";

export type SessionData = {
	user: User | null;
	certifications: Certification[];
	onboardingComplete: boolean;
	pendingFirstName: string;
	pendingLastName: string;
	authProvider: "google" | "apple" | "email" | null;
};

const initialSession = (): SessionData => ({
	user: null,
	certifications: [],
	onboardingComplete: false,
	pendingFirstName: "",
	pendingLastName: "",
	authProvider: null,
});

type LegacyCertificationStatus =
	| Certification["status"]
	| "self_reported"
	| "pending_review"
	| "rejected";

const migrateCertification = (raw: unknown): Certification => {
	const cert = raw as Certification;
	const legacyStatus = (raw as { status: LegacyCertificationStatus }).status;
	if (legacyStatus === "verified") return cert;
	if (
		(legacyStatus === "pending_review" || legacyStatus === "self_reported") &&
		cert.documentUrl
	)
		return {
			...cert,
			status: "verified",
			verifiedAt: cert.verifiedAt ?? new Date().toISOString(),
		};
	return { ...cert, status: "unverified" };
};

export const loadSession = (): SessionData => {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return initialSession();
		const parsed = JSON.parse(raw) as Partial<SessionData>;
		const certifications = parsed.certifications?.map(migrateCertification) ?? [];
		return { ...initialSession(), ...parsed, certifications };
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

	const verifyCertification = useCallback((certId: string, documentUrl: string) => {
		setSession((prev) => {
			const certifications = prev.certifications.map((cert) =>
				cert.id === certId
					? {
							...cert,
							status: "verified" as const,
							documentUrl,
							verifiedAt: new Date().toISOString(),
						}
					: cert,
			);
			const next = { ...prev, certifications };
			saveSession(next);
			return next;
		});
	}, []);

	return { session, update, updateUser, setCertifications, verifyCertification };
};
