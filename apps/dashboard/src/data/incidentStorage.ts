import type { AllyResponseStatus, Incident } from "~/domain/types";
import { sanitizeTupleToLand } from "~/lib/geo";

const STORAGE_KEY = "soteria-incidents";

type PersistedIncident = Incident & { contactedAllyIds?: string[] };

type PersistedState = {
	operatorIncidents: PersistedIncident[];
	overrides: Record<string, Pick<Incident, "allyStatuses" | "handled">>;
};

const migrateAllyStatuses = (inc: PersistedIncident): Partial<Record<string, AllyResponseStatus>> => {
	const statuses = { ...inc.allyStatuses };
	if (inc.contactedAllyIds?.length) {
		for (const id of inc.contactedAllyIds) statuses[id] = "accepted";
	}
	return statuses;
};

const normalize = (inc: PersistedIncident): Incident => ({
	...inc,
	coords: sanitizeTupleToLand(inc.coords),
	emergencyServices: inc.emergencyServices.map((svc) => ({
		...svc,
		coords: sanitizeTupleToLand(svc.coords),
	})),
	allyStatuses: migrateAllyStatuses(inc),
	handled: inc.handled ?? false,
	source: inc.source ?? "operator",
});

export const loadPersistedState = (): PersistedState => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { operatorIncidents: [], overrides: {} };
		const parsed = JSON.parse(raw) as PersistedState;
		return {
			operatorIncidents: (parsed.operatorIncidents ?? []).map(normalize),
			overrides: parsed.overrides ?? {},
		};
	} catch {
		return { operatorIncidents: [], overrides: {} };
	}
};

export const savePersistedState = (incidents: Incident[]) => {
	const operatorIncidents = incidents.filter((i) => i.source === "operator").map(normalize);
	const overrides: PersistedState["overrides"] = {};
	for (const inc of incidents) {
		if (Object.keys(inc.allyStatuses).length > 0 || inc.handled)
			overrides[inc.id] = {
				allyStatuses: inc.allyStatuses,
				handled: inc.handled,
			};
	}
	localStorage.setItem(STORAGE_KEY, JSON.stringify({ operatorIncidents, overrides }));
};

export const mergeIncidents = (seed: Incident[], persisted: PersistedState): Incident[] => {
	const merged = [
		...seed.map((inc) => {
			const override = persisted.overrides[inc.id];
			if (!override) return inc;
			return { ...inc, ...override };
		}),
		...persisted.operatorIncidents,
	];
	return merged;
};
