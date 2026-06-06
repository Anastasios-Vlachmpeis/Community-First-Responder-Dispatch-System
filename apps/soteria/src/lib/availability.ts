export type AvailabilityDuration = "6h" | "1d" | "7d";

export type AvailabilityOption = {
	duration: AvailabilityDuration;
	label: string;
};

export const AVAILABILITY_OPTIONS: AvailabilityOption[] = [
	{ duration: "6h", label: "6 hours" },
	{ duration: "1d", label: "1 day" },
	{ duration: "7d", label: "7 days" },
];

const DURATION_MS: Record<AvailabilityDuration, number> = {
	"6h": 6 * 60 * 60 * 1000,
	"1d": 24 * 60 * 60 * 1000,
	"7d": 7 * 24 * 60 * 60 * 1000,
};

export const availabilityUntil = (duration: AvailabilityDuration, from = Date.now()) =>
	new Date(from + DURATION_MS[duration]).toISOString();

export const isAvailable = (until: string | null | undefined) => {
	if (!until) return false;
	return new Date(until).getTime() > Date.now();
};

export const formatAvailableUntil = (until: string) => {
	const date = new Date(until);
	const now = new Date();
	const isToday = date.toDateString() === now.toDateString();
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const isTomorrow = date.toDateString() === tomorrow.toDateString();

	const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
	if (isToday) return `Today, ${time}`;
	if (isTomorrow) return `Tomorrow, ${time}`;
	return `${date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}, ${time}`;
};

export const formatRemaining = (until: string) => {
	const ms = new Date(until).getTime() - Date.now();
	if (ms <= 0) return null;
	const hours = Math.floor(ms / (60 * 60 * 1000));
	const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
	if (hours >= 48) {
		const days = Math.floor(hours / 24);
		return `${days}d ${hours % 24}h left`;
	}
	if (hours > 0) return `${hours}h ${minutes}m left`;
	return `${minutes}m left`;
};

export const inferAvailableSince = (
	until: string,
	duration: AvailabilityDuration | null,
) => {
	if (!duration) return until;
	return new Date(new Date(until).getTime() - DURATION_MS[duration]).toISOString();
};

export const availabilityProgress = (since: string, until: string) => {
	const total = new Date(until).getTime() - new Date(since).getTime();
	if (total <= 0) return 0;
	const remaining = new Date(until).getTime() - Date.now();
	return Math.max(0, Math.min(1, remaining / total));
};

export const PROGRESS_RING_RADIUS = 46;
export const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;
