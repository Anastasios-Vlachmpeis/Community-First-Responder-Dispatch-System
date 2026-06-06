import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { CertCard } from "~/components/cert-card";
import { OnboardingLayout } from "~/components/onboarding-layout";
import { Toast } from "~/components/toast";
import { UploadZone } from "~/components/upload-zone";
import { CERTIFICATION_OPTIONS, certificationIcon, certificationLabel } from "~/lib/certifications";
import { useSession } from "~/lib/session";
import type { Certification, CertificationType } from "~/lib/types";
import { useRequireOnboarding } from "~/lib/use-require-auth";

type SkillsPhase = "select" | "upload";

type SelectedCert = {
	type: CertificationType;
	customLabel?: string;
};

type UploadDraft = {
	dataUrl: string;
	isPdf: boolean;
};

export const SkillsPage = () => {
	const navigate = useNavigate();
	const { session, setCertifications, update } = useSession();
	const [phase, setPhase] = useState<SkillsPhase>("select");
	const [selected, setSelected] = useState<SelectedCert[]>([]);
	const [showOther, setShowOther] = useState(false);
	const [otherLabel, setOtherLabel] = useState("");
	const [uploads, setUploads] = useState<Partial<Record<string, UploadDraft>>>({});
	const [pdfFlags, setPdfFlags] = useState<Partial<Record<string, boolean>>>({});
	const [skipped, setSkipped] = useState<Set<string>>(new Set());
	const [toast, setToast] = useState<string | null>(null);

	useRequireOnboarding(session);
	if (!session.user) return null;

	const certKey = (cert: SelectedCert) =>
		cert.type === "other" ? `other:${cert.customLabel}` : cert.type;

	const toggle = (type: CertificationType) => {
		const exists = selected.some((c) => c.type === type);
		setSelected(exists ? selected.filter((c) => c.type !== type) : [...selected, { type }]);
	};

	const addOther = () => {
		const label = otherLabel.trim();
		if (!label) return;
		if (selected.some((c) => c.type === "other" && c.customLabel === label)) return;
		setSelected([...selected, { type: "other", customLabel: label }]);
		setOtherLabel("");
		setShowOther(false);
	};

	const finishOnboarding = () => {
		const certifications: Certification[] = selected.map((cert) => {
			const key = certKey(cert);
			const upload = uploads[key];
			const wasSkipped = skipped.has(key);
			return {
				id: crypto.randomUUID(),
				type: cert.type,
				customLabel: cert.customLabel,
				status: upload && !wasSkipped ? "pending_review" : "self_reported",
				documentUrl: upload && !wasSkipped ? upload.dataUrl : undefined,
			};
		});
		// TODO: POST to /api/certifications
		setCertifications(certifications);
		update({ onboardingComplete: true });
		navigate("/profile");
	};

	return (
		<OnboardingLayout phase={2}>
			{toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

			{phase === "select" ? (
				<div className="flex flex-col gap-6 pb-24">
					<div>
						<h1 className="mb-2 text-2xl font-bold text-navy">What are your qualifications?</h1>
						<p className="text-sm text-muted">Select all that apply. No documents needed yet.</p>
					</div>

					<div className="grid grid-cols-2 gap-3">
						{CERTIFICATION_OPTIONS.map((cert) => (
							<CertCard
								key={cert.type}
								icon={cert.icon}
								label={cert.label}
								selected={selected.some((c) => c.type === cert.type)}
								onToggle={() => toggle(cert.type)}
							/>
						))}
					</div>

					{!showOther ? (
						<button
							type="button"
							onClick={() => setShowOther(true)}
							className="text-sm font-medium text-teal"
							aria-label="add other qualification"
						>
							Don't see yours? Add other
						</button>
					) : (
						<div className="flex flex-col gap-3 rounded-2xl bg-card p-4">
							<label
								htmlFor="other-label"
								className="text-xs font-medium tracking-wide text-muted uppercase"
							>
								Other qualification
							</label>
							<input
								id="other-label"
								type="text"
								value={otherLabel}
								onChange={(e) => setOtherLabel(e.target.value)}
								placeholder="e.g. Search & Rescue"
								className="w-full rounded-xl border border-teal/30 bg-white px-3 py-3 text-base text-navy outline-none focus:border-teal"
								aria-label="other qualification label"
							/>
							<button
								type="button"
								onClick={addOther}
								disabled={!otherLabel.trim()}
								className="min-h-12 rounded-2xl bg-teal font-semibold text-white disabled:opacity-40"
								aria-label="add other qualification"
							>
								Add
							</button>
						</div>
					)}

					{selected
						.filter((c) => c.type === "other")
						.map((cert) => (
							<div
								key={certKey(cert)}
								className="flex items-center justify-between rounded-2xl bg-teal/10 px-4 py-3 text-sm font-medium text-navy"
							>
								<span>➕ {cert.customLabel}</span>
								<button
									type="button"
									onClick={() => setSelected(selected.filter((c) => certKey(c) !== certKey(cert)))}
									className="text-teal"
									aria-label={`remove ${cert.customLabel}`}
								>
									Remove
								</button>
							</div>
						))}

					{selected.length > 0 && (
						<div className="fixed right-0 bottom-0 left-0 border-t border-navy/5 bg-white p-4">
							<div className="mx-auto max-w-[480px]">
								<button
									type="button"
									onClick={() => setPhase("upload")}
									className="min-h-14 w-full rounded-2xl bg-teal font-semibold text-white"
									aria-label="continue to optional document upload"
								>
									Continue →
								</button>
							</div>
						</div>
					)}
				</div>
			) : (
				<div className="flex flex-col gap-6">
					<div>
						<h1 className="mb-2 text-2xl font-bold text-navy">Add proof (optional)</h1>
						<p className="text-sm text-muted">
							Upload credentials to speed up verification. You can skip any or all.
						</p>
					</div>

					<div className="flex flex-col gap-4">
						{selected.map((cert) => {
							const key = certKey(cert);
							const label = certificationLabel(cert.type, cert.customLabel);
							const icon = certificationIcon(cert.type);
							return (
								<div key={key} className="rounded-2xl border border-navy/5 bg-card p-4">
									<div className="mb-3 flex items-center gap-2">
										<span className="text-xl" aria-hidden="true">
											{icon}
										</span>
										<p className="text-sm font-semibold text-navy">{label}</p>
									</div>
									<UploadZone
										label={label}
										preview={uploads[key]?.dataUrl ?? null}
										isPdf={pdfFlags[key]}
										optional
										onUpload={(dataUrl, isPdf) => {
											setUploads((prev) => ({ ...prev, [key]: { dataUrl, isPdf } }));
											setPdfFlags((prev) => ({ ...prev, [key]: isPdf }));
											setSkipped((prev) => {
												const next = new Set(prev);
												next.delete(key);
												return next;
											});
										}}
										onSkip={() => setSkipped((prev) => new Set(prev).add(key))}
										onError={setToast}
									/>
								</div>
							);
						})}
					</div>

					<button
						type="button"
						onClick={finishOnboarding}
						className="min-h-14 w-full rounded-2xl bg-teal font-semibold text-white"
						aria-label="finish onboarding"
					>
						Finish →
					</button>
				</div>
			)}
		</OnboardingLayout>
	);
};
