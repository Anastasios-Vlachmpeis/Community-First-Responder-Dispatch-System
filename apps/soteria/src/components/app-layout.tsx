import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AppLayoutProps = {
	children: ReactNode;
	title?: string;
};

export const AppLayout = ({ children, title }: AppLayoutProps) => (
	<div className="flex min-h-full flex-col bg-white">
		<header className="sticky top-0 z-40 border-b border-navy/5 bg-white">
			<div className="mx-auto flex max-w-[480px] items-center justify-between px-4 py-3">
				<Link to="/profile" className="flex items-center gap-2" aria-label="go to profile">
					<div
						className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white"
						aria-hidden="true"
					>
						S
					</div>
					<span className="text-sm font-bold tracking-wide text-navy">Soteria</span>
				</Link>
				{title && <p className="text-xs text-muted">{title}</p>}
			</div>
		</header>
		<main className="step-enter mx-auto w-full max-w-[480px] flex-1 px-4 py-6">{children}</main>
	</div>
);
