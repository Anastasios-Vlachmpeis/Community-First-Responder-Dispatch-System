import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { OnboardingLayout } from "~/components/onboarding-layout";
import { isValidPhone, sendOtp, sendOtpErrorMessage } from "~/lib/auth";
import { useSession } from "~/lib/session";

export const RegisterPage = () => {
	const navigate = useNavigate();
	const { session, update } = useSession();
	const [phone, setPhone] = useState(session.signup?.phone ?? "");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!session.user) return;
		if (session.onboardingComplete) navigate("/profile", { replace: true });
		else navigate("/register/skills", { replace: true });
	}, [session.user, session.onboardingComplete, navigate]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	if (session.user) return null;

	const continueSignup = () => {
		setError(null);
		if (!isValidPhone(phone)) {
			setError(sendOtpErrorMessage.invalid_phone);
			return;
		}
		setLoading(true);
		const res = sendOtp(phone);
		setLoading(false);
		if (!res.ok) {
			setError(sendOtpErrorMessage[res.error]);
			return;
		}
		update({ signup: { phone: phone.trim(), phoneVerified: false } });
		navigate("/register/verify");
	};

	return (
		<OnboardingLayout
			step={1}
			title="What's your number?"
			subtitle="We'll text you a code to verify your identity. Standard message rates may apply."
		>
			<div className="flex flex-col gap-5">
				<div className="form-field">
					<label htmlFor="phone" className="form-label">
						Mobile number
					</label>
					<input
						ref={inputRef}
						id="phone"
						type="tel"
						inputMode="tel"
						autoComplete="tel"
						value={phone}
						onChange={(e) => {
							setPhone(e.target.value);
							if (error) setError(null);
						}}
						onKeyDown={(e) => {
							if (e.key !== "Enter") return;
							continueSignup();
						}}
						placeholder="+1 555 123 4567"
						className="form-input"
						aria-label="mobile number"
						aria-invalid={!!error}
						aria-describedby={error ? "phone-error" : undefined}
					/>
					{error && (
						<p id="phone-error" className="text-sm text-danger" role="alert">
							{error}
						</p>
					)}
				</div>

				<button
					type="button"
					onClick={continueSignup}
					disabled={!phone.trim() || loading}
					className="btn-primary"
					aria-label="continue"
				>
					{loading ? "Sending code…" : "Continue"}
				</button>
			</div>
		</OnboardingLayout>
	);
};
