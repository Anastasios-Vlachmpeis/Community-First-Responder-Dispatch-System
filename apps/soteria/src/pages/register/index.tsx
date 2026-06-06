import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { OnboardingLayout } from "~/components/onboarding-layout";
import { useSession } from "~/lib/session";
import type { User } from "~/lib/types";

type AuthPhase = "auth" | "name";

const mockOAuthNames: Record<"google" | "apple", { firstName: string; lastName: string }> = {
	google: { firstName: "Alex", lastName: "Morgan" },
	apple: { firstName: "Jordan", lastName: "Lee" },
};

export const RegisterPage = () => {
	const navigate = useNavigate();
	const { session, update } = useSession();
	const [phase, setPhase] = useState<AuthPhase>("auth");
	const [showEmail, setShowEmail] = useState(false);
	const [email, setEmail] = useState("");
	const [magicLinkSent, setMagicLinkSent] = useState(false);
	const [firstName, setFirstName] = useState(session.pendingFirstName);
	const [lastName, setLastName] = useState(session.pendingLastName);

	useEffect(() => {
		if (!session.user) return;
		if (session.onboardingComplete) navigate("/profile", { replace: true });
		else navigate("/register/skills", { replace: true });
	}, [session.user, session.onboardingComplete, navigate]);

	if (session.user) return null;

	const startOAuth = (provider: "google" | "apple") => {
		// TODO: POST to /api/auth/oauth
		const { firstName: first, lastName: last } = mockOAuthNames[provider];
		setFirstName(first);
		setLastName(last);
		update({ authProvider: provider, pendingFirstName: first, pendingLastName: last });
		setPhase("name");
	};

	const sendMagicLink = () => {
		if (!email.trim()) return;
		// TODO: POST to /api/auth/magic-link
		const first = email.split("@")[0];
		setMagicLinkSent(true);
		update({ authProvider: "email", pendingFirstName: first, pendingLastName: "" });
		setFirstName(first);
		setLastName("");
		setPhase("name");
	};

	const createAccount = () => {
		const first = firstName.trim();
		const last = lastName.trim();
		if (!first || !last) return;
		const user: User = {
			id: crypto.randomUUID(),
			firstName: first,
			lastName: last,
			email: session.authProvider === "email" ? email.trim() : undefined,
			createdAt: new Date().toISOString(),
		};
		// TODO: POST to /api/register
		update({ user, pendingFirstName: first, pendingLastName: last });
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
							className="text-sm font-medium text-navy/70"
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
								className="w-full rounded-xl border border-navy/20 bg-white px-3 py-3 text-base text-navy outline-none focus:border-navy"
								aria-label="email address"
							/>
							<button
								type="button"
								onClick={sendMagicLink}
								disabled={!email.trim()}
								className="min-h-14 w-full rounded-2xl bg-navy font-semibold text-white disabled:opacity-40"
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
						<h1 className="mb-2 text-2xl font-bold text-navy">Your name</h1>
						<p className="text-sm text-muted">
							Operators will see this on the dashboard when you're dispatched.
						</p>
					</div>
					<div className="flex flex-col gap-3 rounded-2xl bg-card p-4">
						<label
							htmlFor="first-name"
							className="text-xs font-medium tracking-wide text-muted uppercase"
						>
							First name
						</label>
						<input
							id="first-name"
							type="text"
							autoComplete="given-name"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							className="w-full rounded-xl border border-navy/20 bg-white px-3 py-3 text-base text-navy outline-none focus:border-navy"
							aria-label="first name"
						/>
						<label
							htmlFor="last-name"
							className="text-xs font-medium tracking-wide text-muted uppercase"
						>
							Last name
						</label>
						<input
							id="last-name"
							type="text"
							autoComplete="family-name"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							className="w-full rounded-xl border border-navy/20 bg-white px-3 py-3 text-base text-navy outline-none focus:border-navy"
							aria-label="last name"
						/>
					</div>
					<button
						type="button"
						onClick={createAccount}
						disabled={!firstName.trim() || !lastName.trim()}
						className="min-h-14 w-full rounded-2xl bg-navy font-semibold text-white disabled:opacity-40"
						aria-label="create account and continue"
					>
						Continue →
					</button>
				</div>
			)}
		</OnboardingLayout>
	);
};
