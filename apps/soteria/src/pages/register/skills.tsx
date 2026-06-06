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
	const [selected, setSelected] = useState<SelectedCert[]>([]);
	const [showOther, setShowOther] = useState(false);
	const [otherLabel, setOtherLabel] = useState("");
	const [uploads, setUploads] = useState<Partial<Record<string, UploadDraft>>>({});
	const [pdfFlags, setPdfFlags] = useState<Partial<Record<string, boolean>>>({});
	const [toast, setToast] = useState<string | null>(null);

	useRequireOnboarding(session);
	if (!session.user) return null;

	const certKey = (cert: SelectedCert) =>
		cert.type === "other" ? `other:${cert.customLabel}` : cert.type;

	const toggle = (type: CertificationType) => {
		const exists = selected.some((c) => c.type === type);
		const next = exists ? selected.filter((c) => c.type !== type) : [...selected, { type }];
		setSelected(next);
		if (exists) {
			const key = type;
			setUploads((prev) => {
				const { [key]: _, ...rest } = prev;
				return rest;
			});
		}
	};

	const addOther = () => {
		const label = otherLabel.trim();
		if (!label) return;
		if (selected.some((c) => c.type === "other" && c.customLabel === label)) return;
		setSelected([...selected, { type: "other", customLabel: label }]);
		setOtherLabel("");
		setShowOther(false);
	};

	const removeOther = (cert: SelectedCert) => {
		const key = certKey(cert);
		setSelected(selected.filter((c) => certKey(c) !== key));
		setUploads((prev) => {
			const { [key]: _, ...rest } = prev;
			return rest;
		});
	};

	const finishOnboarding = () => {
		const certifications: Certification[] = selected.map((cert) => {
			const key = certKey(cert);
			const upload = uploads[key];
			return {
				id: crypto.randomUUID(),
				type: cert.type,
				customLabel: cert.customLabel,
				status: upload ? "verified" : "unverified",
				documentUrl: upload?.dataUrl,
				verifiedAt: upload ? new Date().toISOString() : undefined,
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

			<div className={`flex flex-col gap-6 ${selected.length > 0 ? "pb-24" : ""}`}>
				<div>
					<h1 className="mb-2 text-2xl font-bold text-navy">What are your qualifications?</h1>
					<p className="text-sm text-muted">Select all that apply.</p>
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
						className="text-sm font-medium text-navy/70"
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
							className="w-full rounded-xl border border-navy/20 bg-white px-3 py-3 text-base text-navy outline-none focus:border-navy"
							aria-label="other qualification label"
						/>
						<button
							type="button"
							onClick={addOther}
							disabled={!otherLabel.trim()}
							className="min-h-12 rounded-2xl bg-navy font-semibold text-white disabled:opacity-40"
							aria-label="add other qualification"
						>
							Add
						</button>
					</div>
				)}

				{selected.length > 0 && (
					<div className="flex flex-col gap-4">
						{selected.map((cert) => {
							const key = certKey(cert);
							const label = certificationLabel(cert.type, cert.customLabel);
							const icon = certificationIcon(cert.type);
							return (
								<div key={key} className="rounded-2xl border border-navy/5 bg-card p-4">
									<div className="mb-3 flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="text-xl" aria-hidden="true">
												{icon}
											</span>
											<p className="text-sm font-semibold text-navy">{label}</p>
										</div>
										{cert.type === "other" && (
											<button
												type="button"
												onClick={() => removeOther(cert)}
												className="text-xs font-medium text-navy/70"
												aria-label={`remove ${label}`}
											>
												Remove
											</button>
										)}
									</div>
									<UploadZone
										label={label}
										preview={uploads[key]?.dataUrl ?? null}
										isPdf={pdfFlags[key]}
										optional
										optionalLabel="Add proof (optional — verifies instantly)"
										onUpload={(dataUrl, isPdf) => {
											setUploads((prev) => ({ ...prev, [key]: { dataUrl, isPdf } }));
											setPdfFlags((prev) => ({ ...prev, [key]: isPdf }));
										}}
										onError={setToast}
									/>
								</div>
							);
						})}
					</div>
				)}

				{selected.length > 0 && (
					<div className="fixed right-0 bottom-0 left-0 border-t border-navy/5 bg-white p-4">
						<div className="mx-auto max-w-[480px]">
							<button
								type="button"
								onClick={finishOnboarding}
								className="min-h-14 w-full rounded-2xl bg-navy font-semibold text-white"
								aria-label="finish onboarding"
							>
								Finish →
							</button>
						</div>
					</div>
				)}
			</div>
		</OnboardingLayout>
	);
};
