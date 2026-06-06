import { useEffect } from "react";

type ToastProps = {
	message: string;
	onDismiss: () => void;
	durationMs?: number;
};

export const Toast = ({ message, onDismiss, durationMs = 5000 }: ToastProps) => {
	useEffect(() => {
		const timer = setTimeout(onDismiss, durationMs);
		return () => clearTimeout(timer);
	}, [durationMs, onDismiss]);

	return (
		<div
			className="toast-enter fixed top-20 right-4 left-4 z-50 mx-auto max-w-[480px] rounded-2xl bg-navy px-4 py-3 text-sm text-white shadow-lg"
			role="status"
			aria-live="polite"
		>
			{message}
		</div>
	);
};
