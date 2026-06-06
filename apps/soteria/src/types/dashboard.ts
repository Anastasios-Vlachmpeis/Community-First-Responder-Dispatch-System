import type { CertificationStatus, CertificationType } from "~/lib/types";

// DASHBOARD_CONTRACT
// - distanceToIncident is in meters. The dashboard is responsible for display formatting.
// - certifications is the full list including unverified entries. The dashboard decides what to filter or highlight.
// - There is no account-level verification field. Do not add a placeholder for one.

export type ResponderDashboardEntry = {
	id: string;
	firstName: string;
	lastName: string;
	distanceToIncident: number;
	certifications: {
		type: CertificationType;
		customLabel?: string;
		status: CertificationStatus;
	}[];
};
