import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppLayout } from "~/components/app-layout";
import { CameraCapture } from "~/components/camera-capture";
import { useSession } from "~/lib/session";
import { useRequireAuth } from "~/lib/use-require-auth";

type VerifyStep = "id" | "selfie" | "review" | "submitted";

export const VerifyPage = () => {
	const navigate = useNavigate();
	const { session, update, updateUser } = useSession();
	const [step, setStep] = useState<VerifyStep>("id");
	const [idCardImage, setIdCardImage] = useState(session.verifyDraft.idCardImage ?? "");
	const [selfieImage, setSelfieImage] = useState(session.verifyDraft.selfieImage ?? "");

	useRequireAuth(session);

	useEffect(() => {
		if (session.user?.accountStatus === "verified") navigate("/profile", { replace: true });
	}, [session.user?.accountStatus, navigate]);

	useEffect(() => {
		if (session.user?.accountStatus === "pending_review") setStep("submitted");
	}, [session.user?.accountStatus]);

	if (!session.user || session.user.accountStatus === "verified") return null;

	const persistDraft = (draft: { idCardImage?: string; selfieImage?: string }) => {
		update({ verifyDraft: { ...session.verifyDraft, ...draft } });
	};

	const submit = () => {
		// TODO: POST identity documents to /api/verify/identity
		updateUser({ accountStatus: "pending_review" });
		setStep("submitted");
	};

	return (
		<AppLayout title="Identity verification">
			<div className="flex flex-col gap-6">
				{step === "submitted" ? (
					<div className="flex flex-col items-center gap-4 py-8 text-center">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-3xl">
							⏳
						</div>
						<h1 className="text-2xl font-bold text-navy">Under review</h1>
						<p className="max-w-xs text-sm leading-relaxed text-muted">
							Your identity documents have been submitted. We'll notify you once verified — usually
							within 24 hours.
						</p>
						<button
							type="button"
							onClick={() => navigate("/profile")}
							className="min-h-14 w-full rounded-2xl bg-teal font-semibold text-white"
							aria-label="return to profile"
						>
							Back to profile
						</button>
					</div>
				) : step === "id" ? (
					<>
						<div>
							<h1 className="mb-2 text-2xl font-bold text-navy">Photograph your ID</h1>
							<p className="text-sm text-muted">
								Place your government ID on a flat surface and take a clear photo.
							</p>
						</div>
						<CameraCapture
							guideShape="card"
							facingMode="environment"
							description="live camera feed for government id photograph"
							onCapture={(image) => {
								setIdCardImage(image);
								persistDraft({ idCardImage: image });
								setStep("selfie");
							}}
						/>
					</>
				) : step === "selfie" ? (
					<>
						<div>
							<h1 className="mb-2 text-2xl font-bold text-navy">Take a selfie</h1>
							<p className="text-sm text-muted">
								We'll match this photo against your ID to confirm your identity.
							</p>
						</div>
						<CameraCapture
							guideShape="oval"
							description="live camera feed for identity selfie"
							onCapture={(image) => {
								setSelfieImage(image);
								persistDraft({ selfieImage: image });
								setStep("review");
							}}
						/>
						<button
							type="button"
							onClick={() => setStep("id")}
							className="text-sm font-medium text-teal"
							aria-label="go back to id photograph"
						>
							← Retake ID photo
						</button>
					</>
				) : (
					<>
						<div>
							<h1 className="mb-2 text-2xl font-bold text-navy">Review & submit</h1>
							<p className="text-sm text-muted">
								Make sure both photos are clear before submitting for review.
							</p>
						</div>
						<div className="grid grid-cols-2 gap-3">
							{idCardImage && (
								<img
									src={idCardImage}
									alt="government id preview"
									className="aspect-[1.586/1] rounded-2xl object-cover"
								/>
							)}
							{selfieImage && (
								<img
									src={selfieImage}
									alt="selfie preview"
									className="aspect-square rounded-2xl object-cover"
								/>
							)}
						</div>
						<p className="text-xs text-muted">Usually reviewed within 24 hours.</p>
						<button
							type="button"
							onClick={submit}
							className="min-h-14 w-full rounded-2xl bg-teal font-semibold text-white"
							aria-label="submit for identity verification"
						>
							Submit for review
						</button>
						<button
							type="button"
							onClick={() => setStep("selfie")}
							className="text-sm font-medium text-teal"
							aria-label="retake photos"
						>
							← Retake photos
						</button>
					</>
				)}
			</div>
		</AppLayout>
	);
};
