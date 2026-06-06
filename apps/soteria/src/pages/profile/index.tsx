import { useState } from "react";

import { AppLayout } from "~/components/app-layout";
import { CertStatusBadge } from "~/components/cert-status-badge";
import { Toast } from "~/components/toast";
import { UploadZone } from "~/components/upload-zone";
import { certificationIcon, certificationLabel } from "~/lib/certifications";
import { useSession } from "~/lib/session";
import { useRequireAuth } from "~/lib/use-require-auth";

export const ProfilePage = () => {
	const { session, verifyCertification } = useSession();
	const [toast, setToast] = useState<string | null>(null);
	const [pdfFlags, setPdfFlags] = useState<Record<string, boolean>>({});

	useRequireAuth(session);
	if (!session.user) return null;

	const { user } = session;

	return (
		<AppLayout title="Profile">
			{toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

			<div className="flex flex-col gap-6">
				<div>
					<h1 className="text-2xl font-bold text-navy">
						{user.firstName} {user.lastName}
					</h1>
					{user.email && <p className="text-sm text-muted">{user.email}</p>}
				</div>

				{session.certifications.length > 0 ? (
					<div className="flex flex-col gap-3">
						<h2 className="text-sm font-semibold text-navy">Your qualifications</h2>
						{session.certifications.map((cert) => {
							const label = certificationLabel(cert.type, cert.customLabel);
							const isPdf = pdfFlags[cert.id] ?? cert.documentUrl?.startsWith("data:application/pdf");
							return (
								<div key={cert.id} className="rounded-2xl bg-card p-4">
									<div className="mb-3 flex items-start justify-between gap-3">
										<div className="flex items-center gap-2">
											<span aria-hidden="true">{certificationIcon(cert.type)}</span>
											<span className="text-sm font-medium text-navy">{label}</span>
										</div>
										<CertStatusBadge status={cert.status} />
									</div>

									{cert.status === "unverified" ? (
										<UploadZone
											label="Upload document or photo to verify"
											preview={null}
											optional={false}
											onUpload={(dataUrl, isPdf) => {
												// TODO: POST to /api/certifications/:id/document
												setPdfFlags((prev) => ({ ...prev, [cert.id]: isPdf }));
												verifyCertification(cert.id, dataUrl);
											}}
											onError={setToast}
										/>
									) : (
										<div className="flex flex-col gap-3">
											{cert.documentUrl &&
												(isPdf ? (
													<div
														role="img"
														className="flex h-24 w-full items-center justify-center rounded-xl bg-white text-muted"
														aria-label="verified document"
													>
														<span className="text-3xl" aria-hidden="true">
															📄
														</span>
													</div>
												) : (
													<img
														src={cert.documentUrl}
														alt={`${label} verification document`}
														className="h-24 w-full rounded-xl object-cover"
													/>
												))}
											{cert.verifiedAt && (
												<p className="text-xs text-muted">
													Verified {new Date(cert.verifiedAt).toLocaleDateString()}
												</p>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				) : (
					<p className="text-sm text-muted">No qualifications added yet.</p>
				)}
			</div>
		</AppLayout>
	);
};
