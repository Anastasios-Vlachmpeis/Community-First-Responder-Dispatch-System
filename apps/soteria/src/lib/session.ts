import { useCallback, useState } from "react";

import type { Certification, User } from "~/lib/types";

const STORAGE_KEY = "soteria-session";

export type VerifyDraft = {
	idCardImage?: string;
	selfieImage?: string;
};

export type SessionData = {
	user: User | null;
	certifications: Certification[];
	onboardingComplete: boolean;
	verifyDraft: VerifyDraft;
	pendingDisplayName: string;
	authProvider: "google" | "apple" | "email" | null;
};

const initialSession = (): SessionData => ({
	user: null,
	certifications: [],
	onboardingComplete: false,
	verifyDraft: {},
	pendingDisplayName: "",
	authProvider: null,
});

export const loadSession = (): SessionData => {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return initialSession();
		return { ...initialSession(), ...(JSON.parse(raw) as Partial<SessionData>) };
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

	return { session, update, updateUser, setCertifications };
};
