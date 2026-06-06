import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import type { SessionData } from "~/lib/session";

export const useRequireAuth = (session: SessionData, redirect = "/register") => {
	const navigate = useNavigate();
	useEffect(() => {
		if (!session.user) navigate(redirect, { replace: true });
	}, [session.user, redirect, navigate]);
};
