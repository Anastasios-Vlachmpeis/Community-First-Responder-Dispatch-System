import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { OnboardingLayout } from "~/components/onboarding-layout";
import { useSession } from "~/lib/session";
import type { User } from "~/lib/types";

type AuthPhase = "auth" | "display-name";

const mockOAuthName: Record<"google" | "apple", string> = {
	google: "Alex Morgan",
	apple: "Jordan Lee",
};

export const RegisterPage = () => {
	const navigate = useNavigate();
	const { session, update } = useSession();
	const [phase, setPhase] = useState<AuthPhase>("auth");
	const [showEmail, setShowEmail] = useState(false);
	const [email, setEmail] = useState("");
	const [magicLinkSent, setMagicLinkSent] = useState(false);
	const [displayName, setDisplayName] = useState(session.pendingDisplayName);

	useEffect(() => {
		if (!session.user) return;
		if (session.onboardingComplete) navigate("/profile", { replace: true });
		else navigate("/register/skills", { replace: true });
	}, [session.user, session.onboardingComplete, navigate]);

	if (session.user) return null;

	const startOAuth = (provider: "google" | "apple") => {
		// TODO: POST to /api/auth/oauth
		setDisplayName(mockOAuthName[provider]);
		update({ authProvider: provider, pendingDisplayName: mockOAuthName[provider] });
		setPhase("display-name");
	};

	const sendMagicLink = () => {
		if (!email.trim()) return;
		// TODO: POST to /api/auth/magic-link
		setMagicLinkSent(true);
		update({ authProvider: "email", pendingDisplayName: email.split("@")[0] });
		setDisplayName(email.split("@")[0]);
		setPhase("display-name");
	};

	const createAccount = () => {
		const name = displayName.trim();
		if (!name) return;
		const user: User = {
			id: crypto.randomUUID(),
			displayName: name,
			email: session.authProvider === "email" ? email.trim() : undefined,
			accountStatus: "unverified",
			createdAt: new Date().toISOString(),
		};
		// TODO: POST to /api/register
		update({ user, pendingDisplayName: name });
		navigate("/register/skills");
	};

	return (
		<OnboardingLayout phase={1}>
			{phase === "auth" ? (
				<div className="flex flex-col gap-6">
					<div>
						<h1 className="mb-2 text-2xl font-bold text-navy">Join Soteria</h1>
						<p className="text-sm text-muted">
							Help your community in emergencies. Sign up in under a minute.
						</p>
					</div>

					<div className="flex flex-col gap-3">
						<button
							type="button"
							onClick={() => startOAuth("google")}
							className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-navy/10 bg-white font-semibold text-navy"
							aria-label="continue with google"
						>
							<span aria-hidden="true">G</span>
							Continue with Google
						</button>
						<button
							type="button"
							onClick={() => startOAuth("apple")}
							className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-navy font-semibold text-white"
							aria-label="continue with apple"
						>
							<span aria-hidden="true">&#63743;</span>
							Continue with Apple
						</button>
					</div>

					<div className="flex items-center gap-3">
						<div className="h-px flex-1 bg-navy/10" />
						<span className="text-xs text-muted">or</span>
						<div className="h-px flex-1 bg-navy/10" />
					</div>

					{!showEmail ? (
						<button
							type="button"
							onClick={() => setShowEmail(true)}
							className="text-sm font-medium text-teal"
							aria-label="use email instead"
						>
							Use email instead
						</button>
					) : (
						<div className="flex flex-col gap-3 rounded-2xl bg-card p-4">
							<label
								htmlFor="email"
								className="text-xs font-medium tracking-wide text-muted uppercase"
							>
								Email address
							</label>
							<input
								id="email"
								type="email"
								inputMode="email"
								autoComplete="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								className="w-full rounded-xl border border-teal/30 bg-white px-3 py-3 text-base text-navy outline-none focus:border-teal"
								aria-label="email address"
							/>
							<button
								type="button"
								onClick={sendMagicLink}
								disabled={!email.trim()}
								className="min-h-14 w-full rounded-2xl bg-teal font-semibold text-white disabled:opacity-40"
								aria-label="send magic link"
							>
								{magicLinkSent ? "Link sent — check your email" : "Send magic link"}
							</button>
						</div>
					)}
				</div>
			) : (
				<div className="flex flex-col gap-6">
					<div>
						<h1 className="mb-2 text-2xl font-bold text-navy">What should we call you?</h1>
						<p className="text-sm text-muted">
							This is how operators and other responders will see you.
						</p>
					</div>
					<div className="rounded-2xl bg-card p-4">
						<label
							htmlFor="display-name"
							className="mb-2 block text-xs font-medium tracking-wide text-muted uppercase"
						>
							Display name
						</label>
						<input
							id="display-name"
							type="text"
							autoComplete="name"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							className="w-full rounded-xl border border-teal/30 bg-white px-3 py-3 text-base text-navy outline-none focus:border-teal"
							aria-label="display name"
						/>
					</div>
					<button
						type="button"
						onClick={createAccount}
						disabled={!displayName.trim()}
						className="min-h-14 w-full rounded-2xl bg-teal font-semibold text-white disabled:opacity-40"
						aria-label="create account and continue"
					>
						Continue →
					</button>
				</div>
			)}
		</OnboardingLayout>
	);
};
