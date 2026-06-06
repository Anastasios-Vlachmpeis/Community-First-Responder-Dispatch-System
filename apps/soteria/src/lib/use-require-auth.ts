import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import type { SessionData } from "~/lib/session";

export const useRequireAuth = (session: SessionData, redirect = "/register") => {
	const navigate = useNavigate();
	useEffect(() => {
		if (!session.user) navigate(redirect, { replace: true });
	}, [session.user, redirect, navigate]);
};

export const useRequireOnboarding = (session: SessionData) => {
	const navigate = useNavigate();
	useEffect(() => {
		if (!session.user) navigate("/register", { replace: true });
		else if (session.onboardingComplete) navigate("/profile", { replace: true });
	}, [session.user, session.onboardingComplete, navigate]);
};
