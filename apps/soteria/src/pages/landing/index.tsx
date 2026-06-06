import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { BrandMark } from "~/components/brand-mark";
import { useSession } from "~/lib/session";

const AlertIcon = () => (
	<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
		<path
			d="M10 2.5L3.5 15h13L10 2.5z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
		<path d="M10 8.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		<circle cx="10" cy="13.5" r="0.75" fill="currentColor" />
	</svg>
);

const BadgeIcon = () => (
	<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
		<path
			d="M10 2l2.2 4.5 5 .7-3.6 3.5.9 5.2L10 13.8 5.5 16l.9-5.2L2.8 7.2l5-.7L10 2z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
	</svg>
);

const PinIcon = () => (
	<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
		<path
			d="M10 2.5c-2.8 0-5 2-5 4.5 0 3.5 5 10.5 5 10.5s5-7 5-10.5c0-2.5-2.2-4.5-5-4.5z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
		<circle cx="10" cy="7" r="1.75" stroke="currentColor" strokeWidth="1.5" />
	</svg>
);

const features = [
	{
		icon: <AlertIcon />,
		title: "Get alerted nearby",
		description: "Receive a call when an emergency happens close to you.",
	},
	{
		icon: <BadgeIcon />,
		title: "Share your skills",
		description: "List certifications so dispatch knows what you can help with.",
	},
	{
		icon: <PinIcon />,
		title: "Help your community",
		description: "Be the first responder before professional crews arrive.",
	},
] as const;

export const LandingPage = () => {
	const navigate = useNavigate();
	const { session } = useSession();

	useEffect(() => {
		if (!session.user) return;
		if (session.onboardingComplete) navigate("/profile", { replace: true });
		else navigate("/register/skills", { replace: true });
	}, [session.user, session.onboardingComplete, navigate]);

	if (session.user) return null;

	return (
		<div className="app-shell">
			<header className="px-5 pt-8">
				<div className="mx-auto w-full max-w-[400px]">
					<BrandMark size="lg" />
				</div>
			</header>

			<main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col px-5 pt-10">
				<div className="step-enter">
					<h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-ink">
						Respond when it matters.
					</h1>
					<p className="mt-3 text-base leading-relaxed text-muted">
						Join a network of trained volunteers who can help during emergencies in their
						area.
					</p>
				</div>

				<div className="mt-8 flex flex-col gap-3">
					{features.map((feature) => (
						<div key={feature.title} className="feature-card">
							<div className="feature-icon">{feature.icon}</div>
							<div>
								<p className="text-sm font-bold text-ink">{feature.title}</p>
								<p className="mt-0.5 text-sm leading-relaxed text-muted">
									{feature.description}
								</p>
							</div>
						</div>
					))}
				</div>
			</main>

			<footer className="app-footer">
				<div className="mx-auto w-full max-w-[400px]">
					<button
						type="button"
						onClick={() => navigate("/register")}
						className="btn-primary"
						aria-label="get started"
					>
						Get started
					</button>
					<p className="mt-4 text-center text-xs leading-relaxed text-muted">
						By continuing you agree to receive SMS alerts for nearby emergencies.
					</p>
				</div>
			</footer>
		</div>
	);
};
