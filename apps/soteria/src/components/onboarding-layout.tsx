import type { ReactNode } from "react";

type OnboardingLayoutProps = {
	phase: 1 | 2;
	children: ReactNode;
};

const phaseLabels: Record<1 | 2, string> = {
	1: "Sign up",
	2: "Your skills",
};

export const OnboardingLayout = ({ phase, children }: OnboardingLayoutProps) => (
	<div className="flex min-h-full flex-col bg-white">
		<header className="sticky top-0 z-40 border-b border-navy/5 bg-white">
			<div className="mx-auto flex max-w-[480px] items-center justify-between px-4 py-3">
				<div className="flex items-center gap-2">
					<div
						className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white"
						aria-hidden="true"
					>
						S
					</div>
					<span className="text-sm font-bold tracking-wide text-navy">Soteria</span>
				</div>
				<p className="text-xs text-muted">
					Step {phase} of 2 · {phaseLabels[phase]}
				</p>
			</div>
			<div className="mx-auto max-w-[480px] px-4 pb-3">
				<div
					className="flex gap-1.5"
					role="progressbar"
					aria-valuenow={phase}
					aria-valuemin={1}
					aria-valuemax={2}
					aria-label={`onboarding progress, step ${phase} of 2`}
				>
					{[1, 2].map((s) => (
						<div
							key={s}
							className={`h-1.5 flex-1 rounded-full transition-colors ${
								s <= phase ? "bg-teal" : "bg-navy/10"
							}`}
						/>
					))}
				</div>
			</div>
		</header>
		<main className="step-enter mx-auto w-full max-w-[480px] flex-1 px-4 py-6">{children}</main>
	</div>
);
