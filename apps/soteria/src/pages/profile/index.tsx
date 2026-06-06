import { useEffect, useState } from "react";

import { AppLayout } from "~/components/app-layout";
import { AvailabilityToggle } from "~/components/availability-toggle";
import { CertCard } from "~/components/cert-card";
import { CertStatusBadge } from "~/components/cert-status-badge";
import { Toast } from "~/components/toast";
import { UploadZone } from "~/components/upload-zone";
import { SkillIcon } from "~/components/skill-icon";
import { isAvailable } from "~/lib/availability";
import { ALL_CERTIFICATION_OPTIONS, CERTIFICATION_GROUPS, certificationLabel } from "~/lib/certifications";
import { useSession } from "~/lib/session";
import type { CertificationType } from "~/lib/types";
import { useRequireAuth } from "~/lib/use-require-auth";

export const ProfilePage = () => {
	const { session, submitCertificationDocument, addCertification, setAvailability, clearAvailability } =
		useSession();
	const [toast, setToast] = useState<string | null>(null);
	const [addingSkill, setAddingSkill] = useState(false);
	const [showSkills, setShowSkills] = useState(false);

	useRequireAuth(session);

	useEffect(() => {
		if (!session.availableUntil || isAvailable(session.availableUntil)) return;
		clearAvailability();
	}, [session.availableUntil, clearAvailability]);

	if (!session.user) return null;

	const { user } = session;
	const existingTypes = new Set(session.certifications.map((c) => c.type));
	const availableToAdd = ALL_CERTIFICATION_OPTIONS.filter((o) => !existingTypes.has(o.type));

	const handleAddSkill = (type: CertificationType) => {
		addCertification(type);
		setAddingSkill(false);
	};

	return (
		<AppLayout>
			{toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

			<div className="flex flex-1 flex-col gap-8">
				<div className="flex flex-1 flex-col items-center justify-center py-4">
					<AvailabilityToggle
						availableUntil={session.availableUntil}
						availableSince={session.availableSince}
						selectedDuration={session.availabilityDuration}
						onEnable={setAvailability}
						onDisable={clearAvailability}
					/>
				</div>

				<div className="section-divider" />

				<div className="flex flex-col gap-3 pb-4">
					<button
						type="button"
						onClick={() => setShowSkills((v) => !v)}
						className="flex items-center justify-between"
						aria-expanded={showSkills}
						aria-label="toggle skills section"
					>
						<div className="text-left">
							<p className="text-sm font-bold text-ink">
								{user.firstName} {user.lastName}
							</p>
							<p className="text-xs text-muted">
								{session.certifications.length} skill
								{session.certifications.length === 1 ? "" : "s"}
							</p>
						</div>
						<span className="text-sm font-bold text-brand">
							{showSkills ? "Hide" : "Skills"}
						</span>
					</button>

					{showSkills && (
						<div className="flex flex-col gap-3">
							{availableToAdd.length > 0 && (
								<button
									type="button"
									onClick={() => setAddingSkill((v) => !v)}
									className="self-start text-sm font-bold text-brand"
									aria-label="add skill"
								>
									{addingSkill ? "Cancel" : "Add skill"}
								</button>
							)}

							{addingSkill && (
								<div className="rounded-lg bg-card p-4">
									{CERTIFICATION_GROUPS.map((group) => {
										const options = group.options.filter((o) => !existingTypes.has(o.type));
										if (options.length === 0) return null;
										return (
											<div key={group.label} className="mb-4 last:mb-0">
												<p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
													{group.label}
												</p>
												<div className="flex flex-col gap-2">
													{options.map((cert) => (
														<CertCard
															key={cert.type}
															type={cert.type}
															label={cert.label}
															selected={false}
															onToggle={() => handleAddSkill(cert.type)}
														/>
													))}
												</div>
											</div>
										);
									})}
								</div>
							)}

							{session.certifications.length > 0 ? (
								session.certifications.map((cert) => {
									const label = certificationLabel(cert.type);
									const canUpload =
										cert.status === "self_reported" || cert.status === "rejected";
									return (
										<div key={cert.id} className="rounded-lg bg-card p-4">
											<div className="mb-3 flex items-start justify-between gap-3">
												<div className="flex items-center gap-2">
													<SkillIcon type={cert.type} size={18} className="text-brand" />
													<span className="text-sm font-medium text-ink">{label}</span>
												</div>
												<CertStatusBadge status={cert.status} />
											</div>

											{cert.status === "rejected" && cert.rejectionReason && (
												<p className="mb-3 text-sm text-danger" role="alert">
													{cert.rejectionReason}
												</p>
											)}

											{cert.status === "pending_review" && (
												<div className="flex flex-col gap-2">
													{cert.documentUrl && (
														<img
															src={cert.documentUrl}
															alt={`${label} certificate photo`}
															className="h-40 w-full rounded-lg object-cover"
														/>
													)}
													<p className="text-sm text-muted">
														Your certificate is being reviewed. This usually takes 1–2
														business days.
													</p>
												</div>
											)}

											{canUpload && (
												<UploadZone
													label="Photograph your certificate to verify this skill"
													preview={null}
													onUpload={(dataUrl) => {
														// TODO: POST to /api/certifications/:id/document
														submitCertificationDocument(cert.id, dataUrl);
													}}
													onError={setToast}
												/>
											)}

											{cert.status === "verified" && cert.documentUrl && (
												<div className="flex flex-col gap-3">
													<img
														src={cert.documentUrl}
														alt={`${label} verified certificate`}
														className="h-40 w-full rounded-lg object-cover"
													/>
													{cert.verifiedAt && (
														<p className="text-xs text-muted">
															Verified {new Date(cert.verifiedAt).toLocaleDateString()}
														</p>
													)}
												</div>
											)}
										</div>
									);
								})
							) : (
								<p className="text-sm text-muted">No skills added yet.</p>
							)}
						</div>
					)}
				</div>
			</div>
		</AppLayout>
	);
};
