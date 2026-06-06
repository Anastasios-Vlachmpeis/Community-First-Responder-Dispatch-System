import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { OnboardingLayout } from "~/components/onboarding-layout";
import { OtpInput } from "~/components/otp-input";
import { sendOtp, sendOtpErrorMessage, verifyOtp } from "~/lib/auth";
import { useSession } from "~/lib/session";

const RESEND_DELAY_S = 30;

const maskPhone = (phone: string) => {
	const digits = phone.replace(/\D/g, "");
	if (digits.length < 4) return phone;
	return `···${digits.slice(-4)}`;
};

export const VerifyPage = () => {
	const navigate = useNavigate();
	const { session, update } = useSession();
	const phone = session.signup?.phone;
	const [error, setError] = useState<string | null>(null);
	const [verifying, setVerifying] = useState(false);
	const [resendIn, setResendIn] = useState(RESEND_DELAY_S);
	const [resending, setResending] = useState(false);

	useEffect(() => {
		if (session.user) {
			navigate(session.onboardingComplete ? "/profile" : "/register/skills", { replace: true });
			return;
		}
		if (!phone) navigate("/register", { replace: true });
	}, [session.user, session.onboardingComplete, phone, navigate]);

	useEffect(() => {
		if (resendIn <= 0) return;
		const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
		return () => clearTimeout(timer);
	}, [resendIn]);

	if (!phone) return null;

	const handleComplete = (code: string) => {
		setError(null);
		setVerifying(true);
		const res = verifyOtp(phone, code);
		setVerifying(false);
		if (!res.ok) {
			setError("incorrect code — try again");
			return;
		}
		update({ signup: { phone, phoneVerified: true } });
		navigate("/register/info");
	};

	const resend = () => {
		if (resendIn > 0 || resending) return;
		setError(null);
		setResending(true);
		const res = sendOtp(phone);
		setResending(false);
		if (!res.ok) {
			setError(sendOtpErrorMessage[res.error]);
			return;
		}
		setResendIn(RESEND_DELAY_S);
	};

	return (
		<OnboardingLayout
			step={2}
			title="Enter your code"
			subtitle={`We sent a 6-digit code to ${maskPhone(phone)}`}
		>
			<div className="flex flex-col items-center gap-6">
				<OtpInput
					onComplete={handleComplete}
					disabled={verifying}
					error={!!error}
					autoFocus
				/>

				{verifying && (
					<p className="text-sm text-muted" aria-live="polite">
						Verifying…
					</p>
				)}

				{error && (
					<p className="text-sm text-danger" role="alert">
						{error}
					</p>
				)}

				<div className="text-center">
					{resendIn > 0 ? (
						<p className="text-sm text-muted">Resend code in {resendIn}s</p>
					) : (
						<button
							type="button"
							onClick={resend}
							disabled={resending}
							className="btn-link"
							aria-label="resend verification code"
						>
							{resending ? "Sending…" : "Resend code"}
						</button>
					)}
				</div>

				<button
					type="button"
					onClick={() => navigate("/register")}
					className="text-sm text-muted underline"
					aria-label="change phone number"
				>
					Change number
				</button>

				<p className="text-xs text-muted/60">Demo code: 123456</p>
			</div>
		</OnboardingLayout>
	);
};
