import { Shield } from "lucide-react";

type BrandMarkProps = {
	size?: "sm" | "md" | "lg";
	inverted?: boolean;
};

const sizes: Record<NonNullable<BrandMarkProps["size"]>, { icon: number; text: string }> = {
	sm: { icon: 18, text: "text-base" },
	md: { icon: 22, text: "text-xl" },
	lg: { icon: 28, text: "text-2xl" },
};

export const BrandMark = ({ size = "md", inverted }: BrandMarkProps) => {
	const { icon, text } = sizes[size];
	return (
		<div className="flex items-center gap-2.5">
			<div
				className={`flex h-9 w-9 items-center justify-center rounded-xl ${
					inverted ? "bg-white/15 text-white" : "bg-brand/10 text-brand"
				}`}
			>
				<Shield size={icon} strokeWidth={2} aria-hidden />
			</div>
			<span
				className={`font-extrabold tracking-tight ${text} ${inverted ? "text-white" : "text-ink"}`}
			>
				Soteria
			</span>
		</div>
	);
};
