import type { ReactNode } from "react";

import { BrandMark } from "~/components/brand-mark";

type AppLayoutProps = {
	children: ReactNode;
	title?: string;
	centered?: boolean;
};

export const AppLayout = ({ children, title, centered }: AppLayoutProps) => (
	<div className="app-shell">
		<header className="app-header">
			<div className="app-header-inner">
				<BrandMark size="sm" />
				{title && <p className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</p>}
			</div>
		</header>
		<main
			className={`app-main step-enter ${centered ? "justify-center" : ""}`}
		>
			{children}
		</main>
	</div>
);
