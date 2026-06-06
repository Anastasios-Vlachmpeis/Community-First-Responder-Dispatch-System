import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { OnboardingLayout } from "~/components/onboarding-layout";
import { useSession } from "~/lib/session";
import type { User } from "~/lib/types";

const isValidDateOfBirth = (value: string) => {
	if (!value) return false;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return false;
	const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
	return age >= 16 && age <= 120;
};

export const InfoPage = () => {
	const navigate = useNavigate();
	const { session, update } = useSession();
	const phone = session.signup?.phone;
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [dateOfBirth, setDateOfBirth] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const firstNameRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (session.user) {
			navigate(session.onboardingComplete ? "/profile" : "/register/skills", { replace: true });
			return;
		}
		if (!phone || !session.signup?.phoneVerified) navigate("/register", { replace: true });
	}, [session.user, session.onboardingComplete, session.signup?.phoneVerified, phone, navigate]);

	useEffect(() => {
		firstNameRef.current?.focus();
	}, []);

	if (!phone || !session.signup?.phoneVerified) return null;

	const canSubmit =
		firstName.trim() && lastName.trim() && isValidDateOfBirth(dateOfBirth);

	const createAccount = () => {
		if (!canSubmit || submitting) return;
		setSubmitting(true);
		const user: User = {
			id: crypto.randomUUID(),
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			phone,
			dateOfBirth,
			createdAt: new Date().toISOString(),
		};
		// TODO: POST to /api/register
		update({ user, signup: null, onboardingComplete: false });
		navigate("/register/skills");
	};

	return (
		<OnboardingLayout
			step={3}
			title="Almost there"
			subtitle="Tell us a bit about yourself so dispatch can identify you during an emergency."
		>
			<div className="flex flex-col gap-5">
				<div className="form-field">
					<label htmlFor="first-name" className="form-label">
						First name
					</label>
					<input
						ref={firstNameRef}
						id="first-name"
						type="text"
						autoComplete="given-name"
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
						className="form-input"
						aria-label="first name"
					/>
				</div>

				<div className="form-field">
					<label htmlFor="last-name" className="form-label">
						Last name
					</label>
					<input
						id="last-name"
						type="text"
						autoComplete="family-name"
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
						className="form-input"
						aria-label="last name"
					/>
				</div>

				<div className="form-field">
					<label htmlFor="dob" className="form-label">
						Date of birth
					</label>
					<input
						id="dob"
						type="date"
						autoComplete="bday"
						value={dateOfBirth}
						max={new Date().toISOString().split("T")[0]}
						onChange={(e) => setDateOfBirth(e.target.value)}
						className="form-input"
						aria-label="date of birth"
					/>
					{dateOfBirth && !isValidDateOfBirth(dateOfBirth) && (
						<p className="text-sm text-danger" role="alert">
							you must be at least 16 years old
						</p>
					)}
				</div>

				<button
					type="button"
					onClick={createAccount}
					disabled={!canSubmit || submitting}
					className="btn-primary"
					aria-label="done"
				>
					{submitting ? "Creating account…" : "Done"}
				</button>
			</div>
		</OnboardingLayout>
	);
};
