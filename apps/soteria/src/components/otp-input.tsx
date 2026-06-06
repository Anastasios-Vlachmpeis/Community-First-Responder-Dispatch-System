import { useEffect, useRef, useState } from "react";

type OtpInputProps = {
	length?: number;
	onComplete: (code: string) => void;
	disabled?: boolean;
	error?: boolean;
	autoFocus?: boolean;
};

export const OtpInput = ({
	length = 6,
	onComplete,
	disabled,
	error,
	autoFocus = true,
}: OtpInputProps) => {
	const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const completedRef = useRef(false);

	useEffect(() => {
		if (!autoFocus) return;
		inputRefs.current[0]?.focus();
	}, [autoFocus]);

	useEffect(() => {
		if (!error) return;
		completedRef.current = false;
		setDigits(Array(length).fill(""));
		inputRefs.current[0]?.focus();
	}, [error, length]);

	const submitIfComplete = (next: string[]) => {
		if (next.some((d) => !d) || completedRef.current) return;
		completedRef.current = true;
		onComplete(next.join(""));
	};

	const setDigit = (index: number, value: string) => {
		const digit = value.replace(/\D/g, "").slice(-1);
		const next = [...digits];
		next[index] = digit;
		setDigits(next);
		if (digit && index < length - 1) inputRefs.current[index + 1]?.focus();
		submitIfComplete(next);
	};

	const handlePaste = (index: number, text: string) => {
		const pasted = text.replace(/\D/g, "").slice(0, length - index);
		if (!pasted) return;
		const next = [...digits];
		for (let i = 0; i < pasted.length; i++) next[index + i] = pasted[i];
		setDigits(next);
		const focusIndex = Math.min(index + pasted.length, length - 1);
		inputRefs.current[focusIndex]?.focus();
		submitIfComplete(next);
	};

	const handleKeyDown = (index: number, key: string) => {
		if (key !== "Backspace") return;
		if (digits[index]) {
			const next = [...digits];
			next[index] = "";
			setDigits(next);
			return;
		}
		if (index === 0) return;
		inputRefs.current[index - 1]?.focus();
		const next = [...digits];
		next[index - 1] = "";
		setDigits(next);
	};

	return (
		<div
			className={`flex justify-center gap-2 sm:gap-3 ${error ? "otp-shake" : ""}`}
			role="group"
			aria-label="verification code"
		>
			{digits.map((digit, index) => (
				<input
					key={index}
					ref={(el) => {
						inputRefs.current[index] = el;
					}}
					type="text"
					inputMode="numeric"
					autoComplete={index === 0 ? "one-time-code" : "off"}
					maxLength={1}
					value={digit}
					disabled={disabled}
					aria-label={`digit ${index + 1} of ${length}`}
					className={`h-12 w-10 rounded-xl border-2 bg-white text-center text-xl font-bold text-ink outline-none transition-colors sm:h-14 sm:w-12 ${
						error
							? "border-danger"
							: digit
								? "border-brand"
								: "border-surface focus:border-brand"
					}`}
					onChange={(e) => setDigit(index, e.target.value)}
					onKeyDown={(e) => handleKeyDown(index, e.key)}
					onPaste={(e) => {
						e.preventDefault();
						handlePaste(index, e.clipboardData.getData("text"));
					}}
				/>
			))}
		</div>
	);
};
